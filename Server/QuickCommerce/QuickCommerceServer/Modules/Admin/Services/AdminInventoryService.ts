import { RowDataPacket } from 'mysql2';
import pool from "../../StandardConfig/MySqlDbConfig";
import { HttpStatusCode } from '../../../StandardUtility/HttpStatusCode';
import { AppError } from '../../../StandardUtility/AppError';
import { CustomCode } from '../../../StandardUtility/CustomCode';

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

// ============= TYPES =============

interface AddProductToVendorInventoryRequest {
  vendorId: string;
  warehouseId: string;
  products: {
    // For NEW products (not in system yet)
    name?: string;
    description?: string;
    category?: string;
    unit?: string;
    image_url?: string;
    sku?: string;
    brand?: string;
    tags?: string;
    price?: number;
    
    // For EXISTING products (already in system)
    product_id?: string;
    
    // Common for both
    quantity: number;
  }[];
  addedBy: string; // admin_id
  remarks?: string;
}

interface ProductInventory extends RowDataPacket {
  product_id: string;
  product_name: string;
  product_description: string;
  category: string;
  unit: string;
  image_url: string;
  price: number;
  sku: string;
  brand: string;
  tags: string;
  total_quantity: number;
  vendor_count: number;
  is_active: boolean;
  offer_price?: number;
  expiry_date?: Date;
  unit_size?: number;
}

interface VendorInventory extends RowDataPacket {
  vendor_id: string;
  vendor_name: string;
  business_owner_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: string;
  isActive: boolean;
  total_products: number;
  total_quantity: number;
  warehouse_count: number;
}

interface WarehouseInventory extends RowDataPacket {
  warehouse_id: string;
  warehouse_name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: string;
  total_products: number;
  total_quantity: number;
  vendor_count: number;
}

interface ProductDetail extends RowDataPacket {
  product_id: string;
  product_name: string;
  sku: string;
  inventory_id: string;
  warehouse_id: string;
  warehouse_name: string;
  vendor_id: string;
  vendor_name: string;
  price: number | null;
  offer_price?: number | null;
  expiry_date?: Date | null;
  quantity: number;
  last_updated: Date;
}

interface QueryFilters {
  category?: string;
  isActive?: string;
  minQuantity?: string;
  search?: string;
  status?: string;
}

