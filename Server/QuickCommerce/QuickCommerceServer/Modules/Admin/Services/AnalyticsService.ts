import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { AppError} from "../../../StandardUtility/AppError";
import pool from "../../StandardConfig/MySqlDbConfig";
import { RowDataPacket} from "mysql2";
import { CustomCode } from "../../../StandardUtility/CustomCode";




export const fetchDashboardOverview = async () => {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM \`order_details\`) as total_orders,
          (SELECT COUNT(*) FROM \`user\` WHERE isActive = 1) as active_users,
          (SELECT COUNT(*) FROM \`vendors\` WHERE isActive = 1) as active_vendors,
          (SELECT COUNT(*) FROM \`driver\` WHERE isActive = 1) as active_drivers,
          (SELECT COUNT(*) FROM \`product\` WHERE is_active = 1) as active_products,
          (SELECT COALESCE(SUM(op.requested_quantity * op.product_price), 0)
           FROM \`order_product\` op 
           JOIN \`order_details\` od ON op.order_id = od.order_id 
           WHERE DATE(od.created_at) = CURDATE()) as today_revenue,
          (SELECT COUNT(*) FROM \`order_details\` 
           WHERE DATE(created_at) = CURDATE()) as today_orders
      `;
  
      const [results] = await pool.query<RowDataPacket[]>(query);
      
      return { 
        success: true, 
        message: "Dashboard overview fetched successfully", 
        code: CustomCode.SuccessCode, 
        data: results[0] 
      };
    } catch (error) {
      throw new AppError("Failed to fetch dashboard overview", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  

export const fetchOrderAnalytics = async (period: string, startDate?: string, endDate?: string) => {
    try {
      let dateCondition = '';
      let trendsParams: any[] = [];
      let statusParams: any[] = [];
      
      if (startDate && endDate) {
        dateCondition = 'WHERE created_at BETWEEN ? AND ?';
        trendsParams = [startDate, endDate];
        statusParams = [startDate, endDate, startDate, endDate]; // For subquery too
      } else {
        dateCondition = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
        trendsParams = [period];
        statusParams = [period, period]; // For subquery too
      }
  
      // Order trends query
      const trendsQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as order_count,
          COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM \`order_details\`
        ${dateCondition}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
  
      // Simplified status distribution query
      const statusQuery = `
        SELECT 
          order_status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM \`order_details\` 
            ${dateCondition}
          ), 2) as percentage
        FROM \`order_details\`
        ${dateCondition}
        GROUP BY order_status
      `;
  
      console.log('Executing trends query:', trendsQuery);
      console.log('Trends params:', trendsParams);
      
      const [orderTrends] = await pool.query<RowDataPacket[]>(trendsQuery, trendsParams);
      
      console.log('Executing status query:', statusQuery);
      console.log('Status params:', statusParams);
      
      const [statusDistribution] = await pool.query<RowDataPacket[]>(statusQuery, statusParams);
  
      return {
        success: true,
        message: "Order analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: {
          trends: orderTrends,
          statusDistribution
        }
      };
    } catch (error) {
      console.error('Order analytics error:', error);
      throw new AppError("Failed to fetch order analytics", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  export const fetchRevenueAnalytics = async (period: string, groupBy: string) => {
    try {
      let dateFormat = '';
      switch (groupBy) {
        case 'hour':
          dateFormat = 'DATE_FORMAT(od.created_at, "%Y-%m-%d %H:00:00")';
          break;
        case 'day':
          dateFormat = 'DATE(od.created_at)';
          break;
        case 'week':
          dateFormat = 'YEARWEEK(od.created_at)';
          break;
        case 'month':
          dateFormat = 'DATE_FORMAT(od.created_at, "%Y-%m")';
          break;
        default:
          dateFormat = 'DATE(od.created_at)';
      }
  
      const query = `
        SELECT 
          ${dateFormat} as period,
          COALESCE(SUM(op.requested_quantity * op.product_price), 0) as revenue,
          COALESCE(SUM(op.requested_quantity * COALESCE(op.offer_price, op.product_price)), 0) as discounted_revenue,
          COUNT(DISTINCT od.order_id) as order_count,
          COALESCE(AVG(op.requested_quantity * op.product_price), 0) as avg_order_value
        FROM \`order_details\` od
        JOIN \`order_product\` op ON od.order_id = op.order_id
        WHERE od.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND od.order_status = 'completed'
        GROUP BY ${dateFormat}
        ORDER BY period
      `;
  
      const [revenueData] = await pool.query<RowDataPacket[]>(query, [period]);
  
      return {
        success: true,
        message: "Revenue analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: revenueData
      };
    } catch (error) {
      throw new AppError("Failed to fetch revenue analytics", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };


  export const fetchProductPerformance = async (limit: number, period: string) => {
    try {
      const topProductsQuery = `
        SELECT 
          op.product_id,
          op.product_name,
          op.product_category,
          op.product_brand,
          SUM(op.requested_quantity) as total_quantity_sold,
          COUNT(DISTINCT op.order_id) as order_count,
          COALESCE(SUM(op.requested_quantity * op.product_price), 0) as total_revenue,
          COALESCE(AVG(op.product_price), 0) as avg_price,
          ROUND(AVG(op.requested_quantity), 2) as avg_quantity_per_order
        FROM \`order_product\` op
        JOIN \`order_details\` od ON op.order_id = od.order_id
        WHERE od.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND od.order_status = 'completed'
        GROUP BY op.product_id, op.product_name, op.product_category, op.product_brand
        ORDER BY total_revenue DESC
        LIMIT ?
      `;
  
      const lowStockQuery = `
        SELECT 
          p.product_id,
          p.name,
          p.category,
          p.brand,
          COALESCE(SUM(i.quantity), 0) as total_stock,
          COUNT(i.warehouse_id) as warehouse_count
        FROM \`product\` p
        LEFT JOIN \`inventory\` i ON p.product_id = i.product_id
        WHERE p.is_active = 1
        GROUP BY p.product_id, p.name, p.category, p.brand
        HAVING total_stock < 50
        ORDER BY total_stock ASC
        LIMIT 20
      `;
  
      const [topProducts] = await pool.query<RowDataPacket[]>(topProductsQuery, [period, limit]);
      const [lowStockProducts] = await pool.query<RowDataPacket[]>(lowStockQuery);
  
      return {
        success: true,
        message: "Product performance analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: {
          topProducts,
          lowStockProducts
        }
      };
    } catch (error) {
      throw new AppError("Failed to fetch product performance", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  
  export const fetchVendorPerformance = async (limit: number, period: string) => {
    try {
      const query = `
        SELECT 
          v.vendor_id,
          v.name as vendor_name,
          v.city,
          v.state,
          COUNT(DISTINCT od.order_id) as total_orders,
          COALESCE(SUM(op.requested_quantity * op.product_price), 0) as total_revenue,
          COALESCE(AVG(op.requested_quantity * op.product_price), 0) as avg_order_value,
          COUNT(DISTINCT op.product_id) as unique_products_sold,
          ROUND(AVG(CASE WHEN od.order_status = 'completed' THEN 1 ELSE 0 END) * 100, 2) as completion_rate
        FROM \`vendors\` v
        JOIN \`order_details\` od ON v.vendor_id = od.vendor_id
        JOIN \`order_product\` op ON od.order_id = op.order_id
        WHERE od.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY v.vendor_id, v.name, v.city, v.state
        ORDER BY total_revenue DESC
        LIMIT ?
      `;
  
      const [vendorStats] = await pool.query<RowDataPacket[]>(query, [period, limit]);
  
      return {
        success: true,
        message: "Vendor performance analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: vendorStats
      };
    } catch (error) {
      throw new AppError("Failed to fetch vendor performance", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  
  export const fetchCategoryPerformance = async (period: string) => {
    try {
      const query = `
        SELECT 
          op.product_category,
          COUNT(DISTINCT op.order_id) as order_count,
          SUM(op.requested_quantity) as total_quantity_sold,
          COALESCE(SUM(op.requested_quantity * op.product_price), 0) as total_revenue,
          COALESCE(AVG(op.product_price), 0) as avg_price,
          COUNT(DISTINCT op.product_id) as unique_products
        FROM \`order_product\` op
        JOIN \`order_details\` od ON op.order_id = od.order_id
        WHERE od.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND od.order_status = 'completed'
          AND op.product_category IS NOT NULL
        GROUP BY op.product_category
        ORDER BY total_revenue DESC
      `;
  
      const [categoryStats] = await pool.query<RowDataPacket[]>(query, [period]);
  
      return {
        success: true,
        message: "Category performance analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: categoryStats
      };
    } catch (error) {
      throw new AppError("Failed to fetch category performance", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  export const fetchInventoryAnalytics = async () => {
    try {
      const warehouseQuery = `
        SELECT 
          w.warehouse_id,
          w.name as warehouse_name,
          w.city,
          COUNT(DISTINCT i.product_id) as total_products,
          COALESCE(SUM(i.quantity), 0) as total_stock,
          COALESCE(AVG(i.quantity), 0) as avg_stock_per_product,
          COUNT(CASE WHEN i.quantity < 10 THEN 1 END) as low_stock_products,
          COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock_products
        FROM \`warehouse\` w
        LEFT JOIN \`inventory\` i ON w.warehouse_id = i.warehouse_id
        GROUP BY w.warehouse_id, w.name, w.city
        ORDER BY total_stock DESC
      `;
  
      const categoryQuery = `
        SELECT 
          p.category,
          COUNT(DISTINCT i.product_id) as product_count,
          COALESCE(SUM(i.quantity), 0) as total_stock,
          COALESCE(AVG(i.quantity), 0) as avg_stock
        FROM \`product\` p
        JOIN \`inventory\` i ON p.product_id = i.product_id
        WHERE p.is_active = 1
        GROUP BY p.category
        ORDER BY total_stock DESC
      `;
  
      const [warehouseStats] = await pool.query<RowDataPacket[]>(warehouseQuery);
      const [categoryInventory] = await pool.query<RowDataPacket[]>(categoryQuery);
  
      return {
        success: true,
        message: "Inventory analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: {
          warehouseStats,
          categoryInventory
        }
      };
    } catch (error) {
      throw new AppError("Failed to fetch inventory analytics", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  
  export const fetchUserGrowthAnalytics = async (period: string, userType: string) => {
    try {
      const results: any[] = [];
      
      if (userType === 'all' || userType === 'customers') {
        const customerQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_registrations,
            'customer' as user_type
          FROM \`user\`
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        const [customerData] = await pool.query<RowDataPacket[]>(customerQuery, [period]);
        results.push(...customerData);
      }
  
      if (userType === 'all' || userType === 'vendors') {
        const vendorQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_registrations,
            'vendor' as user_type
          FROM \`vendors\`
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        const [vendorData] = await pool.query<RowDataPacket[]>(vendorQuery, [period]);
        results.push(...vendorData);
      }
  
      if (userType === 'all' || userType === 'drivers') {
        const driverQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_registrations,
            'driver' as user_type
          FROM \`driver\`
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        const [driverData] = await pool.query<RowDataPacket[]>(driverQuery, [period]);
        results.push(...driverData);
      }
  
      return {
        success: true,
        message: "User growth analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: results
      };
    } catch (error) {
      throw new AppError("Failed to fetch user growth analytics", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  export const fetchUserGrowthAnalyticsNew = async (period: string, userType: string) => {
    try {
      const results: any[] = [];
      
      if (userType === 'all' || userType === 'customers') {
        // Query both user and customer tables for complete customer data
        const customerQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_registrations,
            'customer' as user_type
          FROM (
            SELECT created_at FROM \`user\`
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            UNION ALL
            SELECT created_at FROM \`customer\`
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          ) AS combined_customers
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        const [customerData] = await pool.query<RowDataPacket[]>(customerQuery, [period, period]);
        results.push(...customerData);
      }
  
      if (userType === 'all' || userType === 'vendors') {
        const vendorQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_registrations,
            'vendor' as user_type
          FROM \`vendors\`
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        const [vendorData] = await pool.query<RowDataPacket[]>(vendorQuery, [period]);
        results.push(...vendorData);
      }
  
      if (userType === 'all' || userType === 'drivers') {
        const driverQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_registrations,
            'driver' as user_type
          FROM \`driver\`
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        const [driverData] = await pool.query<RowDataPacket[]>(driverQuery, [period]);
        results.push(...driverData);
      }
  
      return {
        success: true,
        message: "User growth analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: results
      };
    } catch (error) {
      throw new AppError("Failed to fetch user growth analytics", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };
  
  export const fetchGeographicAnalytics = async (level: string, period: string) => {
    try {
      const groupByField = level === 'state' ? 'v.state' : 'v.city';
      
      const query = `
        SELECT 
          ${groupByField} as location,
          COUNT(DISTINCT od.order_id) as order_count,
          COALESCE(SUM(op.requested_quantity * op.product_price), 0) as total_revenue,
          COUNT(DISTINCT v.vendor_id) as vendor_count,
          COALESCE(AVG(op.requested_quantity * op.product_price), 0) as avg_order_value
        FROM \`vendors\` v
        JOIN \`order_details\` od ON v.vendor_id = od.vendor_id
        JOIN \`order_product\` op ON od.order_id = op.order_id
        WHERE od.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND od.order_status = 'completed'
          AND ${groupByField} IS NOT NULL
        GROUP BY ${groupByField}
        ORDER BY total_revenue DESC
        LIMIT 20
      `;
  
      const [geoData] = await pool.query<RowDataPacket[]>(query, [period]);
  
      return {
        success: true,
        message: "Geographic analytics fetched successfully",
        code: CustomCode.SuccessCode,
        data: geoData
      };
    } catch (error) {
      throw new AppError("Failed to fetch geographic analytics", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };