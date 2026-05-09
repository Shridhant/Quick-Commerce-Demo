import { Request, Response } from "express";
import {
  fetchDashboardOverview,
  fetchOrderAnalytics,
  fetchRevenueAnalytics,
  fetchProductPerformance,
  fetchVendorPerformance,
  fetchCategoryPerformance,
  fetchInventoryAnalytics,
  fetchUserGrowthAnalyticsNew,
  fetchGeographicAnalytics
} from "../Services/AnalyticsService";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";

// Dashboard Overview
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const overview = await fetchDashboardOverview();
    res.status(HttpStatusCode.OK).json(overview);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch dashboard overview" });
  }
};

// Order Analytics
export const getOrderAnalytics = async (req: Request, res: Response) => {
    try {
      const { period = '30', startDate, endDate } = req.query;
      const analytics = await fetchOrderAnalytics(
        period as string,
        startDate as string,
        endDate as string
      );
      res.status(HttpStatusCode.OK).json(analytics);
    } catch (error) {
      throw error;
    }
  };

// Revenue Analytics
export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = "30", groupBy = "day" } = req.query;
    const analytics = await fetchRevenueAnalytics(String(period), String(groupBy));
    res.status(HttpStatusCode.OK).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch revenue analytics" });
  }
};

// Product Performance
export const getProductPerformance = async (req: Request, res: Response) => {
  try {
    const { limit = "10", period = "30" } = req.query;
    const analytics = await fetchProductPerformance(parseInt(limit as any), String(period));
    res.status(HttpStatusCode.OK).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch product performance" });
  }
};

// Vendor Performance
export const getVendorPerformance = async (req: Request, res: Response) => {
  try {
    const { limit = "10", period = "30" } = req.query;
    const analytics = await fetchVendorPerformance(parseInt(limit as any), String(period));
    res.status(HttpStatusCode.OK).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch vendor performance" });
  }
};

// Category Performance
export const getCategoryPerformance = async (req: Request, res: Response) => {
  try {
    const { period = "30" } = req.query;
    const analytics = await fetchCategoryPerformance(String(period));
    res.status(HttpStatusCode.OK).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch category performance" });
  }
};

// Inventory Analytics
export const getInventoryAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await fetchInventoryAnalytics();
    res.status(HttpStatusCode.OK).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch inventory analytics" });
  }
};

// User Growth Analytics
export const getUserGrowthAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = "90", userType = "all" } = req.query;
    const analytics = await fetchUserGrowthAnalyticsNew(String(period), String(userType));
    res.status(HttpStatusCode.OK).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch user growth analytics" });
  }
};

// Geographic Analytics
export const getGeographicAnalytics = async (req: Request, res: Response) => {
  try {
    const { level = "city", period = "30" } = req.query;
    const analytics = await fetchGeographicAnalytics(String(level), String(period));
    res.status(HttpStatusCode.OK).json(analytics);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch geographic analytics" });
  }
};
