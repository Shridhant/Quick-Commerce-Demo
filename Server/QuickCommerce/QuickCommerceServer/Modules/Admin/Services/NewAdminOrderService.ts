import {  RowDataPacket } from "mysql2";
import pool from "../../StandardConfig/MySqlDbConfig";
import { AppError } from "../../../StandardUtility/AppError";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import {OrderStatus} from "../../../StandardUtility/StatusEnum";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import { ProductType } from "../../../StandardUtility/StatusEnum"; 

interface PickupDetails {
    driverName: string;
    driverPhone: string;
    vehicleNumber?: string;
    pickupDate: string;     
    pickupTimeStart: string;
    pickupTimeEnd: string; 
    pickupNotes?: string;
  }


async function createAndSaveVendorProductInventory(
    connection: mysql.PoolConnection,
    data: {
      warehouseId: string;
      productId: string;
      vendorId: string;
      requestedQuantity: number;
    }, // add your columns here
    maxAttempts = 10
  ): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const vendorInventoryId = uuidv4();
  
      console.log(
        vendorInventoryId,
        data.warehouseId,
        data.productId,
        data?.vendorId,
        data?.requestedQuantity
      );
      try {
        await connection.execute(
          `INSERT INTO inventory (inventory_id, warehouse_id, product_id,vendor_id,quantity)
           VALUES (?, ?, ?, ?, ?)`,
          [
            vendorInventoryId,
            data.warehouseId,
            data.productId,
            data?.vendorId,
            data?.requestedQuantity,
          ]
        );
        return vendorInventoryId; // success
      } catch (err: any) {
        // Duplicate primary key (very unlikely) → try again with a fresh UUID
        if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) continue;
        throw err; // other DB error
      }
    }
    throw new Error(
      "Could not insert a unique inventory Id after several attempts"
    );
  }
  
