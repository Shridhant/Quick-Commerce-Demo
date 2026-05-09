import { Response, NextFunction } from 'express';
import { HttpStatusCode } from '../Utils/Constants';
import { AuthenticatedRequest } from '../Middleware/AdminTokenAuthenticator';
import { assignWarehouse } from '../Services/AdminService';
import {
  getAllOrders,
  getAvailableDriversService,
  assignDriverService,
  unassignDriverService,
  getOrderByIdService,
  packOrder,
  markReadyForPickup
} from '../Services/AdminUserOrders';

export const getAllOrdersList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // If the logged-in admin has an assigned warehouse, scope the query to it.
    // SUPER_ADMINs with assignedWarehouse = null see ALL orders.
    const warehouseId = req.admin?.assignedWarehouse ?? undefined;

    const response = await getAllOrders({
      page,
      limit,
      orderStatus:  req.query.orderStatus  as string,
      paymentStatus: req.query.paymentStatus as string,
      customerId:   req.query.customerId   as string,
      sortBy:       (req.query.sortBy       as string) || 'created_at',
      sortOrder:    (req.query.sortOrder    as string) || 'DESC',
      searchTerm:   req.query.search        as string,
      startDate:    req.query.startDate     as string,
      endDate:      req.query.endDate       as string,
      warehouseId,
    });

    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const getAvailableDrivers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await getAvailableDriversService();
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const assignDriverToOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    if (!orderId) {
      res.status(HttpStatusCode.BadRequest).json({
        success: false,
        message: 'Order ID is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (!driverId) {
      res.status(HttpStatusCode.BadRequest).json({
        success: false,
        message: 'Driver ID is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const response = await assignDriverService(orderId, driverId);
    res.status(response.success ? HttpStatusCode.OK : HttpStatusCode.BadRequest).json(response);
  } catch (error) {
    next(error);
  }
};

export const unassignDriverFromOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(HttpStatusCode.BadRequest).json({
        success: false,
        message: 'Order ID is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const response = await unassignDriverService(orderId);
    res.status(response.success ? HttpStatusCode.OK : HttpStatusCode.BadRequest).json(response);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(HttpStatusCode.BadRequest).json({
        success: false,
        message: 'Order ID is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const response = await getOrderByIdService(orderId);
    res.status(response.success ? HttpStatusCode.OK : HttpStatusCode.NotFound).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── STEP 7 — PUT /api/admin/usersorders/:order_id/pack ─────────────────────
export const packOrderHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;

    const response = await packOrder({ orderId: order_id });

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message === 'Order not found'
      ? HttpStatusCode.NotFound
      : HttpStatusCode.BadRequest;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// ─── STEP 8 — PUT /api/admin/usersorders/:order_id/ready ────────────────────
export const markReadyForPickupHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { order_id } = req.params;

    const response = await markReadyForPickup({ orderId: order_id });

    const statusCode = response.success
      ? HttpStatusCode.OK
      : response.message === 'Order not found'
      ? HttpStatusCode.NotFound
      : HttpStatusCode.BadRequest;

    res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};