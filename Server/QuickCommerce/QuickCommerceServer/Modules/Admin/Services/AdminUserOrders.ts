import { RowDataPacket } from 'mysql2';

import pool from "../../StandardConfig/MySqlDbConfig";

import { CustomCode } from '../Utils/Constants';


import {
  PackOrderParams,
  MarkReadyParams,
  OrderStatus,
  CustomerOrderRow,
  PushTokenUserType,
} from "../Types/OrderflowTypes";

import { 
  sendExpoPushNotification, 
  getTokensForDrivers, 
  getTokensForCustomer 
} from './ExpoPushNotifService';
// import {
//   getTokensForUserType,
//   sendPushNotification,
// } from "../utils/pushNotification";

interface GetAllOrdersParams {
    page: number;
    limit: number;
    orderStatus?: string;
    paymentStatus?: string;
    customerId?: string;
    sortBy?: string;
    sortOrder?: string;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
  }
  
  export const getAllOrders = async (params: GetAllOrdersParams) => {
    const connection = await pool.getConnection();
    try {
      const {
        page,
        limit,
        orderStatus,
        paymentStatus,
        customerId,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        searchTerm,
        startDate,
        endDate
      } = params;
  
      const offset = (page - 1) * limit;
      const conditions: string[] = [];
      const queryParams: any[] = [];
  
      // Build WHERE conditions
      if (orderStatus) {
        conditions.push('co.order_status = ?');
        queryParams.push(orderStatus);
      }
  
      if (paymentStatus) {
        conditions.push('co.payment_status = ?');
        queryParams.push(paymentStatus);
      }
  
      if (customerId) {
        conditions.push('co.customer_id = ?');
        queryParams.push(customerId);
      }
  
      if (searchTerm) {
        conditions.push('(c.name LIKE ? OR c.email LIKE ? OR co.order_id LIKE ?)');
        const searchPattern = `%${searchTerm}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }
  
      if (startDate) {
        conditions.push('DATE(co.created_at) >= ?');
        queryParams.push(startDate);
      }
  
      if (endDate) {
        conditions.push('DATE(co.created_at) <= ?');
        queryParams.push(endDate);
      }
  
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
      // Valid sort columns
      const validSortColumns = ['created_at', 'total_amount', 'order_status', 'payment_status'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM customer_orders co
        INNER JOIN customer c ON co.customer_id = c.customer_id
        ${whereClause}
      `;
  
      const [countResult] = await connection.query<RowDataPacket[]>(countQuery, queryParams);
      const totalOrders = countResult[0].total;
  
      // Get orders with details including driver information
      const ordersQuery = `
        SELECT 
          co.order_id,
          co.customer_id,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          co.total_amount,
          co.order_status,
          co.payment_status,
          co.payment_method,
          co.shipping_address_id,
          co.remarks,
          co.created_at,
          co.driver_id,
          co.driver_assigned_at,
          d.name as driver_name,
          d.phone as driver_phone,
          d.vehicle_number,
          d.vehicle_type,
          d.isAvailable as driver_available,
          CONCAT(ca.address_line1, ', ', 
                 COALESCE(ca.address_line2, ''), ', ',
                 ca.city, ', ', ca.state, ' ', ca.postal_code) as shipping_address,
          ca.phone_number as shipping_phone,
          (SELECT COUNT(*) FROM customer_order_items WHERE order_id = co.order_id) as items_count
        FROM customer_orders co
        INNER JOIN customer c ON co.customer_id = c.customer_id
        LEFT JOIN customer_addresses ca ON co.shipping_address_id = ca.address_id
        LEFT JOIN driver d ON co.driver_id = d.driver_id
        ${whereClause}
        ORDER BY co.${sortColumn} ${sortDirection}
        LIMIT ? OFFSET ?
      `;
  
      const [orders] = await connection.query<RowDataPacket[]>(
        ordersQuery,
        [...queryParams, limit, offset]
      );
  
      const totalPages = Math.ceil(totalOrders / limit);
  
      return {
        success: true,
        message: "Orders fetched successfully",
        code: CustomCode.SuccessCode,
        result: {
          orders,
          pagination: {
            currentPage: page,
            totalPages,
            totalOrders,
            ordersPerPage: limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        }
      };
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
  
  export const getAvailableDriversService = async () => {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT 
          driver_id,
          name,
          phone,
          email,
          vehicle_number,
          vehicle_type,
          isAvailable,
          isActive,
          isDocumentVerified,
          city,
          state
        FROM driver
        WHERE isActive = 1 
          AND isDocumentVerified = 1
          AND isAvailable = 1
        ORDER BY name ASC
      `;
  
      const [drivers] = await connection.query<RowDataPacket[]>(query);
  
      return {
        success: true,
        message: "Available drivers fetched successfully",
        code: CustomCode.SuccessCode,
        result: drivers
      };
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
  
  export const assignDriverService = async (orderId: string, driverId: string) => {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();
  
      // Check if order exists
      const [orderResult] = await connection.query<RowDataPacket[]>(
        'SELECT order_id, order_status, driver_id FROM customer_orders WHERE order_id = ?',
        [orderId]
      );
  
      if (orderResult.length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: "Order not found",
          code: CustomCode.NotFound
        };
      }
  
      const order = orderResult[0];
  
      // Check if driver exists and is available
      const [driverResult] = await connection.query<RowDataPacket[]>(
        `SELECT 
          driver_id, 
          name, 
          phone,
          vehicle_number,
          vehicle_type,
          isAvailable, 
          isActive, 
          isDocumentVerified 
        FROM driver 
        WHERE driver_id = ?`,
        [driverId]
      );
  
      if (driverResult.length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: "Driver not found",
          code: CustomCode.NotFound
        };
      }
  
      const driver = driverResult[0];
  
      if (!driver.isActive) {
        await connection.rollback();
        return {
          success: false,
          message: "Driver is not active",
          code: CustomCode.ValidationError
        };
      }
  
      if (!driver.isDocumentVerified) {
        await connection.rollback();
        return {
          success: false,
          message: "Driver documents are not verified",
          code: CustomCode.ValidationError
        };
      }
  
      if (!driver.isAvailable) {
        await connection.rollback();
        return {
          success: false,
          message: "Driver is not available",
          code: CustomCode.ValidationError
        };
      }
  
      // Assign driver to order
      await connection.query(
        `UPDATE customer_orders 
         SET driver_id = ?, driver_assigned_at = NOW()
         WHERE order_id = ?`,
        [driverId, orderId]
      );
  
   
  
      await connection.commit();
  
      return {
        success: true,
        message: "Driver assigned successfully",
        code: CustomCode.SuccessCode,
        result: {
          orderId,
          driverId,
          driverName: driver.name,
          driverPhone: driver.phone,
          vehicleNumber: driver.vehicle_number,
          vehicleType: driver.vehicle_type
        }
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
  
  export const unassignDriverService = async (orderId: string) => {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();
  
      // Get current driver assignment
      const [orderResult] = await connection.query<RowDataPacket[]>(
        'SELECT order_id, driver_id FROM customer_orders WHERE order_id = ?',
        [orderId]
      );
  
      if (orderResult.length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: "Order not found",
          code: CustomCode.NotFound
        };
      }
  
      const currentDriverId = orderResult[0].driver_id;
  
      if (!currentDriverId) {
        await connection.rollback();
        return {
          success: false,
          message: "No driver assigned to this order",
          code: CustomCode.ValidationError
        };
      }
  
      // Unassign driver
      await connection.query(
        `UPDATE customer_orders 
         SET driver_id = NULL, driver_assigned_at = NULL
         WHERE order_id = ?`,
        [orderId]
      );
  
      // Optional: Update driver availability back to available
      // Uncomment if you want to mark driver as available when unassigned
      // await connection.query(
      //   'UPDATE driver SET isAvailable = 1 WHERE driver_id = ?',
      //   [currentDriverId]
      // );
  
      await connection.commit();
  
      return {
        success: true,
        message: "Driver unassigned successfully",
        code: CustomCode.SuccessCode,
        result: {
          orderId,
          previousDriverId: currentDriverId
        }
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
  
  export const getOrderByIdService = async (orderId: string) => {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT 
          co.order_id,
          co.customer_id,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          co.total_amount,
          co.order_status,
          co.payment_status,
          co.payment_method,
          co.shipping_address_id,
          co.remarks,
          co.created_at,
          co.driver_id,
          co.driver_assigned_at,
          d.name as driver_name,
          d.phone as driver_phone,
          d.email as driver_email,
          d.vehicle_number,
          d.vehicle_type,
          CONCAT(ca.address_line1, ', ', 
                 COALESCE(ca.address_line2, ''), ', ',
                 ca.city, ', ', ca.state, ' ', ca.postal_code) as shipping_address,
          ca.phone_number as shipping_phone,
          ca.latitude,
          ca.longitude
        FROM customer_orders co
        INNER JOIN customer c ON co.customer_id = c.customer_id
        LEFT JOIN customer_addresses ca ON co.shipping_address_id = ca.address_id
        LEFT JOIN driver d ON co.driver_id = d.driver_id
        WHERE co.order_id = ?
      `;
  
      const [orders] = await connection.query<RowDataPacket[]>(query, [orderId]);
  
      if (orders.length === 0) {
        return {
          success: false,
          message: "Order not found",
          code: CustomCode.NotFound
        };
      }

      // Fetch order items with product details
      const [items] = await connection.query<RowDataPacket[]>(
        `SELECT
           coi.item_id,
           coi.product_id,
           coi.quantity,
           coi.price_at_purchase AS price,
           p.name AS product_name,
           p.image_url AS product_image,
           p.unit_size AS unit_size
         FROM customer_order_items coi
         LEFT JOIN product p ON coi.product_id = p.product_id
         WHERE coi.order_id = ?`,
        [orderId]
      );
  
      return {
        success: true,
        message: "Order fetched successfully",
        code: CustomCode.SuccessCode,
        result: {
          ...orders[0],
          items,
        }
      };
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };


 


// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — Admin packs the order
// Precondition : order_status = ACTIVE
// Postcondition: order_status = PACKED
// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — Admin packs the order
export const packOrder = async (params: PackOrderParams) => {
  const connection = await pool.getConnection();
  try {
    const { orderId } = params;

    // 1. Fetch current order - CORRECTED SYNTAX
    const [orderRows] = await connection.query<CustomerOrderRow[]>(
      "SELECT * FROM customer_orders WHERE order_id = ?", 
      [orderId]
    );

    if (orderRows.length === 0) {
      return {
        success: false,
        message: "Order not found",
        code: CustomCode.NotFound,
        result: null,
      };
    }

    const order = orderRows[0];

    // 2. Guard: must be CONFIRMED
    if (order.order_status !== OrderStatus.CONFIRMED) {
      return {
        success: false,
        message: `Cannot pack order. Current status is "${order.order_status}". Expected "CONFIRMED".`,
        code: CustomCode.AlreadyExists,
        result: null,
      };
    }

    // 3. Update status → PACKING
    await connection.query(
      "UPDATE customer_orders SET order_status = ? WHERE order_id = ?",
      [OrderStatus.PACKING, orderId]
    );

    // 4. Return the updated order - CORRECTED SYNTAX
    const [updatedRows] = await connection.query<CustomerOrderRow[]>(
      "SELECT * FROM customer_orders WHERE order_id = ?", 
      [orderId]
    );

    // 5. Send notification to customer (non-blocking)
    setImmediate(async () => {
      try {
        const customerTokens = await getTokensForCustomer(order.customer_id);
        await sendExpoPushNotification(
          customerTokens,
          "Order Being Packed 📦",
          `Your order #${orderId} is being prepared!`,
          { 
            orderId, 
            status: OrderStatus.PACKING,
            type: 'order_update',
            screen: 'OrderDetails'
          }
        );
      } catch (error) {
        console.error('Failed to send pack notification:', error);
      }
    });

    return {
      success: true,
      message: "Order packed successfully",
      code: CustomCode.SuccessCode,
      result: updatedRows[0],
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// STEP 8 — Admin marks order ready for pickup
export const markReadyForPickup = async (params: MarkReadyParams) => {
  const connection = await pool.getConnection();
  try {
    const { orderId } = params;

    // 1. Fetch current order - CORRECTED SYNTAX
    const [orderRows] = await connection.query<CustomerOrderRow[]>(
      "SELECT * FROM customer_orders WHERE order_id = ?", 
      [orderId]
    );

    if (orderRows.length === 0) {
      return {
        success: false,
        message: "Order not found",
        code: CustomCode.NotFound,
        result: null,
      };
    }

    const order = orderRows[0];

    // 2. Guard: must be PACKING
    if (order.order_status !== OrderStatus.PACKING) {
      return {
        success: false,
        message: `Cannot mark ready. Current status is "${order.order_status}". Expected "PACKING".`,
        code: CustomCode.AlreadyExists,
        result: null,
      };
    }

    // 3. Update status → READY_FOR_PICKUP
    await connection.query(
      "UPDATE customer_orders SET order_status = ? WHERE order_id = ?",
      [OrderStatus.READY_FOR_PICKUP, orderId]
    );

    // 4. Return the updated order - CORRECTED SYNTAX
    const [updatedRows] = await connection.query<CustomerOrderRow[]>(
      "SELECT * FROM customer_orders WHERE order_id = ?", 
      [orderId]
    );

    // 5. Notify all drivers (non-blocking)
    setImmediate(async () => {
      try {
        const driverTokens = await getTokensForDrivers();
        await sendExpoPushNotification(
          driverTokens,
          "New Order Available 🚗",
          `Order #${orderId} is ready for pickup!`,
          { 
            orderId, 
            status: OrderStatus.READY_FOR_PICKUP,
            type: 'new_order_available',
            action: 'pickup_available',
            screen: 'AvailableOrders'
          }
        );
      } catch (error) {
        console.error('Failed to send driver notifications:', error);
      }
    });

    // 6. Notify customer (non-blocking)
    setImmediate(async () => {
      try {
        const customerTokens = await getTokensForCustomer(order.customer_id);
        await sendExpoPushNotification(
          customerTokens,
          "Order Ready ✅",
          `Your order #${orderId} is ready and waiting for a driver!`,
          { 
            orderId, 
            status: OrderStatus.READY_FOR_PICKUP,
            type: 'order_update',
            screen: 'OrderDetails'
          }
        );
      } catch (error) {
        console.error('Failed to send customer notification:', error);
      }
    });

    return {
      success: true,
      message: "Order is now ready for pickup. Drivers have been notified.",
      code: CustomCode.SuccessCode,
      result: updatedRows[0],
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// STEP 8 — Admin marks order ready for pickup + notifies all drivers
// Precondition : order_status = PACKED
// Postcondition: order_status = READY_FOR_PICKUP
// Side-effect  : push notification broadcast to every active driver
// ─────────────────────────────────────────────────────────────────────────────
// export const markReadyForPickup = async (params: MarkReadyParams) => {
//   const connection = await pool.getConnection();
//   try {
//     const { orderId } = params;

//     // 1. Fetch current order
//     const [orderRows] = await connection.query<
//       CustomerOrderRow[] & RowDataPacket[]
//     >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

//     if (orderRows.length === 0) {
//       return {
//         success: false,
//         message: "Order not found",
//         code: CustomCode.NotFound,
//         result: null,
//       };
//     }

//     const order = orderRows[0];

//     // 2. Guard: must be PACKED
//     if (order.order_status !== OrderStatus.PACKING) {
//       return {
//         success: false,
//         message: `Cannot mark ready. Current status is "${order.order_status}". Expected "PACKING".`,
//         code: CustomCode.AlreadyExists,
//         result: null,
//       };
//     }

//     // 3. Update status → READY_FOR_PICKUP
//     await connection.query(
//       "UPDATE customer_orders SET order_status = ? WHERE order_id = ?",
//       [OrderStatus.READY_FOR_PICKUP, orderId]
//     );

//     // 4. Broadcast push to all active drivers (fire-and-forget, non-blocking)
//     // const driverTokens = await getTokensForUserType(PushTokenUserType.DRIVER);
//     // sendPushNotification(
//     //   driverTokens,
//     //   "New Order Available",
//     //   `Order #${orderId} is ready for pickup.`,
//     //   { orderId } // extra data payload so the app can deep-link
//     // );
//     // Note: no await — we intentionally do not block the response on notification delivery.

//     // 5. Return the updated order
//     const [updatedRows] = await connection.query<
//       CustomerOrderRow[] & RowDataPacket[]
//     >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

//     return {
//       success: true,
//       message: "Order is now ready for pickup. Drivers have been notified.",
//       code: CustomCode.SuccessCode,
//       result: updatedRows[0],
//     };
//   } catch (err) {
//     throw err;
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };