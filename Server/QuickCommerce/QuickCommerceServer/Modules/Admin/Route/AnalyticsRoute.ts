import { Router } from 'express';
import { authenticateAdminToken } from '../Middleware/AdminTokenAuthenticator';
import * as analyticsController from '../Controller/AnalyticsController';
const router = Router();

// Dashboard overview
router.get('/dashboard/overview', authenticateAdminToken, analyticsController.getDashboardOverview);

// Order analytics
router.get('/orders', authenticateAdminToken, analyticsController.getOrderAnalytics);

// Revenue analytics
router.get('/revenue', authenticateAdminToken, analyticsController.getRevenueAnalytics);

// Product performance
router.get('/products/performance', authenticateAdminToken, analyticsController.getProductPerformance);

// Vendor performance
router.get('/vendors/performance', authenticateAdminToken, analyticsController.getVendorPerformance);

// Category performance
router.get('/categories/performance', authenticateAdminToken, analyticsController.getCategoryPerformance);

// Inventory analytics
router.get('/inventory', authenticateAdminToken, analyticsController.getInventoryAnalytics);

// User growth analytics
router.get('/users/growth', authenticateAdminToken, analyticsController.getUserGrowthAnalytics);

// Geographic analytics
router.get('/geographic', authenticateAdminToken, analyticsController.getGeographicAnalytics);

export { router as analyticsRoutes };