import express, { Request, Response, NextFunction } from "express";
import { authenticateDriverToken } from "../Middleware/DriverTokenAuthenticator";
import { fetchDriverDashboard, updateDriverProfileHandler, updateDriverStatusHandler, updateDriverLocationHandler, saveDriverPushTokenController } from "../Controller/DriverController";
import {
    acceptOrderHandler,
    deliverOrderHandler,
    getAvailableOrdersHandler,
    getDriverOrdersHandler,
    pickupOrderHandler,
    getOrderDetailsHandler,
    getDriverEarningsHandler,
    getDriverHistoryHandler,
    cancelAssignedOrderHandler,
    returnOrderHandler
} from "../Controller/DriverOrderController";
import { createDriverTicketHandler, getDriverTicketsHandler } from "../Controller/DriverTicketController";
import upload from "../../../StandardUtility/MulterConfig";



const router = express.Router();

export const checkMultipartFormData = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.is('multipart/form-data')) {
        res.status(400).json({ message: 'Content-Type must be multipart/form-data' });
        return;
    }
    next();
};

// ═══════════════════════════════════════════════════════════════════════════
// DRIVER PROFILE & STATUS
// ═══════════════════════════════════════════════════════════════════════════

// Dashboard — Get driver profile, status, and warehouses
router.get("/dashboard", authenticateDriverToken, fetchDriverDashboard);

// Profile — Update driver profile (name, email, address, vehicle info)
router.put("/profile", authenticateDriverToken, updateDriverProfileHandler);

// Status — Toggle driver online/offline
router.put("/status", authenticateDriverToken, updateDriverStatusHandler);

// Location — Update driver's current GPS location
router.put("/location", authenticateDriverToken, updateDriverLocationHandler);

// ═══════════════════════════════════════════════════════════════════════════
// DRIVER ORDERS
// ═══════════════════════════════════════════════════════════════════════════

// My Orders — List orders assigned to this driver (active by default)
router.get("/my-orders", authenticateDriverToken, getDriverOrdersHandler);

// Available Orders — List all orders currently available for pickup
router.get("/available", authenticateDriverToken, getAvailableOrdersHandler);

// Earnings — Get driver's earnings summary (today, week, month, lifetime)
router.get("/earnings", authenticateDriverToken, getDriverEarningsHandler);

// History — Get driver's completed delivery history
router.get("/history", authenticateDriverToken, getDriverHistoryHandler);

// ═══════════════════════════════════════════════════════════════════════════
// DRIVER SUPPORT TICKETS
// ═══════════════════════════════════════════════════════════════════════════

// Create Ticket — Submit a support ticket with optional file attachment
router.post("/tickets", authenticateDriverToken, upload.single("attachment"), createDriverTicketHandler);

// List Tickets — Get all support tickets raised by the authenticated driver
router.get("/tickets", authenticateDriverToken, getDriverTicketsHandler);

// Order Details — Get detailed information about a specific order
router.get("/:order_id", authenticateDriverToken, getOrderDetailsHandler);

// Accept Order — Accept an order (race-safe)
router.post("/:order_id/accept", authenticateDriverToken, acceptOrderHandler);

// Pickup Order — Confirm pickup from warehouse
router.put("/:order_id/pickup", authenticateDriverToken, pickupOrderHandler);

// Deliver Order — Confirm delivery to customer
router.put("/:order_id/deliver", authenticateDriverToken, deliverOrderHandler);

// ═══════════════════════════════════════════════════════════════════════════
// ORDER EXCEPTIONS (Cancel & Return)
// ═══════════════════════════════════════════════════════════════════════════

// Cancel Order — Driver cancels assigned order before pickup (e.g., bike breakdown)
router.post("/:order_id/cancel", authenticateDriverToken, cancelAssignedOrderHandler);

// Return Order — Return to warehouse after pickup (RTO: customer unavailable/refused)
router.post("/:order_id/return", authenticateDriverToken, returnOrderHandler);

//push token save for driver
router.post(
  "/save-push-token",
  authenticateDriverToken,
  saveDriverPushTokenController
);

export default router;
