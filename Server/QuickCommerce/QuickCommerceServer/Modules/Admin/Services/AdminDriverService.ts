import pool from "../../StandardConfig/MySqlDbConfig";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { AppError } from "../../../StandardUtility/AppError";

// Constants
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const UPLOADS_PATH = "/uploads/drivers";

// Helper function to transform driver URLs
const transformDriverUrls = (driver: any) => ({
  ...driver,
  vehicle_image: driver.vehicle_image
    ? `${BASE_URL}${UPLOADS_PATH}/${driver.vehicle_image}`
    : null,
  driving_license_file: driver.driving_license_file
    ? `${BASE_URL}${UPLOADS_PATH}/${driver.driving_license_file}`
    : null,
});

// ============================================
// FETCH DRIVERS WITH FLEXIBLE FILTERING
// ============================================
export const fetchDrivers = async (
  filters: {
    status?: string;
    documentVerified?: boolean;
    isActive?: boolean;
  } = {},
  page: number = 1,
  limit: number = 10
) => {
  // Validate pagination
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10; // Max 100 per page

  const connection = await pool.getConnection();
  try {
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (filters.status) {
      whereConditions.push("status = ?");
      queryParams.push(filters.status);
    }

    if (filters.documentVerified !== undefined) {
      whereConditions.push("isDocumentVerified = ?");
      queryParams.push(filters.documentVerified);
    }

    if (filters.isActive !== undefined) {
      whereConditions.push("isActive = ?");
      queryParams.push(filters.isActive);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Fetch drivers (includes remarks field)
    const query = `
      SELECT * FROM driver 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query<RowDataPacket[]>(query, [
      ...queryParams,
      limit,
      offset,
    ]);

    // Get total count
    const countQuery = `SELECT COUNT(*) AS total FROM driver ${whereClause}`;
    const [totalResult] = await connection.query<RowDataPacket[]>(
      countQuery,
      queryParams
    );

    const totalCount = totalResult[0]?.total || 0;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;

    // Transform URLs for all drivers
    const transformedRows = rows.map(transformDriverUrls);

    return {
      success: true,
      message: "Drivers Fetched Successfully",
      code: CustomCode.SuccessCode,
      result: transformedRows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

// ============================================
// FETCH SINGLE DRIVER DETAILS
// ============================================
export const fetchDriverDetails = async (driverId: string) => {
  const connection = await pool.getConnection();
  try {
    const query = `SELECT * FROM driver WHERE driver_id = ?`;
    const [rows] = await connection.query<RowDataPacket[]>(query, [driverId]);

    if (rows.length === 0) {
      throw new AppError(
        "Driver not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    // Transform URLs (remarks will be included automatically)
    const driver = transformDriverUrls(rows[0]);

    return {
      success: true,
      message: "Driver Details Fetched Successfully",
      code: CustomCode.SuccessCode,
      result: driver,
    };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

// ============================================
// VERIFY DRIVER DOCUMENTS
// ============================================
export const verifyDriverDocuments = async (
  driverId: string,
  adminId: string,
  remarks?: string
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check driver exists and get details
    const [driverCheck] = await connection.query<RowDataPacket[]>(
      `SELECT driver_id, name, isDocumentVerified, isDocumentUploaded 
       FROM driver WHERE driver_id = ?`,
      [driverId]
    );

    if (driverCheck.length === 0) {
      throw new AppError(
        "Driver not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    const driver = driverCheck[0];

    if (!driver.isDocumentUploaded) {
      throw new AppError(
        "Driver documents not uploaded yet",
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    }

    if (driver.isDocumentVerified) {
      throw new AppError(
        "Driver documents already verified",
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    }

    // Prepare verification remarks
    const verificationRemarks = remarks || `Documents verified by admin on ${new Date().toISOString()}`;

    // Update driver verification status with remarks
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE driver 
       SET isDocumentVerified = ?, status = ?, isActive = ?, remarks = ?
       WHERE driver_id = ?`,
      [true, "ACTIVE", true, verificationRemarks, driverId]
    );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Failed to verify driver documents",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        CustomCode.ServerErrorCode
      );
    }

    await connection.commit();

    return {
      success: true,
      message: `Driver ${driver.name} documents verified successfully`,
      code: CustomCode.SuccessCode,
      result: {
        driverId,
        driverName: driver.name,
        verifiedBy: adminId,
        verifiedAt: new Date().toISOString(),
        remarks: verificationRemarks,
      },
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ============================================
// REJECT DRIVER DOCUMENTS
// ============================================
export const rejectDriverDocuments = async (
  driverId: string,
  adminId: string,
  rejectionReason?: string
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check driver exists
    const [driverCheck] = await connection.query<RowDataPacket[]>(
      `SELECT driver_id, name, isDocumentVerified FROM driver WHERE driver_id = ?`,
      [driverId]
    );

    if (driverCheck.length === 0) {
      throw new AppError(
        "Driver not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    const driver = driverCheck[0];

    if (driver.isDocumentVerified) {
      throw new AppError(
        "Cannot reject already verified documents",
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    }

    // Prepare rejection remarks
    const rejectionRemarks = rejectionReason 
      ? `REJECTED: ${rejectionReason} (by admin on ${new Date().toISOString()})`
      : `REJECTED: No reason provided (by admin on ${new Date().toISOString()})`;

    // Update driver status to rejected with remarks
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE driver 
       SET isDocumentVerified = ?, status = ?, isActive = ?, remarks = ?
       WHERE driver_id = ?`,
      [false, "REJECTED", false, rejectionRemarks, driverId]
    );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Failed to reject driver documents",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        CustomCode.ServerErrorCode
      );
    }

    await connection.commit();

    return {
      success: true,
      message: `Driver ${driver.name} documents rejected`,
      code: CustomCode.SuccessCode,
      result: {
        driverId,
        driverName: driver.name,
        rejectedBy: adminId,
        rejectionReason: rejectionReason || "No reason provided",
        rejectedAt: new Date().toISOString(),
        remarks: rejectionRemarks,
      },
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ============================================
// CHANGE DRIVER STATUS
// ============================================
export const changeDriverStatus = async (
  driverId: string,
  newStatus: string,
  adminId: string,
  remarks?: string
) => {
  // Validate status
  const validStatuses = ["ACTIVE", "INACTIVE", "PENDING", "REJECTED"];
  if (!validStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      HttpStatusCode.BAD_REQUEST,
      CustomCode.BadRequestCode
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check driver exists
    const [driverCheck] = await connection.query<RowDataPacket[]>(
      `SELECT driver_id, name, status FROM driver WHERE driver_id = ?`,
      [driverId]
    );

    if (driverCheck.length === 0) {
      throw new AppError(
        "Driver not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    const driver = driverCheck[0];

    if (driver.status === newStatus) {
      throw new AppError(
        `Driver is already ${newStatus.toLowerCase()}`,
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    }

    // Prepare status change remarks
    const statusRemarks = remarks 
      ? `Status changed from ${driver.status} to ${newStatus}: ${remarks} (by admin on ${new Date().toISOString()})`
      : `Status changed from ${driver.status} to ${newStatus} (by admin on ${new Date().toISOString()})`;

    // Update driver status with remarks
    const isActive = newStatus === "ACTIVE";
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE driver 
       SET status = ?, isActive = ?, remarks = ?
       WHERE driver_id = ?`,
      [newStatus, isActive, statusRemarks, driverId]
    );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Failed to update driver status",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        CustomCode.ServerErrorCode
      );
    }

    await connection.commit();

    return {
      success: true,
      message: `Driver status updated to ${newStatus.toLowerCase()} successfully`,
      code: CustomCode.SuccessCode,
      result: {
        driverId,
        driverName: driver.name,
        oldStatus: driver.status,
        newStatus,
        updatedBy: adminId,
        updatedAt: new Date().toISOString(),
        remarks: statusRemarks,
      },
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ============================================
// UPDATE DRIVER REMARKS ONLY
// ============================================
export const updateDriverRemarks = async (
  driverId: string,
  remarks: string,
  adminId: string
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check driver exists
    const [driverCheck] = await connection.query<RowDataPacket[]>(
      `SELECT driver_id, name FROM driver WHERE driver_id = ?`,
      [driverId]
    );

    if (driverCheck.length === 0) {
      throw new AppError(
        "Driver not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    const driver = driverCheck[0];

    // Update remarks
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE driver SET remarks = ? WHERE driver_id = ?`,
      [remarks, driverId]
    );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Failed to update driver remarks",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        CustomCode.ServerErrorCode
      );
    }

    await connection.commit();

    return {
      success: true,
      message: "Driver remarks updated successfully",
      code: CustomCode.SuccessCode,
      result: {
        driverId,
        driverName: driver.name,
        remarks,
        updatedBy: adminId,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ============================================
// GET DRIVER ANALYTICS
// ============================================
export const getDriverAnalytics = async (driverId: string, startDate?: string, endDate?: string) => {
  const connection = await pool.getConnection();
  try {
    // Check driver exists
    const [driverCheck] = await connection.query<RowDataPacket[]>(
      `SELECT driver_id, name FROM driver WHERE driver_id = ?`,
      [driverId]
    );

    if (driverCheck.length === 0) {
      throw new AppError(
        "Driver not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    const driver = driverCheck[0];

    let dateFilterDelivered = "";
    let dateFilterPickedUp = "";
    const dateParams: any[] = [];
    
    if (startDate && endDate) {
      dateFilterDelivered = " AND DATE(od.delivered_at) >= ? AND DATE(od.delivered_at) <= ?";
      dateFilterPickedUp = " AND DATE(od.picked_up_at) >= ? AND DATE(od.picked_up_at) <= ?";
      dateParams.push(startDate, endDate);
    }

    // Total deliveries completed
    const [deliveryStats] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_deliveries
       FROM customer_order_deliveries od
       WHERE od.driver_id = ? AND od.delivery_status = 'DELIVERED'` + dateFilterDelivered,
      [driverId, ...dateParams]
    );

    // Total orders assigned (accepted)
    const [assignedStats] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_assigned
       FROM customer_order_deliveries od
       WHERE od.driver_id = ?` + 
       (startDate && endDate ? " AND DATE(od.created_at) >= ? AND DATE(od.created_at) <= ?" : ""),
      startDate && endDate ? [driverId, startDate, endDate] : [driverId]
    );

    // Cancelled orders by driver
    const [cancelledStats] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_cancelled
       FROM customer_order_deliveries od
       WHERE od.driver_id = ? AND od.delivery_status = 'CANCELLED'` + 
       (startDate && endDate ? " AND DATE(od.created_at) >= ? AND DATE(od.created_at) <= ?" : ""),
      startDate && endDate ? [driverId, startDate, endDate] : [driverId]
    );

    // Average delivery time (from pickup to delivery)
    const [avgTimeStats] = await connection.query<RowDataPacket[]>(
      `SELECT 
         AVG(TIMESTAMPDIFF(MINUTE, od.picked_up_at, od.delivered_at)) as avg_delivery_time_minutes
       FROM customer_order_deliveries od
       WHERE od.driver_id = ? 
         AND od.delivery_status = 'DELIVERED'
         AND od.picked_up_at IS NOT NULL 
         AND od.delivered_at IS NOT NULL` + dateFilterDelivered,
      [driverId, ...dateParams]
    );

    // Total earnings (sum of delivered orders)
    const [earningsStats] = await connection.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(co.total_amount), 0) as total_earnings
       FROM customer_orders co
       INNER JOIN customer_order_deliveries od ON co.order_id = od.order_id
       WHERE od.driver_id = ? AND od.delivery_status = 'DELIVERED'` + dateFilterDelivered,
      [driverId, ...dateParams]
    );

    // This month's performance
    const [monthStats] = await connection.query<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as deliveries_this_month,
         COALESCE(SUM(co.total_amount), 0) as earnings_this_month
       FROM customer_orders co
       INNER JOIN customer_order_deliveries od ON co.order_id = od.order_id
       WHERE od.driver_id = ? 
         AND od.delivery_status = 'DELIVERED'
         AND MONTH(od.delivered_at) = MONTH(CURDATE())
         AND YEAR(od.delivered_at) = YEAR(CURDATE())`,
      [driverId]
    );

    const totalAssigned = assignedStats[0]?.total_assigned || 0;
    const totalDelivered = deliveryStats[0]?.total_deliveries || 0;
    const totalCancelled = cancelledStats[0]?.total_cancelled || 0;
    const avgDeliveryTime = avgTimeStats[0]?.avg_delivery_time_minutes || 0;
    const totalEarnings = parseFloat(earningsStats[0]?.total_earnings) || 0;
    const deliveriesThisMonth = monthStats[0]?.deliveries_this_month || 0;
    const earningsThisMonth = parseFloat(monthStats[0]?.earnings_this_month) || 0;

    // Calculate acceptance/completion rate
    const completionRate = totalAssigned > 0 
      ? ((totalDelivered / totalAssigned) * 100).toFixed(2) 
      : "0.00";
    const cancellationRate = totalAssigned > 0 
      ? ((totalCancelled / totalAssigned) * 100).toFixed(2) 
      : "0.00";

    return {
      success: true,
      message: "Driver analytics fetched successfully",
      code: CustomCode.SuccessCode,
      result: {
        driverId,
        driverName: driver.name,
        lifetime: {
          totalDeliveries: totalDelivered,
          totalAssigned: totalAssigned,
          totalCancelled: totalCancelled,
          completionRate: `${completionRate}%`,
          cancellationRate: `${cancellationRate}%`,
          totalEarnings: totalEarnings,
          avgDeliveryTimeMinutes: Math.round(avgDeliveryTime),
        },
        thisMonth: {
          deliveries: deliveriesThisMonth,
          earnings: earningsThisMonth,
        },
      },
    };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

// ============================================
// GET DRIVER PAYOUT HISTORY
// ============================================
// Note: This is a placeholder implementation since there's no payout/wallet table in the schema
// In a production system, you would have a separate payouts table tracking:
// - payout_id, driver_id, amount, payment_method, status, created_at, etc.
export const getDriverPayoutHistory = async (
  driverId: string,
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
) => {
  const connection = await pool.getConnection();
  try {
    // Check driver exists
    const [driverCheck] = await connection.query<RowDataPacket[]>(
      `SELECT driver_id, name FROM driver WHERE driver_id = ?`,
      [driverId]
    );

    if (driverCheck.length === 0) {
      throw new AppError(
        "Driver not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    // Since there's no payout table in the schema, we'll return delivery-based earnings
    // In production, replace this with actual payout records
    const offset = (page - 1) * limit;

    let dateFilter = "";
    const queryParamsCount: any[] = [driverId];
    const queryParamsData: any[] = [driverId];

    if (startDate && endDate) {
      dateFilter = " AND DATE(od.delivered_at) >= ? AND DATE(od.delivered_at) <= ?";
      queryParamsCount.push(startDate, endDate);
      queryParamsData.push(startDate, endDate);
    }
    queryParamsData.push(limit, offset);

    const [countResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM customer_order_deliveries od
       WHERE od.driver_id = ? AND od.delivery_status = 'DELIVERED'` + dateFilter,
      queryParamsCount
    );
    const totalRecords = countResult[0].total;

    // Get delivered orders as a proxy for "payouts"
    const [payoutRecords] = await connection.query<RowDataPacket[]>(
      `SELECT 
         od.delivery_id,
         od.order_id,
         co.total_amount as earning_amount,
         od.delivered_at as payout_date,
         'COMPLETED' as status,
         CONCAT('Delivery #', od.order_id) as description
       FROM customer_order_deliveries od
       INNER JOIN customer_orders co ON od.order_id = co.order_id
       WHERE od.driver_id = ? AND od.delivery_status = 'DELIVERED'
       ${dateFilter}
       ORDER BY od.delivered_at DESC
       LIMIT ? OFFSET ?`,
      queryParamsData
    );

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      success: true,
      message: "Driver payout history fetched successfully",
      code: CustomCode.SuccessCode,
      result: {
        driverId,
        payouts: payoutRecords,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          limit,
        },
        note: "This is based on delivery records. Implement a dedicated payouts table for production.",
      },
    };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};