import { Router } from 'express';
import {
  getAllProductsInventory,
  getInventoryByVendor,
  getInventoryByWarehouse,
  getProductInventoryDetails,
  
  getVendorsList,
  
  getWarehousesList,
  addInventoryItem,
  editInventoryItem,
  fetchProducts
} from '../Controller/AdminInventory';
import { authenticateAdminToken } from "../Middleware/AdminTokenAuthenticator";


const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateAdminToken);

// ============= PRODUCT INVENTORY ROUTES =============



//FOR Admins to be able to add products to vendors
router.post('/inventory/add', authenticateAdminToken, addInventoryItem);
router.post('/add', authenticateAdminToken, addInventoryItem);
router.put('/inventory/items/:inventoryId', authenticateAdminToken, editInventoryItem);
router.put('/items/:inventoryId', authenticateAdminToken, editInventoryItem);
router.get('/warehouses/list', authenticateAdminToken, getWarehousesList);
router.get('/products/list', authenticateAdminToken, fetchProducts  );
router.get('/vendors/list', authenticateAdminToken, getVendorsList);


/**
 * GET /admin/v1/inventory/products
 * Get all products with inventory summary
 * Query params: 
 *   - category: filter by category
 *   - isActive: filter by active status (true/false)
 *   - minQuantity: minimum total quantity
 *   - search: search in name, sku, or brand
 */
router.get('/products', getAllProductsInventory);

/**
 * GET /admin/v1/inventory/products/:productId
 * Get detailed inventory breakdown for a specific product
 * Params: productId
 */
router.get('/products/:productId', getProductInventoryDetails);

// ============= VENDOR INVENTORY ROUTES =============

/**
 * GET /admin/v1/inventory/vendors
 * Get all vendors with their inventory summary
 * Query params:
 *   - status: filter by vendor status
 *   - minQuantity: minimum total quantity
 */
router.get('/vendors', getInventoryByVendor);

/**
 * GET /admin/v1/inventory/vendors/:vendorId
 * Get detailed inventory for a specific vendor
 * Params: vendorId
 */
router.get('/vendors/:vendorId', getInventoryByVendor);

// ============= WAREHOUSE INVENTORY ROUTES =============

/**
 * GET /admin/v1/inventory/warehouses
 * Get all warehouses with their inventory summary
 * Query params:
 *   - status: filter by warehouse status
 *   - minQuantity: minimum total quantity
 */
router.get('/warehouses', getInventoryByWarehouse);

/**
 * GET /admin/v1/inventory/warehouses/:warehouseId
 * Get detailed inventory for a specific warehouse
 * Params: warehouseId
 */
router.get('/warehouses/:warehouseId', getInventoryByWarehouse);




export default router;
