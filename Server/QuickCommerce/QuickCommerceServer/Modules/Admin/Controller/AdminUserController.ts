import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import express, { Request, Response, NextFunction } from "express";
import { userListing, getCustomerAnalytics,getCustomerOrders,getRecentOrders,getUserDetails, getAllOrders } from "../Services/AdminUserService";

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
  
      const response = await userListing(page, limit);
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerId } = req.params;
  
      const response = await getUserDetails(customerId);
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await getCustomerAnalytics();
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  export const getOrderHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
  
      const response = await getCustomerOrders(customerId, page, limit);
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  export const getRecentOrdersList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
  
      const response = await getRecentOrders(limit);
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  export const getAllOrdersList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const orderStatus = req.query.orderStatus as string;
      const paymentStatus = req.query.paymentStatus as string;
      const customerId = req.query.customerId as string;
      const sortBy = (req.query.sortBy as string) || 'created_at';
      const sortOrder = (req.query.sortOrder as string) || 'DESC';
      const searchTerm = req.query.search as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
  
      const response = await getAllOrders({
        page,
        limit,
        orderStatus,
        paymentStatus,
        customerId,
        sortBy,
        sortOrder,
        searchTerm,
        startDate,
        endDate
      });
  
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
