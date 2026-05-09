import { RowDataPacket, ResultSetHeader } from "mysql2";
import { AppError } from "../../../StandardUtility/AppError";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import pool from "../../StandardConfig/MySqlDbConfig";

export const getAllCategories = async () => {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM product_category`
    );

    return {
      success: true,
      message: "Categories fetched successfully",
      code: CustomCode.SuccessCode,
      result,
    };
  } catch (err) {
    throw new AppError("Failed to fetch categories");
  }
};

export const getCategoryById = async (id: number) => {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM product_category WHERE category_id = ?`,
      [id]
    );

    if (result.length === 0) {
      throw new AppError(
        "Category not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    return {
      success: true,
      message: "Category fetched successfully",
      code: CustomCode.SuccessCode,
      result: result[0],
    };
  } catch (err) {
    throw err;
  }
};

export const createCategory = async (name: string, status: string) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO product_category (name, status) VALUES (?, ?)`,
      [name, status]
    );

    return {
      success: true,
      message: "Category created successfully",
      code: CustomCode.SuccessCode,
      result: { id: result.insertId, name, status },
    };
  } catch (err) {
    throw new AppError("Failed to create category");
  }
};

export const updateCategory = async (
  id: number,
  name: string,
  status: string
) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE product_category SET name = ?, status = ? WHERE category_id = ?`,
      [name, status, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Category not found or no changes made",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    return {
      success: true,
      message: "Category updated successfully",
      code: CustomCode.SuccessCode,
    };
  } catch (err) {
    throw err;
  }
};

export const deleteCategory = async (id: number) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM product_category WHERE category_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Category not found",
        HttpStatusCode.NOT_FOUND,
        CustomCode.NotFoundCode
      );
    }

    return {
      success: true,
      message: "Category deleted successfully",
      code: CustomCode.SuccessCode,
    };
  } catch (err) {
    throw err;
  }
};
