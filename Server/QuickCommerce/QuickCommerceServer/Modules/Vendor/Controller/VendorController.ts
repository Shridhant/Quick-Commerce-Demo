import { Request, Response } from "express";
import {
  addProductToDb, cancelRequestedOrder, createOrderAndUpdateProductQuantity, createOrUpdateOrderProducts, createVendorServiceRequest, editVendorProfileDetails, fetchLowQuantityProducts,
  getVendorDashboard, getVendorExchangeDashboardService, getVendorExchangeListService, getVendorOrdersService, getVendorsalesDashboardService, getVendorWarehouses, orderListingVendor, productCategoryListing, registerAndUpdateVendorProfile,
  ServiceRecordListingVendor, updateInventoryProduct, updateOrderProduct
} from "../Service/VendorService";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { saveUploadedFile, saveUploadedProductFile } from "../../../StandardUtility/FileUpload";
import fs from "fs/promises";
import fsStream, { stat } from "fs";
import path from "path";
import { AppError } from "../../../StandardUtility/AppError";
import { CustomCode } from "../../../StandardUtility/CustomCode";
import { AuthenticatedUserRequest, AuthenticatedVendorRequest } from "../../../StandardUtility/CustomVendorPayload";
import { OrderStatus, StandardStatus, VendorServiceRecordStatus } from "../../../StandardUtility/StatusEnum";
import { generateManifest, fetchAvailableProductsInventory } from "../../../StandardUtility/CommonService";


// export const vendorRegistration = async (req: Request, res: Response) => {
//   const { phone, password } = req.body;
//   try {
//     const response = await registerVendor(password, phone)
//     res.status(HttpStatusCode.OK).json(response)
//   } catch (err) {
//     throw err;
//   }

// };

// export const vendorLogin = async (req: Request, res: Response) => {
//   const { phone, password } = req.body;
//   try {
//     const response = await loginVendor(password, phone)
//     res.status(HttpStatusCode.OK).json(response)
//   } catch (err) {
//     throw err;
//   }

// };

// export const vendorLogin = async (req: Request, res: Response) => {
//   const { phone} = req.body;
//   try {
//     const response = await loginVendor(phone);
//     res.status(HttpStatusCode.OK).json(response)
//   } catch (err) {
//     throw err;
//   }

// };

export const vendorProfileUpdate = async (req: AuthenticatedUserRequest, res: Response) => {

  const tradeLicense =
    !Array.isArray(req.files) ? req.files?.['tradeLicense']?.[0] || null : null;
  const GSTFile =
    !Array.isArray(req.files) ? req.files?.['GSTFile']?.[0] || null : null;

  const storeImage =
    !Array.isArray(req.files) ? req.files?.['storeImage']?.[0] || null : null;
  const { name, email, address_line1, address_line2, city, state, postal_code, latitude,
    longitude, country, gstId, warehouseIds, business_owner_name } = req.body;


  let phone: string = 'DEFAULT';
  if (req.user && typeof req.user === "object") {
    phone = req.user.phone;
  }

  if (phone === 'DEFAULT') {
    throw new AppError("Invalid Token/Expired Token", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode)
  }

  const uploadedFiles: string[] = [];

  try {
    // Navigate from dist/Modules/Vendor/Controller back to the root
    const rootFolder = path.resolve(__dirname, '../../../../Modules/Vendor/Uploads');

    let savedTrade = null;
    if (tradeLicense) {
      savedTrade = await saveUploadedFile(tradeLicense, rootFolder, "VENDOR");
      uploadedFiles.push(path.join(rootFolder, "tradeLicense", savedTrade));
    }

    let savedGST = null;
    if (GSTFile) {
      savedGST = await saveUploadedFile(GSTFile, rootFolder, "VENDOR");
      uploadedFiles.push(path.join(rootFolder, "GSTFile", savedGST));
    }

    let savedStoreImage = null;
    if (storeImage) {
      savedStoreImage = await saveUploadedFile(storeImage, rootFolder, "VENDOR");
      uploadedFiles.push(path.join(rootFolder, "storeImage", savedStoreImage));
    }

    const response = await registerAndUpdateVendorProfile(name, email, address_line1, address_line2, city, state, postal_code, latitude, longitude, country, gstId, savedGST, savedTrade, phone, savedStoreImage, warehouseIds, business_owner_name)

    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    for (const filePath of uploadedFiles) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        console.error(`Error deleting file ${filePath}:`, unlinkErr);
      }
    }
    console.error(err);
    throw err;
  }
};


