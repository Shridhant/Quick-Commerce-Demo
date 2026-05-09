import { Router } from "express";
import {
  getDrivers,
  getDriverDetails,
  verifyDriver,
  rejectDriver,
  updateDriverStatus,
  updateRemarks,
  getDriverAnalyticsHandler,
  getDriverPayoutHistoryHandler,
} from "../Controller/AdminDriverController";

import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";

const router = Router();

// ============================================
// DRIVER LISTING & DETAILS
// ============================================

// Get all drivers with optional filters
// Supports: status, documentVerified, isActive, page, limit
// Example: /drivers?status=ACTIVE&documentVerified=true&page=1&limit=10
router.get("/drivers", authenticateAdminToken, getDrivers);

// Get individual driver details (includes remarks)
router.get("/drivers/:driverId", authenticateAdminToken, getDriverDetails);

// ============================================
// DRIVER VERIFICATION
// ============================================

// Verify driver documents and set status to ACTIVE
// Body (optional): { "remarks": "All documents valid" }
router.put("/drivers/:driverId/verify", authenticateAdminToken, verifyDriver);

// Reject driver documents and set status to REJECTED
// Body (optional): { "rejectionReason": "Invalid license" }
router.put("/drivers/:driverId/reject", authenticateAdminToken, rejectDriver);

// ============================================
// DRIVER STATUS MANAGEMENT
// ============================================

// Update driver status (ACTIVE, INACTIVE, PENDING, REJECTED)
// Body: { "status": "ACTIVE", "remarks": "Optional note" }
router.put("/drivers/:driverId/status", authenticateAdminToken, updateDriverStatus);

// Update driver remarks only (without changing status)
// Body: { "remarks": "Additional notes about the driver" }
router.put("/drivers/:driverId/remarks", authenticateAdminToken, updateRemarks);

// ============================================
// DRIVER ANALYTICS & PAYOUTS
// ============================================

// Get driver performance analytics (deliveries, completion rate, avg delivery time, earnings)
router.get("/drivers/:driverId/analytics", authenticateAdminToken, getDriverAnalyticsHandler);

// Get driver payout/earnings history (paginated)
// Query params: page, limit
router.get("/drivers/:driverId/payouts", authenticateAdminToken, getDriverPayoutHistoryHandler);

export default router;