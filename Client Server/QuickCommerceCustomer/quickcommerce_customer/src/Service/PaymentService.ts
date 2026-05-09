import { RowDataPacket } from "mysql2";
import pool from "../Config/MySqlDbConfig";
import mysql from 'mysql2/promise';
import { CustomCode } from "../Config/CustomCode";
import { AppError } from "../Config/AppError";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import Razorpay from "razorpay";
import crypto from "crypto";
import { PaymentStatus } from "../Utility/CustomerStatus";
import { insertErrorLog, insertLogs } from "./CommonService";
import { Json } from "sequelize/types/utils";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();
import { ACCESS_TOKEN_SECRET, ORDERID_PREFIX, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, REFRESH_TOKEN_SECRET } from "../Config/SettingReader";

interface CheckoutItem {
  product_id: string;
  quantity: number;
  price: number;
  vendorId: string,
  inventory_id: string;
  cart_item_id: string;
}

const createUniqueOrderRef = async (connection: mysql.PoolConnection): Promise<string> => {
  const prefix = "QCP";

  const pad = (n: number) => n.toString().padStart(2, "0");

  while (true) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);

    const now = new Date();
    const formattedDate =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    const orderRef = `${prefix}${randomNum}${formattedDate}`;

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT 1 FROM customer_orders WHERE order_id = ? LIMIT 1",
      [orderRef]
    );

    if (!Array.isArray(rows) || rows.length === 0) return orderRef;
  }
};

