import { Router } from "express";
import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";
import { getUsers, getAnalytics,getOrderHistory,getRecentOrdersList,getUserById, getAllOrdersList} from "../Controller/AdminUserController";

export const userRouter = Router()

//Orders

userRouter.get('/orders',authenticateAdminToken,getAllOrdersList)

// User management routes
userRouter.get('/', authenticateAdminToken, getUsers);
userRouter.get('/:customerId', authenticateAdminToken, getUserById);
userRouter.get('/:customerId/orders', authenticateAdminToken, getOrderHistory);

// Analytics routes
userRouter.get('/analytics/overview', authenticateAdminToken, getAnalytics);
userRouter.get('/orders/recent', authenticateAdminToken, getRecentOrdersList);