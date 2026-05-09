import { AppError } from "../../../StandardUtility/AppError";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import mysql from 'mysql2/promise';
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { ACCESS_TOKEN_SECRET, LOW_ALERT_THRESHOLD, TOKEN_EXPIRES_IN } from "../../StandardConfig/SettingsReader";
import { OrderStatus, productStatus, ProductType, StandardStatus, VendorServiceRecordStatus, VendorStatus } from "../../../StandardUtility/StatusEnum";
import pool from "../../StandardConfig/MySqlDbConfig";
import { OrderDetails, OrderProduct, Product, Vendor, VendorServiceRecord, VendorSRAttachment, Warehouse } from "../../Models/Associtaion"


export const registerVendor = async (phone: string, connection: mysql.PoolConnection) => {
    let vendorId = "";
    try {
        // const vendor = await isPhoneExist(phone, connection);

        // if (vendor.length > 0) {
        //     return vendor[0]?.vendor_id;
        // }
        const maxVendorCode = await getVendorId(connection);
        let nextCodeNumber = (maxVendorCode || 100000) + 1;
        vendorId = `VD${nextCodeNumber.toString().padStart(5, '0')}`;

        const query = `INSERT INTO vendors (vendor_id, phone, isActive,status) VALUES (?, ?, ?,?)`;
        const [result] = await connection.query<any>(query, [vendorId, phone, 1, VendorStatus.REGISTERED]);

        if (result?.affectedRows === 0) {
            throw new AppError("Failed to insert vendor");
        }

        return vendorId;

    } catch (err) {
        throw err;
    }
};

export const loginVendor = async (phone: string, connection: mysql.PoolConnection) => {

    try {

        const vendorId = await registerVendor(phone, connection);

        return vendorId;
    } catch (err) {
        throw err;
    }
}

export const createVendorTokenAndLogin = async (vendorId: string, connection: mysql.PoolConnection) => {
    try {
        const [result] = await connection.query<RowDataPacket[]>("select * from vendors where vendor_id = ?", [vendorId]);

        if (!result.length) throw new AppError("Vendor Not Found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        const payload = {
            vendorId: vendorId,
            purpose: 'vendor'
        }
        const token = generateToken(payload);
        if (!token) {
            throw new AppError("Error generating Token", HttpStatusCode.INTERNAL_SERVER_ERROR, CustomCode.ServerErrorCode);
        }

        return {
            success: true,
            status: HttpStatusCode.OK,
            code: CustomCode.SuccessCode,
            message: 'Login Successful',
            token,
            documentUploaded: result[0].isDocumentUploaded == 0 ? false : true,
            name: result[0].name,
            role: "VENDOR"
        }
    } catch (err) {
        throw err;
    }
}

export const getVendorDashboard = async (vendorId: string) => {

    try {

        const [result] = await pool.query<RowDataPacket[]>('SELECT vendor_id, name, email, phone, address_line1, address_line2, city, state, postal_code, latitude, longitude, status, country, isDocumentUploaded, isDocumentVerified, gstId, gstFile, tradeLicenseFile, store_image from vendors where vendor_id = ?', [vendorId])
        return { success: true, code: CustomCode.SuccessCode, messgae: "Data Fetch Successfully", result, role: 'VENDOR' }
    } catch (err) {
        throw err;
    }
}

const isPhoneExist = async (mobile: string, connection: mysql.PoolConnection) => {
    try {

        const [result] = await connection.query<RowDataPacket[]>('select * from vendors where phone = ?', [mobile]);
        return result;
    } catch (err) {
        throw err;
    }
}

const isVendorExist = async (phone: string, connection: mysql.PoolConnection) => {
    try {

        const [result] = await connection.query<RowDataPacket[]>(`select * from vendors where phone = ?`, [phone]);
        if (result.length) {
            throw new AppError("Vendor Already Exist", HttpStatusCode.CONFLICT, CustomCode.ConflictCode);
        }
        return result[0];
    } catch (err) {
        throw err;
    }
}
const getVendorId = async (connection: mysql.PoolConnection) => {
    try {
        const selectVDCodeQuery = `
            SELECT MAX(CAST(SUBSTRING(vendor_id, 3) AS UNSIGNED)) AS vendorId
            FROM vendors
            WHERE vendor_id LIKE 'VD%'`;

        const [rows] = await connection.query<RowDataPacket[]>(selectVDCodeQuery);

        const maxVdCode = rows[0]?.vendorId ? parseInt(rows[0]?.vendorId) : 100000;
        return maxVdCode;
    } catch (err) {
        throw new AppError("Error Generating Unique Vendor Code",);
    }
};

const generateToken = (payload: any): string => {
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: '7d' // token expiry
    });
    return token;
};

