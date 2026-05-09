import express, { Request, Response, NextFunction } from "express";
import { addProduct,cancelVendorRequestedOrder,createOrUpdateProductOrder,editInventoryProduct,editOrderProduct,editVendorProfile,fetchActiveProductCategories,fetchProductInventory,fetchServiceRequests,fetchVendorDashboard,fetchVendorWarehouses,
    generateOrderManifest,
    getVendorOrderExchageDashboardController,
    getVendorOrderExchageListingController,
    getVendorSalesDashboardController,
    lowProductsAlert,
    registerVendorServiceRequest,
    updateSavedProductQuantityAndCreateOrder,
vendorOrderListing,vendorProfileUpdate } from "../Controller/VendorController";
import { createAndUpdateProductQuantityValidator, createOrAddProductValidation, registerSRValidation, validateInventoryProductUpdate, validateUpdateOrderProduct, vendorEditProfileValidation, vendorUpdateProfileValidation } from "../RequestValidator/VendorValidator";
import { validateRequest } from "../../../StandardMiddleware/RequestBodyValidator";
import { authenticateVendorToken } from "../Middleware/TokenAuthentication";
import upload from "../../../StandardUtility/MulterConfig";
import { checkUploadFiles } from "../Middleware/CheckRequiredFiles";

const router = express.Router();

export const checkMultipartFormData = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.is('multipart/form-data')) {
        res.status(400).json({ message: 'Content-Type must be multipart/form-data' });
        return;
    }
    next();
};

//router.post("/register", vendorRegistrationValidation, validateRequest, vendorRegistration);
// router.post("/send-otp", vendorOtpValidation, validateRequest, sendOtpToVendor);
// router.post("/validateLogin",vendorLoginValidation , validateRequest,vendorLogin);
router.post("/update-profile", authenticateVendorToken, upload.fields([{ name: 'tradeLicense', maxCount: 1 }, { name: 'GSTFile', maxCount: 1 }]),
 checkUploadFiles(['tradeLicense', 'GSTFile']),vendorUpdateProfileValidation,validateRequest,checkMultipartFormData, vendorProfileUpdate)

router.post("/register/sr",authenticateVendorToken, upload.fields([{ name: 'SR', maxCount: 3 }]),registerSRValidation,
validateRequest,checkMultipartFormData, registerVendorServiceRequest)

 router.post("/add-product", authenticateVendorToken, upload.fields([{ name: 'product', maxCount: 5 }]),
 checkUploadFiles(['product']),checkMultipartFormData,addProduct)

 router.post("/create-product-order", authenticateVendorToken,upload.any(),createOrAddProductValidation,validateRequest, createOrUpdateProductOrder);
 
 router.post('/order/cancel',authenticateVendorToken,cancelVendorRequestedOrder);

 router.post('/order/generate-manifest',authenticateVendorToken,generateOrderManifest);

 router.put('/order/edit',authenticateVendorToken,validateUpdateOrderProduct,validateRequest,editOrderProduct);

 router.post('/order/update-product/quantity',authenticateVendorToken,createAndUpdateProductQuantityValidator,validateRequest,updateSavedProductQuantityAndCreateOrder);
 
 router.put('/profile/edit',authenticateVendorToken,vendorEditProfileValidation,validateRequest,editVendorProfile);
 
 router.put('/inventory/product/edit',authenticateVendorToken,validateInventoryProductUpdate,validateRequest,editInventoryProduct);

 router.get('/dashboard',authenticateVendorToken,fetchVendorDashboard)

 router.get('/service-requests',authenticateVendorToken,fetchServiceRequests)

 router.get('/order/listing',authenticateVendorToken,vendorOrderListing)

 router.get("/warehouses",authenticateVendorToken,fetchVendorWarehouses);

 router.get("/low-product-alert",authenticateVendorToken,lowProductsAlert);
 
 router.get("/listing/product-categories",authenticateVendorToken,fetchActiveProductCategories);
 
 router.get("/inventory/products",authenticateVendorToken,fetchProductInventory);
 
 router.get("/sales/dashboard",authenticateVendorToken,getVendorSalesDashboardController);
 
 router.get("/exchange/orders/dashboard",authenticateVendorToken,getVendorOrderExchageDashboardController);
 
 router.get("/exchange/orders",authenticateVendorToken,getVendorOrderExchageListingController);
 

export default router;
