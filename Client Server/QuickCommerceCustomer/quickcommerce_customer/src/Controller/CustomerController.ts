
import { Request, Response } from "express";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import { AuthenticatedCustomerRequest } from "../Utility/CustomPayload";
import {
  addCustomerAddress, addProductToCart, cancelOrder, createExchangeService, customerOrderListing, customerProfile, deleteSavedAddress, getAvailableProducts, getCartItems, getCategories, getDashboardData, getProductDetailsById,
  getProductNameSuggestions,
  getRecentlyViewedProducts,
  getSavedAddresses, insertNewOrder, insertRecentProductView, removeItemFromCart, savePushToken, searchProductsByKeyword, updateCustomerDetails, updateSavedAddress
} from "../Service/CustomerService";
import { AppError } from "../Config/AppError";
import { CustomCode } from "../Config/CustomCode";
import path from "path";
import { saveUploadedFile } from "../Utility/FileUpload";
import fs from "fs/promises";

export const updateCustomerProfile = async (req: AuthenticatedCustomerRequest, res: Response) => {
  const {
    name,
    email,
    phone
  } = req.body;
  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    const response = await updateCustomerDetails(customerId, name, email, phone)
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }

};

export const fetchCustomerProfile = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    const response = await customerProfile(customerId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }

};

export const addNewCustomerAddress = async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {

    const { address_line1, address_line2, phone_number, city, state, landmark, postal_code, latitude, longitude, is_default } = req.body;

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    if (customerId === 'DEFAULT') throw new AppError("unauthorized", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode)

    const response = await addCustomerAddress(customerId, address_line1, address_line2, city, state, is_default, postal_code, latitude, longitude, phone_number, landmark)
    res.status(HttpStatusCode.OK).json(response);

  } catch (error) {
    throw error;
  }
}
export const updateSavedCustomerAddressController = async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {

    const { addressId } = req.params;

    if (!addressId) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: HttpStatusCode.BAD_REQUEST, message: "addressId is required" });
    }


    const { address_line1, address_line2, phone_number, city, state, landmark, postal_code, latitude, longitude, is_default } = req.body;

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    if (customerId === 'DEFAULT') throw new AppError("unauthorized", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode)

    const response = await updateSavedAddress(addressId, customerId, address_line1, address_line2, city, state, is_default, postal_code, latitude, longitude, phone_number, landmark)
    res.status(HttpStatusCode.OK).json(response);

  } catch (error) {
    throw error;
  }
}

export const deleteSavedCustomerAddressController = async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {

    const { addressId } = req.params;

    if (!addressId) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: HttpStatusCode.BAD_REQUEST, message: "addressId is required" });
    }

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    if (customerId === 'DEFAULT') throw new AppError("unauthorized", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode)

    const response = await deleteSavedAddress(addressId, customerId)
    res.status(HttpStatusCode.OK).json(response);

  } catch (error) {
    throw error;
  }
}

export const customerAddresses = async (req: AuthenticatedCustomerRequest, res: Response) => {
  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    if (customerId === 'DEFAULT') throw new AppError("unauthorized", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode)

    const response = await getSavedAddresses(customerId);
    res.status(HttpStatusCode.OK).json(response);

  } catch (error) {
    throw error;
  }
}

export const fetchAvailableProducts = async (req: AuthenticatedCustomerRequest, res: Response) => {

  const { category, vendorId, longitude, latitude } = req.query;

  if(!longitude || !latitude){
    return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: HttpStatusCode.BAD_REQUEST, message: "longitude and latitude query params are required" });
  }
  try {

    const newCategory: string = category ? category as string : 'ALL';
    const newVendorId: string = vendorId ? vendorId as string : 'ALL';
    const response = await getAvailableProducts(newCategory, newVendorId, parseFloat(latitude as string), parseFloat(longitude as string));

    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const getCategoriesController = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {

    const response = await getCategories();
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
}

export const fetchProductDetailsById = async (req: AuthenticatedCustomerRequest, res: Response) => {

  const { productId } = req.params;

  if (!productId) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: 400, message: "Product ID is required" });
  }
  try {

    const response = await getProductDetailsById(productId as string);
    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const insertProductToCart = async (req: AuthenticatedCustomerRequest, res: Response) => {

  const { productId, quantity, vendorId, inventoryId } = req.body;

  try {
    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const response = await addProductToCart(customerId, productId, quantity, vendorId, inventoryId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    throw error;
  }
}

export const fetchCartItems = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {
    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const response = await getCartItems(customerId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    throw error;
  }
}

export const deleteCartItem = async (req: AuthenticatedCustomerRequest, res: Response) => {


  const { cartItemId } = req.query;
  if (!cartItemId) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: 400, message: "cartItemId is required" });
  }
  try {
    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }
    // Implementation for deleting cart item goes here

    const response = await removeItemFromCart(cartItemId as string, customerId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    throw error;
  }
}

