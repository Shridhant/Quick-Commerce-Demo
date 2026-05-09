import express from "express";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import { addWarehouseValidation } from "../RequestBodyValidation/AdminBodyValidation";
import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";
import { addWarehouse, fetchWarehouses, getRecentWarehouseActivities, getWarehouseAnalytics } from "../Controller/WarehouseController";

const router = express.Router();

// ============================================
// WAREHOUSE MANAGEMENT
// ============================================

/**
 * GET /warehouses
 * Get all warehouses
 */
router.get("/", fetchWarehouses);

/**
 * POST /warehouses
 * Add new warehouse
 * Body validation: addWarehouseValidation
 */
router.post(
  "/",
  authenticateAdminToken,
  addWarehouseValidation,
  validateRequest,
  addWarehouse
);

router.get('/analytics/warehouse/overview', authenticateAdminToken, getWarehouseAnalytics);
router.get('/warehouse/recent-activities', authenticateAdminToken, getRecentWarehouseActivities);

export default router;