export const registerAndUpdateVendorProfile = async (name: string, email: string | null, address_line1: string, address_line2: string | null, city: string,
    state: string, postal_code: string, latitude: number, longitude: number, country: string, gstId: string, gstFile: string | null, tradeLicenseFile: string | null, phone: string,
    storeImageUrl: string | null, warehouseIds: string, businessOwnerName: string) => {

    const connection = await pool.getConnection();

    const warehouseIdsArray = warehouseIds.split(',').map(id => id.trim());

    const filteredWarehouseIds = warehouseIdsArray.filter(id => id !== 'DEFAULT' && id !== '');

    //console.log(filteredWarehouseIds)
    try {
        let vendorId: string = 'DEFAULT';
        await connection.beginTransaction();

        await isVendorExist(phone, connection);

        const maxVendorCode = await getVendorId(connection);
        let nextCodeNumber = (maxVendorCode || 1000000) + 1;
        vendorId = `VD${nextCodeNumber.toString().padStart(6, '0')}`;

        const vendorQuery = `
  INSERT INTO vendors (
    phone, name, email, address_line1, address_line2, city, state, postal_code,
    latitude, longitude, country, isDocumentVerified, gstId, gstFile,
    tradeLicenseFile, isDocumentUploaded, store_image, vendor_id,status,business_owner_name
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;
        const values = [phone, name, email, address_line1, address_line2, city, state, postal_code, latitude, longitude, country,
            false, gstId, gstFile, tradeLicenseFile, true, storeImageUrl, vendorId, StandardStatus.PENDING, businessOwnerName];

        const updateUserQuery = `UPDATE user SET name = ?, email = ?, role = ?, isActive = ? WHERE phone = ?`;
        const userValues = [name, email, 'VENDOR', true, phone];

        await connection.query(updateUserQuery, userValues);
        await connection.query(vendorQuery, values);

        const vendorWarehouseInsertQuery = `INSERT INTO vendor_warehouses(vendor_id, warehouse_id, status) VALUES (?,?,?)`;
        for (const warehouseId of filteredWarehouseIds) {
            await connection.query(vendorWarehouseInsertQuery, [vendorId, warehouseId, StandardStatus.ACTIVE])
        }

        await connection.commit();

        const payload = {
            vendorId: vendorId,
            purpose: 'vendor'
        }

        const token = generateToken(payload);
        if (!token) {
            throw new AppError("Error generating Token", HttpStatusCode.INTERNAL_SERVER_ERROR, CustomCode.ServerErrorCode);
        }

        return {
            success: true,
            code: CustomCode.SuccessCode,
            message: "Vendor Registered and Details Updated Successfully",
            newToken: token
        }

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

export const editVendorProfileDetails = async (name: string, email: string | null, address_line1: string, address_line2: string | null, city: string,
    state: string, postal_code: string, latitude: number, longitude: number, phone: string, businessOwnerName: string, vendorId: string) => {

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query<RowDataPacket[]>(`select * from vendors where vendor_id = ?`, [vendorId]);

        if (!result.length) throw new AppError("Vendor Not Found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        const vendorUpdateQuery = `
       UPDATE vendors SET phone=?, name=?, email=?, address_line1=?, address_line2=?, city=?, state=?, postal_code=?,
       latitude=?, longitude=?,business_owner_name=? WHERE vendor_id=?;`;

        await connection.query(vendorUpdateQuery, [phone, name, email, address_line1, address_line2, city, state, postal_code,
            latitude, longitude, businessOwnerName, vendorId]);

        await connection.commit();

        return {
            success: true,
            code: CustomCode.SuccessCode,
            message: "Vendor Profile Detiails Updated Successfully",
        }

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

export const addProductToDb = async (name: string, description: string | null, category: string | null, unit: string, image_url: string, price: number, sku: string, brand: string | null) => {
    try {

        const query = `
      INSERT INTO product (name, description, category, unit, image_url, price, sku, brand)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const values = [name, description, category, unit, image_url, price, sku, brand];

        const [result] = await pool.query<ResultSetHeader>(query, values);

        if (result?.affectedRows > 0) {
            return { success: true, message: "Product created successfully" };
        }
        return { success: false, message: "Failed Adding Product" };

    } catch (err) {
        throw err;
    }
}

// export const createOrUpdateOrderProduct = async (vendorId: string, productId: number, type: string, requestedQuantity: number, productName: string | null,
//     productBrand: string | null, productCategoryId: string | null, productUnit: string | null, productDescription: string | null,
//     productSku: string | null, productTags: string | null, productPrice: number | null) => {

//     const connection = await pool.getConnection();
//     try {

//         await connection.beginTransaction();

//         const query = `
//       INSERT INTO order_details (vendor_id, type, requested_quantity, product_name, product_brand, product_category, product_unit,
//         product_description, product_sku, product_tags, product_price, product_id,product_status,order_status,order_id)
//       VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`

//               const updateProductQuantityQuery = `
//       INSERT INTO order_details (vendor_id, type, requested_quantity,product_id,product_status,order_status,order_id)
//       VALUES (?,?, ?, ?, ?, ?, ?)`

//         const maxOrderId = await getOrderID(connection);
//         const newOrderId = `ODR${(maxOrderId + 1).toString().padStart(8, '0')}`;

//         if (type === ProductType.ADD_PRODUCT && !productId) {
//             await connection.query(query, [vendorId, type, requestedQuantity, productName, productBrand, productCategoryId,
//                 productUnit, productDescription, productSku, productTags, productPrice, productId, productStatus.PENDING, OrderStatus.PENDING, newOrderId])
//         }else{
//             await connection.query(updateProductQuantityQuery, [vendorId, type, requestedQuantity,productId, productStatus.PENDING, OrderStatus.PENDING, newOrderId])

//         }
//         await connection.commit();

//         return { success: true, message: "Order Product Created/Updated Successfully", code: CustomCode.SuccessCode, orderId: newOrderId };
//     } catch (err) {
//         await connection.rollback();
//         throw err;
//     } finally {
//         connection.release();
//     }
// }

