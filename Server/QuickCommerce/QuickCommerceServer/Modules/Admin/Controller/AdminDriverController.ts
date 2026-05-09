import {
  fetchDriverDetails,
  fetchDrivers,
  changeDriverStatus,
  verifyDriverDocuments,
  rejectDriverDocuments,
  updateDriverRemarks,
  getDriverAnalytics,
  getDriverPayoutHistory,
} from "../Services/AdminDriverService";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import express, { Request, Response, NextFunction } from "express";

// ============================================
// GET ALL DRIVERS WITH OPTIONAL FILTERS
// ============================================
export const getDrivers = async (req: Request, res: Response) => {
  const {
    status,
    documentVerified,
    isActive,
    page = "1",
    limit = "10",
  } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    // Parse boolean filters
    const filters: {
      status?: string;
      documentVerified?: boolean;
      isActive?: boolean;
    } = {};

    if (status) filters.status = status as string;
    if (documentVerified !== undefined) {
      filters.documentVerified = documentVerified === "true";
    }
    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }

    const response = await fetchDrivers(filters, pageNum, limitNum);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// GET SINGLE DRIVER DETAILS
// ============================================
export const getDriverDetails = async (req: Request, res: Response) => {
  const { driverId } = req.params;

  try {
    const response = await fetchDriverDetails(driverId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// VERIFY DRIVER DOCUMENTS
// ============================================
export const verifyDriver = async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { remarks } = req.body;

  try {
    const adminId =
      (req as any).admin?.adminId || (req as any).admin?.id || "unknown";

    const response = await verifyDriverDocuments(driverId, adminId, remarks);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// REJECT DRIVER DOCUMENTS
// ============================================
export const rejectDriver = async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { rejectionReason } = req.body;

  try {
    const adminId =
      (req as any).admin?.adminId || (req as any).admin?.id || "unknown";

    const response = await rejectDriverDocuments(
      driverId,
      adminId,
      rejectionReason
    );
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// UPDATE DRIVER STATUS
// ============================================
export const updateDriverStatus = async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { status, remarks } = req.body;

  try {
    if (!status) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Status is required",
        code: "BAD_REQUEST",
      });
      return;
    }

    const adminId =
      (req as any).admin?.adminId || (req as any).admin?.id || "unknown";

    const response = await changeDriverStatus(driverId, status, adminId, remarks);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// UPDATE DRIVER REMARKS ONLY
// ============================================
export const updateRemarks = async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { remarks } = req.body;

  try {
    if (!remarks) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Remarks is required",
        code: "BAD_REQUEST",
      });
      return;
    }

    const adminId =
      (req as any).admin?.adminId || (req as any).admin?.id || "unknown";

    const response = await updateDriverRemarks(driverId, remarks, adminId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// GET DRIVER ANALYTICS
// ============================================
export const getDriverAnalyticsHandler = async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const response = await getDriverAnalytics(driverId, startDate as string, endDate as string);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

// ============================================
// GET DRIVER PAYOUT HISTORY
// ============================================
export const getDriverPayoutHistoryHandler = async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { page = "1", limit = "10", startDate, endDate } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    const response = await getDriverPayoutHistory(driverId, pageNum, limitNum, startDate as string, endDate as string);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};