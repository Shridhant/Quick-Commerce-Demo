
import { RowDataPacket } from "mysql2";
import pool from "../../StandardConfig/MySqlDbConfig";
import { v4 as uuidv4 } from "uuid";
import { ProductType } from "../../../StandardUtility/StatusEnum";

import { AppError } from "../../../StandardUtility/AppError";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import mysql from "mysql2/promise";
import {
  OrderStatus,
} from "../../../StandardUtility/StatusEnum";


import {
  OrderDetails,
  OrderProduct,
  Product,
  Vendor,
  Warehouse,
} from "../../Models/Associtaion";





export const fetchIncomingOrderProducts = async (
  status: string,
  limit: number,
  page: number,
  warehouseId: string
) => {
  const offset = (page - 1) * limit;

  try {
    const whereClause: any = {};

    if (status !== "ALL") {
      whereClause.order_status = status;
    }

    if (warehouseId) {
      whereClause.warehouse_id = warehouseId;
    }

    const totalOrders = await OrderDetails.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalOrders / limit);

    const incomingOrders = await OrderDetails.findAll({
      where: whereClause,
      limit,
      offset,
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["name", "business_owner_name", "vendor_id"],
        },

        {
          model: Warehouse,
          as: "warehouse",
          attributes: [
            "warehouse_id",
            "name",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
          ],
        },
        {
          model: OrderProduct,
          as: "order_product",
          required: false,
          attributes: [
            "id",
            "order_id",
            "product_id",
            "product_name",
            "product_brand",
            "product_sku",
            "product_unit",
            "product_image_url",
            "product_description",
            "product_category",
            "product_price",
            "product_tags",
            "requested_quantity",
            "offer_price",
            "expiry_date",
            "unit_size",
          ],
          include: [
            {
              model: Product,
              as: "product",
              required: false,
              attributes: [
                "product_id",
                "name",
                "sku",
                "brand",
                "unit",
                "image_url",
                "description",
                "category",
                "price",
                "tags",
                "offer_price",
                "expiry_date",
                "unit_size",
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const result = incomingOrders.map((order) => {
      // Type assertion to include associated models
      const orderWithAssociation = order as OrderDetails & {
        vendor: Vendor;
        warehouse: Warehouse;
        order_product: (OrderProduct & { product?: Product })[];
      };

      return {
        order_id: order.order_id,
        order_status: order.order_status,
        created_at: order.created_at,
        Warehouse: orderWithAssociation.warehouse,
        //vendor: (order as any)?.vendor?.name ?? null, // 👈 safe access
        vendor: orderWithAssociation?.vendor,

        products: orderWithAssociation.order_product.map((op) => {
          const product = op.product;
          return {
            name: product?.name ?? op.product_name,
            sku: product?.sku ?? op.product_sku,
            brand: product?.brand ?? op.product_brand,
            price: product?.price ?? op.product_price,
            unit: product?.unit ?? op.product_unit,
            image: product?.image_url ?? op.product_image_url,
            description: product?.description ?? op.product_description,
            category: product?.category ?? op.product_category,
            tags: product?.tags ?? op.product_tags,
            requested_quantity: op.requested_quantity,
            // @ts-ignore
            offer_price: product?.offer_price ?? (op as any).offer_price,
            // @ts-ignore
            expiry_date: product?.expiry_date ?? (op as any).expiry_date,
            // @ts-ignore
            unit_size: product?.unit_size ?? (op as any).unit_size,
          };
        }),
      };
    });

    return {
      success: true,
      message: "Orders Fetched Successfully",
      code: CustomCode.SuccessCode,
      result,
      totalOrders,
      totalPages,
    };
  } catch (err) {
    throw err;
  }
};

export const rejectVendorRequestedOrder = async (
  orderId: string,
  vendorId: string,
  remarks: string | null
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const savedOrder = await isOrderExist(orderId, vendorId, connection);

    const cancelOrderQuery = `UPDATE order_details SET order_status = ?, product_status = ?, remarks = ? WHERE order_id = ? AND vendor_id = ?`;

    await connection.query(cancelOrderQuery, [
      OrderStatus.REJECTED,
      OrderStatus.REJECTED,
      remarks,
      orderId,
      vendorId,
    ]);
    await connection.commit();

    return {
      success: true,
      message: `OrderId : ${orderId} Rejected Successfully`,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const isOrderExist = async (
  orderId: string,
  vendorId: string,
  connection: mysql.PoolConnection
) => {
  try {
    const [savedOrder] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM order_details WHERE order_id = ? AND vendor_id = ?`,
      [orderId, vendorId]
    );

    if (!savedOrder.length)
      throw new AppError(
        `Order Not Found for OrderId : ${orderId}`,
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );

    return savedOrder[0];
  } catch (err) {
    throw err;
  }
};


/* export const approveOrderDetailsAndUpdateInventory = async (
    orderId: string,
    vendorId: string,
    remarks: string | null
  ) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const orderSelectQuery = `SELECT order_id, vendor_id, type,warehouse_id, order_status, product_status FROM order_details WHERE order_id = ? AND vendor_id = ?`;
      const [savedOrder] = await connection.query<RowDataPacket[]>(
        orderSelectQuery,
        [orderId, vendorId]
      );
  
      if (!savedOrder.length)
        throw new AppError(
          "No Order Found",
          HttpStatusCode.NOT_FOUND,
          CustomCode.BadRequestCode
        );
  
      const orderProductSelectQuery = `SELECT id, order_id, requested_quantity, product_name, product_brand, product_sku, product_unit, product_image_url, product_description, product_category, product_price, product_tags, product_id, FROM order_product WHERE order_id = ?`;
      const [savedOrderProducts] = await connection.query<RowDataPacket[]>(
        orderProductSelectQuery,
        [orderId]
      );
  
      const order = savedOrder[0];
  
      if (order.type === ProductType.ADD_PRODUCT) {
        for (const p of savedOrderProducts) {
          const productToSave = {
            name: p?.product_name,
            description: p?.product_description,
            category: p?.product_category,
            unit: p?.product_unit,
            image_url: p?.product_image_url,
            sku: p?.product_sku,
            brand: p?.product_brand,
            tags: p?.product_tags,
            price: p?.product_price,
            // offer_price: p?.offer_price ? p?.offer_price : 0,
          };
          const productId = await createProduct(connection, productToSave);
          const productInvData = {
            warehouseId: order?.warehouse_id,
            productId: productId,
            vendorId: vendorId,
            requestedQuantity: p?.requested_quantity,
          };
          await createAndSaveVendorProductInventory(connection, productInvData);
        }
     } //else {
      //   for (const p of savedOrderProducts) {
      //     const vendorInvSelectQuery = `select * from inventory where vendor_id= ? and product_id = ?`;
  
      //     const [productInvResult] = await connection.query<RowDataPacket[]>(
      //       vendorInvSelectQuery,
      //       [vendorId, p?.product_id]
      //     );
  
      //     if (!productInvResult.length)
      //       throw new AppError(
      //         `Product Does Not Exist`,
      //         HttpStatusCode.NOT_FOUND,
      //         CustomCode.NotFoundCode
      //       );
  
      //     const productInv = productInvResult[0];
  
      //     const [savedProudct] = await connection.query<RowDataPacket[]>(
      //       `SELECT * FROM product WHERE product_id = ?`,
      //       [p?.product_id]
      //     );
  
      //     const invProductQuantity = productInv?.quantity;
  
      //     const productInvUpdateQuery = `UPDATE inventory SET quantity = ? where vendor_id= ? and product_id = ? and inventory_id = ?`;
  
      //     const parseRequestedQuantity = p?.requested_quantity
      //       ? parseInt(p?.requested_quantity)
      //       : 0;
      //     if (!p?.requested_quantity || parseRequestedQuantity < 1)
      //       throw new AppError(
      //         `requested_quantity must not be empty and it should be greater than 0`,
      //         HttpStatusCode.BAD_REQUEST,
      //         CustomCode.BadRequestCode
      //       );
  
      //     const offerPrice =
      //       p.offer_price &&
      //       p.offer_price > 0 &&
      //       p.offer_price != savedProudct[0]?.offer_price
      //         ? p.offer_price
      //         : savedProudct[0]?.offer_price;
      //     const updateProductQuery = `UPDATE product SET offer_price = ? WHERE product_id = ?`;
      //     await connection.query(updateProductQuery, [offerPrice, p?.product_id]);
      //     const updatedQuantity =
      //       parseInt(invProductQuantity) + parseRequestedQuantity;
      //     await connection.query(productInvUpdateQuery, [
      //       updatedQuantity,
      //       vendorId,
      //       p?.product_id,
      //       productInv?.inventory_id,
      //     ]);
      //   }
      // }
  
      await connection.query(
        `UPDATE order_details set order_status = ?, remarks = ? WHERE order_id = ? AND vendor_id = ?`,
        [OrderStatus.APPROVED, remarks, orderId, vendorId]
      );
  
      await connection.commit();
  
      return {
        success: true,
        message: "Product verified Successfully and Inventory Updated",
        code: CustomCode.SuccessCode,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  };*/

async function createAndSaveVendorProductInventory(
  connection: mysql.PoolConnection,
  data: {
    warehouseId: string;
    productId: string;
    vendorId: string;
    requestedQuantity: number;
    price: number;
    offer_price: number;
    expiry_date: string | null;
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
      data?.requestedQuantity,
      data.price,
      data.offer_price,
      data.expiry_date
    );

    try {

      await connection.execute(
        `INSERT INTO inventory (inventory_id, warehouse_id, product_id,vendor_id,quantity,price,offer_price,expiry_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vendorInventoryId,
          data.warehouseId,
          data.productId,
          data?.vendorId,
          data?.requestedQuantity,
          data.price,
          data.offer_price,
          data.expiry_date

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
const getOrCreateProductVariant = async (
  connection: mysql.PoolConnection,
  vendorId: string,
  productData: {
    name: string;
    description: string | null;
    category: string;
    unit: string;
    image_url: string | null;
    sku: string;
    brand: string | null;
    tags: string | null;
    unit_size: number | null;
  }
) => {

  // 1️⃣ check if vendor already owns this SKU
  const [vendorSku]: any = await connection.query(
    `
    SELECT 1
    FROM inventory i
    JOIN product p ON p.product_id = i.product_id
    WHERE i.vendor_id = ? AND p.unit_size = ? and p.unit = ?
    AND p.sku = ?
    LIMIT 1
    `,
    [vendorId, productData.unit_size || 0, productData.unit || null, productData.sku]
  );

  if (vendorSku.length) {
    throw new Error(`Vendor already has product with SKU ${productData.sku}`);
  }

  const [existingVariant]: any = await connection.query(
    `
SELECT product_id
FROM product
WHERE sku = ?
AND unit_size = ?
AND unit = ?
LIMIT 1
`,
    [
      productData.sku,
      productData.unit_size || 0,
      productData.unit || null
    ]
  );

  if (existingVariant.length) {
    return existingVariant[0].product_id;
  }

  // 3️⃣ find product group
  const [group]: any = await connection.query(
    `
    SELECT group_id
    FROM product_group
    WHERE name = ?
    AND brand = ?
    LIMIT 1
    `,
    [productData.name, productData.brand]
  );

  let groupId;

  if (group.length) {
    groupId = group[0].group_id;
  } else {

    groupId = uuidv4();

    await connection.query(
      `
      INSERT INTO product_group
      (group_id, name, brand, category, description)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        groupId,
        productData.name,
        productData.brand,
        productData.category,
        productData.description
      ]
    );
  }

  // 4️⃣ create new variant
  const productId = uuidv4();

  await connection.query(
    `
    INSERT INTO product
    (
      product_id,
      group_id,
      name,
      sku,
      unit_size,
      unit,
      brand
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      productId,
      groupId,
      productData.name,
      productData.sku,
      productData.unit_size,
      productData.unit,
      productData.brand
    ]
  );

  return productId;
};

// async function getOrCreateProductBySku(
//   connection: mysql.PoolConnection,
// productData: {
//   name: string;
//   description: string | null;
//   category: string;
//   unit: string;
//   image_url: string | null;
//   sku: string;
//   brand: string | null;
//   tags: string | null;
//   unit_size: number | null;
// }
// ): Promise<string> {

//   const [rows] = await connection.query<RowDataPacket[]>(
//     `SELECT product_id FROM product WHERE sku = ? LIMIT 1`,
//     [productData.sku]
//   );

//   // SKU already exists → use existing product
//   if (rows.length > 0) {
//     return rows[0].product_id;
//   }

//   // SKU not found → create product
//   const productId = await createProduct(connection, productData);

//   return productId;
// }



// export const approveOrderDetailsAndUpdateInventory = async (
//   orderId: string,
//   vendorId: string,
//   remarks: string | null
// ) => {
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     // ============================================
//     // STEP 1: Get order details
//     // ============================================
//     const orderSelectQuery = `
//         SELECT order_id, vendor_id, type, warehouse_id, order_status, product_status 
//         FROM order_details 
//         WHERE order_id = ? AND vendor_id = ?
//       `;

//     const [savedOrder] = await connection.query<RowDataPacket[]>(
//       orderSelectQuery,
//       [orderId, vendorId]
//     );

//     if (!savedOrder.length) {
//       throw new AppError(
//         "No Order Found",
//         HttpStatusCode.NOT_FOUND,
//         CustomCode.NotFoundCode
//       );
//     }

//     const order = savedOrder[0];

//     // Check if already approved
//     if (order.order_status === OrderStatus.APPROVED) {
//       throw new AppError(
//         "Order is already approved",
//         HttpStatusCode.BAD_REQUEST,
//         CustomCode.BadRequestCode
//       );
//     }

//     // ============================================
//     // STEP 2: Get all products in the order
//     // ============================================
//     const orderProductSelectQuery = `
//         SELECT 
//           id, order_id, requested_quantity, product_name, product_brand, 
//           product_sku, product_unit, product_image_url, product_description, 
//           product_category, product_price, product_tags, product_id,
//           offer_price, expiry_date, unit_size
//         FROM order_product 
//         WHERE order_id = ?
//       `;  // ✅ Fixed: Removed extra comma before FROM

//     const [savedOrderProducts] = await connection.query<RowDataPacket[]>(
//       orderProductSelectQuery,
//       [orderId]
//     );

//     if (!savedOrderProducts.length) {
//       throw new AppError(
//         "No products found in this order",
//         HttpStatusCode.NOT_FOUND,
//         CustomCode.NotFoundCode
//       );
//     }

//     // ============================================
//     // STEP 3: Handle based on order type
//     // ============================================

//     if (order.type === ProductType.ADD_PRODUCT) {
//       // ============================================
//       // CASE A: Adding NEW products to the system
//       // ============================================
//       for (const p of savedOrderProducts) {
//         // Validate requested quantity
//         if (!p.requested_quantity || p.requested_quantity < 1) {
//           throw new AppError(
//             `Requested quantity must be greater than 0 for product: ${p.product_name}`,
//             HttpStatusCode.BAD_REQUEST,
//             CustomCode.BadRequestCode
//           );
//         }

//         // Create product data object
//         const productToSave = {
//           name: p.product_name,
//           description: p.product_description,
//           category: p.product_category,
//           unit: p.product_unit,
//           image_url: p.product_image_url,
//           sku: p.product_sku,
//           brand: p.product_brand,
//           tags: p.product_tags,
//           unit_size: p.unit_size,
//         };

//         // Create the product in product table
//         const productId = await createProduct(connection, productToSave);

//         // Create inventory entry for this new product
//         const productInvData = {
//           warehouseId: order.warehouse_id,
//           productId: productId,
//           vendorId: vendorId,
//           requestedQuantity: p.requested_quantity,
//           price: p.product_price,
//           offer_price: p.offer_price,
//           expiry_date: p.expiry_date,
//         };

//         await createAndSaveVendorProductInventory(connection, productInvData);
//       }

//     } else {
//       // ============================================
//       // CASE B: Restocking EXISTING products
//       // ============================================
//       for (const p of savedOrderProducts) {
//         // Validate requested quantity
//         if (!p.requested_quantity || p.requested_quantity < 1) {
//           throw new AppError(
//             `Requested quantity must be greater than 0 for product: ${p.product_name}`,
//             HttpStatusCode.BAD_REQUEST,
//             CustomCode.BadRequestCode
//           );
//         }

//         // Check if product exists in inventory
//         const vendorInvSelectQuery = `
//             SELECT * FROM inventory 
//             WHERE vendor_id = ? AND product_id = ? AND warehouse_id = ?
//           `;

//         const [productInvResult] = await connection.query<RowDataPacket[]>(
//           vendorInvSelectQuery,
//           [vendorId, p.product_id, order.warehouse_id]
//         );

//         if (productInvResult.length > 0) {
//           // ============================================
//           // Product exists in inventory - UPDATE quantity
//           // ============================================
//           const productInv = productInvResult[0];
//           const currentQuantity = parseInt(productInv.quantity) || 0;
//           const newQuantity = currentQuantity + parseInt(p.requested_quantity);

//           const productInvUpdateQuery = `
//               UPDATE inventory 
//               SET quantity = ? 
//               WHERE vendor_id = ? AND product_id = ? AND inventory_id = ?
//             `;

//           await connection.query(productInvUpdateQuery, [
//             newQuantity,
//             vendorId,
//             p.product_id,
//             productInv.inventory_id,
//           ]);

//         } else {
//           // ============================================
//           // Product doesn't exist in inventory - CREATE new entry
//           // ============================================
//           const productInvData = {
//             warehouseId: order.warehouse_id,
//             productId: p.product_id,
//             vendorId: vendorId,
//             requestedQuantity: p.requested_quantity,
//             price: p.product_price,
//             offer_price: p.offer_price,
//             expiry_date: p.expiry_date,
//           };

//           await createAndSaveVendorProductInventory(connection, productInvData);
//         }
//       }
//     }

//     // ============================================
//     // STEP 4: Update order status to APPROVED
//     // ============================================
//     await connection.query(
//       `UPDATE order_details 
//          SET order_status = ?, product_status = ?, remarks = ? 
//          WHERE order_id = ? AND vendor_id = ?`,
//       [OrderStatus.APPROVED, OrderStatus.APPROVED, remarks, orderId, vendorId]
//     );

//     // ============================================
//     // STEP 5: Commit all changes
//     // ============================================
//     await connection.commit();

//     return {
//       success: true,
//       message: "Order approved successfully and inventory updated",
//       code: CustomCode.SuccessCode,
//       orderId,
//     };

//   } catch (err) {

//     await connection.rollback();
//     throw err;
//   } finally {

//     connection.release();
//   }
// };

export const approveOrderDetailsAndUpdateInventory = async (
  orderId: string,
  vendorId: string,
  remarks: string | null
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ============================================
    // STEP 1: Get order details
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
    // STEP 2: Get all products in the order
    // ============================================
    const orderProductSelectQuery = `
        SELECT 
          id, order_id, requested_quantity, product_name, product_brand, 
          product_sku, product_unit, product_image_url, product_description, 
          product_category, product_price, product_tags, product_id,
          offer_price, expiry_date, unit_size
        FROM order_product 
        WHERE order_id = ?
      `;  // ✅ Fixed: Removed extra comma before FROM

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
    // STEP 3: Handle based on order type
    // ============================================
    if (order.type === ProductType.ADD_PRODUCT) {

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
          unit_size: p.unit_size,
        };

        // 🔥 THIS IS THE IMPORTANT CHANGE
        const productId = await getOrCreateProductVariant(
          connection,
          vendorId,
          productToSave
        );

        console.log(productId)
        // Check inventory first
        const [inventoryRows] = await connection.query<RowDataPacket[]>(
          `
      SELECT inventory_id, quantity
      FROM inventory
      WHERE vendor_id = ?
      AND product_id = ?
      AND warehouse_id = ?
      `,
          [vendorId, productId, order.warehouse_id]
        );

        console.log(inventoryRows.length)
        if (inventoryRows.length > 0) {

          const currentQty = Number(inventoryRows[0].quantity) || 0;
          const newQty = currentQty + Number(p.requested_quantity);

          await connection.query(
            `
        UPDATE inventory
        SET quantity = ?,price = ?, offer_price = ?, expiry_date = ?
        WHERE inventory_id = ?
        `,
            [newQty, p.product_price, p.offer_price, p.expiry_date, inventoryRows[0].inventory_id]
          );

        } else {

          const productInvData = {
            warehouseId: order.warehouse_id,
            productId: productId,
            vendorId: vendorId,
            requestedQuantity: p.requested_quantity,
            price: p.product_price,
            offer_price: p.offer_price,
            expiry_date: p.expiry_date,
          };

          await createAndSaveVendorProductInventory(
            connection,
            productInvData
          );
        }
      }
    } else {
      // ============================================
      // CASE B: Restocking EXISTING products
      // ============================================
      for (const p of savedOrderProducts) {
        // Validate requested quantity
        if (!p.requested_quantity || p.requested_quantity < 1) {
          throw new AppError(
            `Requested quantity must be greater than 0 for product: ${p.product_name}`,
            HttpStatusCode.BAD_REQUEST,
            CustomCode.BadRequestCode
          );
        }

        // Check if product exists in inventory
        const vendorInvSelectQuery = `
            SELECT * FROM inventory 
            WHERE vendor_id = ? AND product_id = ? AND warehouse_id = ?
          `;

        const [productInvResult] = await connection.query<RowDataPacket[]>(
          vendorInvSelectQuery,
          [vendorId, p.product_id, order.warehouse_id]
        );

        if (productInvResult.length > 0) {
          // ============================================
          // Product exists in inventory - UPDATE quantity
          // ============================================
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
          // ============================================
          // Product doesn't exist in inventory - CREATE new entry
          // ============================================
          const productInvData = {
            warehouseId: order.warehouse_id,
            productId: p.product_id,
            vendorId: vendorId,
            requestedQuantity: p.requested_quantity,
            price: p.product_price,
            offer_price: p.offer_price,
            expiry_date: p.expiry_date,
          };

          await createAndSaveVendorProductInventory(connection, productInvData);
        }
      }
    }

    // ============================================
    // STEP 4: Update order status to APPROVED
    // ============================================
    await connection.query(
      `UPDATE order_details 
         SET order_status = ?, product_status = ?, remarks = ? 
         WHERE order_id = ? AND vendor_id = ?`,
      [OrderStatus.APPROVED, OrderStatus.APPROVED, remarks, orderId, vendorId]
    );

    // ============================================
    // STEP 5: Commit all changes
    // ============================================
    await connection.commit();

    return {
      success: true,
      message: "Order approved successfully and inventory updated",
      code: CustomCode.SuccessCode,
      orderId,
    };

  } catch (err) {

    await connection.rollback();
    throw err;
  } finally {

    connection.release();
  }
};