export const createOrUpdateOrderProducts = async (
    vendorId: string,
    warehouseId: string,
    type: string,
    products: Array<{
        product_id?: string;
        requested_quantity: number;
        product_name?: string | null;
        product_brand?: string | null;
        product_category?: string | null;
        product_unit?: string | null;
        product_description?: string | null;
        product_sku?: string | null;
        product_tags?: string | null;
        product_price?: number | null;
        offer_price?: number | 0;
        expiry_date?: string | null;
        unit_size?: number | 0;
        images?: string | null;
    }>,
    orderId: string
) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const maxOrderId = await getOrderID(connection);
        let newOrderId = null;

        // Step 1: Insert into order_details (1 row per order)

        if (type === ProductType.ADD_PRODUCT && !orderId) {
            newOrderId = `ODR${(maxOrderId + 1).toString().padStart(8, '0')}`;
            const insertOrderQuery = `
           INSERT INTO order_details (
           order_id, vendor_id, type, order_status, product_status,warehouse_id
            )
           VALUES (?, ?, ?, ?, ?, ?)
    `;

            await connection.query(insertOrderQuery, [
                newOrderId,
                vendorId,
                type,
                OrderStatus.PENDING,
                OrderStatus.PENDING,
                warehouseId
            ]);

        }

        // Step 2: Insert into order_product (1 row per product)
        const insertProductQuery = `
      INSERT INTO order_product (
        order_id, product_name, product_brand, product_sku, product_unit,product_image_url,
        product_description, product_category, product_price, product_tags, product_id,requested_quantity,offer_price,expiry_date,unit_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const skus = products
            .map(p => p.product_sku)
            .filter(Boolean);

        for (const p of products) {
            const uniqueProductId = await generateUniqueOrderProductId();
            if (type === ProductType.ADD_PRODUCT && !p.product_id) {

                const placeholders = skus.map(() => "?").join(",");

                const [existing]: any = await connection.query(
                    `
                    SELECT p.product_id, p.name, p.sku
                    FROM product p
                    LEFT JOIN inventory i 
                    ON i.product_id = p.product_id
                    WHERE p.sku = ? AND p.unit_size = ? and p.unit = ? and p.name = ? 
                    AND (i.vendor_id = ?)`,
                    [p.product_sku, p.unit_size || 0, p.product_unit || null, p.product_name || null, vendorId]
                );

                if (existing.length > 0) {
                    const duplicateSkus = existing.map((p: any) => p.sku);

                    throw new AppError(
                        `Products with SKU,name,unit_size,unit already exist for this vendor: ${duplicateSkus.join(", ")}`,
                        HttpStatusCode.BAD_REQUEST,
                        CustomCode.BadRequestCode
                    );
                }
                await connection.query(insertProductQuery, [
                    newOrderId,
                    p.product_name,
                    p.product_brand,
                    p.product_sku,
                    p.product_unit,
                    p.images ?? null,
                    p.product_description,
                    p.product_category,
                    p.product_price,
                    p.product_tags,
                    uniqueProductId,
                    p.requested_quantity,
                    p.offer_price ? p.offer_price : 0,
                    p.expiry_date ?? null,
                    p.unit_size ? p.unit_size : 0
                ]);
            }

        }

        await connection.commit();
        return {
            success: true,
            message: "Order with products created/updated successfully",
            code: CustomCode.SuccessCode,
            orderId: newOrderId ? newOrderId : orderId
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const generateUniqueOrderProductId = async (): Promise<string> => {
    let uniqueId: string;
    let exists = true;

    while (exists) {
        uniqueId = uuidv4().toLowerCase();

        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM order_product WHERE product_id = ?`,
            [uniqueId]
        );

        const result = Array.isArray(rows) ? rows[0] as { count: number } : { count: 0 };
        exists = result.count > 0; // true if ID already exists
    }

    return uniqueId!;
};


const getOrderID = async (connection: mysql.PoolConnection) => {
    try {
        const selectOrderIdQuery = `
            SELECT MAX(CAST(SUBSTRING(order_id, 4) AS UNSIGNED)) AS orderId
            FROM order_details
            WHERE order_id LIKE 'ODR%'`;

        const [rows] = await connection.query<RowDataPacket[]>(selectOrderIdQuery);

        const maxOrderId = rows[0]?.orderId ? parseInt(rows[0]?.orderId) : 1;
        return maxOrderId;
    } catch (err) {
        throw new AppError("Error Generating Unique Vendor Code",);
    }
};

