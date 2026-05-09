import express from "express";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";
import { fetchProductInventory } from "../Controller/AdminController";
import upload from "../../../StandardUtility/MulterConfig";
import {
  fetchAllProducts,
  fetchProductById,
  addProduct,
  editProduct,
  updateProductStatus,
  removeProduct,
  removeProductImage,
} from "../Controller/AdminProductController";

const router = express.Router();

// ============================================
// EXISTING ROUTES
// ============================================

/**
 * GET /products/inventory/products
 * Get product inventory (vendor-scoped)
 */
router.get("/inventory/products", authenticateAdminToken, fetchProductInventory);

// ============================================
// NEW ROUTES — PRODUCT MANAGEMENT
// ============================================

/**
 * GET /products
 * List all products with optional filters
 * Query: category, is_active, search, page, limit
 */
router.get("/", authenticateAdminToken, fetchAllProducts);

/**
 * GET /products/:productId
 * Get a single product by ID
 */
router.get("/:productId", authenticateAdminToken, fetchProductById);

/**
 * POST /products
 * Create a new product
 * Body: name (required), description, category, unit, image_url, sku, brand, tags, unit_size
 */
router.post("/", authenticateAdminToken, upload.fields([{ name: "product", maxCount: 5 }]), addProduct);

/**
 * PUT /products/:productId
 * Update product details
 * Body: any updatable fields (name, description, category, unit, image_url, sku, brand, tags, unit_size)
 */
router.put("/:productId", authenticateAdminToken, upload.fields([{ name: "product", maxCount: 5 }]), editProduct);

/**
 * PATCH /products/:productId/status
 * Activate or deactivate a product
 * Body: { is_active: true | false }
 */
router.patch("/:productId/status", authenticateAdminToken, updateProductStatus);

/**
 * DELETE /products/:productId
 * Permanently delete a product
 */
router.delete("/:productId", authenticateAdminToken, removeProduct);
router.delete("/:productId/images", authenticateAdminToken, removeProductImage);

export default router;