export const fetchDashboardData = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {
    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const { longitude, latitude } = req.query;

    if(!longitude || !latitude){
      return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: HttpStatusCode.BAD_REQUEST, message: "longitude and latitude query params are required" });
    }
    const response = await getDashboardData(customerId, parseFloat(latitude as string), parseFloat(longitude as string));
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    throw error;
  }
}

export const createNewOrder = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {
    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const {
      total_amount,
      payment_method,
      shipping_address_id,
      items
    } = req.body;
    const response = await insertNewOrder(items, total_amount, payment_method, shipping_address_id, customerId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    throw error;
  }
}

export const cancelCustomerOrder = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {
    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const { orderId, remarks } = req.body;

    const response = await cancelOrder(orderId, customerId, remarks)

    res.status(HttpStatusCode.OK).json(response);
  } catch (error) {
    throw error;
  }
}

export const fetchOrders = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const response = await customerOrderListing(customerId);
    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const addProductToRecentView = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const { product_id } = req.params;

    if (!product_id) throw new AppError("product_id param required", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode)

    const response = await insertRecentProductView(customerId, product_id);
    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const recentViewedProducts = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }
    const response = await getRecentlyViewedProducts(customerId);
    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const savePushTokenController = async (req: AuthenticatedCustomerRequest, res: Response) => {

  try {

    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }
    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    const { pushToken, platform, deviceId, deviceModel, appVersion } = req.body;

    const response = await savePushToken(customerId, pushToken, platform, deviceId, deviceModel, appVersion);
    res.status(HttpStatusCode.OK).json(response);

  } catch (err) {
    throw err;
  }
}

export const productNameSuggestionController = async (req: AuthenticatedCustomerRequest, res: Response) => {

  const keyword = req.query.keyword as string;
  if (!keyword) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: HttpStatusCode.BAD_REQUEST, message: "keyword query param is required" });
  }
  try {

    const response = await getProductNameSuggestions(keyword);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
}

export const searchProductsByKeywordController = async (req: AuthenticatedCustomerRequest, res: Response) => {

  const keyword = req.query.keyword as string;
  const limit = req.query.limit as string;
  const page = req.query.page as string;
  if (!keyword) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, code: HttpStatusCode.BAD_REQUEST, message: "keyword query param is required" });
  }
  try {

    const response = await searchProductsByKeyword(keyword, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
}

export const createExchangeRequest = async (
  req: AuthenticatedCustomerRequest,
  res: Response
) => {

  let savedProductFiles: { filename: string; fullPath: string }[] = [];
  try {

    const { orderId, reason, notes, items } = req.body;

    const rootFolder = path.join(process.cwd(), 'ExchangeImages');

    let productFiles: any[] = [];

    if (!Array.isArray(req.files)) {
      productFiles = req.files?.['pfile'] || [];
    }


    let customerId: string = "DEFAULT";
    if (req.customer && typeof req.customer === "object") {
      customerId = req.customer.customerId;
    }

    if (customerId === "DEFAULT") {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, code: HttpStatusCode.UNAUTHORIZED, message: "Unauthorized access" });
    }

    for (const file of productFiles) {
      const savedFileName = await saveUploadedFile(file, rootFolder, customerId);
      const fullPath = path.join(rootFolder, savedFileName);

      savedProductFiles.push({
        filename: savedFileName,
        fullPath: fullPath
      });
    }

    const savedFileNames : string [] = savedProductFiles.map(file => file.filename);

    const response = await createExchangeService(items, orderId, customerId, reason, notes, savedFileNames);
    return res.status(HttpStatusCode.CREATED).json(response);
  } catch (error) {
    for (const file of savedProductFiles) {
      try {
        await fs.unlink(file.fullPath);
      } catch (unlinkErr) {
        console.error(`Error deleting file ${file.fullPath}:`, unlinkErr);
      }
    }
    throw error;
  }
};

