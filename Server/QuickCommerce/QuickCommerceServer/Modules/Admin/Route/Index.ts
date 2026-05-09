import express from "express";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import { adminLoginValidation } from "../RequestBodyValidation/AdminBodyValidation";

import { loginAdmin, refreshTokenHandler, logoutAdmin } from "../Controller/SuperAdminController";
import { fetchProductInventory } from "../Controller/AdminController";

// Import modular routes

import driveRoutes from "./AdminDriverRoute";

import adminRoutes from "./AdminManagementRoute"

import orderRoutes from "./AdminOrderRoute"

import vendorRoutes from "./AdminVendorRoute"

import warehouseRoutes from "./AdminWarehouseRoute"

import inventoryRoutes from "./AdminInventoryRoute"

import { userRouter } from "./AdminUserRoute";

import tickeRoutes from "./AdminTicketRoute"

import userOrderRoutes from "./AdminUserOrderRoutes"

import productRoutes from "./AdminProductRoute"

const router = express.Router();

// ============================================
// AUTHENTICATION
// ============================================

/**
 * POST /login
 * Admin login
 */
router.post("/login", adminLoginValidation, validateRequest, loginAdmin);

/**
 * POST /refresh-token
 * Silent token refresh using HTTP-only cookie (no auth middleware required)
 */
router.post("/refresh-token", refreshTokenHandler);

/**
 * POST /logout
 * Clear the refresh token cookie
 */
router.post("/logout", logoutAdmin);

// ============================================
// MODULAR ROUTES
// ============================================

/**
 * /admins - Admin management routes
 */
router.use("/admins", adminRoutes);

/**
 * /warehouses - Warehouse management routes
 */
router.use("/warehouses", warehouseRoutes);

/**
 * /vendors - Vendor management routes
 */
router.use("/vendors", vendorRoutes);

/**
 * /drivers - Driver management routes
 */
router.use("/drivers", driveRoutes);

/**
 * /orders - Order management routes
 */
router.use("/orders", orderRoutes);

// ============================================
// INVENTORY
// ============================================

/**
 * GET /inventory/products
 * Get product inventory
 */
router.use("/inventory", inventoryRoutes);

router.use("/users", userRouter);

router.use("/usersorders", userOrderRoutes);
// router.get("/inventory/products", fetchProductInventory);

router.use('/tickets', tickeRoutes)

router.use('/products', productRoutes)

export default router;
