
import pool from "../../StandardConfig/MySqlDbConfig";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { StandardStatus } from "../../../StandardUtility/StatusEnum";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const fetchVendorListing = async (
  status?: string,
  documentVerified?: number,
  page: number = 1,
  limit: number = 15
) => {
  const connection = await pool.getConnection();
  try {
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (documentVerified !== undefined) {
      conditions.push('isDocumentVerified = ?');
      params.push(documentVerified);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Fetch vendors
    const query = `
      SELECT * FROM vendors 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query<RowDataPacket[]>(query, [
      ...params,
      limit,
      offset,
    ]);

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total FROM vendors 
      ${whereClause}
    `;

    const [totalVendorsResult] = await connection.query<RowDataPacket[]>(
      countQuery,
      params
    );

    const totalVendorsCount = totalVendorsResult[0]?.total || 0;
    const totalPages = Math.ceil(totalVendorsCount / limit);

    return {
      success: true,
      message: "Vendors Fetched Successfully",
      code: CustomCode.SuccessCode,
      result: rows,
      totalVendorsCount,
      totalPages,
      currentPage: page,
      filters: {
        status: status || 'all',
        documentVerified: documentVerified !== undefined ? documentVerified : 'all'
      }
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};




export const verifyVendor = async (vendorId: string, remarks?: string) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // First, check if vendor exists
      const [vendorCheck] = await connection.query<RowDataPacket[]>(
        `SELECT vendor_id, status, isDocumentVerified FROM vendors WHERE vendor_id = ?`,
        [vendorId]
      );

      if (vendorCheck.length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: "Vendor not found",
          code: CustomCode.NotFoundCode,
        };
      }

      // Update vendor verification status with remarks
      const verifyQuery = `
        UPDATE vendors 
        SET isDocumentVerified = ?, 
            status = ?, 
            remarks = ?,
            isActive = ?
        WHERE vendor_id = ?
      `;
  
      const [isUpdated] = await connection.execute<ResultSetHeader>(verifyQuery, [
        true,
        StandardStatus.ACTIVE,
        remarks || 'Document verified and approved by admin',
        true,
        vendorId,
      ]);
  
      if (isUpdated.affectedRows > 0) {
        await connection.commit();
        return {
          success: true,
          message: "Vendor has been verified successfully.",
          code: CustomCode.SuccessCode,
        };
      }
      
      await connection.rollback();
      return {
        success: false,
        message: "Vendor verification failed",
        code: CustomCode.ServerErrorCode,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };


// ─────────────────────────────────────────────────────────────
// GET SINGLE VENDOR BY ID
// ─────────────────────────────────────────────────────────────
export const getVendorById = async (vendorId: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM vendors WHERE vendor_id = ?`,
    [vendorId]
  );

  if (rows.length === 0) {
    return {
      success: false,
      message: "Vendor not found",
      code: CustomCode.NotFoundCode,
    };
  }

  return {
    success: true,
    message: "Vendor fetched successfully",
    code: CustomCode.SuccessCode,
    result: rows[0],
  };
};


// ─────────────────────────────────────────────────────────────
// CREATE VENDOR (Admin-created)
// ─────────────────────────────────────────────────────────────
export const createVendor = async (
  data: {
    name: string;
    business_owner_name?: string;
    email?: string;
    phone: string;
    password?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    gstId?: string;
    is_company_vendor?: boolean;
    remarks?: string;
  },
  createdBy: string
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const vendorId = `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await connection.query<ResultSetHeader>(
      `INSERT INTO vendors 
        (vendor_id, vendor_type, created_by, is_company_vendor, business_owner_name, 
         name, password, email, phone, 
         address_line1, address_line2, city, state, postal_code, country, 
         latitude, longitude, gstId, status, isActive, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendorId,
        'ADMIN_CREATED',
        createdBy,
        data.is_company_vendor ? 1 : 0,
        data.business_owner_name ?? null,
        data.name,
        data.password ?? null,
        data.email ?? null,
        data.phone,
        data.address_line1 ?? null,
        data.address_line2 ?? null,
        data.city ?? null,
        data.state ?? null,
        data.postal_code ?? null,
        data.country ?? null,
        data.latitude ?? null,
        data.longitude ?? null,
        data.gstId ?? null,
        StandardStatus.PENDING,
        0,
        data.remarks ?? null,
      ]
    );

    await connection.commit();
    return {
      success: true,
      message: "Vendor created successfully",
      code: CustomCode.SuccessCode,
      vendorId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


// ─────────────────────────────────────────────────────────────
// UPDATE VENDOR
// ─────────────────────────────────────────────────────────────
export const updateVendor = async (
  vendorId: string,
  data: {
    name?: string;
    business_owner_name?: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    gstId?: string;
    is_company_vendor?: boolean;
    remarks?: string;
  }
) => {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields: (keyof typeof data)[] = [
    "name", "business_owner_name", "email", "phone",
    "address_line1", "address_line2", "city", "state", "postal_code", "country",
    "latitude", "longitude", "gstId", "is_company_vendor", "remarks",
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    return {
      success: false,
      message: "No fields to update",
      code: CustomCode.BadRequestCode,
    };
  }

  values.push(vendorId);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE vendors SET ${fields.join(", ")} WHERE vendor_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return {
      success: false,
      message: "Vendor not found",
      code: CustomCode.NotFoundCode,
    };
  }

  return { success: true, message: "Vendor updated successfully", code: CustomCode.SuccessCode };
};


// ─────────────────────────────────────────────────────────────
// TOGGLE VENDOR STATUS (isActive)
// ─────────────────────────────────────────────────────────────
export const toggleVendorStatus = async (vendorId: string, isActive: boolean) => {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE vendors SET isActive = ? WHERE vendor_id = ?`,
    [isActive ? 1 : 0, vendorId]
  );

  if (result.affectedRows === 0) {
    return {
      success: false,
      message: "Vendor not found",
      code: CustomCode.NotFoundCode,
    };
  }

  return {
    success: true,
    message: `Vendor ${isActive ? "activated" : "deactivated"} successfully`,
    code: CustomCode.SuccessCode,
  };
};


// ─────────────────────────────────────────────────────────────
// DELETE VENDOR
// ─────────────────────────────────────────────────────────────
export const deleteVendor = async (vendorId: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM vendors WHERE vendor_id = ?`,
    [vendorId]
  );

  if (result.affectedRows === 0) {
    return {
      success: false,
      message: "Vendor not found",
      code: CustomCode.NotFoundCode,
    };
  }

  return { success: true, message: "Vendor deleted successfully", code: CustomCode.SuccessCode };
};