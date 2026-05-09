
import { NextFunction, Request, Response } from "express";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import {
 
  createWarehouse,
 
  getRecentWarehouseOrders,
 
  getWarehouseAnalyticsData,
 
  warehouseListing,
} from "../Services/AdminWarehouseService";
import { AppError } from "../../../StandardUtility/AppError";
import { CustomCode } from "../../../StandardUtility/CustomCode";

import {

  StandardStatus,
} from "../../../StandardUtility/StatusEnum";


export const addWarehouse = async (req: Request, res: Response) => {
    const {
      name,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      latitude,
      longitude,
    } = req.body;
    try {
      const response = await createWarehouse(
        name,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        latitude,
        longitude
      );
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  };
  
  export const fetchWarehouses = async (req: Request, res: Response) => {
    const { status } = req.query;
  
    if (!status)
      throw new AppError(
        `status query field is required`,
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
  
    if (status !== StandardStatus.ACTIVE && status !== StandardStatus.INACTIVE)
      throw new AppError(
        `status must be ACTIVE/INACTIVE`,
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    try {
      const response = await warehouseListing(status);
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  };
  export const getWarehouseAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const warehouseId = req.query.warehouse_id as string;
      const response = await getWarehouseAnalyticsData(warehouseId);
      
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  export const getRecentWarehouseActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const warehouseId = req.query.warehouse_id as string;
      
      const response = await getRecentWarehouseOrders(limit, warehouseId);
      
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
  