export const createRazorpayOrder = async (
  customerId: string,
  shippingAddressId: number,
  totalAmount: number,
  paymentMode: string,
  items: CheckoutItem[],
  orderId?: string
) => {

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let finalOrderId = orderId || '';
    let payableAmount = totalAmount;


    if (finalOrderId) {

      const [existingOrder] = await connection.query<RowDataPacket[]>(
        `SELECT total_amount, payment_status FROM customer_orders WHERE order_id = ? AND customer_id = ? LIMIT 1`,
        [orderId, customerId]
      );

      if (existingOrder.length === 0) {
        throw new AppError(
          "Order not found for the customer",
          HttpStatusCode.NOT_FOUND,
          CustomCode.NotFoundCode
        );
      }

      if (existingOrder[0].payment_status === 'PAID') {
        throw new AppError(
          "Order already paid",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      if (existingOrder[0].total_amount !== totalAmount) {
        throw new AppError(
          "Total amount mismatch",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      payableAmount = existingOrder[0].total_amount;
    } else {

      if (!items || items.length === 0) {
        throw new AppError(
          "Items required",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      finalOrderId = await createUniqueOrderRef(connection);

      const customerOrderQuery = `
      INSERT INTO customer_orders 
        (order_id, customer_id, total_amount, payment_status, shipping_address_id,payment_method) 
      VALUES (?, ?, ?, 'UNPAID', ?, ?)
    `;

      await connection.query(customerOrderQuery, [
        finalOrderId,
        customerId,
        payableAmount,
        shippingAddressId,
        paymentMode
      ]);


      for (const item of items) {

        const [inventory] = await connection.query<RowDataPacket[]>(`
      SELECT inventory_id, vendor_id
      FROM inventory
      WHERE product_id = ?
      AND quantity > 0
      ORDER BY quantity DESC
      LIMIT 1
    `, [item.product_id]);

        if (inventory.length === 0) {
          throw new AppError(
            "Product out of stock",
            HttpStatusCode.BAD_REQUEST,
            CustomCode.BadRequestCode
          )
        }

        const itemId = uuidv4();
        await connection.query(
          `
        INSERT INTO customer_order_items (
          item_id,
          order_id,
          product_id,
          inventory_id,
          quantity,
          vendor_id,
          cart_id,
          price_at_purchase
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            itemId.slice(0, 18),
            finalOrderId,
            item.product_id,
            item.inventory_id,
            item.quantity,
            item.vendorId,
            item.cart_item_id,
            item.price,
          ]
        );
      };
    }

    if (paymentMode === 'COD') {
      await connection.commit();
      return {
        success: true,
        code: CustomCode.SuccessCode,
        message: "Order created successfully with COD",
        orderId: finalOrderId,
        paymentMode: "COD",
      }
    }

    const [paidPayment] = await connection.query<RowDataPacket[]>(
      `
     SELECT 1 
     FROM payments 
     WHERE order_id = ? AND status = 'captured'
     LIMIT 1
  `,
      [finalOrderId]
    );

    if (paidPayment.length > 0) {
      throw new AppError(
        "Order already paid",
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    }

    const options = {
      amount: payableAmount * 100,
      currency: "INR",
      receipt: finalOrderId,
      notes: {
        customerId: customerId,
        orderId: finalOrderId
      },
    };

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create(options);

    await connection.query(
      `INSERT INTO payment_orders 
       (customer_id, order_id, razorpay_order_id, total_amount, remarks, payment_status,currency)
       VALUES (?, ?, ?, ?, ?, 'created', 'INR')
       ON DUPLICATE KEY UPDATE
       razorpay_order_id = VALUES(razorpay_order_id),
       total_amount = VALUES(total_amount),
       payment_status = 'created'`,
      [customerId, finalOrderId, order.id, payableAmount, `payment order created for ${finalOrderId}`]
    );

    await connection.commit();

    return {
      success: true,
      code: CustomCode.SuccessCode,
      message: "order created successfully",
      paymentMode,
      order,
    };

  } catch (err) {
    await connection.rollback();
    throw err;

  } finally {
    connection.release();
  }
};

export const verifyPaymentQuick = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  orderId: string
) => {
  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(sign)
    .digest("hex");

  if (expected !== razorpay_signature) {
    throw new AppError("Invalid signature", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);
  }

  await pool.query(
    `UPDATE customer_orders SET payment_status = ? WHERE order_id = ?`,
    ["CONFIRMING_PAYMENT", orderId]
  );

  return {
    success: true,
    message: "Payment verification initiated! Confirming payment status shortly.",
  };
};


export const verifyCustomerOrderPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  orderId: string,
  customerId: string
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Ensure order exists & not already PAID
    const [order] = await connection.query<RowDataPacket[]>(
      `
      SELECT payment_status 
      FROM customer_orders 
      WHERE order_id = ? AND customer_id = ?
      LIMIT 1
      `,
      [orderId, customerId]
    );

    if (order.length === 0) {
      throw new AppError(
        "Order not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    if (order[0].payment_status === PaymentStatus.captured) {
      return {
        success: true,
        paymentStatus: PaymentStatus.captured,
        message: "Order already paid"
      };
    }

    // 2️⃣ Verify Razorpay payment + insert into payments table
    const paymentResult = await verifyRazorPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      customerId,
      connection
    );

    // 3️⃣ Update order status ONLY if captured
    if (paymentResult.paymentStatus === PaymentStatus.captured) {
      await connection.query(
        `UPDATE customer_orders SET payment_status = ? WHERE order_id = ?`,
        [PaymentStatus.captured, orderId]
      );
    }

    await updateInventoryAfterPayment(orderId, connection);

    await insertLogs(
      `Payment verification: orderId=${orderId}, customerId=${customerId}, razorpay_order_id=${razorpay_order_id}, status=${paymentResult.paymentStatus}`,
      "Payment Verification"
    );

    await connection.commit();
    return paymentResult;

  } catch (error) {
    await connection.rollback();

    if (error instanceof Error) {
      await insertErrorLog(error.message, error.stack, "Payment Verification Error");
    } else {
      await insertErrorLog("N/A", "N/A", JSON.stringify(error));
    }

    throw error;
  } finally {
    connection.release();
  }
};

const verifyRazorPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  orderId: string,
  customerId: string,
  connection: mysql.PoolConnection
) => {
  try {
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new AppError(
        "Invalid Razorpay signature",
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    }

    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT status FROM payments WHERE razorpay_payment_id = ? LIMIT 1`,
      [razorpay_payment_id]
    );

    if (existing.length > 0) {
      await connection.commit();
      return {
        success: true,
        paymentStatus: existing[0].status,
        message: `Payment already processed with status: ${existing[0].status}`
      };
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    const paidAmount = Number(payment.amount) / 100;

    if (payment.notes?.customerId !== customerId) {
      throw new AppError(
        "Payment customer mismatch",
        HttpStatusCode.FORBIDDEN,
        CustomCode.ForbiddenCode
      );
    }

    if (payment.status !== PaymentStatus.captured) {
      await connection.query(
        `
      INSERT INTO payments (
        customer_id,
        order_id,
        description,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        total_amount,
        status,
        method
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          customerId,
          orderId,
          payment.description || 'Payment not captured',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          paidAmount,
          payment.status,
          payment.method,
        ]
      );

      return {
        success: false,
        paymentStatus: payment.status,
        message:
          payment.error_description ||
          payment.error_reason ||
          `Payment ${payment.status}`,
        razorpayError: {
          code: payment.error_code || null,
          source: payment.error_source || null,
          step: payment.error_step || null,
          reason: payment.error_reason || null,
          description: payment.error_description || null
        }
      };
    }

    await connection.query(
      `
      INSERT INTO payments (
        customer_id,
        order_id,
        description,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        total_amount,
        status,
        method
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        customerId,
        orderId,
        payment.description || null,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paidAmount,
        payment.status,
        payment.method,
      ]
    );

    return {
      success: true,
      paymentStatus: payment.status,
      message:
        payment.status === PaymentStatus.captured
          ? "Payment Successful!"
          : `Payment - ${payment.status}`,
    };
  } catch (error) {
    throw error;
  }
};

const updateInventoryAfterPayment = async (
  orderId: string,
  connection: mysql.PoolConnection
) => {
  try {
    const [orderItems] = await connection.query<RowDataPacket[]>(
      `
      SELECT oi.product_id, oi.quantity, oi.vendor_id,oi.inventory_id
      FROM quickcommerce.customer_order_items oi
      WHERE oi.order_id = ?;
    `,
      [orderId]
    );

    for (const item of orderItems) {
      await connection.query(
        `
        UPDATE inventory
        SET quantity = quantity - ?
        WHERE product_id = ? AND inventory_id = ? AND vendor_id = ?;
      `,
        [item.quantity, item.product_id, item.inventory_id, item.vendor_id]
      );
    }
  } catch (error) {
    throw error;
  }
};