export const editVendorProfile = async (req: AuthenticatedVendorRequest, res: Response) => {

  try {

    const { name, email, address_line1, address_line2, city, state, postal_code, latitude,
      longitude, business_owner_name, phone } = req.body;

    let vendorId: string = "DEFAULT";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }


    const response = await editVendorProfileDetails(name, email, address_line1, address_line2, city, state, postal_code, latitude, longitude, phone, business_owner_name, vendorId)

    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    throw err;
  }
};

// export const createOrUpdateProductOrder = async (req: AuthenticatedVendorRequest, res: Response) => {
//   let {
//     type, warehouseId, products
//   } = req.body;

//   let vendorId: string = 'DEFAULT';
//   if (req.vendor && typeof req.vendor === "object") {
//     vendorId = req.vendor.vendorId;
//   }

//   if (typeof products === "string") {
//     try {
//       products = JSON.parse(products);
//     } catch (e) {
//       throw new AppError("Invalid products JSON", HttpStatusCode.BAD_REQUEST, "InvalidJSON");
//     }
//   }

//   console.log(products)

//   if (vendorId === 'DEFAULT') {
//     throw new AppError("Invalid Token/Expired Token", HttpStatusCode.UNAUTHORIZED, CustomCode.UnauthorizedCode)
//   }

//   console.log(vendorId)


//   const uploadedFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })?.productImages || [];
//   const rootFolder = path.join(process.cwd(), 'Uploads', vendorId);
//   const savedFileNames: string[] = [];

//   try {
//     for (const file of uploadedFiles) {
//       const savedFileName = await saveUploadedFile(file, rootFolder, vendorId); // using sku as id
//       savedFileNames.push(savedFileName);
//     }

//     const imageUrls = savedFileNames.length > 0 ? savedFileNames.join(',') : "";
//     const response = await createOrUpdateOrderProducts(vendorId, warehouseId, type, products);


//     res.status(HttpStatusCode.OK).json(response);
//   } catch (err: any) {
//     await Promise.all(
//       savedFileNames.map(async filename => {
//         try {
//           const filePath = path.join(rootFolder, 'productImages', filename);
//           await fs.unlink(filePath);
//         } catch (e) {
//           console.error(`Failed to delete file ${filename}`, e);
//         }
//       })
//     );
//     throw err;
//   }
// };

