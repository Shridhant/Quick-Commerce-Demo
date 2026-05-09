import express from 'express';
import {
  getAllOrdersList,
  getOrderById,
  getAvailableDrivers,
  assignDriverToOrder,
  unassignDriverFromOrder,packOrderHandler,
  markReadyForPickupHandler,
} from '../Controller/AdminUserOrdersController';

import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";

const router = express.Router();

// Orders routes
router.get('/users/orders', authenticateAdminToken, getAllOrdersList);
router.get('/orders/:orderId', authenticateAdminToken, getOrderById);

// Driver management routes
router.get('/drivers/available', authenticateAdminToken, getAvailableDrivers);
router.post('/orders/:orderId/assign-driver', authenticateAdminToken, assignDriverToOrder);
router.post('/orders/:orderId/unassign-driver', authenticateAdminToken, unassignDriverFromOrder);





// All routes below assume the router is mounted at /api/admin/orders
// e.g. app.use("/api/admin/orders", adminOrderRoutes);

// STEP 7 — Pack an order
router.put("/:order_id/pack", authenticateAdminToken, packOrderHandler);

// STEP 8 — Mark order ready for pickup (broadcasts notification to drivers)
router.put("/:order_id/ready", authenticateAdminToken, markReadyForPickupHandler);



export default router;