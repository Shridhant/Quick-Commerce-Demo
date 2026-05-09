
import pool from "../../StandardConfig/MySqlDbConfig";

import { CustomCode } from "../../../StandardUtility/CustomCode";

import { ResultSetHeader, RowDataPacket } from "mysql2";

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
  

export const fetchAvailableProductsInventory = async (vendorId: string, warehouseId: string) => {

    try {

        console.log("inside")
        const query = `SELECT i.*,p.* FROM inventory i JOIN product p on p.product_id = i.product_id  WHERE i.vendor_id = ? AND i.warehouse_id = ?`;

        const [inventoryProducts] = await pool.query<RowDataPacket[]>(query, [vendorId, warehouseId]);

        console.log(inventoryProducts)

        return { success: true, message: "Inventory Products fetched successfully", code: CustomCode.SuccessCode, inventoryProducts };

    } catch (error) {

    }
}