async function createProduct(
    connection: mysql.PoolConnection,
    data: {
      name: string;
      description: string | null;
      category: string;
      unit: string;
      image_url: string | null;
      sku: string;
      brand: string | null;
      tags: string | null;
      price: number;
      offer_price: number | null;
      expiry_date: Date | string | null;
      unit_size: number | null;
    }, // add your columns here
    maxAttempts = 10
  ): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const productId = uuidv4();
      try {
        await connection.execute(
          `INSERT INTO product (product_id, name,description,category,unit,image_url,sku,brand,tags,unit_size)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productId,
            data.name,
            data.description,
            data.category,
            data.unit,
            data.image_url,
            data.sku,
            data.brand,
            data.tags,
            data.unit_size,
          ]
        );
        return productId; // success
      } catch (err: any) {
        console.log(err);
        // Duplicate primary key (very unlikely) → try again with a fresh UUID
        if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) continue;
        throw err; // other DB error
      }
    }
    throw new AppError(
      "Could not insert a unique product_id after several attempts"
    );
  } 

// ============================================
// Updated Approve Order Function with Pickup Details
// ============================================
export const newApproveOrderDetailsAndUpdateInventory = async (
    orderId: string,
    vendorId: string,
    remarks: string | null,
    pickupDetails: PickupDetails
  ) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
  
      // ============================================
      // STEP 1: Validate pickup details
      // ============================================
      if (!pickupDetails.driverName || !pickupDetails.driverPhone) {
        throw new AppError(
          "Driver name and phone are required",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }
  
      if (!pickupDetails.pickupDate || !pickupDetails.pickupTimeStart || !pickupDetails.pickupTimeEnd) {
        throw new AppError(
          "Pickup date and time range are required",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }
  
      // ============================================
      // STEP 2: Get order details
      // ============================================
      const orderSelectQuery = `
        SELECT order_id, vendor_id, type, warehouse_id, order_status, product_status 
        FROM order_details 
        WHERE order_id = ? AND vendor_id = ?
      `;
      
      const [savedOrder] = await connection.query<RowDataPacket[]>(
        orderSelectQuery,
        [orderId, vendorId]
      );
  
      if (!savedOrder.length) {
        throw new AppError(
          "No Order Found",
          HttpStatusCode.NOT_FOUND,
          CustomCode.NotFoundCode
        );
      }
  
      const order = savedOrder[0];
  
      // Check if already approved
      if (order.order_status === OrderStatus.APPROVED) {
        throw new AppError(
          "Order is already approved",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }
  
      // ============================================
      // STEP 3: Get all products in the order
      // ============================================
      const orderProductSelectQuery = `
        SELECT 
          id, order_id, requested_quantity, product_name, product_brand, 
          product_sku, product_unit, product_image_url, product_description, 
          product_category, product_price, product_tags, product_id,
          offer_price, expiry_date, unit_size
        FROM order_product 
        WHERE order_id = ?
      `;
      
      const [savedOrderProducts] = await connection.query<RowDataPacket[]>(
        orderProductSelectQuery,
        [orderId]
      );
  
      if (!savedOrderProducts.length) {
        throw new AppError(
          "No products found in this order",
          HttpStatusCode.NOT_FOUND,
          CustomCode.NotFoundCode
        );
      }
  
      // ============================================
      // STEP 4: Handle based on order type (same as before)
      // ============================================
      
      if (order.type === ProductType.ADD_PRODUCT) {
        // Adding NEW products to the system
        for (const p of savedOrderProducts) {
          if (!p.requested_quantity || p.requested_quantity < 1) {
            throw new AppError(
              `Requested quantity must be greater than 0 for product: ${p.product_name}`,
              HttpStatusCode.BAD_REQUEST,
              CustomCode.BadRequestCode
            );
          }
  
          const productToSave = {
            name: p.product_name,
            description: p.product_description,
            category: p.product_category,
            unit: p.product_unit,
            image_url: p.product_image_url,
            sku: p.product_sku,
            brand: p.product_brand,
            tags: p.product_tags,
            price: p.product_price,
            offer_price: p.offer_price,
            expiry_date: p.expiry_date,
            unit_size: p.unit_size,
          };
  
          const productId = await createProduct(connection, productToSave);
  
          const productInvData = {
            warehouseId: order.warehouse_id,
            productId: productId,
            vendorId: vendorId,
            requestedQuantity: p.requested_quantity,
          };
          
          await createAndSaveVendorProductInventory(connection, productInvData);
        }
        
      } else {
        // Restocking EXISTING products
        for (const p of savedOrderProducts) {
          if (!p.requested_quantity || p.requested_quantity < 1) {
            throw new AppError(
              `Requested quantity must be greater than 0 for product: ${p.product_name}`,
              HttpStatusCode.BAD_REQUEST,
              CustomCode.BadRequestCode
            );
          }
  
          const vendorInvSelectQuery = `
            SELECT * FROM inventory 
            WHERE vendor_id = ? AND product_id = ? AND warehouse_id = ?
          `;
          
          const [productInvResult] = await connection.query<RowDataPacket[]>(
            vendorInvSelectQuery,
            [vendorId, p.product_id, order.warehouse_id]
          );
  
          if (productInvResult.length > 0) {
            // Product exists - UPDATE quantity
            const productInv = productInvResult[0];
            const currentQuantity = parseInt(productInv.quantity) || 0;
            const newQuantity = currentQuantity + parseInt(p.requested_quantity);
  
            const productInvUpdateQuery = `
              UPDATE inventory 
              SET quantity = ? 
              WHERE vendor_id = ? AND product_id = ? AND inventory_id = ?
            `;
            
            await connection.query(productInvUpdateQuery, [
              newQuantity,
              vendorId,
              p.product_id,
              productInv.inventory_id,
            ]);
            
          } else {
            // Product doesn't exist - CREATE new entry
            const productInvData = {
              warehouseId: order.warehouse_id,
              productId: p.product_id,
              vendorId: vendorId,
              requestedQuantity: p.requested_quantity,
            };
            
            await createAndSaveVendorProductInventory(connection, productInvData);
          }
        }
      }
  
      // ============================================
      // STEP 5: Update order status AND pickup details
      // ============================================
      await connection.query(
        `UPDATE order_details 
         SET order_status = ?, 
             product_status = ?, 
             remarks = ?,
             driver_name = ?,
             driver_phone = ?,
             vehicle_number = ?,
             pickup_date = ?,
             pickup_time_start = ?,
             pickup_time_end = ?,
             pickup_notes = ?
         WHERE order_id = ? AND vendor_id = ?`,
        [
          OrderStatus.APPROVED, 
          OrderStatus.APPROVED, 
          remarks,
          pickupDetails.driverName,
          pickupDetails.driverPhone,
          pickupDetails.vehicleNumber || null,
          pickupDetails.pickupDate,
          pickupDetails.pickupTimeStart,
          pickupDetails.pickupTimeEnd,
          pickupDetails.pickupNotes || null,
          orderId, 
          vendorId
        ]
      );
  
      // ============================================
      // STEP 6: Commit all changes
      // ============================================
      await connection.commit();
  
      // ============================================
      // STEP 7: Send notification to vendor (add your notification logic)
      // ============================================
      // await sendPickupNotificationToVendor({
      //   vendorId,
      //   orderId,
      //   driverName: pickupDetails.driverName,
      //   driverPhone: pickupDetails.driverPhone,
      //   vehicleNumber: pickupDetails.vehicleNumber,
      //   pickupDate: pickupDetails.pickupDate,
      //   pickupTimeStart: pickupDetails.pickupTimeStart,
      //   pickupTimeEnd: pickupDetails.pickupTimeEnd
      // });
  
      return {
        success: true,
        message: "Order approved successfully and pickup scheduled",
        code: CustomCode.SuccessCode,
        orderId,
        pickupInfo: {
          driverName: pickupDetails.driverName,
          driverPhone: pickupDetails.driverPhone,
          vehicleNumber: pickupDetails.vehicleNumber,
          pickupDate: pickupDetails.pickupDate,
          pickupTime: `${pickupDetails.pickupTimeStart} - ${pickupDetails.pickupTimeEnd}`,
        }
      };
      
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  };
  
  // ============================================
  // Get Pickup Details for an Order
  // ============================================
  export const getOrderPickupDetails = async (
    orderId: string,
    
  ) => {
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          order_id, vendor_id, order_status,
          driver_name, driver_phone, vehicle_number,
          pickup_date, pickup_time_start, pickup_time_end, pickup_notes
        FROM order_details 
        WHERE order_id = ? 
      `;
      
      const [result] = await connection.query<RowDataPacket[]>(query, [orderId]);
  
      if (!result.length) {
        throw new AppError(
          "Order not found",
          HttpStatusCode.NOT_FOUND,
          CustomCode.NotFoundCode
        );
      }
  
      return {
        success: true,
        data: result[0],
        code: CustomCode.SuccessCode,
      };
      
    } catch (err) {
      throw err;
    } finally {
      connection.release();
    }
  };