// ============= SERVICE 1: GET ALL PRODUCTS WITH INVENTORY SUMMARY =============
export const fetchAllProductsInventory = async (filters: QueryFilters) => {
  try {
    const { category, isActive, minQuantity, search } = filters;

    let query = `
      SELECT 
        p.product_id,
        p.name as product_name,
        p.description as product_description,
        p.category,
        p.unit,
        p.image_url,
        MAX(i.price) as price,
        p.sku,
        p.brand,
        p.tags,
        p.is_active,
        MAX(i.offer_price) as offer_price,
        MAX(i.expiry_date) as expiry_date,
        p.unit_size,
        COALESCE(SUM(i.quantity), 0) as total_quantity,
        COUNT(DISTINCT i.warehouse_id) as warehouse_count,
        COUNT(DISTINCT i.vendor_id) as vendor_count
      FROM product p
      LEFT JOIN inventory i ON p.product_id = i.product_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (category) {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (isActive !== undefined) {
      query += ` AND p.is_active = ?`;
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += `
      GROUP BY p.product_id
      HAVING 1=1
    `;

    if (minQuantity) {
      query += ` AND total_quantity >= ?`;
      params.push(Number(minQuantity));
    }

    query += ` ORDER BY p.created_at DESC`;

    const [products] = await pool.query<ProductInventory[]>(query, params);

    return {
      success: true,
      message: "Products inventory fetched successfully",
      code: "2000",
      data: {
        products: products.map((product) => ({
          ...product,
          image_url: mapProductImageUrl(product.image_url),
        })),
        totalProducts: products.length,
        totalInventory: products.reduce((sum, p) => sum + Number(p.total_quantity), 0)
      }
    };
  } catch (error) {
    console.error("Error in fetchAllProductsInventory:", error);
    throw error;
  }
};

// ============= SERVICE 2: GET INVENTORY BY VENDOR =============
export const fetchInventoryByVendor = async (
  vendorId: string | undefined,
  filters: QueryFilters
) => {
  try {
    const { status, minQuantity } = filters;

    let query = `
      SELECT 
        v.vendor_id,
        v.name as vendor_name,
        v.business_owner_name,
        v.email,
        v.phone,
        v.city,
        v.state,
        v.status,
        v.isActive,
        COUNT(DISTINCT i.product_id) as total_products,
        COALESCE(SUM(i.quantity), 0) as total_quantity,
        COUNT(DISTINCT i.warehouse_id) as warehouse_count
      FROM vendors v
      LEFT JOIN inventory i ON v.vendor_id = i.vendor_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (vendorId) {
      query += ` AND v.vendor_id = ?`;
      params.push(vendorId);
    }

    if (status) {
      query += ` AND v.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY v.vendor_id`;

    if (minQuantity) {
      query += ` HAVING total_quantity >= ?`;
      params.push(Number(minQuantity));
    }

    query += ` ORDER BY total_quantity DESC`;

    const [vendors] = await pool.query<VendorInventory[]>(query, params);

    // If specific vendor, get detailed inventory
    if (vendorId && vendors.length > 0) {
      const detailQuery = `
        SELECT 
          i.inventory_id,
          i.product_id,
          p.name as product_name,
          p.sku,
          p.category,
          i.price,
          i.warehouse_id,
          w.name as warehouse_name,
          i.quantity,
          i.last_updated
        FROM inventory i
        JOIN product p ON i.product_id = p.product_id
        JOIN warehouse w ON i.warehouse_id = w.warehouse_id
        WHERE i.vendor_id = ?
        ORDER BY i.last_updated DESC
      `;

      const [inventoryDetails] = await pool.query<ProductDetail[]>(detailQuery, [vendorId]);

      return {
        success: true,
        message: "Vendor inventory fetched successfully",
        code: "2000",
        data: {
          vendor: vendors[0],
          inventory: inventoryDetails
        }
      };
    }

    return {
      success: true,
      message: "Vendors inventory summary fetched successfully",
      code: "2000",
      data: {
        vendors,
        totalVendors: vendors.length
      }
    };
  } catch (error) {
    console.error("Error in fetchInventoryByVendor:", error);
    throw error;
  }
};

// ============= SERVICE 3: GET INVENTORY BY WAREHOUSE =============
export const fetchInventoryByWarehouse = async (
  warehouseId: string | undefined,
  filters: QueryFilters
) => {
  try {
    const { status, minQuantity } = filters;

    let query = `
      SELECT 
        w.warehouse_id,
        w.name as warehouse_name,
        w.address_line1,
        w.city,
        w.state,
        w.postal_code,
        w.country,
        w.status,
        COUNT(DISTINCT i.product_id) as total_products,
        COALESCE(SUM(i.quantity), 0) as total_quantity,
        COUNT(DISTINCT i.vendor_id) as vendor_count
      FROM warehouse w
      LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (warehouseId) {
      query += ` AND w.warehouse_id = ?`;
      params.push(warehouseId);
    }

    if (status) {
      query += ` AND w.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY w.warehouse_id`;

    if (minQuantity) {
      query += ` HAVING total_quantity >= ?`;
      params.push(Number(minQuantity));
    }

    query += ` ORDER BY total_quantity DESC`;

    const [warehouses] = await pool.query<WarehouseInventory[]>(query, params);

    // If specific warehouse, get detailed inventory
    if (warehouseId && warehouses.length > 0) {
      const detailQuery = `
        SELECT 
          i.inventory_id,
          i.product_id,
          p.name as product_name,
          p.sku,
          p.category,
          i.price,
          i.vendor_id,
          v.name as vendor_name,
          v.business_owner_name,
          i.quantity,
          i.last_updated
        FROM inventory i
        JOIN product p ON i.product_id = p.product_id
        JOIN vendors v ON i.vendor_id = v.vendor_id
        WHERE i.warehouse_id = ?
        ORDER BY i.last_updated DESC
      `;

      const [inventoryDetails] = await pool.query<ProductDetail[]>(detailQuery, [warehouseId]);

      return {
        success: true,
        message: "Warehouse inventory fetched successfully",
        code: "2000",
        data: {
          warehouse: warehouses[0],
          inventory: inventoryDetails
        }
      };
    }

    return {
      success: true,
      message: "Warehouses inventory summary fetched successfully",
      code: "2000",
      data: {
        warehouses,
        totalWarehouses: warehouses.length
      }
    };
  } catch (error) {
    console.error("Error in fetchInventoryByWarehouse:", error);
    throw error;
  }
};

// ============= SERVICE 4: GET PRODUCT DETAILS WITH FULL INVENTORY BREAKDOWN =============
export const fetchProductInventoryDetails = async (productId: string) => {
  try {
    // Get product info
    const productQuery = `
      WITH latest_inventory AS (
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
          COALESCE(SUM(i.quantity), 0) AS total_quantity
        FROM inventory i
        GROUP BY i.product_id
      )
      SELECT
        p.*,
        li.price,
        li.offer_price,
        li.expiry_date,
        COALESCE(isum.total_quantity, 0) AS total_quantity
      FROM product p
      LEFT JOIN latest_inventory li
        ON p.product_id = li.product_id AND li.rn = 1
      LEFT JOIN inventory_summary isum
        ON p.product_id = isum.product_id
      WHERE p.product_id = ?
    `;

    const [products] = await pool.query<ProductInventory[]>(productQuery, [productId]);

    if (products.length === 0) {
      return {
        success: false,
        message: "Product not found",
        code: "4004",
        data: null
      };
    }

    // Get inventory breakdown
    const inventoryQuery = `
      SELECT 
        i.inventory_id,
        i.warehouse_id,
        w.name as warehouse_name,
        w.city as warehouse_city,
        i.vendor_id,
        v.name as vendor_name,
        i.price,
        i.offer_price,
        i.expiry_date,
        v.business_owner_name,
        i.quantity,
        i.last_updated
      FROM inventory i
      JOIN warehouse w ON i.warehouse_id = w.warehouse_id
      JOIN vendors v ON i.vendor_id = v.vendor_id
      WHERE i.product_id = ?
      ORDER BY i.quantity DESC
    `;

    const [inventory] = await pool.query<ProductDetail[]>(inventoryQuery, [productId]);

    return {
      success: true,
      message: "Product inventory details fetched successfully",
      code: "2000",
      data: {
        product: {
          ...products[0],
          image_url: mapProductImageUrl(products[0].image_url),
          image_urls: parseStoredProductImages(products[0].image_url).map(mapStoredProductImage),
        },
        inventoryBreakdown: inventory,
        summary: {
          totalQuantity: products[0].total_quantity,
          warehouseCount: inventory.length,
          vendorCount: new Set(inventory.map(i => i.vendor_id)).size
        }
      }
    };
  } catch (error) {
    console.error("Error in fetchProductInventoryDetails:", error);
    throw error;
  }
};


interface InventoryItemData {
  warehouse_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  price?: number | null;
  offer_price?: number | null;
  expiry_date?: string | null;
}

interface UpdateInventoryItemData {
  quantity: number;
  price?: number | null;
  offer_price?: number | null;
  expiry_date?: string | null;
}

export const createInventoryItem = async (data: InventoryItemData) => {
  const connection = await pool.getConnection();
  try {
    // Validate that warehouse exists and is active
    const [warehouse] = await connection.query<RowDataPacket[]>(
      'SELECT warehouse_id, name FROM warehouse WHERE warehouse_id = ? AND status = "ACTIVE"',
      [data.warehouse_id]
    );

    if (warehouse.length === 0) {
      throw new Error('Warehouse not found or inactive');
    }

    // Validate that product exists and is active
    const [product] = await connection.query<RowDataPacket[]>(
      'SELECT product_id, name FROM product WHERE product_id = ? AND is_active = 1',
      [data.product_id]
    );

    if (product.length === 0) {
      throw new Error('Product not found or inactive');
    }

    // Validate that vendor exists and is active
    const [vendor] = await connection.query<RowDataPacket[]>(
      'SELECT vendor_id, name FROM vendors WHERE vendor_id = ? AND isActive = 1',
      [data.vendor_id]
    );

    if (vendor.length === 0) {
      throw new Error('Vendor not found or inactive');
    }

    // Validate quantity
    if (data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (data.price !== undefined && data.price !== null && data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (data.offer_price !== undefined && data.offer_price !== null && data.offer_price < 0) {
      throw new Error('Offer price cannot be negative');
    }

    if (
      data.price !== undefined &&
      data.price !== null &&
      data.offer_price !== undefined &&
      data.offer_price !== null &&
      data.offer_price > data.price
    ) {
      throw new Error('Offer price cannot be greater than price');
    }

    // Check if inventory item already exists for this combination
    const [existingInventory] = await connection.query<RowDataPacket[]>(
      `SELECT inventory_id, quantity FROM inventory 
       WHERE warehouse_id = ? AND product_id = ? AND vendor_id = ?`,
      [data.warehouse_id, data.product_id, data.vendor_id]
    );

    if (existingInventory.length > 0) {
      // Update existing inventory - ADD to existing quantity
      const previousQuantity = existingInventory[0].quantity;
      const newQuantity = previousQuantity + data.quantity;
      
      await connection.query(
        `UPDATE inventory
         SET quantity = ?,
             price = COALESCE(?, price),
             offer_price = ?,
             expiry_date = ?,
             last_updated = CURRENT_TIMESTAMP
         WHERE inventory_id = ?`,
        [
          newQuantity,
          data.price ?? null,
          data.offer_price ?? null,
          data.expiry_date ?? null,
          existingInventory[0].inventory_id,
        ]
      );

      return {
        success: true,
        message: "Inventory updated successfully",
        code: CustomCode.SuccessCode,
        result: {
          inventory_id: existingInventory[0].inventory_id,
          action: 'updated',
          warehouse_name: warehouse[0].name,
          product_name: product[0].name,
          vendor_name: vendor[0].name,
          previous_quantity: previousQuantity,
          added_quantity: data.quantity,
          new_quantity: newQuantity,
          price: data.price ?? null,
          offer_price: data.offer_price ?? null,
          expiry_date: data.expiry_date ?? null,
        },
      };
    } else {
      // Create new inventory item
      const inventory_id = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await connection.query(
        `INSERT INTO inventory (inventory_id, warehouse_id, product_id, vendor_id, quantity, price, offer_price, expiry_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inventory_id,
          data.warehouse_id,
          data.product_id,
          data.vendor_id,
          data.quantity,
          data.price ?? null,
          data.offer_price ?? null,
          data.expiry_date ?? null,
        ]
      );

      return {
        success: true,
        message: "Inventory item created successfully",
        code: CustomCode.SuccessCode,
        result: {
          inventory_id,
          action: 'created',
          warehouse_name: warehouse[0].name,
          product_name: product[0].name,
          vendor_name: vendor[0].name,
          quantity: data.quantity,
          price: data.price ?? null,
          offer_price: data.offer_price ?? null,
          expiry_date: data.expiry_date ?? null,
        },
      };
    }
  } catch (err: any) {
    // Handle specific errors
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error('Failed to add inventory item');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const updateInventoryItem = async (inventoryId: string, data: UpdateInventoryItemData) => {
  const connection = await pool.getConnection();
  try {
    if (data.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    if (data.price !== undefined && data.price !== null && data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (data.offer_price !== undefined && data.offer_price !== null && data.offer_price < 0) {
      throw new Error("Offer price cannot be negative");
    }

    if (
      data.price !== undefined &&
      data.price !== null &&
      data.offer_price !== undefined &&
      data.offer_price !== null &&
      data.offer_price > data.price
    ) {
      throw new Error("Offer price cannot be greater than price");
    }

    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT i.inventory_id, i.product_id, p.name AS product_name, w.name AS warehouse_name, v.name AS vendor_name
       FROM inventory i
       JOIN product p ON p.product_id = i.product_id
       JOIN warehouse w ON w.warehouse_id = i.warehouse_id
       JOIN vendors v ON v.vendor_id = i.vendor_id
       WHERE i.inventory_id = ?`,
      [inventoryId]
    );

    if (existing.length === 0) {
      throw new Error("Inventory item not found");
    }

    await connection.query(
      `UPDATE inventory
       SET quantity = ?,
           price = ?,
           offer_price = ?,
           expiry_date = ?,
           last_updated = CURRENT_TIMESTAMP
       WHERE inventory_id = ?`,
      [
        data.quantity,
        data.price ?? null,
        data.offer_price ?? null,
        data.expiry_date ?? null,
        inventoryId,
      ]
    );

    return {
      success: true,
      message: "Inventory item updated successfully",
      code: CustomCode.SuccessCode,
      result: {
        inventory_id: inventoryId,
        product_id: existing[0].product_id,
        product_name: existing[0].product_name,
        warehouse_name: existing[0].warehouse_name,
        vendor_name: existing[0].vendor_name,
        quantity: data.quantity,
        price: data.price ?? null,
        offer_price: data.offer_price ?? null,
        expiry_date: data.expiry_date ?? null,
      },
    };
  } catch (err: any) {
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error("Failed to update inventory item");
  } finally {
    connection.release();
  }
};

export const getAllActiveWarehouses = async () => {
  const connection = await pool.getConnection();
  try {
    const [warehouses] = await connection.query<RowDataPacket[]>(
      `SELECT warehouse_id, name, city, state, country 
       FROM warehouse 
       WHERE status = 'ACTIVE' 
       ORDER BY name ASC`
    );

    return {
      success: true,
      message: "Active warehouses fetched successfully",
      code: CustomCode.SuccessCode,
      result: warehouses,
    };
  } catch (err) {
    throw new Error('Failed to fetch warehouses');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const getAllActiveProducts = async () => {
  const connection = await pool.getConnection();
  try {
    const [products] = await connection.query<RowDataPacket[]>(
      `SELECT product_id, name, category, brand, sku, unit
       FROM product 
       WHERE is_active = 1 
       ORDER BY name ASC`
    );

    return {
      success: true,
      message: "Active products fetched successfully",
      code: CustomCode.SuccessCode,
      result: products,
    };
  } catch (err) {
    throw new Error('Failed to fetch products');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const getAllActiveVendors = async () => {
  const connection = await pool.getConnection();
  try {
    const [vendors] = await connection.query<RowDataPacket[]>(
      `SELECT vendor_id, name, business_owner_name, city, state, country, phone, email 
       FROM vendors 
       WHERE isActive = 1 
       ORDER BY name ASC`
    );

    return {
      success: true,
      message: "Active vendors fetched successfully",
      code: CustomCode.SuccessCode,
      result: vendors,
    };
  } catch (err) {
    throw new Error('Failed to fetch vendors');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};



//new


interface Product {
  product_id: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  image_url?: string;
  price?: number;
  is_active: number;
  sku?: string;
  brand?: string;
  tags?: string;
  created_at: Date;
}

interface ProductFilters {
  category?: string;
  is_active?: number;
  search?: string;
}

export const getProducts = async (filters: ProductFilters = {}) => {
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT 
        p.product_id,
        p.name,
        p.description,
        p.category,
        p.unit,
        p.image_url,
        p.is_active,
        p.sku,
        p.brand,
        p.tags,
        p.created_at,
        pc.name as category_name
      FROM product p
      LEFT JOIN product_category pc ON p.category = pc.category_id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];

    // Apply filters
    if (filters.category) {
      query += ' AND p.category = ?';
      queryParams.push(filters.category);
    }

    if (filters.is_active !== undefined) {
      query += ' AND p.is_active = ?';
      queryParams.push(filters.is_active);
    } else {
      // By default, only show active products
      query += ' AND p.is_active = 1';
    }

    if (filters.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY p.name ASC';

    const [products] = await connection.query<RowDataPacket[]>(query, queryParams);

    return {
      success: true,
      message: "Products retrieved successfully",
      code: CustomCode.SuccessCode,
      result: products as Product[],
      count: products.length,
    };
  } catch (err: any) {
    throw new Error('Failed to fetch products');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
