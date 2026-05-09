import { RowDataPacket } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid"; // adjust if you use a different ID generator
import pool from "../../StandardConfig/MySqlDbConfig";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import {
  GetAvailableOrdersParams,
  AcceptOrderParams,
  PickupOrderParams,
  DeliverOrderParams,
  OrderStatus,
  DeliveryStatus,
  CustomerOrderRow,
  OrderDeliveryRow,
  PushTokenUserType,
} from "../../Admin/Types/OrderflowTypes";
// import {
//   getTokensForUser,
//   sendPushNotification,
// } from "../utils/pushNotification";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9 — Driver fetches all orders currently available for pickup
// No mutation. Paginated list of READY_FOR_PICKUP orders with item counts
// and shipping address details so the driver can decide whether to accept.
// ─────────────────────────────────────────────────────────────────────────────
export const getAvailableOrders = async (
  params: GetAvailableOrdersParams
) => {
  const connection = await pool.getConnection();
  try {
    const { page, limit, sortOrder = "DESC" } = params;
    const offset = (page - 1) * limit;
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Total count
    const [countResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM customer_orders
       WHERE order_status = ?`,
      [OrderStatus.READY_FOR_PICKUP]
    );
    const totalOrders = countResult[0].total;

    // Orders with enriched data
    const [orders] = await connection.query<RowDataPacket[]>(
      `SELECT
         co.order_id,
         co.total_amount,
         co.created_at,
         co.shipping_address_id,
         CONCAT(ca.address_line1, ', ',
                COALESCE(ca.address_line2, ''), ', ',
                ca.city, ', ', ca.state, ' ', ca.postal_code) AS shipping_address,
         ca.latitude  AS delivery_lat,
         ca.longitude AS delivery_lng,
         ca.landmark,
         (SELECT COUNT(*)
          FROM customer_order_items
          WHERE order_id = co.order_id) AS items_count
       FROM customer_orders co
       LEFT JOIN customer_addresses ca
         ON co.shipping_address_id = ca.address_id
       WHERE co.order_status = ?
       ORDER BY co.created_at ${sortDirection}
       LIMIT ? OFFSET ?`,
      [OrderStatus.READY_FOR_PICKUP, limit, offset]
    );

    const totalPages = Math.ceil(totalOrders / limit);

    return {
      success: true,
      message: "Available orders fetched successfully",
      code: CustomCode.SuccessCode,
      result: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          ordersPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
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
// STEP 10 — Driver accepts an order
//
// Race-condition guard: the entire accept is wrapped in a transaction and
// the order row is locked with SELECT … FOR UPDATE before any mutation.
// If another driver accepted between the time the list was fetched and
// the tap, the status check fails and the driver gets a clean error.
//
// Precondition : order_status = READY_FOR_PICKUP
// Postcondition:
//   customer_orders  → driver_id set, driver_assigned_at set, status = ASSIGNED_TO_DRIVER
//   customer_order_deliveries → new row with delivery_status = ASSIGNED
// Side-effect  : push to the customer
// ─────────────────────────────────────────────────────────────────────────────
export const acceptOrder = async (params: AcceptOrderParams) => {
  const connection = await pool.getConnection();
  try {
    const { orderId, driverId } = params;

    await connection.beginTransaction();

    // 1. Lock the row — any concurrent acceptOrder on the same order_id will
    //    block here until this transaction commits or rolls back.
    const [orderRows] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ? FOR UPDATE", [
      orderId,
    ]);

    if (orderRows.length === 0) {
      await connection.rollback();
      return {
        success: false,
        message: "Order not found",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    const order = orderRows[0];

    // 2. Guard: status must still be READY_FOR_PICKUP
    //    (another driver may have accepted it while we were waiting for the lock)
    if (order.order_status !== OrderStatus.READY_FOR_PICKUP) {
      await connection.rollback();
      return {
        success: false,
        message:
          "This order is no longer available. Another driver may have already accepted it.",
        code: CustomCode.BadRequestCode,
        result: null,
      };
    }

    // 3. Update customer_orders
    await connection.query(
      `UPDATE customer_orders
       SET driver_id          = ?,
           driver_assigned_at = NOW(),
           order_status       = ?
       WHERE order_id = ?`,
      [driverId, OrderStatus.ASSIGNED_TO_DRIVER, orderId]
    );

    // 4. Create customer_order_deliveries row
    const deliveryId = uuidv4();
    await connection.query(
      `INSERT INTO customer_order_deliveries (delivery_id, order_id, driver_id, delivery_status)
       VALUES (?, ?, ?, ?)`,
      [deliveryId, orderId, driverId, DeliveryStatus.ASSIGNED]
    );

    await connection.commit();

    // 5. Notify customer (fire-and-forget, outside the transaction)
    // const customerTokens = await getTokensForUser(
    //   order.customer_id,
    //   PushTokenUserType.CUSTOMER
    // );
    // sendPushNotification(
    //   customerTokens,
    //   "Driver Assigned",
    //   "A driver has been assigned to your order. It's on its way!",
    //   { orderId }
    // );

    // 6. Return the updated order + delivery record
    const [updatedOrder] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

    const [delivery] = await connection.query<
      OrderDeliveryRow[] & RowDataPacket[]
    >("SELECT * FROM customer_order_deliveries WHERE delivery_id = ?", [deliveryId]);

    return {
      success: true,
      message: "Order accepted successfully",
      code: CustomCode.SuccessCode,
      result: {
        order: updatedOrder[0],
        delivery: delivery[0],
      },
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

// ─────────────────────────────────────────────────────────────────────────────
// STEP 11 — Driver confirms pickup from warehouse
// Precondition : order_status = ASSIGNED_TO_DRIVER  &  delivery belongs to this driver
// Postcondition:
//   customer_order_deliveries → delivery_status = PICKED_UP, picked_up_at = NOW()
//   customer_orders  → order_status = OUT_FOR_DELIVERY
// Side-effect  : push to the customer
// ─────────────────────────────────────────────────────────────────────────────
export const pickupOrder = async (params: PickupOrderParams) => {
  const connection = await pool.getConnection();
  try {
    const { orderId, driverId } = params;

    // 1. Fetch the order
    const [orderRows] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

    if (orderRows.length === 0) {
      return {
        success: false,
        message: "Order not found",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    const order = orderRows[0];

    // 2. Ownership guard — this delivery must belong to the requesting driver
    if (order.driver_id !== driverId) {
      return {
        success: false,
        message: "This order is not assigned to you",
        code: CustomCode.ForbiddenCode,
        result: null,
      };
    }

    // 3. Status guard
    if (order.order_status !== OrderStatus.ASSIGNED_TO_DRIVER) {
      return {
        success: false,
        message: `Cannot pick up. Current status is "${order.order_status}". Expected "ASSIGNED_TO_DRIVER".`,
        code: CustomCode.BadRequestCode,
        result: null,
      };
    }

    // 4. Update customer_order_deliveries
    await connection.query(
      `UPDATE customer_order_deliveries
       SET delivery_status = ?,
           picked_up_at     = NOW()
       WHERE order_id = ? AND driver_id = ?`,
      [DeliveryStatus.PICKED_UP, orderId, driverId]
    );

    // 5. Update customer_orders
    await connection.query(
      "UPDATE customer_orders SET order_status = ? WHERE order_id = ?",
      [OrderStatus.SHIPPED, orderId]
    );

    // 6. Notify customer
    // const customerTokens = await getTokensForUser(
    //   order.customer_id,
    //   PushTokenUserType.CUSTOMER
    // );
    // sendPushNotification(
    //   customerTokens,
    //   "Order Picked Up",
    //   "Your order has been picked up and is on its way to you!",
    //   { orderId }
    // );

    // 7. Return updated records
    const [updatedOrder] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

    const [delivery] = await connection.query<
      OrderDeliveryRow[] & RowDataPacket[]
    >(
      "SELECT * FROM customer_order_deliveries WHERE order_id = ? AND driver_id = ?",
      [orderId, driverId]
    );

    return {
      success: true,
      message: "Order picked up successfully",
      code: CustomCode.SuccessCode,
      result: {
        order: updatedOrder[0],
        delivery: delivery[0],
      },
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
// STEP 12 — Driver confirms delivery to customer
// Precondition : delivery_status = PICKED_UP  &  delivery belongs to this driver
// Postcondition:
//   customer_order_deliveries → delivery_status = DELIVERED, delivered_at = NOW()
//   customer_orders  → order_status = DELIVERED  (terminal state)
// Side-effect  : push to the customer
// ─────────────────────────────────────────────────────────────────────────────
export const deliverOrder = async (params: DeliverOrderParams) => {
  const connection = await pool.getConnection();
  try {
    const { orderId, driverId } = params;

    // 1. Fetch the delivery record for this driver + order
    const [deliveryRows] = await connection.query<
      OrderDeliveryRow[] & RowDataPacket[]
    >(
      "SELECT * FROM customer_order_deliveries WHERE order_id = ? AND driver_id = ?",
      [orderId, driverId]
    );

    if (deliveryRows.length === 0) {
      return {
        success: false,
        message: "Delivery not found or not assigned to you",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    const delivery = deliveryRows[0];

    // 2. Status guard — must be PICKED_UP before we can mark delivered
    if (delivery.delivery_status !== DeliveryStatus.PICKED_UP) {
      return {
        success: false,
        message: `Cannot deliver. Current delivery status is "${delivery.delivery_status}". Expected "PICKED_UP".`,
        code: CustomCode.BadRequestCode,
        result: null,
      };
    }

    // 3. Fetch the order (we need customer_id for the notification)
    const [orderRows] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

    const order = orderRows[0];

    // 4. Update customer_order_deliveries → DELIVERED
    await connection.query(
      `UPDATE customer_order_deliveries
       SET delivery_status = ?,
           delivered_at     = NOW()
       WHERE order_id = ? AND driver_id = ?`,
      [DeliveryStatus.DELIVERED, orderId, driverId]
    );

    // 5. Update customer_orders → DELIVERED (terminal)
    await connection.query(
      "UPDATE customer_orders SET order_status = ? WHERE order_id = ?",
      [OrderStatus.DELIVERED, orderId]
    );

    // 6. Notify customer
    // const customerTokens = await getTokensForUser(
    //   order.customer_id,
    //   PushTokenUserType.CUSTOMER
    // );
    // sendPushNotification(
    //   customerTokens,
    //   "Order Delivered ✓",
    //   "Your order has been delivered successfully. Enjoy!",
    //   { orderId }
    // );

    // 7. Return final state
    const [updatedOrder] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

    const [updatedDelivery] = await connection.query<
      OrderDeliveryRow[] & RowDataPacket[]
    >(
      "SELECT * FROM customer_order_deliveries WHERE order_id = ? AND driver_id = ?",
      [orderId, driverId]
    );

    return {
      success: true,
      message: "Order delivered successfully",
      code: CustomCode.SuccessCode,
      result: {
        order: updatedOrder[0],
        delivery: updatedDelivery[0],
      },
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
// GET /api/driver/my-orders — Driver fetches their accepted/in-progress orders
// Returns orders with status ASSIGNED_TO_DRIVER or OUT_FOR_DELIVERY
// ─────────────────────────────────────────────────────────────────────────────
export interface GetDriverOrdersParams {
  driverId: string;
  page: number;
  limit: number;
  status?: string; // Optional filter: 'all', 'assigned', 'out_for_delivery', 'delivered'
  sortOrder?: "ASC" | "DESC";
}

export const getDriverOrders = async (params: GetDriverOrdersParams) => {
  const connection = await pool.getConnection();
  try {
    const { driverId, page, limit, status = "active", sortOrder = "DESC" } = params;
    const offset = (page - 1) * limit;
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Build status filter based on the status param
    let statusFilter: string[];
    switch (status.toLowerCase()) {
      case "assigned":
        statusFilter = [OrderStatus.ASSIGNED_TO_DRIVER];
        break;
      case "out_for_delivery":
        statusFilter = [OrderStatus.SHIPPED];
        break;
      case "delivered":
        statusFilter = [OrderStatus.DELIVERED];
        break;
      case "all":
        statusFilter = [
          OrderStatus.ASSIGNED_TO_DRIVER,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ];
        break;
      case "active":
      default:
        // Active = in-progress orders (not yet delivered)
        statusFilter = [OrderStatus.ASSIGNED_TO_DRIVER, OrderStatus.SHIPPED];
        break;
    }

    const statusPlaceholders = statusFilter.map(() => "?").join(", ");

    // Total count for this driver
    const [countResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM customer_orders
       WHERE driver_id = ? AND order_status IN (${statusPlaceholders})`,
      [driverId, ...statusFilter]
    );
    const totalOrders = countResult[0].total;

    // Orders with enriched data
    const [orders] = await connection.query<RowDataPacket[]>(
      `SELECT
         co.order_id,
         co.customer_id,
         co.total_amount,
         co.order_status,
         co.payment_status,
         co.created_at,
         co.driver_assigned_at,
         co.shipping_address_id,
         CONCAT(ca.address_line1, ', ',
                COALESCE(ca.address_line2, ''), ', ',
                ca.city, ', ', ca.state, ' ', ca.postal_code) AS shipping_address,
         ca.latitude  AS delivery_lat,
         ca.longitude AS delivery_lng,
         ca.landmark,
         c.name AS customer_name,
         c.phone AS customer_phone,
         (SELECT COUNT(*)
          FROM customer_order_items
          WHERE order_id = co.order_id) AS items_count,
         od.delivery_status,
         od.picked_up_at,
         od.delivered_at
       FROM customer_orders co
       LEFT JOIN customer_addresses ca
         ON co.shipping_address_id = ca.address_id
       LEFT JOIN customer c
         ON co.customer_id = c.customer_id
       LEFT JOIN customer_order_deliveries od
         ON co.order_id = od.order_id AND od.driver_id = ?
       WHERE co.driver_id = ? AND co.order_status IN (${statusPlaceholders})
       ORDER BY co.driver_assigned_at ${sortDirection}
       LIMIT ? OFFSET ?`,
      [driverId, driverId, ...statusFilter, limit, offset]
    );

    const totalPages = Math.ceil(totalOrders / limit);

    return {
      success: true,
      message: "Driver orders fetched successfully",
      code: CustomCode.SuccessCode,
      result: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          ordersPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
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
// GET /api/driver/:order_id — Get detailed order information
// Returns full order details including items, customer contact, delivery address
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderDetails = async (orderId: string, driverId: string) => {
  const connection = await pool.getConnection();
  try {
    // Fetch order with customer and address details
    const [orderRows] = await connection.query<RowDataPacket[]>(
      `SELECT
         co.order_id,
         co.customer_id,
         co.total_amount,
         co.order_status,
         co.payment_status,
         co.payment_method,
         co.created_at,
         co.driver_assigned_at,
         co.remarks,
         co.driver_id,
         CONCAT(ca.address_line1, ', ',
                COALESCE(ca.address_line2, ''), ', ',
                ca.city, ', ', ca.state, ' ', ca.postal_code) AS shipping_address,
         ca.address_line1,
         ca.address_line2,
         ca.city,
         ca.state,
         ca.postal_code,
         ca.latitude AS delivery_lat,
         ca.longitude AS delivery_lng,
         ca.landmark,
         c.name AS customer_name,
         c.phone AS customer_phone,
         c.email AS customer_email
       FROM customer_orders co
       LEFT JOIN customer_addresses ca
         ON co.shipping_address_id = ca.address_id
       LEFT JOIN customer c
         ON co.customer_id = c.customer_id
       WHERE co.order_id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return {
        success: false,
        message: "Order not found",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    const order = orderRows[0];

    // Verify driver owns this order (if assigned)
    if (order.driver_id && order.driver_id !== driverId) {
      return {
        success: false,
        message: "This order is not assigned to you",
        code: CustomCode.ForbiddenCode,
        result: null,
      };
    }

    // Fetch order items
    const [items] = await connection.query<RowDataPacket[]>(
      `SELECT
         coi.item_id,
         coi.product_id,
         coi.quantity,
         coi.price_at_purchase AS price,
         p.name AS product_name,
         p.image_url AS product_image
       FROM customer_order_items coi
       LEFT JOIN product p ON coi.product_id = p.product_id
       WHERE coi.order_id = ?`,
      [orderId]
    );

    // Fetch delivery info if exists
    const [deliveryRows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM customer_order_deliveries
       WHERE order_id = ? AND driver_id = ?`,
      [orderId, driverId]
    );

    return {
      success: true,
      message: "Order details fetched successfully",
      code: CustomCode.SuccessCode,
      result: {
        order,
        items,
        delivery: deliveryRows[0] || null,
      },
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
// GET /api/driver/earnings — Get driver earnings summary
// Returns earnings for today, this week, and this month
// ─────────────────────────────────────────────────────────────────────────────
export interface GetDriverEarningsParams {
  driverId: string;
}

export const getDriverEarnings = async (params: GetDriverEarningsParams) => {
  const connection = await pool.getConnection();
  try {
    const { driverId } = params;

    // Today's earnings and deliveries
    const [todayStats] = await connection.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS deliveries_count,
         COALESCE(SUM(co.total_amount), 0) AS total_amount
       FROM customer_orders co
       INNER JOIN customer_order_deliveries od ON co.order_id = od.order_id
       WHERE od.driver_id = ?
         AND od.delivery_status = ?
         AND DATE(od.delivered_at) = CURDATE()`,
      [driverId, DeliveryStatus.DELIVERED]
    );

    // This week's earnings
    const [weekStats] = await connection.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS deliveries_count,
         COALESCE(SUM(co.total_amount), 0) AS total_amount
       FROM customer_orders co
       INNER JOIN customer_order_deliveries od ON co.order_id = od.order_id
       WHERE od.driver_id = ?
         AND od.delivery_status = ?
         AND YEARWEEK(od.delivered_at, 1) = YEARWEEK(CURDATE(), 1)`,
      [driverId, DeliveryStatus.DELIVERED]
    );

    // This month's earnings
    const [monthStats] = await connection.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS deliveries_count,
         COALESCE(SUM(co.total_amount), 0) AS total_amount
       FROM customer_orders co
       INNER JOIN customer_order_deliveries od ON co.order_id = od.order_id
       WHERE od.driver_id = ?
         AND od.delivery_status = ?
         AND MONTH(od.delivered_at) = MONTH(CURDATE())
         AND YEAR(od.delivered_at) = YEAR(CURDATE())`,
      [driverId, DeliveryStatus.DELIVERED]
    );

    // Total lifetime stats
    const [lifetimeStats] = await connection.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total_deliveries,
         COALESCE(SUM(co.total_amount), 0) AS total_earnings
       FROM customer_orders co
       INNER JOIN customer_order_deliveries od ON co.order_id = od.order_id
       WHERE od.driver_id = ?
         AND od.delivery_status = ?`,
      [driverId, DeliveryStatus.DELIVERED]
    );

    return {
      success: true,
      message: "Earnings fetched successfully",
      code: CustomCode.SuccessCode,
      result: {
        today: {
          deliveries: todayStats[0].deliveries_count || 0,
          amount: parseFloat(todayStats[0].total_amount) || 0,
        },
        thisWeek: {
          deliveries: weekStats[0].deliveries_count || 0,
          amount: parseFloat(weekStats[0].total_amount) || 0,
        },
        thisMonth: {
          deliveries: monthStats[0].deliveries_count || 0,
          amount: parseFloat(monthStats[0].total_amount) || 0,
        },
        lifetime: {
          deliveries: lifetimeStats[0].total_deliveries || 0,
          earnings: parseFloat(lifetimeStats[0].total_earnings) || 0,
        },
      },
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
// GET /api/driver/history — Get driver's completed delivery history
// Returns paginated list of completed deliveries
// ─────────────────────────────────────────────────────────────────────────────
export interface GetDriverHistoryParams {
  driverId: string;
  page: number;
  limit: number;
  sortOrder?: "ASC" | "DESC";
}

export const getDriverHistory = async (params: GetDriverHistoryParams) => {
  const connection = await pool.getConnection();
  try {
    const { driverId, page, limit, sortOrder = "DESC" } = params;
    const offset = (page - 1) * limit;
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Total count
    const [countResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM customer_order_deliveries od
       WHERE od.driver_id = ? AND od.delivery_status = ?`,
      [driverId, DeliveryStatus.DELIVERED]
    );
    const totalOrders = countResult[0].total;

    // Completed deliveries with order details
    const [orders] = await connection.query<RowDataPacket[]>(
      `SELECT
         co.order_id,
         co.total_amount,
         co.order_status,
         co.created_at,
         co.driver_assigned_at,
         CONCAT(ca.address_line1, ', ',
                COALESCE(ca.address_line2, ''), ', ',
                ca.city, ', ', ca.state, ' ', ca.postal_code) AS shipping_address,
         c.name AS customer_name,
         (SELECT COUNT(*)
          FROM customer_order_items
          WHERE order_id = co.order_id) AS items_count,
         od.delivery_status,
         od.picked_up_at,
         od.delivered_at
       FROM customer_order_deliveries od
       INNER JOIN customer_orders co ON od.order_id = co.order_id
       LEFT JOIN customer_addresses ca
         ON co.shipping_address_id = ca.address_id
       LEFT JOIN customer c
         ON co.customer_id = c.customer_id
       WHERE od.driver_id = ? AND od.delivery_status = ?
       ORDER BY od.delivered_at ${sortDirection}
       LIMIT ? OFFSET ?`,
      [driverId, DeliveryStatus.DELIVERED, limit, offset]
    );

    const totalPages = Math.ceil(totalOrders / limit);

    return {
      success: true,
      message: "Delivery history fetched successfully",
      code: CustomCode.SuccessCode,
      result: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          ordersPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
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
// POST /api/driver/orders/:order_id/cancel — Driver cancels an assigned order
// This is used when driver cannot complete an order BEFORE pickup (e.g., bike breakdown)
// Precondition: order_status = ASSIGNED_TO_DRIVER & delivery belongs to this driver
// Postcondition:
//   customer_orders  → driver_id = NULL, driver_assigned_at = NULL, status = READY_FOR_PICKUP
//   customer_order_deliveries → delivery_status = CANCELLED
// ─────────────────────────────────────────────────────────────────────────────
export interface CancelAssignedOrderParams {
  orderId: string;
  driverId: string;
  cancellationReason?: string;
}

export const cancelAssignedOrder = async (params: CancelAssignedOrderParams) => {
  const connection = await pool.getConnection();
  try {
    const { orderId, driverId, cancellationReason } = params;

    await connection.beginTransaction();

    // 1. Fetch the order with lock
    const [orderRows] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ? FOR UPDATE", [
      orderId,
    ]);

    if (orderRows.length === 0) {
      await connection.rollback();
      return {
        success: false,
        message: "Order not found",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    const order = orderRows[0];

    // 2. Ownership guard — must be assigned to this driver
    if (order.driver_id !== driverId) {
      await connection.rollback();
      return {
        success: false,
        message: "This order is not assigned to you",
        code: CustomCode.ForbiddenCode,
        result: null,
      };
    }

    // 3. Status guard — can only cancel if ASSIGNED_TO_DRIVER (not yet picked up)
    if (order.order_status !== OrderStatus.ASSIGNED_TO_DRIVER) {
      await connection.rollback();
      return {
        success: false,
        message: `Cannot cancel. Order status is "${order.order_status}". Can only cancel orders with status "ASSIGNED_TO_DRIVER".`,
        code: CustomCode.BadRequestCode,
        result: null,
      };
    }

    // 4. Update customer_order_deliveries → CANCELLED
    await connection.query(
      `UPDATE customer_order_deliveries
       SET delivery_status = ?,
           delivery_notes = ?
       WHERE order_id = ? AND driver_id = ?`,
      [
        DeliveryStatus.CANCELLED,
        cancellationReason || "Driver cancelled the order",
        orderId,
        driverId,
      ]
    );

    // 5. Update customer_orders → unassign driver and revert to READY_FOR_PICKUP
    await connection.query(
      `UPDATE customer_orders
       SET driver_id = NULL,
           driver_assigned_at = NULL,
           order_status = ?,
           remarks = CONCAT(COALESCE(remarks, ''), '\n[Driver Cancelled]: ', ?)
       WHERE order_id = ?`,
      [
        OrderStatus.READY_FOR_PICKUP,
        cancellationReason || "Driver cancelled the order",
        orderId,
      ]
    );

    await connection.commit();

    // 6. Notify customer (optional, commented out)
    // const customerTokens = await getTokensForUser(
    //   order.customer_id,
    //   PushTokenUserType.CUSTOMER
    // );
    // sendPushNotification(
    //   customerTokens,
    //   "Order Assignment Cancelled",
    //   "Your order is being reassigned to another driver.",
    //   { orderId }
    // );

    return {
      success: true,
      message: "Order cancelled successfully. It will be reassigned to another driver.",
      code: CustomCode.SuccessCode,
      result: {
        orderId,
        cancellationReason: cancellationReason || "Driver cancelled the order",
      },
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/driver/orders/:order_id/return — Driver returns order to warehouse (RTO)
// This is used when delivery fails AFTER pickup (e.g., customer not available, refused)
// Precondition: order_status = OUT_FOR_DELIVERY & delivery belongs to this driver
// Postcondition:
//   customer_orders  → order_status = CANCELLED, remarks updated with return reason
//   customer_order_deliveries → delivery_status = CANCELLED, delivery_notes updated
// Note: In a production system, you'd also trigger inventory restoration here
// ─────────────────────────────────────────────────────────────────────────────
export interface ReturnOrderParams {
  orderId: string;
  driverId: string;
  returnReason: string;
}

export const returnOrder = async (params: ReturnOrderParams) => {
  const connection = await pool.getConnection();
  try {
    const { orderId, driverId, returnReason } = params;

    await connection.beginTransaction();

    // 1. Fetch the delivery record
    const [deliveryRows] = await connection.query<
      OrderDeliveryRow[] & RowDataPacket[]
    >(
      "SELECT * FROM customer_order_deliveries WHERE order_id = ? AND driver_id = ? FOR UPDATE",
      [orderId, driverId]
    );

    if (deliveryRows.length === 0) {
      await connection.rollback();
      return {
        success: false,
        message: "Delivery not found or not assigned to you",
        code: CustomCode.NotFoundCode,
        result: null,
      };
    }

    const delivery = deliveryRows[0];

    // 2. Status guard — must be PICKED_UP (out for delivery)
    if (delivery.delivery_status !== DeliveryStatus.PICKED_UP) {
      await connection.rollback();
      return {
        success: false,
        message: `Cannot return. Current delivery status is "${delivery.delivery_status}". Expected "PICKED_UP".`,
        code: CustomCode.BadRequestCode,
        result: null,
      };
    }

    // 3. Fetch the order
    const [orderRows] = await connection.query<
      CustomerOrderRow[] & RowDataPacket[]
    >("SELECT * FROM customer_orders WHERE order_id = ?", [orderId]);

    const order = orderRows[0];

    // 4. Update customer_order_deliveries → CANCELLED with return reason
    await connection.query(
      `UPDATE customer_order_deliveries
       SET delivery_status = ?,
           delivery_notes = ?
       WHERE order_id = ? AND driver_id = ?`,
      [
        DeliveryStatus.CANCELLED,
        `RTO: ${returnReason}`,
        orderId,
        driverId,
      ]
    );

    // 5. Update customer_orders → CANCELLED
    await connection.query(
      `UPDATE customer_orders
       SET order_status = ?,
           remarks = CONCAT(COALESCE(remarks, ''), '\n[Return to Origin]: ', ?)
       WHERE order_id = ?`,
      [OrderStatus.CANCELLED, returnReason, orderId]
    );

    // TODO: Restore inventory quantities (if you have inventory management logic)
    // This would involve:
    // - Fetching customer_order_items for this order_id
    // - Incrementing inventory quantities for each item
    // - Logging the inventory adjustment

    await connection.commit();

    // 6. Notify customer
    // const customerTokens = await getTokensForUser(
    //   order.customer_id,
    //   PushTokenUserType.CUSTOMER
    // );
    // sendPushNotification(
    //   customerTokens,
    //   "Order Returned",
    //   "Your order could not be delivered and has been returned. You will receive a full refund.",
    //   { orderId }
    // );

    return {
      success: true,
      message: "Order returned to warehouse successfully",
      code: CustomCode.SuccessCode,
      result: {
        orderId,
        returnReason,
        note: "Inventory restoration should be handled separately",
      },
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