export const createOrUpdateProductOrder = async (
  req: AuthenticatedVendorRequest,
  res: Response
) => {
  let { type, warehouseId, products, order_id } = req.body;

  // ✅ Get vendorId from token
  let vendorId: string = "DEFAULT";
  if (req.vendor && typeof req.vendor === "object") {
    vendorId = req.vendor.vendorId;
  }

  // ✅ Parse products if sent as JSON string
  if (typeof products === "string") {
    try {
      products = JSON.parse(products);
    } catch (e) {
      throw new AppError(
        "Invalid products JSON",
        HttpStatusCode.BAD_REQUEST,
        "InvalidJSON"
      );
    }
  }

  if (vendorId === "DEFAULT") {
    throw new AppError(
      "Invalid Token/Expired Token",
      HttpStatusCode.UNAUTHORIZED,
      CustomCode.UnauthorizedCode
    );
  }

  // ✅ Multer with upload.any() → files come as array
  const uploadedFiles = req.files as Express.Multer.File[];

  const rootFolder = path.join(process.cwd(), "Uploads");

  // Track all saved files for cleanup if failure
  const allSavedFiles: { productSku: string; filename: string }[] = [];

  try {
    // ✅ Attach images to each product


    if (type === "ADD_PRODUCT") {
      for (const product of products) {
        const productSku = product?.product_sku;
        if (!productSku) {
          throw new AppError(
            "Each product must have a sku or productId",
            HttpStatusCode.BAD_REQUEST,
            "MissingSku"
          );
        }

        // Find files for this product by matching fieldname
        const productFiles = uploadedFiles.filter(
          (file) => file.fieldname === `productImages[${productSku}]`
        );

        const savedFileNames: string[] = [];

        for (const file of productFiles) {
          const savedFileName = await saveUploadedProductFile(
            file,
            rootFolder,
            productSku // 👈 ensures per-product folder
          );
          savedFileNames.push(savedFileName);
          allSavedFiles.push({ productSku, filename: savedFileName });
        }

        // Attach product image URLs
        product.images = savedFileNames.join(",");
      }
    }

    // ✅ Pass products (with images) to service
    const response = await createOrUpdateOrderProducts(
      vendorId,
      warehouseId,
      type,
      products,
      order_id
    );

    res.status(HttpStatusCode.OK).json(response);
  } catch (err: any) {
    // Cleanup saved files if error
    await Promise.all(
      allSavedFiles.map(async ({ productSku, filename }) => {
        try {
          const filePath = path.join(
            rootFolder,
            productSku,
            filename
          );
          await fs.unlink(filePath);
        } catch (e) {
          console.error(`Failed to delete file ${filename}`, e);
        }
      })
    );
    throw err;
  }
};
export const addProduct = async (req: Request, res: Response) => {
  const { name, description, category, unit, price, sku, brand } = req.body;

  const requiredFields = ['name', 'description', 'category', 'unit', 'price', 'sku']

  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

  const stringFields = ['name', 'description', 'category', 'unit', 'sku'];
  const invalidFields = stringFields.filter(field => {
    const value = req.body[field];
    return (
      value === undefined || // missing
      value === null ||      // explicitly null
      typeof value !== 'string' || // not a string
      value.trim() === ''         // empty string
    );
  });

  if (invalidFields.length > 0) {
    throw new AppError(
      `Invalid or missing string fields: ${invalidFields.join(', ')}`,
      HttpStatusCode.BAD_REQUEST,
      CustomCode.BadRequestCode
    );
  }

  const priceValue = Number(price);
  if (isNaN(priceValue) || priceValue <= 0) {
    throw new AppError(
      'Price must be a positive number',
      HttpStatusCode.BAD_REQUEST,
      CustomCode.BadRequestCode
    );
  }

  const uploadedFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })?.product || [];
  const rootFolder = path.join(process.cwd(), 'Uploads');


  const savedFileNames: string[] = [];

  //const uploadPath = path.join(__dirname, '../../../Uploads/Products');

  try {
    for (const file of uploadedFiles) {
      const savedFileName = await saveUploadedFile(file, rootFolder, sku); // using sku as id
      savedFileNames.push(savedFileName);
    }

    const imageUrls = savedFileNames.length > 0 ? savedFileNames.join(',') : "";

    const response = await addProductToDb(name, description, category, unit, imageUrls, priceValue, sku, brand);
    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    // Rollback file uploads
    await Promise.all(
      savedFileNames.map(async filename => {
        try {
          const filePath = path.join(rootFolder, 'product', filename);
          await fs.unlink(filePath);
        } catch (e) {
          console.error(`Failed to delete file ${filename}`, e);
        }
      })
    );
    throw err;
  }
};

export const fetchVendorDashboard = async (req: AuthenticatedVendorRequest, res: Response) => {
  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found",)
    const response = await getVendorDashboard(vendorId);
    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    throw err;
  }
};

export const cancelVendorRequestedOrder = async (req: AuthenticatedVendorRequest, res: Response) => {
  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")


    const orderId: any = req?.body?.orderId;

    if (!orderId) throw new AppError(`orderId query field is required`, HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

    const response = await cancelRequestedOrder(orderId, vendorId);
    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    throw err;
  }
};

