import {  RowDataPacket } from "mysql2";
import pool from "../../StandardConfig/MySqlDbConfig";
import { ACCESS_TOKEN_SECRET } from "../../StandardConfig/SettingsReader";
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
      role: "ADMIN",
      email: user.email,
      assignedWarehouse: user.assigned_warehouse || null,
    };

    const token = generateToken(payload);
    if (!token) {
      throw new AppError(
        "Error generating Token",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        CustomCode.ServerErrorCode
      );
    }

    return {
      adminId: user.admin_id,
      name: user.name,
      email: user.email,
      token,
      role:user.role
    };
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const generateToken = (payload: any): string => {
  const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "1h", // token expiry
  });
  return token;
};