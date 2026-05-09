import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../StandardConfig/MySqlDbConfig";

import { AppError } from "../../../StandardUtility/AppError";

import { CustomCode } from "../../../StandardUtility/CustomCode";




import mysql from "mysql2/promise";
import {
  
  StandardStatus,
  
} from "../../../StandardUtility/StatusEnum";




const getWarehouseId = async (connection: mysql.PoolConnection) => {
  try {
    const selectWarehouseQuery = `
      SELECT warehouse_id
      FROM warehouse
      WHERE warehouse_id REGEXP '^WH[0-9]{5,}$'
      ORDER BY CAST(SUBSTRING(warehouse_id, 3) AS SIGNED) DESC
      LIMIT 1`;

    const [rows] = await connection.query<RowDataPacket[]>(
      selectWarehouseQuery
    );

    console.log("Query result rows:", rows); // DEBUG

    if (!rows || rows.length === 0) {
      console.log("No warehouses found, starting from 100000"); // DEBUG
      return 100000;
    }

    const lastWarehouseId = rows[0].warehouse_id;
    console.log("Last warehouse_id:", lastWarehouseId); // DEBUG
    
    if (!lastWarehouseId || typeof lastWarehouseId !== 'string') {
      return 100000;
    }

    // Extract numeric part after "WH"
    const numericPart = lastWarehouseId.substring(2);
    const numericValue = parseInt(numericPart, 10);
    
    console.log("Numeric part extracted:", numericPart, "Parsed value:", numericValue); // DEBUG
    
    if (isNaN(numericValue) || numericValue < 100000) {
      return 100000;
    }
    
    return numericValue;
  } catch (err) {
    console.error("Error in getWarehouseId:", err);
    throw new AppError("Error Generating Unique Warehouse Code");
  }
};

