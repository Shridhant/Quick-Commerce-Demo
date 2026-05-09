import express from "express";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import {
  vendorListingValidation,
  verifyVendorAndAssignWarehouseValidation,
} from "../RequestBodyValidation/AdminBodyValidation";
import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";
import {
  vendorListing,
  vendorVerification,
  fetchVendorById,
  addVendor,
  editVendor,
  updateVendorStatus,
  removeVendor,
} from "../Controller/AdminVendorController";

const router = express.Router();

// ============================================
// VENDOR MANAGEMENT
// ============================================

/**
 * GET /vendors
 * Get vendor listing with filters
 * Query: status, documentVerified, page, limit
 */
router.get(
  "/",
  authenticateAdminToken,
  vendorListing
);

/**
 * GET /vendors/:vendorId
 * Get a single vendor by ID
 */
router.get("/:vendorId", authenticateAdminToken, fetchVendorById);

/**
 * POST /vendors
 * Create a new vendor (admin-created)
 * Body: name (required), phone (required), business_owner_name, email, password,
 *       address_line1, address_line2, city, state, postal_code, country,
 *       latitude, longitude, gstId, is_company_vendor, remarks
 */
router.post("/", authenticateAdminToken, addVendor);

/**
 * POST /vendors/verify
 * Verify vendor and assign warehouse
 * Body validation: verifyVendorAndAssignWarehouseValidation
 */
router.post(
  "/verify",
  authenticateAdminToken,
  verifyVendorAndAssignWarehouseValidation,
  validateRequest,
  vendorVerification
);

/**
 * PUT /vendors/:vendorId
 * Update vendor details
 * Body: any updatable vendor fields
 */
router.put("/:vendorId", authenticateAdminToken, editVendor);

/**
 * PATCH /vendors/:vendorId/status
 * Activate or deactivate a vendor
 * Body: { isActive: true | false }
 */
router.patch("/:vendorId/status", authenticateAdminToken, updateVendorStatus);

/**
 * DELETE /vendors/:vendorId
 * Permanently delete a vendor
 */
router.delete("/:vendorId", authenticateAdminToken, removeVendor);

export default router;