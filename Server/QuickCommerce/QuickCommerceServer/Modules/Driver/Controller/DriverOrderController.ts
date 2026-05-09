import { Request, Response, NextFunction } from "express";
import {
  getAvailableOrders,
  acceptOrder,
  pickupOrder,
  deliverOrder,
  getDriverOrders,
  getOrderDetails,
  getDriverEarnings,
  getDriverHistory,
  cancelAssignedOrder,
  returnOrder,
} from "../Service/DriverOrderService";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Extract driverId from authenticated request
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Extracts driverId from the JWT payload attached by authenticateDriverToken middleware.
 * Handles different JWT payload structures between local and production environments.
 * 
 * Possible JWT structures:
 * { driverId: "DRV000001", purpose: "driver" }      // Correct (current)
 * { driverID: "DRV000001", purpose: "driver" }      // Old casing (backward compatibility)
 * { driver_id: "DRV000001", purpose: "driver" }     // Alternative format
 * { id: "DRV000001", purpose: "driver" }            // Generic format
 */
const extractDriverId = (req: Request): string | null => {
  const driver = (req as any).driver;
  
  if (!driver) {
    console.warn('⚠️  No driver object found in request');
    return null;
  }
  
  // Try multiple possible field names (including old typo 'driverID' for backward compatibility)
  const driverId = driver.driverId || driver.driverID || driver.driver_id || driver.id;
  
  if (!driverId) {
    console.error('❌ Could not extract driverId from JWT payload:', JSON.stringify(driver));
  }
  
  return driverId || null;
};

// ─── STEP 9 — GET /api/driver/orders/available ──────────────────────────────
export const getAvailableOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

    const response = await getAvailableOrders({ page, limit, sortOrder });

    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── STEP 10 — POST /api/driver/orders/:order_id/accept ─────────────────────
export const acceptOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;
    const driverId = extractDriverId(req);

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const response = await acceptOrder({ orderId: order_id, driverId });

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message === "Order not found"
      ? HttpStatusCode.NOT_FOUND
      : HttpStatusCode.BAD_REQUEST;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── STEP 11 — PUT /api/driver/orders/:order_id/pickup ──────────────────────
export const pickupOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;
    const driverId = extractDriverId(req);

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const response = await pickupOrder({ orderId: order_id, driverId });

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message.includes("not assigned to you")
      ? HttpStatusCode.FORBIDDEN
      : response.message === "Order not found"
      ? HttpStatusCode.NOT_FOUND
      : HttpStatusCode.BAD_REQUEST;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── STEP 12 — PUT /api/driver/orders/:order_id/deliver ─────────────────────
export const deliverOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;
    const driverId = extractDriverId(req);

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const response = await deliverOrder({ orderId: order_id, driverId });

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message.includes("not assigned to you") ||
        response.message.includes("not found or not assigned")
      ? HttpStatusCode.FORBIDDEN
      : HttpStatusCode.BAD_REQUEST;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/driver/my-orders ───────────────────────────────────────────────
export const getDriverOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = extractDriverId(req);

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || "active";
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

    const response = await getDriverOrders({
      driverId,
      page,
      limit,
      status,
      sortOrder,
    });

    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/driver/orders/:order_id ────────────────────────────────────────
export const getOrderDetailsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;
    const driverId = extractDriverId(req);

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const response = await getOrderDetails(order_id, driverId);

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message === "Order not found"
      ? HttpStatusCode.NOT_FOUND
      : response.message === "This order is not assigned to you"
      ? HttpStatusCode.FORBIDDEN
      : HttpStatusCode.BAD_REQUEST;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/driver/earnings ────────────────────────────────────────────────
export const getDriverEarningsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = extractDriverId(req);

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const response = await getDriverEarnings({ driverId });

    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/driver/history ─────────────────────────────────────────────────
export const getDriverHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = extractDriverId(req);

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

    const response = await getDriverHistory({
      driverId,
      page,
      limit,
      sortOrder,
    });

    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/driver/orders/:order_id/cancel ────────────────────────────────
export const cancelAssignedOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;
    const driverId = extractDriverId(req);
    const { cancellationReason } = req.body;

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    const response = await cancelAssignedOrder({
      orderId: order_id,
      driverId,
      cancellationReason,
    });

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message === "Order not found"
      ? HttpStatusCode.NOT_FOUND
      : response.message.includes("not assigned to you")
      ? HttpStatusCode.FORBIDDEN
      : HttpStatusCode.BAD_REQUEST;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/driver/orders/:order_id/return ─────────────────────────────────
export const returnOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;
    const driverId = extractDriverId(req);
    const { returnReason } = req.body;

    if (!driverId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Driver not authenticated",
        code: "UNAUTHORIZED",
        result: null,
      });
      return;
    }

    if (!returnReason || returnReason.trim() === "") {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Return reason is required",
        code: "BAD_REQUEST",
        result: null,
      });
      return;
    }

    const response = await returnOrder({
      orderId: order_id,
      driverId,
      returnReason,
    });

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message.includes("not found")
      ? HttpStatusCode.NOT_FOUND
      : HttpStatusCode.BAD_REQUEST;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};