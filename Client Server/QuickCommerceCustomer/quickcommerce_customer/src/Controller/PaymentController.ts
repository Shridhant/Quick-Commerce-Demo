
import { Request, Response } from "express";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import { AuthenticatedCustomerRequest } from "../Utility/CustomPayload";
import { createRazorpayOrder, verifyCustomerOrderPayment, verifyPaymentQuick } from "../Service/PaymentService";
import { RAZORPAY_WEBHOOK_SECRET } from "../Config/SettingReader";
import crypto from "crypto";
import pool from "../Config/MySqlDbConfig";
import { CustomerOrderStatus, PaymentStatus } from "../Utility/CustomerStatus";
import { RowDataPacket } from "mysql2";
import { insertLogs } from "../Service/CommonService";

export const createPaymentOrderController = async (req: AuthenticatedCustomerRequest, res: Response) => {

  const { shippingAddressId, totalAmount, paymentMode, items, orderId } = req.body;
  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const parsedTotalAmount = parseFloat(totalAmount);
    if (isNaN(parsedTotalAmount) || parsedTotalAmount <= 0) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: HttpStatusCode.BAD_REQUEST, message: "Invalid totalAmount" });
    }
    const response = await createRazorpayOrder(customerId, shippingAddressId, parsedTotalAmount, paymentMode, items, orderId);
    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const verifyPaymentOrderController = async (req: AuthenticatedCustomerRequest, res: Response) => {

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  try {

    // let customerId: string = "DEFAULT";
    // if (req.customer && typeof req.customer === "object") {
    //   customerId = req.customer.customerId;
    // }
    // if (customerId === "DEFAULT") {
    //   return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    // }

    const response = await verifyPaymentQuick(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId)
    // const response = await verifyCustomerOrderPayment(
    //   razorpay_order_id,
    //   razorpay_payment_id,
    //   razorpay_signature,
    //   orderId,
    //   customerId
    // )
    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const razorpayWebhookHandler = async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const payload = req.body.toString("utf8");

  console.log("Called Webhook : ",JSON.stringify(payload));

  console.log("Called Webhook 1: ",payload);

  // 1️⃣ Verify webhook signature
  if (!verifyWebhook(payload, signature)) {
    console.log("signatue : ",signature)
    console.log("invalid webhook")
    return res.status(HttpStatusCode.BAD_REQUEST).send("Invalid webhook");
  }

  const body = JSON.parse(payload);
  const event = body.event;

  console.log("body : ",body);
  console.log("event : ",event)

  // 2️⃣ Only act on captured payments
  if (event !== "payment.captured") {

    console.log("payment not captured")
    return res.status(HttpStatusCode.OK).send("Ignored");
  }

  const payment = body.payload.payment.entity;

  console.log("payment : ",payment)

  const orderId = payment.notes?.orderId;
  const customerId = payment.notes?.customerId;

  if (!orderId || !customerId) {
    console.log("missing meta data")
    return res.status(HttpStatusCode.OK).send("Missing metadata");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 3️⃣ Lock order row
    const [order] = await connection.query<RowDataPacket[]>(
      `
      SELECT payment_status
      FROM customer_orders
      WHERE order_id = ?
      FOR UPDATE
      `,
      [orderId]
    );

    if (!order.length) {
      await connection.rollback();
      console.log("No Order Found")
      return res.status(HttpStatusCode.NOT_FOUND).send("Order not found");
    }

      await insertLogs(JSON.stringify(payment), "Webhook received",);

    // 4️⃣ Idempotency check
    if (order[0].payment_status === PaymentStatus.captured) {
      await connection.commit();
      return res.status(HttpStatusCode.OK).send("Already processed");
    }

    // 5️⃣ Insert payment (matches your verifyRazorPayment table)
    await connection.query(
      `
      INSERT IGNORE INTO payments (
        customer_id,
        order_id,
        description,
        razorpay_order_id,
        razorpay_payment_id,
        total_amount,
        status,
        method
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        customerId,
        orderId,
        payment.description || "Payment captured",
        payment.order_id,
        payment.id,
        payment.amount / 100,
        payment.status,
        payment.method
      ]
    );

    // 6️⃣ Update order status
    await connection.query(
      `
      UPDATE customer_orders
      SET payment_status = ?,order_status = ?
      WHERE order_id = ?
      `,
      [PaymentStatus.captured, CustomerOrderStatus.CONFIRMED, orderId]
    );

    await connection.query(`DELETE FROM cart_items
        WHERE cart_item_id IN (
        SELECT cart_id
        FROM customer_order_items
        WHERE order_id = ?);`, [orderId]);

    // 7️⃣ Batch inventory deduction (optimized)
    await connection.query(
      `
      UPDATE inventory i
      JOIN customer_order_items oi
        ON i.inventory_id = oi.inventory_id
       AND i.product_id = oi.product_id
       AND i.vendor_id = oi.vendor_id
      SET i.quantity = i.quantity - oi.quantity
      WHERE oi.order_id = ?
      `,
      [orderId]
    );

    await connection.commit();
    return res.status(HttpStatusCode.OK).send("Processed");

  } catch (error) {
    await connection.rollback();
    console.error("Webhook error:", error);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send("Webhook error");
  } finally {
    connection.release();
  }
};

const verifyWebhook = (payload: string, signature: string) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");

  return expected === signature;
};


export const getPaymentStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if(!orderId){
    return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Order ID is required" });
  }
  
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT payment_status
    FROM customer_orders
    WHERE order_id = ?
    `,
    [orderId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  return {success: true, code: HttpStatusCode.OK, message: "Payment status retrieved successfully", paymentStatus: rows[0].payment_status};
};
