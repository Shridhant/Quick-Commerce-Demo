import express from "express";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import { addAdminValidation } from "../RequestBodyValidation/AdminBodyValidation";
import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";
import {
  addAdmin,
  fetchAdmin,
  getAdminByIdHandler,
  updateAdminHandler,
  deleteAdminHandler,
  updateAdminRoleHandler,
  assignWarehouseHandler,
} from "../Controller/SuperAdminController";

const router = express.Router();

// ============================================
// EXISTING ROUTES
// ============================================

/**
 * GET /admins
 * Get all admins listing
 */
router.get("/", authenticateAdminToken, fetchAdmin);

/**
 * POST /admins
 * Add new admin
 * Body validation: addAdminValidation
 */
router.post(
  "/",
  authenticateAdminToken,
  addAdminValidation,
  validateRequest,
  addAdmin
);

// ============================================
// NEW ROUTES — ADMIN MANAGEMENT
// ============================================

/**
 * GET /admins/:adminId
 * Get a single admin's details by ID
 */
router.get("/:adminId", authenticateAdminToken, getAdminByIdHandler);

/**
 * PUT /admins/:adminId
 * Update admin info (name, email, password)
 * Body: { name?, email?, password? }
 */
router.put("/:adminId", authenticateAdminToken, updateAdminHandler);

/**
 * DELETE /admins/:adminId
 * Delete an admin (only deletes role = 'ADMIN', not SUPER_ADMIN)
 */
router.delete("/:adminId", authenticateAdminToken, deleteAdminHandler);

/**
 * PATCH /admins/:adminId/role
 * Change an admin's role
 * Body: { role: "ADMIN" | "SUPER_ADMIN" | "MANAGER" }
 */
router.patch("/:adminId/role", authenticateAdminToken, updateAdminRoleHandler);

/**
 * PATCH /admins/:adminId/warehouse
 * Assign (or remove) a warehouse from an admin.
 * Body: { warehouse_id: string | null }
 * Pass null to unassign the current warehouse.
 */
router.patch("/:adminId/warehouse", authenticateAdminToken, assignWarehouseHandler);

export default router;