export const cancelRequestedOrder = async (orderId: string, vendorId: string) => {

    const connection = await pool.getConnection();
    try {

        await connection.beginTransaction();
        const savedOrder = await isOrderExist(orderId, vendorId, connection);

        const cancelOrderQuery = `UPDATE order_details SET order_status = ?, product_status = ? WHERE order_id = ? AND vendor_id = ?`;

        await connection.query(cancelOrderQuery, [OrderStatus.CANCELLED, OrderStatus.CANCELLED, orderId, vendorId]);
        await connection.commit();

        return { success: true, message: `OrderId : ${orderId} Cancelled Successfully` }
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

const isOrderExist = async (orderId: string, vendorId: string, connection: mysql.PoolConnection) => {
    try {
        const [savedOrder] = await pool.query<RowDataPacket[]>(`SELECT * FROM order_details WHERE order_id = ? AND vendor_id = ?`, [orderId, vendorId]);

        if (!savedOrder.length) throw new AppError(`Order Not Found for OrderId : ${orderId}`, HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        return savedOrder[0];
    } catch (err) {
        throw err;
    }
}

// export const orderListingVendor = async (
//     status: string,
//     vendorId: string,
//     limit: number,
//     page: number
// ) => {
//     const offset = (page - 1) * limit;

//     try {
//         // Prepare base query
//         let selectQuery = `
//       SELECT
//         od.order_id,
//         od.vendor_id,
//         v.name AS vendor_name,
//         od.type,
//         od.order_status,
//         od.product_status,
//         od.requested_quantity,
//         od.created_at,

//         CASE WHEN od.product_id IS NOT NULL THEN p.name ELSE od.product_name END AS product_name,
//         CASE WHEN od.product_id IS NOT NULL THEN p.brand ELSE od.product_brand END AS brand,
//         CASE WHEN od.product_id IS NOT NULL THEN p.sku ELSE od.product_sku END AS sku,
//         CASE WHEN od.product_id IS NOT NULL THEN p.unit ELSE od.product_unit END AS unit,
//         CASE WHEN od.product_id IS NOT NULL THEN p.image_url ELSE od.product_image_url END AS image_url,
//         CASE WHEN od.product_id IS NOT NULL THEN p.description ELSE od.product_description END AS description,
//         CASE WHEN od.product_id IS NOT NULL THEN p.price ELSE od.product_price END AS price,
//         CASE WHEN od.product_id IS NOT NULL THEN p.tags ELSE od.product_tags END AS tags,
//         CASE WHEN od.product_id IS NOT NULL THEN p.category ELSE od.product_category END AS category,

//         w.name AS warehouse_name,
//         i.quantity AS available_quantity

//       FROM order_details od
//       JOIN vendors v ON od.vendor_id = v.vendor_id
//       LEFT JOIN product p ON od.product_id = p.product_id
//       LEFT JOIN inventory i ON i.product_id = COALESCE(od.product_id, 'dummy') AND i.vendor_id = od.vendor_id
//       LEFT JOIN warehouse w ON w.warehouse_id = i.warehouse_id
//       WHERE od.vendor_id = ?
//     `;

//         const queryParams: any[] = [vendorId];

//         if (status !== 'ALL') {
//             selectQuery += ` AND od.order_status = ?`;
//             queryParams.push(status);
//         }

//         selectQuery += `
//       ORDER BY od.created_at DESC
//       LIMIT ? OFFSET ?`;

//         queryParams.push(limit, offset);

//         const [result] = await pool.query<RowDataPacket[]>(selectQuery, queryParams);

//         // Count total orders
//         let countQuery = `SELECT COUNT(*) AS totalOrders FROM order_details WHERE vendor_id = ?`;
//         const countParams: any[] = [vendorId];

//         if (status !== 'ALL') {
//             countQuery += ` AND order_status = ?`;
//             countParams.push(status);
//         }

//         const [totalOrdersResult] = await pool.query<RowDataPacket[]>(countQuery, countParams);

//         const totalOrders = totalOrdersResult[0]?.totalOrders || 0;
//         const totalPages = Math.ceil(totalOrders / limit);

//         return {
//             success: true,
//             message: 'Orders Fetched Successfully',
//             code: CustomCode.SuccessCode,
//             result,
//             totalOrders,
//             totalPages
//         };
//     } catch (err) {
//         throw err;
//     }
// };

export const orderListingVendor = async (
    status: string,
    limit: number,
    page: number,
    vendorid: string
) => {
    const offset = (page - 1) * limit;

    try {
        const whereClause: any = {};
        whereClause.vendor_id = vendorid;

        if (status !== 'ALL') {
            whereClause.order_status = status;
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
                    model: Warehouse,
                    as: 'warehouse',
                    attributes: ['warehouse_id', 'name', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country']

                },
                {
                    model: OrderProduct,
                    as: 'order_product',
                    required: false,
                    attributes: [
                        'id',
                        'order_id',
                        'product_id',
                        'product_name',
                        'product_brand',
                        'product_sku',
                        'product_unit',
                        'product_image_url',
                        'product_description',
                        'product_category',
                        'product_price',
                        'product_tags',
                        'requested_quantity',
                        'unit_size',
                        'expiry_date'
                    ],
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            required: false,
                            attributes: [
                                'product_id',
                                'name',
                                'sku',
                                'brand',
                                'unit',
                                'image_url',
                                'description',
                                'category',
                                'tags',
                            ],
                        },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        const result = incomingOrders.map(order => {
            // Type assertion to include associated models
            const orderWithAssociation = order as OrderDetails & {
                warehouse: Warehouse,
                order_product: (OrderProduct & { product?: Product })[];
            };

            return {
                order_id: order.order_id,
                order_status: order.order_status,
                remarks: order.remarks,
                created_at: order.created_at,
                Warehouse: orderWithAssociation.warehouse,
                products: orderWithAssociation.order_product.map(op => {
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
                        unit_size: product?.unit_size ?? op.unit_size,
                        expiry_date: product?.expiry_date ?? op.expiry_date
                    };
                }),
            };
        });


        return {
            success: true,
            message: 'Orders Fetched Successfully',
            code: CustomCode.SuccessCode,
            result,
            totalOrders,
            totalPages
        };
    } catch (err) {
        throw err;
    }
};

export const productCategoryListing = async () => {
    try {

        const [result] = await pool.query(`select category_id, name from product_category where status = 'A'`);
        return { success: true, message: 'product category fetched successfully', code: CustomCode.SuccessCode, result }
    } catch (err) {
        throw err;
    }
}

export const getVendorWarehouses = async (vendorId: string) => {
    try {
        const [result] = await pool.query<RowDataPacket[]>(`SELECT vw.id, vw.vendor_id, vw.warehouse_id, vw.status, w.name as warehouse_name FROM vendor_warehouses vw join warehouse w on w.warehouse_id = vw.warehouse_id WHERE vw.vendor_id = ? AND vw.status = ?`, [vendorId, StandardStatus.ACTIVE]);

        return { success: true, message: "Vendor Warehouses fetched successfully", code: CustomCode.SuccessCode, result };
    } catch (err) {
        throw err;
    }
}

export const fetchLowQuantityProducts = async (vendorId: string) => {
    try {

        const [result] = await pool.query<RowDataPacket[]>(`
            SELECT w.warehouse_id,w.name as warehouse_name,p.product_id, p.name as product_name, p.sku, p.brand, p.unit, p.image_url, p.description, p.category, p.price, p.tags, i.quantity
            FROM product p
            JOIN inventory i ON p.product_id = i.product_id
            JOIN warehouse w ON i.warehouse_id = w.warehouse_id
            JOIN vendor_warehouses vw ON vw.warehouse_id = w.warehouse_id
            WHERE i.vendor_id = ?  AND i.quantity < ?;
        `, [vendorId, 20]);

        return { success: true, message: "Low quantity products fetched successfully", code: CustomCode.SuccessCode, result };
    } catch (err) {
        throw err;
    }
}

export const updateOrderProduct = async (orderId: string, productId: string, productBrand: string | null, productUnit: string | null,
    productDescription: string | null, productCategory: string | null, productPrice: number | null, productTags: string | null,
    unitSize: number | null, expiryDate: string | null, offerPrice: number | null, vendorId: string
) => {

    try {

        const [order] = await pool.query<RowDataPacket[]>(`SELECT * FROM order_details WHERE order_id = ? AND order_status = ? AND vendor_id = ?`, [orderId, OrderStatus.PENDING, vendorId]);

        if (!order.length) throw new AppError("Order Not Found/Order is Already Approved", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        const [product] = await pool.query<RowDataPacket[]>(`SELECT * FROM order_product WHERE order_id = ? AND product_id = ?`, [orderId, productId]);

        if (!product.length) throw new AppError("Product Not Found in the Order", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        const productUpdateQuery = `UPDATE order_product SET product_description = ?, product_category = ?, product_unit = ?, product_price = ?, product_brand = ?,
         product_tags = ?,product_price = ?, offer_price = ?, expiry_date = ?, unit_size = ? WHERE order_id = ? AND product_id = ?`;


        const [result] = await pool.query<ResultSetHeader>(productUpdateQuery, [productDescription, productCategory, productUnit, productPrice, productBrand,
            productTags, productPrice, offerPrice, expiryDate, unitSize, orderId, productId]);

        if (result?.affectedRows > 0) {
            return { success: true, message: 'Product Updated Successfully', code: CustomCode.SuccessCode, productId }
        }
    } catch (err) {
        throw err;
    }
}


export const updateInventoryProduct = async (vendorId: string, inventoryId: string, productId: string, officePrice: number,
    actualPrice: number, description: string | null, category: string | null, brand: string | null, tags: string | null,
    expiryDate: string | null
) => {

    const transaction = await pool.getConnection();

    const isProductQuery = `SELECT count(*) as count FROM inventory i join product p on p.product_id = i.product_id  WHERE p.product_id = ? AND i.vendor_id = ? AND i.inventory_id = ?`;


    const query = `UPDATE product SET description = ?, category = ?, brand = ?, tags = ? WHERE product_id = ?`

    const updateInvProductQuery = `UPDATE inventory SET offer_price = ?,price = ?, expiry_date = ? WHERE product_id = ? AND vendor_id = ? AND inventory_id = ?`

    try {
        await transaction.beginTransaction();

        const [isProduct] = await transaction.query<RowDataPacket[]>(isProductQuery, [productId, vendorId, inventoryId]);

        if (isProduct[0].count == 0) {
            throw new AppError("Product Not Found in Inventory", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
        }

        const [result] = await transaction.query<ResultSetHeader>(query, [description, category, brand, tags, productId]);

        await transaction.query(updateInvProductQuery, [officePrice, actualPrice, expiryDate, productId, vendorId, inventoryId]);
        if (result?.affectedRows > 0) {
            return { success: true, message: 'Product Updated Successfully', code: CustomCode.SuccessCode, productId }
        }

        await transaction.commit();

        return { success: false, message: 'Failed Updating Product', code: CustomCode.ServerErrorCode, productId };

    } catch (err) {
        await transaction.rollback();
        throw err;
    } finally {
        transaction.release();
    }
}

export const createOrderAndUpdateProductQuantity = async (
    vendorId: string,
    warehouseId: string,
    products: { productId: string; quantity: number }[]
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const productIds = products.map((p) => p.productId);

        const inventoryQuery = `
      SELECT p.*, i.vendor_id, i.warehouse_id
      FROM product p
      JOIN inventory i ON p.product_id = i.product_id
      WHERE i.vendor_id = ? AND i.warehouse_id = ? AND i.product_id IN (?);
    `;

        const [inventoryResults] = await connection.query<RowDataPacket[]>(
            inventoryQuery,
            [vendorId, warehouseId, productIds]
        );

        const foundIds = inventoryResults.map((r) => r.product_id);
        const invalidProductIds = productIds.filter((id) => !foundIds.includes(id));

        if (invalidProductIds.length > 0) {
            await connection.rollback();
            return {
                success: false,
                message: "One or more invalid products found. Order not created.",
                invalidProductIds,
                code: CustomCode.NotFoundCode,
            };
        }

        const maxOrderId = await getOrderID(connection);
        const newOrderId = `ODR${(maxOrderId + 1).toString().padStart(8, "0")}`;

        const insertOrderQuery = `
      INSERT INTO order_details (
        order_id, vendor_id, type, order_status, product_status, warehouse_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        await connection.query(insertOrderQuery, [
            newOrderId,
            vendorId,
            ProductType.UPDATE_PRODUCT_QUANTITY,
            OrderStatus.PENDING,
            OrderStatus.PENDING,
            warehouseId,
        ]);

        const insertProductQuery = `
      INSERT INTO order_product (
        order_id, product_name, product_brand, product_sku, product_unit,
        product_image_url, product_description, product_category,
        product_price, product_tags, product_id, requested_quantity,
        offer_price, expiry_date, unit_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

        for (const item of products) {
            const { productId, quantity } = item;
            const product = inventoryResults.find((p) => p.product_id === productId);
            if (!product) {
                await connection.rollback();
                return {
                    success: false,
                    message: `Product ${productId} not found in inventory.`,
                    invalidProductIds: [productId],
                    code: CustomCode.NotFoundCode,
                };
            }

            await connection.query(insertProductQuery, [
                newOrderId,
                product.name,
                product.brand,
                product.sku,
                product.unit,
                product.image_url,
                product.description,
                product.category,
                product.price,
                product.tags,
                product.product_id,
                quantity,
                product.offer_price,
                product.expiry_date,
                product.unit_size,
            ]);

        }

        await connection.commit();

        return {
            success: true,
            message: "Order created and product quantities updated successfully.",
            orderId: newOrderId,
            code: CustomCode.SuccessCode,
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};


const getUniqueServiceRecordId = async (connection: mysql.PoolConnection) => {
    try {
        const selectMaxTicketIdQuery = `
            SELECT MAX(CAST(SUBSTRING(ticket_number, 3) AS UNSIGNED)) AS maxTicketId
            FROM vendor_service_record
            WHERE ticket_number LIKE 'SR%'`;

        const [rows] = await connection.query<RowDataPacket[]>(selectMaxTicketIdQuery);

        const maxTicketNumber = rows[0]?.maxTicketId ? parseInt(rows[0]?.maxTicketId) : 1;
        return maxTicketNumber;
    } catch (err) {
        throw new AppError("Error Generating Unique Ticket Id",);
    }
};

export const createVendorServiceRequest = async (vendorId: string, subject: string, description: string | null, uploadedFiles: string[]) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();


        const maxTicketNumber = await getUniqueServiceRecordId(connection);
        const newTicketNumber = `SR${(maxTicketNumber + 1).toString().padStart(8, '0')}`;

        const insertServiceRequestQuery = `
        INSERT INTO vendor_service_record (
        ticket_number, vendor_id, subject, description, status
         )
        VALUES (?, ?, ?, ?, ?);`;

        await connection.query(insertServiceRequestQuery, [newTicketNumber, vendorId, subject, description, VendorServiceRecordStatus.OPEN]);

        for (const filename of uploadedFiles) {
            const insertAttachmentQuery = `
            INSERT INTO vendor_srattachment (
                ticket_number, filename
            )
            VALUES (?, ?);`;
            await connection.query(insertAttachmentQuery, [newTicketNumber, filename]);
        }
        await connection.commit();
        return { success: true, message: "Service Request Created Successfully", code: CustomCode.SuccessCode, ticketNumber: newTicketNumber };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export const ServiceRecordListingVendor = async (
    status: string,
    limit: number,
    page: number,
    vendorid: string
) => {
    const offset = (page - 1) * limit;
    try {
        const whereClause: any = {};
        whereClause.vendor_id = vendorid;

        if (status !== 'ALL') {
            whereClause.status = status;
        }

        const totalServiceRequest = await VendorServiceRecord.count({
            where: whereClause,
        });

        const totalPages = Math.ceil(totalServiceRequest / limit);

        const serviceRequests = await VendorServiceRecord.findAll({
            where: whereClause,
            limit,
            offset,
            include: [
                {
                    model: VendorSRAttachment,
                    as: 'vendor_srattachment',
                    attributes: ['ticket_number', 'filename']

                }
            ],
            order: [['created_at', 'DESC']],
        });

        return {
            success: true,
            message: 'SR Fetched Successfully',
            code: CustomCode.SuccessCode,
            serviceRequests,
            totalServiceRequest,
            totalPages
        };
    } catch (err) {
        throw err;
    }
};

interface FilterOptions {
    filter?: string;
    startDate?: string;
    endDate?: string;
}

function buildDateFilterDynamic(
    options: FilterOptions,
    values: any[],
    tableAlias: string
) {
    let dateFilter = "";

    if (options.filter === "WEEK") {
        dateFilter = ` AND ${tableAlias}.created_at >= NOW() - INTERVAL 7 DAY `;
    }
    else if (options.filter === "MONTH") {
        dateFilter = ` AND ${tableAlias}.created_at >= NOW() - INTERVAL 1 MONTH `;
    }
    else if (
        options.filter === "CUSTOM" &&
        options.startDate &&
        options.endDate
    ) {
        dateFilter = ` AND ${tableAlias}.created_at BETWEEN ? AND ? `;
        values.push(
            `${options.startDate} 00:00:00`,
            `${options.endDate} 23:59:59`
        );
    }

    return dateFilter;
}

function buildDateFilter(options: FilterOptions, values: any[]) {
    let dateFilter = "";

    if (options.filter === "WEEK") {
        dateFilter = "AND co.created_at >= NOW() - INTERVAL 7 DAY";
    }
    else if (options.filter === "MONTH") {
        dateFilter = "AND co.created_at >= NOW() - INTERVAL 1 MONTH";
    }
    else if (
        options.filter === "CUSTOM" &&
        options.startDate &&
        options.endDate
    ) {
        dateFilter = "AND co.created_at BETWEEN ? AND ?";
        values.push(
            `${options.startDate} 00:00:00`,
            `${options.endDate} 23:59:59`
        );
    }

    return dateFilter;
}
function buildDateExchangeOrderFilter(options: FilterOptions, values: any[]) {
    let dateFilter = "";

    if (options.filter === "WEEK") {
        dateFilter = "AND oe.created_at >= NOW() - INTERVAL 7 DAY";
    }
    else if (options.filter === "MONTH") {
        dateFilter = "AND oe.created_at >= NOW() - INTERVAL 1 MONTH";
    }
    else if (
        options.filter === "CUSTOM" &&
        options.startDate &&
        options.endDate
    ) {
        dateFilter = "AND oe.created_at BETWEEN ? AND ?";
        values.push(
            `${options.startDate} 00:00:00`,
            `${options.endDate} 23:59:59`
        );
    }

    return dateFilter;
}

export const getVendorsalesDashboardService = async (
    vendorId: string,
    options: FilterOptions
) => {
    const connection = await pool.getConnection();

    try {
        const values: any[] = [vendorId];
        const dateFilter = buildDateFilter(options, values);

        /* ===============================
        Latest 15 Orders
        =============================== */
        const ordersQuery = `
  SELECT 
    co.order_id,
    co.customer_id,
    co.order_status,
    co.payment_status,
    co.created_at,
    p.name AS product_name,
    coi.product_id,
    coi.vendor_id,
    SUM(coi.quantity * coi.price_at_purchase) AS vendor_order_total
  FROM customer_order_items coi
  JOIN customer_orders co 
      ON co.order_id = coi.order_id
  JOIN product p 
      ON p.product_id = coi.product_id
  WHERE coi.vendor_id = ?
  ${dateFilter}
  GROUP BY 
      co.order_id,
      co.customer_id,
      co.order_status,
      co.payment_status,
      co.created_at,
      p.name,
      coi.product_id,
      coi.vendor_id
  ORDER BY co.created_at DESC
  LIMIT 15
`;

        const [orders] = await connection.query(ordersQuery, values);

        /* ===============================
         Total Sales Summary
        =============================== */

        const salesValues: any[] = [vendorId];
        const salesDateFilter = buildDateFilter(options, salesValues);

        const salesQuery = `
      SELECT 
        IFNULL(SUM(coi.quantity * coi.price_at_purchase), 0) AS total_sales
      FROM customer_order_items coi
      JOIN customer_orders co 
        ON co.order_id = coi.order_id
      WHERE coi.vendor_id = ?
      AND co.payment_status = 'PAID'
      AND co.order_status IN ('CONFIRMED','DELIVERED')
      ${salesDateFilter}
    `;

        const [salesRows]: any = await connection.query(
            salesQuery,
            salesValues
        );

        return {
            summary: salesRows[0],
            orders
        };

    } finally {
        connection.release();
    }
};

export const getVendorExchangeDashboardService = async (
    vendorId: string,
    options: FilterOptions
) => {
    const connection = await pool.getConnection();

    try {
        const values: any[] = [vendorId];
        const dateFilter = buildDateExchangeOrderFilter(options, values);

        /* ===============================
           Latest 15 Exchange Orders
        =============================== */

        const exchangesQuery = `
            SELECT 
        oe.exchange_id,
        oei.exchange_item_id,
        oe.order_id,
        oe.customer_id,
        oe.status,
        oe.reason,
        oei.product_id,
        oei.inventory_id,
        oei.vendor_id,
        oei.condition_status,
        oei.quantity,
        p.name as product_name,
        oei.quantity,
        oe.created_at
            FROM order_exchange_items oei
            JOIN order_exchanges oe 
                ON oe.exchange_id = oei.exchange_id
            JOIN product p 
                ON p.product_id = oei.product_id
            WHERE oei.vendor_id = ?
            ${dateFilter}
            LIMIT 15
        `;

        const [exchanges] = await connection.query(exchangesQuery, values);

        /* ===============================
           Exchange Summary
        =============================== */

        const summaryValues: any[] = [vendorId];
        const summaryDateFilter = buildDateExchangeOrderFilter(options, summaryValues);

        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT oe.exchange_id) AS total_exchanges,
                COUNT(DISTINCT CASE WHEN oe.status = 'PENDING' THEN oe.exchange_id END) AS pending,
                COUNT(DISTINCT CASE WHEN oe.status = 'APPROVED' THEN oe.exchange_id END) AS approved,
                COUNT(DISTINCT CASE WHEN oe.status = 'REJECTED' THEN oe.exchange_id END) AS rejected
            FROM order_exchange_items oei
            JOIN order_exchanges oe 
                ON oe.exchange_id = oei.exchange_id
            WHERE oei.vendor_id = ?
            ${summaryDateFilter}
        `;

        const [summaryRows]: any = await connection.query(
            summaryQuery,
            summaryValues
        );

        return {
            summary: summaryRows[0],
            exchanges
        };

    } finally {
        connection.release();
    }
};

export const getVendorOrdersService = async (
    vendorId: string,
    status = "all",
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 20) => {

    const connection = await pool.getConnection();

    try {
        const offset = (page - 1) * pageSize;

        // ✅ Dynamic WHERE conditions
        let whereConditions = `WHERE coi.vendor_id = ?`;
        const queryParams: any[] = [vendorId];

        // ✅ Status filter
        if (status && status.toLowerCase() !== "all") {
            whereConditions += ` AND co.order_status = ?`;
            queryParams.push(status);
        }

        // ✅ Date filter
        if (startDate && endDate) {
            whereConditions += ` AND DATE(co.created_at) BETWEEN ? AND ?`;
            queryParams.push(startDate, endDate);
        }

        // ==========================
        // 1️⃣ Fetch Paginated Data
        // ==========================
        const dataQuery = `
      SELECT 
        co.order_id,
        co.customer_id,
        co.order_status,
        co.payment_status,
        co.created_at,
        p.name AS product_name,
        coi.product_id,
        coi.vendor_id,
        SUM(coi.quantity * coi.price_at_purchase) AS vendor_order_total
      FROM customer_order_items coi
      JOIN customer_orders co 
        ON co.order_id = coi.order_id
      JOIN product p 
        ON p.product_id = coi.product_id
      ${whereConditions}
      GROUP BY 
        co.order_id,
        co.customer_id,
        co.order_status,
        co.payment_status,
        co.created_at,
        p.name,
        coi.product_id,
        coi.vendor_id
      ORDER BY co.created_at DESC
      LIMIT ? OFFSET ?
    `;

        const [rows]: any = await connection.query(dataQuery, [
            ...queryParams,
            pageSize,
            offset,
        ]);

        // ==========================
        // 2️⃣ Get Total Count
        // ==========================
        const countQuery = `
      SELECT COUNT(DISTINCT co.order_id, coi.product_id) AS total
      FROM customer_order_items coi
      JOIN customer_orders co 
        ON co.order_id = coi.order_id
      ${whereConditions}
    `;

        const [countResult]: any = await connection.query(countQuery, queryParams);

        const totalRecords = countResult[0]?.total || 0;

        return {
            result: rows,
            pagination: {
                total: totalRecords,
                page,
                pageSize,
                totalPages: Math.ceil(totalRecords / pageSize),
            },
        };

    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
};

export const getVendorExchangeListService = async (
    vendorId: string,
    options: FilterOptions,
    status: string = "all",
    page: number = 1,
    limit: number = 20
) => {
    const connection = await pool.getConnection();

    try {
        const values: any[] = [vendorId];
        let whereConditions = ` WHERE oei.vendor_id = ? `;

        whereConditions += buildDateFilterDynamic(options, values, "oe");

        if (status && status !== "all") {
            whereConditions += ` AND oe.status = ? `;
            values.push(status);
        }

        const offset = (page - 1) * limit;

        const exchangesQuery = `
    SELECT 
        oe.exchange_id,
        oei.exchange_item_id,
        oe.order_id,
        oe.customer_id,
        oe.status,
        oe.reason,
        oei.product_id,
        oei.inventory_id,
        oei.vendor_id,
        oei.condition_status,
        oei.quantity,
        p.name as product_name,
        oei.quantity,
        oe.created_at
    FROM order_exchange_items oei
    JOIN order_exchanges oe 
        ON oe.exchange_id = oei.exchange_id
    JOIN product p 
        ON p.product_id = oei.product_id
    ${whereConditions}
    ORDER BY oe.created_at DESC
    LIMIT ? OFFSET ?
`;

        const [exchanges] = await connection.query(
            exchangesQuery,
            [...values, limit, offset]
        );

        const countQuery = `
            SELECT COUNT(DISTINCT oe.exchange_id) as total
            FROM order_exchange_items oei
            JOIN order_exchanges oe 
                ON oe.exchange_id = oei.exchange_id
            ${whereConditions}
        `;

        const [countResult]: any = await connection.query(countQuery, values);

        const [exchangeStatus]: any = await connection.query(`select DISTINCT status from order_exchanges`);

        const total = countResult[0]?.total || 0;

        return {
            data: exchanges,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            exchangeStatus
        };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};