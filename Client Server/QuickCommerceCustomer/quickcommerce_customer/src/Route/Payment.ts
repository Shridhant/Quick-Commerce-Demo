import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../Middleware/RequestBodyValidator";
import { paymentOrderCreateValidation, verifyPaymentValidation } from "../Validation/CommonValidator";

import { AuthenticateCustomerToken } from "../Middleware/TokenAuthenticator";
import { createPaymentOrderController, getPaymentStatus, razorpayWebhookHandler, verifyPaymentOrderController } from "../Controller/PaymentController";


const router = express.Router();

// start the payment order creation process -1
router.post("/order/create", AuthenticateCustomerToken, paymentOrderCreateValidation, validateRequest, createPaymentOrderController);

// verify and initialize the payment capture process -3
router.post("/order/payments/capture", AuthenticateCustomerToken,verifyPaymentValidation,validateRequest,verifyPaymentOrderController);

// webhook endpoint to capture payment from razorpay - 2 automatically
// router.post("/order/payments/webhook/capture",express.raw({type: "application/json"}),razorpayWebhookHandler);

// get payment status for an order -4 last frequent call 
router.get("/order/payments/status/:orderId", AuthenticateCustomerToken, getPaymentStatus);

export default router;