export const vendorOrderListing = async (req: AuthenticatedVendorRequest, res: Response) => {
  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")


    const status: any = req.query.status;

    if (!status) throw new AppError(`status query field is required`, HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

    if (status !== OrderStatus.APPROVED && status !== OrderStatus.CANCELLED && status !== OrderStatus.PENDING && status !== OrderStatus.REJECTED && status !== 'ALL') throw new AppError(`status must be APPROVED/CANCELLED/PENDING/REJECTED/ALL`, HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

    const page: any = req.query.page;
    const limit: any = req.query.limit;


    const parsedPage = parseInt(page) || 1;

    const parsedLimit = parseInt(limit) || 10;

    const response = await orderListingVendor(status, parsedLimit, parsedPage, vendorId);
    res.status(HttpStatusCode.OK).json(response)
  } catch (err) {
    throw err;
  }
};

export const fetchVendorWarehouses = async (req: AuthenticatedVendorRequest, res: Response) => {

  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const response = await getVendorWarehouses(vendorId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }

}

export const fetchActiveProductCategories = async (req: AuthenticatedVendorRequest, res: Response) => {

  try {

    const response = await productCategoryListing();
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }

}

export const lowProductsAlert = async (req: AuthenticatedVendorRequest, res: Response) => {
  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const response = await fetchLowQuantityProducts(vendorId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
}

export const generateOrderManifest = async (req: AuthenticatedVendorRequest, res: Response) => {



  // Get the root directory (one level up from the current file)
  const rootDir = process.cwd();

  let vendorId: string = "";
  if (req.vendor && typeof req.vendor === "object") {
    vendorId = req.vendor.vendorId;
  }
  if (!vendorId) throw new AppError("Vendor ID not Found")

  try {
    const { orderIds } = req.body;
    const { filename, manifestRef } = await generateManifest(orderIds, vendorId);
    // const response = await saveManifest(filename, manifestRef, sellerId, orderIds);

    const filePath = path.join(rootDir, "OrderManifest", filename);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.endsWith('.pdf') ? filename : filename + '.pdf'}"`
    );

    res.setHeader("Content-Type", "application/pdf")


    await fs.access(filePath);

    const fileStream = fsStream.createReadStream(filePath);
    fileStream.pipe(res);
    fileStream.on('error', (err) => {
      res.status(500).json({ error: 'Error downloading the file' });
    });
  } catch (err) {
    //  err.message = "Error Creating Manifest";
    throw err;
  }
}

export const fetchProductInventory = async (req: AuthenticatedVendorRequest, res: Response) => {

  try {

    const { warehouseId } = req.query;

    if (!warehouseId) throw new AppError("warehouseId query param is required", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const response = await fetchAvailableProductsInventory(vendorId, warehouseId as string);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }

}

export const editOrderProduct = async (req: AuthenticatedVendorRequest, res: Response) => {

  const { orderId, product_id, product_name, product_brand, product_description, product_category, product_unit, product_price, product_tags, offer_price, expiry_date, unit_size } = req.body;

  if (!orderId) throw new AppError("orderId is required", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

  if (!product_id) throw new AppError("product_id is required", HttpStatusCode.BAD_REQUEST, CustomCode.BadRequestCode);

  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const response = await updateOrderProduct(orderId, product_id, product_brand, product_unit, product_description, product_category, product_price, product_tags, unit_size, expiry_date, offer_price, vendorId);
    res.status(HttpStatusCode.OK).json(response);

  } catch (error) {
    throw error;
  }
}

export const editInventoryProduct = async (req: AuthenticatedVendorRequest, res: Response) => {

  const {
    product_id,
    inventory_id,
    product_brand,
    product_category,
    product_description,
    product_tags,
    offer_price,
    expiry_date,
    product_price
  } = req.body;
  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const response = await updateInventoryProduct(vendorId, inventory_id, product_id, offer_price, product_price, product_description, product_category,
      product_brand, product_tags, expiry_date
    )
    res.status(HttpStatusCode.OK).json(response);

  } catch (error) {
    throw error;
  }
}

export const updateSavedProductQuantityAndCreateOrder = async (req: AuthenticatedVendorRequest, res: Response) => {

  const { warehouseId, products } = req.body;
  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const response = await createOrderAndUpdateProductQuantity(vendorId, warehouseId, products)
    res.status(HttpStatusCode.OK).json(response);

  } catch (error) {
    throw error;
  }
}

export const registerVendorServiceRequest = async (req: AuthenticatedVendorRequest, res: Response) => {

  const { subject, description } = req.body;

  const rootFolder = path.join(process.cwd(), 'Modules', 'Vendor', 'Uploads');

  let tradeLicenseFiles: any[] = [];
  let savedTradeFiles: { filename: string; fullPath: string }[] = [];

  if (!Array.isArray(req.files)) {
    tradeLicenseFiles = req.files?.['SR'] || [];
  }
  try {

    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    // ✅ Process each uploaded file
    for (const file of tradeLicenseFiles) {
      const savedFileName = await saveUploadedFile(file, rootFolder, "SR");
      const fullPath = path.join(rootFolder, "SR", savedFileName);

      savedTradeFiles.push({
        filename: savedFileName,
        fullPath: fullPath
      });
    }

    const savedFileName = savedTradeFiles.map(f => f.filename);

    const response = await createVendorServiceRequest(vendorId, subject, description, savedFileName);
    res.status(HttpStatusCode.OK).json(response)
  } catch (error) {
    throw error;
  }
}

