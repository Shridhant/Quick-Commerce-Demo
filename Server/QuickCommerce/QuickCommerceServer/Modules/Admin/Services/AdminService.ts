import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../StandardConfig/MySqlDbConfig";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES, TOKEN_EXPIRES_IN } from "../../StandardConfig/SettingsReader";
import jwt from "jsonwebtoken";
import { AppError } from "../../../StandardUtility/AppError";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { CustomCode } from "../../../StandardUtility/CustomCode";



export const adminLogin = async (email: string, password: string) => {
  const connection = await pool.getConnection();
  try {
    const query = `
            SELECT * FROM system_user 
            WHERE email = ? AND password = ?
        `;
    const [rows] = await connection.query<RowDataPacket[]>(query, [
      email,
      password,
    ]);

    if (rows.length === 0) {
      throw new AppError(
        "Invalid email or password",
        HttpStatusCode.UNAUTHORIZED,
        CustomCode.UnauthorizedCode
      );
    }

    const user = rows[0];

    const payload = {
      adminId: user.admin_id,
      name: user.name,
      role: user.role,
      email: user.email,
      assignedWarehouse: user.assigned_warehouse || null,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ adminId: user.admin_id, email: user.email });

    if (!accessToken || !refreshToken) {
      throw new AppError(
        "Error generating tokens",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        CustomCode.ServerErrorCode
      );
    }

    return {
      adminId: user.admin_id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedWarehouse: user.assigned_warehouse || null,
      accessToken,
      refreshToken,
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const generateAccessToken = (payload: any): string => {
  const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: (TOKEN_EXPIRES_IN || "1h") as jwt.SignOptions["expiresIn"],
  });
  return token;
};

const generateRefreshToken = (payload: any): string => {
  const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: (REFRESH_TOKEN_EXPIRES || "7d") as jwt.SignOptions["expiresIn"],
  });
  return token;
};

/**
 * Verify a refresh token and issue a new access + refresh token pair.
 */
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
      adminId: number;
      email: string;
    };

    // Re-fetch the user from DB so the new access token has fresh data
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT admin_id, name, role, email, assigned_warehouse FROM system_user WHERE admin_id = ? AND email = ?`,
      [decoded.adminId, decoded.email]
    );

    if (rows.length === 0) {
      throw new AppError(
        "User no longer exists",
        HttpStatusCode.UNAUTHORIZED,
        CustomCode.UnauthorizedCode
      );
    }

    const user = rows[0];

    const accessPayload = {
      adminId: user.admin_id,
      name: user.name,
      role: user.role,
      email: user.email,
      assignedWarehouse: user.assigned_warehouse || null,
    };

    const newAccessToken = generateAccessToken(accessPayload);
    const newRefreshToken = generateRefreshToken({ adminId: user.admin_id, email: user.email });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        adminId: user.admin_id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedWarehouse: user.assigned_warehouse || null,
      },
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "Invalid or expired refresh token",
      HttpStatusCode.UNAUTHORIZED,
      CustomCode.UnauthorizedCode
    );
  }
};





export const createAdmin = async (
  name: string,
  email: string,
  assigned_warehouse: string | null,
  password: string
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const query = `
            INSERT INTO system_user ( name, email, assigned_warehouse ,password)
            VALUES (?, ?, ?, ?)
        `;
    const [result] = await connection.query<ResultSetHeader>(query, [
      name,
      email,
      assigned_warehouse,
      password,
    ]);

    await connection.commit();
    if (result?.affectedRows > 0) {
      return { success: true, message: "Admin created successfully" };
    }

    return { success: false, message: "Failed Adding Admin" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const adminListing = async () => {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM system_user where role = 'ADMIN'`,
    );
    return {
      success: true,
      message: "Data Fetched Successfully",
      code: CustomCode.SuccessCode,
      result,
    };
  } catch (err) {
    throw err;
  }
};

export const getAdminById = async (adminId: string) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT admin_id, name, role, email, assigned_warehouse, created_at FROM system_user WHERE admin_id = ?`,
      [adminId]
    );
    if (rows.length === 0) {
      throw new AppError("Admin not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
    }
    return { success: true, message: "Data Fetched Successfully", result: rows[0] };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

export const updateAdmin = async (
  adminId: string,
  name?: string,
  email?: string,
  password?: string
) => {
  const connection = await pool.getConnection();
  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (name) { fields.push("name = ?"); values.push(name); }
    if (email) { fields.push("email = ?"); values.push(email); }
    if (password) { fields.push("password = ?"); values.push(password); }

    if (fields.length === 0) {
      throw new AppError("No fields to update", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);
    }

    values.push(adminId);
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE system_user SET ${fields.join(", ")} WHERE admin_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new AppError("Admin not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
    }
    return { success: true, message: "Admin updated successfully" };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

export const deleteAdmin = async (adminId: string) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `DELETE FROM system_user WHERE admin_id = ? AND role = 'ADMIN'`,
      [adminId]
    );
    if (result.affectedRows === 0) {
      throw new AppError("Admin not found or cannot be deleted", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
    }
    return { success: true, message: "Admin deleted successfully" };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

export const updateAdminRole = async (adminId: string, role: string) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE system_user SET role = ? WHERE admin_id = ?`,
      [role, adminId]
    );
    if (result.affectedRows === 0) {
      throw new AppError("Admin not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
    }
    return { success: true, message: "Admin role updated successfully" };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * PATCH /admins/:adminId/warehouse
 * Assign (or clear) a warehouse for an admin.
 * Pass warehouseId = null to remove the assignment.
 * Only regular ADMINs can have a warehouse assigned;
 * SUPER_ADMINs are blocked at the service level.
 */
export const assignWarehouse = async (
  adminId: string,
  warehouseId: string | null
) => {
  const connection = await pool.getConnection();
  try {
    // 1. Guard: fetch the target admin
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT admin_id, role FROM system_user WHERE admin_id = ?`,
      [adminId]
    );

    if (rows.length === 0) {
      throw new AppError("Admin not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
    }

    if (rows[0].role === "SUPER_ADMIN") {
      throw new AppError(
        "Cannot assign a warehouse to a SUPER_ADMIN account",
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      );
    }

    // 2. If a warehouseId is provided, verify the warehouse exists
    if (warehouseId) {
      const [wh] = await connection.query<RowDataPacket[]>(
        `SELECT warehouse_id FROM warehouse WHERE warehouse_id = ?`,
        [warehouseId]
      );
      if (wh.length === 0) {
        throw new AppError("Warehouse not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
      }
    }

    // 3. Update
    await connection.query<ResultSetHeader>(
      `UPDATE system_user SET assigned_warehouse = ? WHERE admin_id = ?`,
      [warehouseId, adminId]
    );

    return {
      success: true,
      message: warehouseId
        ? `Warehouse ${warehouseId} assigned to admin ${adminId}`
        : `Warehouse assignment removed for admin ${adminId}`,
    };
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};
