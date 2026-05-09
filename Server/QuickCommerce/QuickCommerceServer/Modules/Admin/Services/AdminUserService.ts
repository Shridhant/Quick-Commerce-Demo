import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../StandardConfig/MySqlDbConfig";

import { AppError } from "../../../StandardUtility/AppError";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { CustomCode } from "../../../StandardUtility/CustomCode";

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
}

export const userListing = async (
    page: number = 1,
    limit: number = 15
  ) => {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
  
      // Fetch customers with all their addresses
      const query = `
        SELECT 
          c.*,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'address_id', ca.address_id,
              'address_line1', ca.address_line1,
              'address_line2', ca.address_line2,
              'city', ca.city,
              'state', ca.state,
              'postal_code', ca.postal_code,
              'country', ca.country,
              'latitude', ca.latitude,
              'longitude', ca.longitude,
              'landmark', ca.landmark,
              'phone_number', ca.phone_number,
              'is_default', ca.is_default
            )
          ) as addresses
        FROM customer c
        LEFT JOIN customer_addresses ca ON c.customer_id = ca.customer_id
        GROUP BY c.customer_id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;
  
      const [result] = await connection.query<RowDataPacket[]>(query, [
        limit,
        offset,
      ]);
  
      // Count total customers
      const countQuery = `SELECT COUNT(*) AS total FROM customer`;
      const [totalCustomersResult] = await connection.query<RowDataPacket[]>(countQuery);
  
      const totalCustomersCount = totalCustomersResult[0]?.total || 0;
      const totalPages = Math.ceil(totalCustomersCount / limit);
  
      return {
        success: true,
        message: "Customer Listing fetched successfully",
        code: CustomCode.SuccessCode,
        result,
        totalCustomersCount,
        totalPages,
        currentPage: page,
      };
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
  
  // Get single user details with addresses and order summary
  export const getUserDetails = async (customerId: string) => {
    const connection = await pool.getConnection();
    try {
      // replace the column list with actual columns from your `customer` table
const query = `
SELECT
  c.customer_id,
  c.name AS first_name,  -- Note: your table has 'name', not 'first_name' and 'last_name'
  c.email,
  c.phone,
  COALESCE(
    JSON_ARRAYAGG(
      CASE 
        WHEN ca.address_id IS NOT NULL THEN
          JSON_OBJECT(
            'address_id', ca.address_id,
            'address_line1', ca.address_line1,
            'address_line2', ca.address_line2,
            'city', ca.city,
            'state', ca.state,
            'postal_code', ca.postal_code,
            'country', ca.country,
            'latitude', ca.latitude,
            'longitude', ca.longitude,
            'landmark', ca.landmark,
            'phone_number', ca.phone_number,
            'is_default', ca.is_default
          )
        END
    ),
    JSON_ARRAY()
  ) AS addresses,
  COUNT(DISTINCT co.order_id) AS total_orders,
  COALESCE(SUM(co.total_amount), 0) AS lifetime_value
FROM customer c
LEFT JOIN customer_addresses ca ON c.customer_id = ca.customer_id
LEFT JOIN customer_orders co ON c.customer_id = co.customer_id
WHERE c.customer_id = ?
GROUP BY c.customer_id, c.name, c.email, c.phone;
`;

  
      const [result] = await connection.query<RowDataPacket[]>(query, [customerId]);
  
      if (!result || result.length === 0) {
        return {
          success: false,
          message: "Customer not found",
          code: CustomCode.NotFoundCode,
          result: null,
        };
      }
  
      return {
        success: true,
        message: "Customer details fetched successfully",
        code: CustomCode.SuccessCode,
        result: result[0],
      };
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
  
  // Customer analytics/statistics
  export const getCustomerAnalytics = async () => {
    const connection = await pool.getConnection();
    try {
      // Overview stats
      const overviewQuery = `
        SELECT 
          COUNT(DISTINCT c.customer_id) as total_customers,
          COUNT(DISTINCT CASE WHEN c.isActive = 1 THEN c.customer_id END) as active_customers,
          COUNT(DISTINCT co.order_id) as total_orders,
          COALESCE(SUM(co.total_amount), 0) as total_revenue,
          COALESCE(AVG(co.total_amount), 0) as avg_order_value
        FROM customer c
        LEFT JOIN customer_orders co ON c.customer_id = co.customer_id
      `;
  
      const [overview] = await connection.query<RowDataPacket[]>(overviewQuery);
  
      // Top customers by revenue
      const topCustomersQuery = `
        SELECT 
          c.customer_id,
          c.name,
          c.email,
          c.phone,
          COUNT(co.order_id) as order_count,
          COALESCE(SUM(co.total_amount), 0) as total_spent
        FROM customer c
        LEFT JOIN customer_orders co ON c.customer_id = co.customer_id
        GROUP BY c.customer_id
        ORDER BY total_spent DESC
        LIMIT 10
      `;
  
      const [topCustomers] = await connection.query<RowDataPacket[]>(topCustomersQuery);
  
      // Customer growth by month (last 6 months)
      const growthQuery = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as new_customers
        FROM customer
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
      `;
  
      const [growth] = await connection.query<RowDataPacket[]>(growthQuery);
  
      // Order status distribution
      const orderStatusQuery = `
        SELECT 
          order_status,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total_amount
        FROM customer_orders
        GROUP BY order_status
      `;
  
      const [orderStatus] = await connection.query<RowDataPacket[]>(orderStatusQuery);
  
      return {
        success: true,
        message: "Customer analytics fetched successfully",
        code: CustomCode.SuccessCode,
        result: {
          overview: overview[0],
          topCustomers,
          growth,
          orderStatus,
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
  
  // Get customer order history
  export const getCustomerOrders = async (
    customerId: string,
    page: number = 1,
    limit: number = 15
  ) => {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
  
      const query = `
        SELECT 
          co.*,
          JSON_OBJECT(
            'address_line1', ca.address_line1,
            'address_line2', ca.address_line2,
            'city', ca.city,
            'state', ca.state,
            'postal_code', ca.postal_code
          ) as shipping_address,
          COUNT(coi.item_id) as item_count
        FROM customer_orders co
        LEFT JOIN customer_addresses ca ON co.shipping_address_id = ca.address_id
        LEFT JOIN customer_order_items coi ON co.order_id = coi.order_id
        WHERE co.customer_id = ?
        GROUP BY co.order_id
        ORDER BY co.created_at DESC
        LIMIT ? OFFSET ?
      `;
  
      const [orders] = await connection.query<RowDataPacket[]>(query, [
        customerId,
        limit,
        offset,
      ]);
  
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM customer_orders 
        WHERE customer_id = ?
      `;
  
      const [totalOrdersResult] = await connection.query<RowDataPacket[]>(
        countQuery,
        [customerId]
      );
  
      const totalOrdersCount = totalOrdersResult[0]?.total || 0;
      const totalPages = Math.ceil(totalOrdersCount / limit);
  
      return {
        success: true,
        message: "Customer orders fetched successfully",
        code: CustomCode.SuccessCode,
        result: orders,
        totalOrdersCount,
        totalPages,
        currentPage: page,
      };
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
  
  // Get recent orders (for dashboard)
  export const getRecentOrders = async (limit: number = 10) => {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT 
          co.order_id,
          co.customer_id,
          c.name as customer_name,
          c.email,
          co.total_amount,
          co.order_status,
          co.payment_status,
          co.created_at
        FROM customer_orders co
        INNER JOIN customer c ON co.customer_id = c.customer_id
        ORDER BY co.created_at DESC
        LIMIT ?
      `;
  
      const [orders] = await connection.query<RowDataPacket[]>(query, [limit]);
  
      return {
        success: true,
        message: "Recent orders fetched successfully",
        code: CustomCode.SuccessCode,
        result: orders,
      };
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };




  
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
  
      // Get orders with details
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
          CONCAT(ca.address_line1, ', ', 
                 COALESCE(ca.address_line2, ''), ', ',
                 ca.city, ', ', ca.state, ' ', ca.postal_code) as shipping_address,
          ca.phone_number as shipping_phone,
          (SELECT COUNT(*) FROM customer_order_items WHERE order_id = co.order_id) as items_count
        FROM customer_orders co
        INNER JOIN customer c ON co.customer_id = c.customer_id
        LEFT JOIN customer_addresses ca ON co.shipping_address_id = ca.address_id
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
  