export const createWarehouse = async (
  warehouseName: string,
  warehouseAddressline1: string | null,
  warehouseAddressline2: string | null,
  warehouseCity: string,
  warehouseState: string,
  warehousePostalCode: string,
  warehouseCountry: string,
  warehouseLatitude: number | null,
  warehouseLongitude: number | null
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const maxWarehouseCode = await getWarehouseId(connection);
    console.log("maxWarehouseCode:", maxWarehouseCode); // DEBUG
    
    const nextWarehouseCode = maxWarehouseCode + 1;
    console.log("nextWarehouseCode:", nextWarehouseCode); // DEBUG
    
    const warehouseId = `WH${nextWarehouseCode.toString().padStart(5, "0")}`;
    console.log("Generated warehouseId:", warehouseId); // DEBUG
    
    // Validate the generated ID
    if (warehouseId.length > 10) {
      throw new AppError("Generated warehouse ID is invalid");
    }

const query = `
  INSERT INTO warehouse (
    warehouse_id,
    name,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    latitude,
    longitude,
    location,
    status
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, POINT(?, ?), ?)
`;
    
    const [result] = await connection.query<ResultSetHeader>(query, [
      warehouseId,
      warehouseName,
      warehouseAddressline1,
      warehouseAddressline2,
      warehouseCity,
      warehouseState,
      warehousePostalCode,
      warehouseCountry,
      warehouseLatitude,
      warehouseLongitude,
      warehouseLongitude, // longitude for POINT
      warehouseLatitude,  // latitude for POINT
      StandardStatus.ACTIVE,
    ]);

    console.log("Insert result:", result); // DEBUG

    await connection.commit();
    
    if (result?.affectedRows > 0) {
      return { success: true, message: "Warehouse created successfully", warehouseId };
    }

    return { success: false, message: "Failed Adding Warehouse" };
  } catch (err) {
    await connection.rollback();
    console.error("Error in createWarehouse:", err); // DEBUG
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
  
  
  
  
  export const warehouseListing = async (status: string) => {
    try {
      const [result] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM warehouse where status = ?`,
        [status]
      );
      return {
        success: true,
        message: "Data Fetched Successfully",
        code: CustomCode.SuccessCode,
        result,
      };
    } catch (err) {
      throw err;
    }
  };
  

  export const getWarehouseAnalyticsData = async (warehouseId?: string) => {
    const connection = await pool.getConnection();
    try {
      const warehouseFilter = warehouseId ? 'WHERE w.warehouse_id = ?' : '';
      const params = warehouseId ? [warehouseId] : [];
  
      // Overview stats
      const overviewQuery = `
        SELECT 
          COUNT(DISTINCT w.warehouse_id) as total_warehouses,
          COUNT(DISTINCT CASE WHEN w.status = 'ACTIVE' THEN w.warehouse_id END) as active_warehouses,
          COUNT(DISTINCT i.inventory_id) as total_inventory_items,
          COALESCE(SUM(i.quantity), 0) as total_stock_quantity,
          COUNT(DISTINCT i.vendor_id) as total_vendors_served,
          COUNT(DISTINCT i.product_id) as unique_products_stored
        FROM warehouse w
        LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
        ${warehouseFilter}
      `;
  
      const [overview] = await connection.query<RowDataPacket[]>(
        overviewQuery, 
        params
      );
  
      // Warehouse inventory breakdown
      const inventoryBreakdownQuery = `
        SELECT 
          w.warehouse_id,
          w.name as warehouse_name,
          w.city,
          w.state,
          w.status,
          COUNT(DISTINCT i.inventory_id) as inventory_items,
          COUNT(DISTINCT i.vendor_id) as vendor_count,
          COUNT(DISTINCT i.product_id) as product_count,
          COALESCE(SUM(i.quantity), 0) as total_quantity
        FROM warehouse w
        LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
        ${warehouseFilter}
        GROUP BY w.warehouse_id
        ORDER BY total_quantity DESC
      `;
  
      const [warehouseBreakdown] = await connection.query<RowDataPacket[]>(
        inventoryBreakdownQuery,
        params
      );
  
      // Top products by stock quantity
      const topProductsQuery = `
        SELECT 
          p.product_id,
          p.name as product_name,
          p.category,
          p.brand,
          ${warehouseId ? 'w.warehouse_id, w.name as warehouse_name,' : ''}
          COALESCE(SUM(i.quantity), 0) as total_stock,
          COUNT(DISTINCT i.vendor_id) as vendor_count
        FROM product p
        LEFT JOIN inventory i ON p.product_id = i.product_id
        ${warehouseId ? 'LEFT JOIN warehouse w ON i.warehouse_id = w.warehouse_id' : ''}
        ${warehouseFilter}
        GROUP BY p.product_id ${warehouseId ? ', w.warehouse_id' : ''}
        ORDER BY total_stock DESC
        LIMIT 10
      `;
  
      const [topProducts] = await connection.query<RowDataPacket[]>(
        topProductsQuery,
        params
      );
  
      // Vendor distribution per warehouse
      const vendorDistributionQuery = `
        SELECT 
          w.warehouse_id,
          w.name as warehouse_name,
          v.vendor_id,
          v.name as vendor_name,
          v.city as vendor_city,
          COUNT(DISTINCT i.inventory_id) as inventory_items,
          COALESCE(SUM(i.quantity), 0) as total_stock
        FROM warehouse w
        INNER JOIN inventory i ON w.warehouse_id = i.warehouse_id
        INNER JOIN vendors v ON i.vendor_id = v.vendor_id
        ${warehouseFilter}
        GROUP BY w.warehouse_id, v.vendor_id
        ORDER BY w.warehouse_id, total_stock DESC
      `;
  
      const [vendorDistribution] = await connection.query<RowDataPacket[]>(
        vendorDistributionQuery,
        params
      );
  
      // Low stock alerts (products with quantity < 10)
      const lowStockQuery = `
        SELECT 
          w.warehouse_id,
          w.name as warehouse_name,
          p.product_id,
          p.name as product_name,
          p.category,
          v.vendor_id,
          v.name as vendor_name,
          i.quantity,
          i.last_updated
        FROM inventory i
        INNER JOIN warehouse w ON i.warehouse_id = w.warehouse_id
        INNER JOIN product p ON i.product_id = p.product_id
        INNER JOIN vendors v ON i.vendor_id = v.vendor_id
        WHERE i.quantity < 10
        ${warehouseId ? 'AND w.warehouse_id = ?' : ''}
        ORDER BY i.quantity ASC, i.last_updated DESC
        LIMIT 20
      `;
  
      const [lowStock] = await connection.query<RowDataPacket[]>(
        lowStockQuery,
        params
      );
  
      // Product category distribution
      const categoryDistributionQuery = `
        SELECT 
          p.category,
          COUNT(DISTINCT i.inventory_id) as inventory_items,
          COUNT(DISTINCT p.product_id) as unique_products,
          COALESCE(SUM(i.quantity), 0) as total_quantity
        FROM inventory i
        INNER JOIN product p ON i.product_id = p.product_id
        INNER JOIN warehouse w ON i.warehouse_id = w.warehouse_id
        ${warehouseFilter}
        GROUP BY p.category
        ORDER BY total_quantity DESC
      `;
  
      const [categoryDistribution] = await connection.query<RowDataPacket[]>(
        categoryDistributionQuery,
        params
      );
  
      // Recent inventory updates
      const recentUpdatesQuery = `
        SELECT 
          i.inventory_id,
          w.warehouse_id,
          w.name as warehouse_name,
          p.product_id,
          p.name as product_name,
          v.vendor_id,
          v.name as vendor_name,
          i.quantity,
          i.last_updated
        FROM inventory i
        INNER JOIN warehouse w ON i.warehouse_id = w.warehouse_id
        INNER JOIN product p ON i.product_id = p.product_id
        INNER JOIN vendors v ON i.vendor_id = v.vendor_id
        ${warehouseFilter}
        ORDER BY i.last_updated DESC
        LIMIT 10
      `;
  
      const [recentUpdates] = await connection.query<RowDataPacket[]>(
        recentUpdatesQuery,
        params
      );
  
      return {
        success: true,
        message: "Warehouse analytics fetched successfully",
        code: CustomCode.SuccessCode,
        result: {
          overview: overview[0],
          warehouseBreakdown,
          topProducts,
          vendorDistribution,
          lowStockAlerts: lowStock,
          categoryDistribution,
          recentUpdates,
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
  
  export const getRecentWarehouseOrders = async (limit: number = 10, warehouseId?: string) => {
    const connection = await pool.getConnection();
    try {
      const warehouseFilter = warehouseId ? 'WHERE od.warehouse_id = ?' : '';
      const params = warehouseId ? [warehouseId, limit] : [limit];
  
      const query = `
        SELECT 
          od.order_id,
          od.type,
          od.order_status,
          od.product_status,
          w.warehouse_id,
          w.name as warehouse_name,
          v.vendor_id,
          v.name as vendor_name,
          od.driver_name,
          od.driver_phone,
          od.vehicle_number,
          od.pickup_date,
          od.pickup_time_start,
          od.pickup_time_end,
          od.created_at
        FROM order_details od
        INNER JOIN vendors v ON od.vendor_id = v.vendor_id
        LEFT JOIN warehouse w ON od.warehouse_id = w.warehouse_id
        ${warehouseFilter}
        ORDER BY od.created_at DESC
        LIMIT ?
      `;
  
      const [orders] = await connection.query<RowDataPacket[]>(
        query, 
        warehouseId ? [warehouseId, limit] : [limit]
      );
  
      return {
        success: true,
        message: "Recent warehouse orders fetched successfully",
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