export const fetchServiceRequests = async (req: AuthenticatedVendorRequest, res: Response) => {

  const { status, page, limit } = req.query;

  const parsedPage = parseInt(page as string) || 1;
  const parsedLimit = parseInt(limit as string) || 10;
  const parsedStatus = status as string || 'ALL';
  try {
    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const response = await ServiceRecordListingVendor(parsedStatus, parsedLimit, parsedPage, vendorId);
    res.status(HttpStatusCode.OK).json(response)
  } catch (error) {
    throw error;
  }

}

export const getVendorSalesDashboardController = async (req: AuthenticatedVendorRequest, res: Response) => {

  try {
    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const { filter, startDate, endDate } = req.query;

    /* ===============================
     Validation
    =============================== */

    if (filter === "CUSTOM") {
      if (!startDate || !endDate) {

        throw new AppError(
          "startDate and endDate are required for CUSTOM filter",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      if (
        !isValidDateFormat(startDate as string) ||
        !isValidDateFormat(endDate as string)
      ) {
        throw new AppError(
          "Dates must be in YYYY-MM-DD format",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      // Optional: check startDate <= endDate
      if (new Date(startDate as string) > new Date(endDate as string)) {

        throw new AppError(
          "startDate cannot be greater than endDate",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }
    }

    const result = await getVendorsalesDashboardService(vendorId, {
      filter: filter as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.status(HttpStatusCode.OK).json({
      success: true,
      result
    });

  } catch (error) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch vendor dashboard",
      error
    });
  }

}

export const getVendorOrderExchageDashboardController = async (req: AuthenticatedVendorRequest, res: Response) => {

  try {
    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const { filter, startDate, endDate } = req.query;

    /* ===============================
     Validation
    =============================== */

    if (filter === "CUSTOM") {
      if (!startDate || !endDate) {

        throw new AppError(
          "startDate and endDate are required for CUSTOM filter",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      if (
        !isValidDateFormat(startDate as string) ||
        !isValidDateFormat(endDate as string)
      ) {
        throw new AppError(
          "Dates must be in YYYY-MM-DD format",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      // Optional: check startDate <= endDate
      if (new Date(startDate as string) > new Date(endDate as string)) {

        throw new AppError(
          "startDate cannot be greater than endDate",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }
    }

    const result = await getVendorExchangeDashboardService(vendorId, {
      filter: filter as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.status(HttpStatusCode.OK).json({
      success: true,
      result
    });

  } catch (error) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch vendor dashboard",
      error
    });
  }

}

export const getVendorOrderExchageListingController = async (req: AuthenticatedVendorRequest, res: Response) => {

  try {
    let vendorId: string = "";
    if (req.vendor && typeof req.vendor === "object") {
      vendorId = req.vendor.vendorId;
    }
    if (!vendorId) throw new AppError("Vendor ID not Found")

    const { filter, startDate, endDate, status, page, limit } = req.query;


    if (filter === "CUSTOM") {
      if (!startDate || !endDate) {

        throw new AppError(
          "startDate and endDate are required for CUSTOM filter",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      if (
        !isValidDateFormat(startDate as string) ||
        !isValidDateFormat(endDate as string)
      ) {
        throw new AppError(
          "Dates must be in YYYY-MM-DD format",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }

      // Optional: check startDate <= endDate
      if (new Date(startDate as string) > new Date(endDate as string)) {

        throw new AppError(
          "startDate cannot be greater than endDate",
          HttpStatusCode.BAD_REQUEST,
          CustomCode.BadRequestCode
        );
      }
    }

    const parsedPage = parseInt(page as string) || 1;
    const parsedLimit = parseInt(limit as string) || 20;

    const result = await getVendorExchangeListService(vendorId, {
      filter: filter as string,
      startDate: startDate as string,
      endDate: endDate as string
    },status as string, parsedPage, parsedLimit);

    res.status(HttpStatusCode.OK).json({
      success: true,
      result
    });

  } catch (error) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch vendor dashboard",
      error
    });
  }

}


function isValidDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
}






