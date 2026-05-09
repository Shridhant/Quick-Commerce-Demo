import { NextFunction, Request, Response } from 'express';
import {
  fetchAllProductsInventory,
  fetchInventoryByVendor,
    fetchInventoryByWarehouse,
    fetchProductInventoryDetails,
  getAllActiveVendors,
  getAllActiveProducts,
  getAllActiveWarehouses,
  createInventoryItem,
  getProducts,
  updateInventoryItem
} from '../Services/AdminInventoryService';
import { HttpStatusCode } from '../../../StandardUtility/HttpStatusCode';

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

// ============= CONTROLLER 1: GET ALL PRODUCTS WITH INVENTORY SUMMARY =============
export const getAllProductsInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isActive, minQuantity, search } = req.query;

    const response = await fetchAllProductsInventory({
      category: category as string,
      isActive: isActive as string,
      minQuantity: minQuantity as string,
      search: search as string
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching products inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products inventory",
      code: "5000"
    });
  }
};

// ============= CONTROLLER 2: GET INVENTORY BY VENDOR =============
export const getInventoryByVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const { status, minQuantity } = req.query;

    const response = await fetchInventoryByVendor(vendorId, {
      status: status as string,
      minQuantity: minQuantity as string
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching vendor inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor inventory",
      code: "5000"
    });
  }
};

// ============= CONTROLLER 3: GET INVENTORY BY WAREHOUSE =============
export const getInventoryByWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;
    const { status, minQuantity } = req.query;

    const response = await fetchInventoryByWarehouse(warehouseId, {
      status: status as string,
      minQuantity: minQuantity as string
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching warehouse inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouse inventory",
      code: "5000"
    });
  }
};

// ============= CONTROLLER 4: GET PRODUCT DETAILS WITH FULL INVENTORY BREAKDOWN =============
export const getProductInventoryDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
        code: "4000"
      });
      return;
    }

    const response = await fetchProductInventoryDetails(productId);

    if (!response.success) {
      res.status(404).json(response);
      return;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching product inventory details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product inventory details",
      code: "5000"
    });
  }
};

export const addInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventoryData = req.body;
    const response = await createInventoryItem(inventoryData);
    
    res.status(HttpStatusCode.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const editInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inventoryId } = req.params;
    const response = await updateInventoryItem(inventoryId, req.body);
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const getWarehousesList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getAllActiveWarehouses();
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const fetchProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, is_active, search } = req.query;
    
    const filters = {
      category: category as string,
      is_active: is_active ? parseInt(is_active as string) : undefined,
      search: search as string,
    };
    
    const response = await getProducts(filters);
    res.status(HttpStatusCode.OK).json({
      success: response.success,
      message: response.message,
      code: response.code,
      data: { products: response.result } // Map 'result' to 'data.products' for frontend
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorsList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getAllActiveVendors();
    res.status(HttpStatusCode.OK).json({
      success: response.success,
      message: response.message,
      code: response.code,
      data: { vendors: response.result } // Map 'result' to 'data.vendors' for frontend
    });
  } catch (error) {
    next(error);
  }
};
