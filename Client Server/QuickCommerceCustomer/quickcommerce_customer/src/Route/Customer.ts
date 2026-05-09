import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../Middleware/RequestBodyValidator";
import { addAddress, addProductToCardValidation, cancelOrderValidation, createExchangeValidation, createOrderValidation, createSavePushTokenValidation, customerUpdateProfileValidation } from "../Validation/CommonValidator";
import {
    addNewCustomerAddress, addProductToRecentView, cancelCustomerOrder, createExchangeRequest, createNewOrder, customerAddresses, deleteCartItem, deleteSavedCustomerAddressController, fetchAvailableProducts, fetchCartItems, fetchCustomerProfile, fetchDashboardData,
    fetchOrders,
    fetchProductDetailsById, getCategoriesController, insertProductToCart, productNameSuggestionController, recentViewedProducts, savePushTokenController, searchProductsByKeywordController, updateCustomerProfile,
    updateSavedCustomerAddressController
} from "../Controller/CustomerController";
import { AuthenticateCustomerToken } from "../Middleware/TokenAuthenticator";
import upload from "../Utility/MulterConfig";
import { parseItemsJson } from "../Middleware/JsonRequestValidator";

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

const router = express.Router();

router.post("/update-profile",AuthenticateCustomerToken, customerUpdateProfileValidation, validateRequest, updateCustomerProfile);

router.get("/profile",AuthenticateCustomerToken, fetchCustomerProfile);

router.post("/product/add-to-cart", AuthenticateCustomerToken, addProductToCardValidation, validateRequest, insertProductToCart);

router.post("/order/create", AuthenticateCustomerToken, createOrderValidation, validateRequest, createNewOrder);

router.post("/order/cancel", AuthenticateCustomerToken, cancelOrderValidation, validateRequest, cancelCustomerOrder);

router.post("/add-address", AuthenticateCustomerToken, addAddress, validateRequest, addNewCustomerAddress);

router.get("/addresses", AuthenticateCustomerToken, customerAddresses);

router.get("/orders", AuthenticateCustomerToken, fetchOrders);

router.delete("/delete/address/:addressId", AuthenticateCustomerToken, deleteSavedCustomerAddressController);

router.put("/address/edit/:addressId", AuthenticateCustomerToken, addAddress, validateRequest, updateSavedCustomerAddressController);

router.get("/products", AuthenticateCustomerToken, fetchAvailableProducts);

router.get("/product/:productId", AuthenticateCustomerToken, fetchProductDetailsById);

router.get("/cart-items", AuthenticateCustomerToken, fetchCartItems);

router.get("/dashboard", AuthenticateCustomerToken, fetchDashboardData);

router.get("/product-name-suggestion",AuthenticateCustomerToken, productNameSuggestionController);

router.get("/products/search", searchProductsByKeywordController);

router.get("/products/categories", AuthenticateCustomerToken, getCategoriesController);

router.delete("/delete/cart-item", AuthenticateCustomerToken, deleteCartItem);

router.post("/product/add-recent-product/:product_id", AuthenticateCustomerToken, addProductToRecentView);

router.post("/product/recent-viewed-products", AuthenticateCustomerToken, recentViewedProducts);

router.post("/save-push-token", AuthenticateCustomerToken,createSavePushTokenValidation,validateRequest,savePushTokenController)

router.post("/order/exchange", AuthenticateCustomerToken,checkMultipartFormData, upload.fields([{ name: 'pfile', maxCount: 3 }]),parseItemsJson,createExchangeValidation,validateRequest, createExchangeRequest )


export default router; 