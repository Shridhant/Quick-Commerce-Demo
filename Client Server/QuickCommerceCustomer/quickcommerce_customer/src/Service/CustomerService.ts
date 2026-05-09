import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../Config/MySqlDbConfig";
import mysql from 'mysql2/promise';
import { CustomCode } from "../Config/CustomCode";
import { CustomerOrderStatus, CustomerStatus, OrderExchangeStatus } from "../Utility/CustomerStatus";
import { AppError } from "../Config/AppError";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import { generateUniqueId } from "../Utility/Helper";
import { DELIVERY_DISTANCE_THRESHOLD_KM, ORDERID_PREFIX } from "../Config/SettingReader";
import { CustomerOrder, Product, CustomerOrderItem } from "../Models/Association";
import { getOrSetWithLock } from "../Utility/CacheLock";
import { productDetailKey, productSearchKey, productSuggestionKey } from "../Utility/CacheKeys";

export const updateCustomerDetails = async (customerId: string, name: string, email: string | null, phone: string | null) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();


        const customerUpdateQuery = `
            UPDATE customer 
            SET name = ?, email = ?,status = ?, phone = ?
            WHERE customer_id = ?
        `;

        await connection.query<ResultSetHeader>(customerUpdateQuery, [name, email || null, CustomerStatus.ACTIVE, phone || null, customerId]);
        await connection.commit();

        return {
            success: true,
            code: CustomCode.SuccessCode,
            message: "Customer details updated successfully"
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const insertIntoAddress = async (customerId: string, address_line1: string, address_line2: string | null, city: string | null, state: string | null, is_default: boolean,
    postal_code: string | null, latitude: string | null, longitude: string | null, phone_number: string | null, landmark: string | null, connection: mysql.PoolConnection) => {

    try {
        await connection.query<ResultSetHeader>(
            `
        INSERT INTO customer_addresses 
        (customer_id, address_line1, address_line2, city, state, postal_code, country, latitude, longitude, is_default, phone_number, landmark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
                customerId,
                address_line1,
                address_line2 || null,
                city,
                state || null,
                postal_code,
                "INDIA",
                latitude || null,
                longitude || null,
                is_default,
                phone_number || null,
                landmark || null,
            ]
        );
    } catch (error) {
        throw error;
    }
}


export const updateSavedAddress = async (addressId: string, customerId: string, address_line1: string, address_line2: string | null, city: string | null, state: string | null, is_default: boolean,
    postal_code: string | null, latitude: string | null, longitude: string | null, phone_number: string | null, landmark: string | null) => {

    const connection = await pool.getConnection();
    try {
        const addressCheckQuery = `SELECT 1 FROM customer_addresses WHERE address_id = ? AND customer_id = ?`;
        const [addressRows] = await connection.query<RowDataPacket[]>(addressCheckQuery, [addressId, customerId]);
        if (addressRows.length === 0) throw new AppError("Address not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        const [result] = await connection.query<ResultSetHeader>(
            `
            UPDATE customer_addresses 
            SET
                address_line1 = ?,
                address_line2 = ?,
                city = ?,
                state = ?,
                postal_code = ?,
                country = "INDIA",
                latitude = ?,
                longitude = ?,
                is_default = ?,
                phone_number = ?,
                landmark = ?
            WHERE address_id = ? AND customer_id = ?
            `,
            [
                address_line1,
                address_line2 || null,
                city,
                state || null,
                postal_code,
                latitude || null,
                longitude || null,
                is_default,
                phone_number || null,
                landmark || null,
                addressId,
                customerId
            ]
        );

        if (result.affectedRows === 1) {
            return { success: true, code: CustomCode.SuccessCode, message: "Address updated successfully" };
        }
    } catch (error) {
        throw error;
    }
}

export const deleteSavedAddress = async (addressId: string, customerId: string) => {

    const connection = await pool.getConnection();
    try {
        const addressCheckQuery = `SELECT 1 FROM customer_addresses WHERE address_id = ? AND customer_id = ?`;
        const [addressRows] = await connection.query<RowDataPacket[]>(addressCheckQuery, [addressId, customerId]);
        if (addressRows.length === 0) throw new AppError("Address not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        const [result] = await connection.query<ResultSetHeader>(
            `
            DELETE FROM customer_addresses 
            WHERE address_id = ? AND customer_id = ?
            `,
            [
                addressId,
                customerId
            ]
        );
        if (result.affectedRows === 1) {
            return { success: true, code: CustomCode.SuccessCode, message: "Address deleted successfully" };
        }
    } catch (error) {
        throw error;
    }
}
export const addCustomerAddress = async (customerId: string, address_line1: string, address_line2: string | null, city: string | null, state: string | null, is_default: boolean,
    postal_code: string | null, latitude: string | null, longitude: string | null, phone_number: string | null, landmark: string | null) => {

    const connection = await pool.getConnection();
    try {

        await connection.beginTransaction();
        await insertIntoAddress(customerId, address_line1, address_line2, city, state, is_default || false, postal_code, latitude, longitude, phone_number, landmark, connection);

        await connection.commit();

        return { success: true, code: CustomCode.SuccessCode, message: "address added successfully" }

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export const getSavedAddresses = async (customerId: string) => {
    try {

        const [addresses] = await pool.query("select * from customer_addresses where customer_id = ?", [customerId]);
        return { success: true, code: CustomCode.SuccessCode, addresses }
    } catch (error) {
        throw error;
    }
}

export const getAvailableProducts = async (categoryName: string, vendor: string, latitude: number, longitude: number) => {
    try {
    //     const productQuery = `SELECT 
    // p.product_id,
    // p.name AS product_name,
    // p.description,
    // p.category,
    // p.unit,
    // p.image_url,
    // i.price,
    // i.offer_price,
    // p.sku,
    // p.brand,
    // p.tags,
    // i.expiry_date,
    // p.unit_size,
    // i.inventory_id,
    // i.warehouse_id,
    // i.vendor_id,
    // i.quantity,
    // v.name as storename
    // FROM inventory i
    // JOIN product p ON i.product_id = p.product_id
    // JOIN vendors v on v.vendor_id = i.vendor_id
    // WHERE i.quantity > 0
    // AND (p.category = ? OR ? = 'ALL')
    // AND (v.name = ? OR ? = 'ALL');`

    const productQuery = `
    SELECT *
FROM (
    SELECT 
        p.product_id,
        p.name AS product_name,
        p.description,
        p.category,
        p.unit,
        p.image_url,
        p.sku,
        p.brand,
        p.tags,
        p.unit_size,

        i.price,
        i.offer_price,
        i.expiry_date,
        i.inventory_id,
        i.warehouse_id,
        i.vendor_id,
        i.quantity,

        v.name AS storename,

        ST_Distance_Sphere(
            w.location,
            POINT(?, ?)
        ) AS distance,

        ROW_NUMBER() OVER (
            PARTITION BY i.product_id, i.vendor_id
            ORDER BY 
                ST_Distance_Sphere(w.location, POINT(?, ?)) ASC,
                COALESCE(i.offer_price, i.price) ASC
        ) AS rn

    FROM quickcommerce.inventory i
    JOIN quickcommerce.product p 
        ON i.product_id = p.product_id
    JOIN quickcommerce.vendors v 
        ON v.vendor_id = i.vendor_id
    JOIN quickcommerce.warehouse w 
        ON w.warehouse_id = i.warehouse_id

    WHERE 
        i.quantity > 0
        AND w.status = 'A'
        AND (p.category = ? OR ? = 'ALL')
        AND (v.name = ? OR ? = 'ALL')
) t

WHERE 
    t.distance <= ${DELIVERY_DISTANCE_THRESHOLD_KM}
    AND t.rn = 1;`

        const [products] = await pool.query<RowDataPacket[]>(productQuery, [longitude,latitude,longitude,latitude,categoryName, categoryName, vendor, vendor]);

        return { success: true, code: CustomCode.SuccessCode, message: "Products fetched successfully", products };
    } catch (error) {
        throw error;
    }
}


export const getProductDetailsById = async (productId: string) => {

    const cacheKey = productDetailKey(productId);

    return getOrSetWithLock(cacheKey, async () => {
        const productQuery = `SELECT 
    p.product_id,
    p.name AS product_name,
    p.description,
    p.category,
    p.unit,
    p.image_url,
    i.price,
    i.offer_price,
    p.sku,
    p.brand,
    p.tags,
    i.expiry_date,
    p.unit_size,
    i.inventory_id,
    i.warehouse_id,
    i.vendor_id,
    i.quantity,
    v.name as storename
    FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    JOIN vendors v on v.vendor_id = i.vendor_id
    WHERE p.product_id = ?`;

        const [product] = await pool.query<RowDataPacket[]>(productQuery, [productId]);

        return { success: true, code: CustomCode.SuccessCode, message: "Product fetched successfully", product };
    }, 300);
}

export const addProductToCart = async (customerId: string, productId: string, quantity: number, vendorId: string, inventoryId: string) => {

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [savedProduct] = await connection.query<RowDataPacket[]>(`
        SELECT * FROM product WHERE product_id = ?`, [productId]);

        if (savedProduct.length === 0) throw new AppError("Product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        if (quantity <= 0) {
            await connection.query(
                `DELETE FROM cart_items WHERE customer_id = ? AND product_id = ?`,
                [customerId, productId]
            );

            return {
                success: true,
                message: "Product removed from cart"
            };
        }

        const uniqueId = await generateUniqueId('cart_items', 'cart_item_id');
        const query = `INSERT INTO cart_items (cart_item_id,customer_id, product_id, quantity,vendor_id, inventory_id) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`;
        const [result] = await connection.query<ResultSetHeader>(query, [uniqueId, customerId, productId, quantity, vendorId, inventoryId]);

        await connection.commit();
        return { success: true, code: CustomCode.SuccessCode, message: "Product added / Updated Quantity to cart successfully" };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export const getCartItems = async (customerId: string) => {
    try {

        const query = `SELECT 
           p.name AS product_name,
           p.description,
           p.category,
           p.unit,
           p.image_url,
           i.price,
           i.offer_price,
           p.sku,
           p.brand,
           p.tags,
           i.expiry_date,
           p.unit_size,
           c.cart_item_id,
           c.quantity as item_quantity,
           c.product_id,
           c.inventory_id,
           i.vendor_id
           FROM product p JOIN cart_items c on c.product_id = p.product_id join inventory i on i.product_id = p.product_id where c.customer_id = ?`

        const [cartItems] = await pool.query<RowDataPacket[]>(query, [customerId]);

        return { success: true, code: CustomCode.SuccessCode, message: "Cart items fetched successfully", cartItems };
    } catch (err) {
        throw err;
    }
}

export const removeItemFromCart = async (cartItemId: string, customerId: string) => {
    try {
        const query = `DELETE FROM cart_items WHERE cart_item_id = ? and customer_id = ?`;
        const [result] = await pool.query<ResultSetHeader>(query, [cartItemId, customerId]);
        if (result.affectedRows === 1) {
            return { success: true, code: CustomCode.SuccessCode, message: "Item removed from cart successfully" };
        }
        return { success: false, code: CustomCode.NotFoundCode, message: "Cart item not found" };
    } catch (error) {
        throw error;
    }
}

export const getDashboardData = async (customerId: string, latitude: number, longitude: number) => {
    try {
        // Fetch total number of products
        const [productCountResult] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS totalCartItem FROM cart_items where customer_id = ?`, [customerId]);
        const totalCartItem = productCountResult[0]?.totalCartItem || 0;
        const { products } = await getAvailableProducts('ALL', 'ALL', latitude, longitude);
        return { success: true, code: CustomCode.SuccessCode, message: "Dashboard data fetched successfully", result: { totalCartItem, products } };

    } catch (error) {
        throw error;
    }
}

export const insertNewOrder = async (items: any[], totalAmount: number | 0, paymentMethod: string, addressId: string, customerId: string) => {

    const transaction = await pool.getConnection();
    try {

        await transaction.beginTransaction();
        let inventoryId = '';
        const productQuery = `SELECT 
                                p.product_id,
                                i.inventory_id
                                FROM inventory i
                                JOIN product p ON i.product_id = p.product_id
                                WHERE i.product_id = ?;`

        const orderInsertQuery = `INSERT INTO customer_orders 
        (order_id, customer_id, total_amount, payment_method, shipping_address_id,remarks)
        VALUES (?, ?, ?, ?, ?, ?)`;

        const orderItemsInsertQuery = `INSERT INTO customer_order_items
        (item_id, order_id, product_id, inventory_id, quantity, price_at_purchase)
        VALUES (?, ?, ?, ?, ?, ?)`;

        const [addressRows] = await transaction.query<RowDataPacket[]>(`SELECT 1 FROM customer_addresses WHERE address_id = ? AND customer_id = ?`, [addressId, customerId]);
        if (addressRows.length === 0) throw new AppError("Address not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

        if (items.length === 0) throw new AppError("Order must contain at least one item", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

        const maxOrderId = await getUniqueOrderId(transaction);
        let nextCodeNumber = maxOrderId + 1;
        let newOrderId = `${ORDERID_PREFIX}${nextCodeNumber.toString().padStart(5, '0')}`;

        await transaction.query(orderInsertQuery, [newOrderId, customerId, totalAmount, paymentMethod, addressId, "Order placed"]);

        let cartItemIds: string[] = [];
        for (const item of items) {
            const [productInfo] = await transaction.query<RowDataPacket[]>(productQuery, [item.product_id]);
            cartItemIds.push(item.cart_item_id);
            inventoryId = productInfo[0]?.inventory_id;
            if (productInfo.length === 0) throw new AppError("Product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);

            if (productInfo[0].quantity < item.quantity) throw new AppError(`Only ${productInfo[0].quantity} items are available in stock for product ${item.product_id}`, HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);
            const uniqueItemId = await generateUniqueId('customer_order_items', 'item_id');
            await transaction.query(orderItemsInsertQuery, [uniqueItemId, newOrderId, item.product_id, inventoryId, item.quantity, item.price_at_purchase])
        }


        // Placeholder for payment processing logic
        // After successful payment, insert payment record
        const paymentId = await generateUniqueId('payments', 'payment_id');

        const paymentInsertQuery = `INSERT INTO payments
        (payment_id, order_id, amount, payment_method, customer_id)
        VALUES (?, ?, ?, ?, ?)`;

        await transaction.query(paymentInsertQuery, [paymentId, newOrderId, totalAmount, paymentMethod, customerId]);

        await transaction.query(`DELETE FROM cart_items WHERE cart_item_id IN (?) AND customer_id = ?`, [cartItemIds, customerId]);
        await transaction.commit();

        return { success: true, code: CustomCode.SuccessCode, message: "Order placed successfully", orderId: newOrderId };
    } catch (error) {
        await transaction.rollback();
        throw error;
    } finally {
        transaction.release();
    }
}

export const cancelOrder = async (orderId: string, customerId: string, remarks: string | null) => {
    try {
        const query = `UPDATE customer_orders SET status = ?, remarks = ? WHERE order_id = ? AND customer_id = ? AND status = ?`;
        const [result] = await pool.query<ResultSetHeader>(query, [CustomerOrderStatus.CANCELLED, remarks, orderId, customerId, CustomerOrderStatus.CREATED]);
        if (result.affectedRows === 1) {
            return { success: true, code: CustomCode.SuccessCode, message: "Order cancelled successfully" };
        }
        return { success: false, code: CustomCode.NotFoundCode, message: "Order not found or cannot be cancelled" };
    } catch (error) {
        throw error;
    }
}

const getUniqueOrderId = async (connection: mysql.PoolConnection) => {
    try {
        const selectOrderIdQuery = `
            SELECT MAX(CAST(SUBSTRING(order_id, 7) AS UNSIGNED)) AS orderId
            FROM customer_orders
            WHERE order_id LIKE '${ORDERID_PREFIX}%'`;

        const [rows] = await connection.query<RowDataPacket[]>(selectOrderIdQuery);

        const maxOrderId = rows[0]?.orderId ? parseInt(rows[0]?.orderId) : 100000;
        return maxOrderId;
    } catch (err) {
        throw new AppError("Error Generating Unique Order Id",);
    }
};

export const customerOrderListing = async (customerId: string) => {
    try {
        const orders = await CustomerOrder.findAll({
            where: {
                customer_id: customerId,
                order_status: CustomerOrderStatus.CONFIRMED
            },
            include: [
                {
                    model: CustomerOrderItem,
                    as: "customer_order_items",
                    include: [
                        {
                            model: Product,
                            as: "product",
                            attributes: ["name", "image_url", "category", "unit", "brand"]
                        }
                    ]
                }
            ],
            order: [["created_at", "DESC"]]
        });
        return { success: true, code: CustomCode.SuccessCode, message: "Orders fetched successfully", orders };
    } catch (error) {
        throw error;
    }
}

export const customerProfile = async (customerId: string) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT customer_id, name, email, phone, status FROM customer WHERE customer_id = ?`, [customerId]);
        if (rows.length === 0) {
            throw new AppError("Customer not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
        }
        const customer = rows[0];
        return { success: true, code: CustomCode.SuccessCode, message: "Customer profile fetched successfully", customer };
    } catch (error) {
        throw error;
    }
}

export const insertRecentProductView = async (customerId: string, productId: string) => {

    const connection = await pool.getConnection();
    try {
        // Fetch product details
        const [productRows] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM product WHERE product_id = ?`,
            [productId]
        );

        if (productRows.length === 0) {
            throw new AppError("product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode)
        }

        // Insert or update recent view
        await connection.query(`
            INSERT INTO recently_viewed_product (customer_id, product_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP
        `, [customerId, productId]);

        // OPTIONAL: Keep only last 20 views
        await connection.query(`
            DELETE FROM recently_viewed_product
            WHERE customer_id = ?
            AND id NOT IN (
                SELECT id FROM (
                    SELECT id
                    FROM recently_viewed_product
                    WHERE customer_id = ?
                    ORDER BY viewed_at DESC
                    LIMIT 20
                ) AS temp
            )
        `, [customerId, customerId]);

        return { success: true, message: "product added successfully to recent view", code: CustomCode.SuccessCode }

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

export const getRecentlyViewedProducts = async (customerId: string) => {

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT p.*,i.vendor_id
            FROM recently_viewed_product rv
            JOIN product p ON rv.product_id = p.product_id
            JOIN inventory i ON i.product_id = p.product_id
            WHERE rv.customer_id = ?
            ORDER BY rv.viewed_at DESC
            LIMIT 20
        `, [customerId]);

        return { success: true, message: "recently viewed products fetched successfully", products: rows }

    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        connection.release();
    }
};

export const getProductNameSuggestions = async (keyword: string) => {
    if (!keyword || keyword.length < 2) return [];

    const cacheKey = productSuggestionKey(keyword);

    return getOrSetWithLock(cacheKey, async () => {
        const query = `
    SELECT name
    FROM product
    WHERE name LIKE CONCAT('%', ?, '%')
    AND is_active = 1
    ORDER BY name
    LIMIT 10
  `;
        const [rows] = await pool.query<RowDataPacket[]>(query, [keyword]);

        const productNames = rows.map(r => r.name);

        return { success: true, code: CustomCode.SuccessCode, message: "Product name suggestions fetched successfully", productNames };
    }, 120);
};

export const searchProductsByKeyword = async (keyword: string, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const cacheKey = productSearchKey(keyword, page, limit);

    return getOrSetWithLock(cacheKey, async () => {
    const query = `
     SELECT 
    p.product_id,
    p.name AS product_name,
    p.description,
    p.category,
    p.unit,
    p.image_url,
    i.price,
    i.offer_price,
    p.sku,
    p.brand,
    p.tags,
    i.expiry_date,
    p.unit_size,
    i.inventory_id,
    i.warehouse_id,
    i.vendor_id,
    i.quantity,
    v.name as storename
    FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    JOIN vendors v on v.vendor_id = i.vendor_id
    WHERE i.quantity > 0
    and MATCH(p.name, p.description, p.brand, p.tags, p.sku)
    AGAINST (? IN BOOLEAN MODE)
    AND p.is_active = 1
    AND (p.expiry_date IS NULL OR p.expiry_date >= NOW())
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?;
  `;

    // ✅ sanitize & format ONCE
    const cleanKeyword = keyword.replace(/[+\-*<>()~"]/g, "").trim();
    const searchTerm = `+${cleanKeyword}*`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [
        searchTerm,
        Number(limit),
        Number(offset)
    ]);
    return { success: rows.length > 0 ? true : false, code: CustomCode.SuccessCode, message: "Products fetched successfully", products: rows };
    }, 180);
};

export const savePushToken = async (customerId: string, pushToken: string, platform: string, deviceId: string | null, deviceModel: string | null, appVersion: string | null) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const query = `INSERT INTO customer_push_tokens (customer_id, push_token, platform, device_id, device_model, app_version)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        customer_id = VALUES(customer_id),
        push_token = VALUES(push_token),
        platform = VALUES(platform),
        device_id = VALUES(device_id),
        device_model = VALUES(device_model),
        app_version = VALUES(app_version),
        is_active = TRUE,
        updated_at = NOW()
        `;
        await connection.query(query, [customerId, pushToken, platform, deviceId, deviceModel, appVersion]);
        await connection.commit();
        return { success: true, code: CustomCode.SuccessCode, message: "Push token saved successfully" };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

interface ExchangeItem {
    vendorId: string;
    productId: string;
    inventoryId: string;
    quantity: number;
}

export const createExchangeService = async (
    items: ExchangeItem[],
    orderId: string,
    customerId: string,
    reason?: string | null,
    notes?: string | null,
    productFileNames?: string []
) => {

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [exchangeResult]: any = await connection.query(
            `
      INSERT INTO order_exchanges
      (order_id, customer_id, reason, notes, status)
      VALUES (?, ?, ?, ?, ?)
      `,
            [
                orderId,
                customerId,
                reason || null,
                notes || null,
                OrderExchangeStatus.PENDING,
            ]
        );

        const exchangeId = exchangeResult.insertId;

        for (const item of items) {
            await connection.query(
                `
           INSERT INTO order_exchange_items
           (exchange_id, customer_id, vendor_id, product_id, inventory_id, quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    exchangeId,
                    customerId,
                    item.vendorId,
                    item.productId,
                    item.inventoryId,
                    item.quantity,
                ]
            );
        }

        for(const filename of productFileNames || []) {

            await connection.query(
                `
                INSERT INTO order_exchange_file (exchange_id, filename)
                VALUES (?, ?)
                `,
                [
                    exchangeId,
                    filename
                ]
            );
        }

        await connection.commit();

        return {
            exchangeId,
            orderId: orderId,
            status: OrderExchangeStatus.PENDING,
            message: "Exchange request created successfully",
            success: true,
            code: CustomCode.SuccessCode
        };
        
    } catch (error) {
        await connection.rollback();
        throw new AppError(
            "Failed to create exchange request",
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            CustomCode.ServerErrorCode
        );
    } finally {
        connection.release();
    }
};

export const getCategories = async () => {
    try {
        const query = `SELECT * from product_category`;
        const [rows] = await pool.query<RowDataPacket[]>(query);
        return { success: true, code: CustomCode.SuccessCode, message: "Categories fetched successfully", categories: rows };
    } catch (err) {
        throw err;
    } 
};

