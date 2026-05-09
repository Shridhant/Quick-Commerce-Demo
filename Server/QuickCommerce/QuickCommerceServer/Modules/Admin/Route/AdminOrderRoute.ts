import express from "express";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import { approveOrderValidation } from "../RequestBodyValidation/AdminBodyValidation";
import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";
import {
  approveIncomingOrder,
  rejectVendorIncomingOrder,
  fetchAdminOrderProducts,
  newApproveOrder,
  getPickupDetails
} from "../Controller/AdminController";

const router = express.Router();

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * GET /orders/incoming
 * Get all incoming vendor orders
 */
router.get("/incoming", authenticateAdminToken, fetchAdminOrderProducts);

/**
 * POST /orders/approve
 * Approve incoming vendor order
 * Body validation: approveOrderValidation
 */
router.post(
  "/approve",
  authenticateAdminToken,
  approveOrderValidation,
  validateRequest,
  approveIncomingOrder
);

/**
 * POST /orders/reject
 * Reject incoming vendor order
 * Body validation: approveOrderValidation
 */
router.post(
  "/reject",
  authenticateAdminToken,
  approveOrderValidation,
  validateRequest,
  rejectVendorIncomingOrder
);


//New routes for approve order with pick up details

router.post("/newapprove",authenticateAdminToken, newApproveOrder)

router.get("/:orderId/pickup",authenticateAdminToken, getPickupDetails)

export default router;