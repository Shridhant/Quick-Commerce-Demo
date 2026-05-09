import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../StandardConfig/MySqlDbConfig";
import { AppError } from "../../../StandardUtility/AppError";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const PRODUCT_IMAGE_BASE_PATH = process.env.PRODUCT_IMAGE_BASE_PATH || "/Uploads/product";

const parseStoredProductImages = (imageUrl?: string | null) => {
  if (!imageUrl) return [];
  return imageUrl
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const mapStoredProductImage = (imageName: string) => {
  if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
    return imageName;
  }
  return `${BASE_URL}${PRODUCT_IMAGE_BASE_PATH}/${imageName}`;
};

const mapProductImageUrl = (imageUrl?: string | null) => {
  const images = parseStoredProductImages(imageUrl);
  if (images.length === 0) return null;
  return mapStoredProductImage(images[0]);
};

const transformProductRow = <T extends RowDataPacket>(row: T) => ({
  ...row,
  image_url: mapProductImageUrl((row as T & { image_url?: string | null }).image_url),
  image_urls: parseStoredProductImages((row as T & { image_url?: string | null }).image_url).map(mapStoredProductImage),
});

// ─────────────────────────────────────────────────────────────
// GET ALL PRODUCTS
// Query params: category, is_active, search, page, limit
// ─────────────────────────────────────────────────────────────
export const getAllProducts = async (
  category?: string,
  is_active?: string,
  search?: string,
  page: number = 1,
  limit: number = 20
) => {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: any[] = [];

  if (category) {
    conditions.push("category = ?");
    values.push(category);
  }
  if (is_active !== undefined) {
    conditions.push("is_active = ?");
    values.push(is_active === "true" ? 1 : 0);
  }
  if (search) {
    conditions.push("(name LIKE ? OR sku LIKE ? OR brand LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query<RowDataPacket[]>(
    `WITH latest_inventory AS (
       SELECT
         i.product_id,
         i.price,
         i.offer_price,
         i.expiry_date,
         ROW_NUMBER() OVER (
           PARTITION BY i.product_id
           ORDER BY i.last_updated DESC, i.inventory_id DESC
         ) AS rn
       FROM inventory i
     ),
     inventory_summary AS (
       SELECT
         i.product_id,
         COALESCE(SUM(i.quantity), 0) AS total_quantity,
         COUNT(DISTINCT i.vendor_id) AS vendor_count,
         COUNT(DISTINCT i.warehouse_id) AS warehouse_count
       FROM inventory i
       GROUP BY i.product_id
     )
     SELECT
       p.*,
       li.price,
       li.offer_price,
       li.expiry_date,
       COALESCE(isum.total_quantity, 0) AS total_quantity,
       COALESCE(isum.vendor_count, 0) AS vendor_count,
       COALESCE(isum.warehouse_count, 0) AS warehouse_count
     FROM product p
     LEFT JOIN latest_inventory li
       ON p.product_id = li.product_id AND li.rn = 1
     LEFT JOIN inventory_summary isum
       ON p.product_id = isum.product_id
     ${whereClause}
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const [[countRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM product ${whereClause}`,
    values
  );

  return {
    success: true,
    message: "Products fetched successfully",
    result: rows.map(transformProductRow),
    pagination: {
      total: countRow.total,
      page,
      limit,
      totalPages: Math.ceil(countRow.total / limit),
    },
  };
};

// ─────────────────────────────────────────────────────────────
// GET SINGLE PRODUCT BY ID
// ─────────────────────────────────────────────────────────────
export const getProductById = async (productId: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `WITH latest_inventory AS (
       SELECT
         i.product_id,
         i.price,
         i.offer_price,
         i.expiry_date,
         ROW_NUMBER() OVER (
           PARTITION BY i.product_id
           ORDER BY i.last_updated DESC, i.inventory_id DESC
         ) AS rn
       FROM inventory i
     ),
     inventory_summary AS (
       SELECT
         i.product_id,
         COALESCE(SUM(i.quantity), 0) AS total_quantity,
         COUNT(DISTINCT i.vendor_id) AS vendor_count,
         COUNT(DISTINCT i.warehouse_id) AS warehouse_count
       FROM inventory i
       GROUP BY i.product_id
     )
     SELECT
       p.*,
       li.price,
       li.offer_price,
       li.expiry_date,
       COALESCE(isum.total_quantity, 0) AS total_quantity,
       COALESCE(isum.vendor_count, 0) AS vendor_count,
       COALESCE(isum.warehouse_count, 0) AS warehouse_count
     FROM product p
     LEFT JOIN latest_inventory li
       ON p.product_id = li.product_id AND li.rn = 1
     LEFT JOIN inventory_summary isum
       ON p.product_id = isum.product_id
     WHERE p.product_id = ?`,
    [productId]
  );

  if (rows.length === 0) {
    throw new AppError("Product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
  }

  return { success: true, message: "Product fetched successfully", result: transformProductRow(rows[0]) };
};

// ─────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────
export const createProduct = async (data: {
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  sku?: string;
  brand?: string;
  tags?: string;
  unit_size?: number;
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const productId = uuidv4();
    const groupId = productId;

    await connection.query<ResultSetHeader>(
      `INSERT INTO product (product_id, group_id, name, description, category, unit, image_url, sku, brand, tags, unit_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        groupId,
        data.name,
        data.description ?? null,
        data.category ?? null,
        data.unit ?? null,
        data.image_url ?? null,
        data.sku ?? null,
        data.brand ?? null,
        data.tags ?? null,
        data.unit_size ?? null,
      ]
    );

    await connection.commit();
    return {
      success: true,
      message: "Product created successfully. Add inventory to set price and stock.",
      productId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────
export const updateProduct = async (
  productId: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    unit?: string;
    image_url?: string;
    sku?: string;
    brand?: string;
    tags?: string;
    unit_size?: number;
  }
) => {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields: (keyof typeof data)[] = [
    "name", "description", "category", "unit", "image_url", "sku", "brand", "tags", "unit_size"
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    throw new AppError("No fields to update", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);
  }

  values.push(productId);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE product SET ${fields.join(", ")} WHERE product_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    throw new AppError("Product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
  }

  return { success: true, message: "Product updated successfully" };
};

// ─────────────────────────────────────────────────────────────
// TOGGLE PRODUCT STATUS (is_active)
// ─────────────────────────────────────────────────────────────
export const getStoredProductImageUrls = async (productId: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT image_url FROM product WHERE product_id = ?`,
    [productId]
  );

  if (rows.length === 0) {
    throw new AppError("Product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
  }

  return (rows[0].image_url as string | null) ?? null;
};

export const deleteStoredProductImage = async (productId: string, imageName: string) => {
  const storedImageUrls = await getStoredProductImageUrls(productId);
  const currentImages = parseStoredProductImages(storedImageUrls);

  if (!currentImages.includes(imageName)) {
    throw new AppError("Product image not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
  }

  const remainingImages = currentImages.filter((entry) => entry !== imageName);

  await pool.query<ResultSetHeader>(
    `UPDATE product SET image_url = ? WHERE product_id = ?`,
    [remainingImages.length > 0 ? remainingImages.join(",") : null, productId]
  );

  return {
    success: true,
    message: "Product image deleted successfully",
    image_urls: remainingImages.map(mapStoredProductImage),
  };
};

export const toggleProductStatus = async (productId: string, is_active: boolean) => {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE product SET is_active = ? WHERE product_id = ?`,
    [is_active ? 1 : 0, productId]
  );

  if (result.affectedRows === 0) {
    throw new AppError("Product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
  }

  return {
    success: true,
    message: `Product ${is_active ? "activated" : "deactivated"} successfully`,
  };
};

// ─────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────
export const deleteProduct = async (productId: string) => {
  const [inventoryRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM inventory WHERE product_id = ?`,
    [productId]
  );

  if ((inventoryRows[0]?.total ?? 0) > 0) {
    throw new AppError(
      "Cannot delete product while inventory exists. Remove inventory entries first or deactivate the product.",
      HttpStatusCode.BAD_REQUEST,
      CustomCode.BadRequestCode
    );
  }

  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM product WHERE product_id = ?`,
    [productId]
  );

  if (result.affectedRows === 0) {
    throw new AppError("Product not found", HttpStatusCode.NOT_FOUND, CustomCode.NotFoundCode);
  }

  return { success: true, message: "Product deleted successfully" };
};
