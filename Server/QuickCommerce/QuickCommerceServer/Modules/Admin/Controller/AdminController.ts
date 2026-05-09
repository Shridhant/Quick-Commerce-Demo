import { Request, Response } from "express";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { AppError } from "../../../StandardUtility/AppError";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { AuthenticatedVendorRequest} from "../Types/VendorPayload"

import { fetchAvailableProductsInventory } from "../Services/WarehouseService";

import {
  approveOrderDetailsAndUpdateInventory,
  fetchIncomingOrderProducts,
  rejectVendorRequestedOrder,
} from "../Services/AdminOrderService";

import {
  OrderStatus, 
} from "../../../StandardUtility/StatusEnum";

import { newApproveOrderDetailsAndUpdateInventory, getOrderPickupDetails } from "../Services/NewAdminOrderService";



export const fetchProductInventory = async (req: AuthenticatedVendorRequest, res: Response) => {

    try {
  
      const { warehouseId } = req.query;
  
      if (!warehouseId) throw new AppError("warehouseId query param is required", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);
  
      let vendorId: string = "";
      if (req.vendor && typeof req.vendor === "object") {
        vendorId = req.vendor.vendorId;
      }
      if (!vendorId) throw new AppError("Vendor ID not Found")
  
      console.log(warehouseId)
  
      const response = await fetchAvailableProductsInventory(vendorId, warehouseId as string);
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  
  }
  
export const approveIncomingOrder = async (req: Request, res: Response) => {
    const { orderId, vendorId, remarks } = req.body;
    try {
      const response = await approveOrderDetailsAndUpdateInventory(
        orderId,
        vendorId,
        remarks
      );
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  };
  
  
  export const fetchAdminOrderProducts = async (req: Request, res: Response) => {
    try {
      const page: any = req.query.page;
      const limit: any = req.query.limit;
  
      const status: any = req.query.status;
  
      const warehouseId: any = req.query.warehouseId;
  
      if (!status)
        throw new AppError(
          `status query field is required`,
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
  
      if (
        status !== OrderStatus.APPROVED &&
        status !== OrderStatus.CANCELLED &&
        status !== OrderStatus.PENDING &&
        status !== OrderStatus.REJECTED &&
        status !== "ALL"
      )
        throw new AppError(
          `status must be APPROVED/CANCELLED/PENDING/REJECTED/ALL`,
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
  
      const parsedPage = parseInt(page) || 1;
  
      const parsedLimit = parseInt(limit) || 10;
  
      const response = await fetchIncomingOrderProducts(
        status,
        parsedLimit,
        parsedPage,
        warehouseId
      );
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  };
  
  export const rejectVendorIncomingOrder = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { orderId, vendorId, remarks } = req.body;
  
      const response = await rejectVendorRequestedOrder(
        orderId,
        vendorId,
        remarks
      );
      res.status(HttpStatusCode.OK).json(response);
    } catch (err) {
      throw err;
    }
  };
  

//New order controller with driver pickup data

export const newApproveOrder = async (req:Request, res:Response) => {
  try {
    const { 
      orderId, 
      vendorId, 
      remarks,
      driverName,
      driverPhone,
      vehicleNumber,
      pickupDate,
      pickupTimeStart,
      pickupTimeEnd,
      pickupNotes
    } = req.body;

    // Validate required fields
    if (!orderId || !vendorId) {
       res.status(400).json({
        success: false,
        message: "orderId and vendorId are required",
        code: CustomCode.BadRequestCode,
      });
    }

    if (!driverName || !driverPhone || !pickupDate || !pickupTimeStart || !pickupTimeEnd) {
       res.status(400).json({
        success: false,
        message: "Driver details and pickup timing are required",
        code: CustomCode.BadRequestCode,
      });
    }

    const pickupDetails = {
      driverName,
      driverPhone,
      vehicleNumber,
      pickupDate,
      pickupTimeStart,
      pickupTimeEnd,
      pickupNotes,
    };

    const result = await newApproveOrderDetailsAndUpdateInventory(
      orderId,
      vendorId,
      remarks,
      pickupDetails
    );

    res.status(200).json(result);
    
  } catch (error) {
    throw(error);
  }
};


export const getPickupDetails = async (req:Request, res:Response) => {
  try {
    const { orderId } = req.params;
    
    const result = await getOrderPickupDetails(orderId );

    res.status(200).json(result);
    
  } catch (error) {
    throw(error);
  }
}