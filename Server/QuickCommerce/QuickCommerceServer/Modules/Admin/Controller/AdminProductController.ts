import fs from "fs/promises";
import path from "path";
import { Request, Response } from "express";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { saveUploadedFile } from "../../../StandardUtility/FileUpload";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
  getStoredProductImageUrls,
  deleteStoredProductImage,
} from "../Services/AdminProductService";

const PRODUCT_UPLOAD_ROOT = path.join(process.cwd(), "Uploads");

const getUploadedProductFiles = (req: Request) =>
  ((req.files as { [fieldname: string]: Express.Multer.File[] } | undefined)?.product ?? []);

const removeSavedFiles = async (fileNames: string[]) => {
  await Promise.all(
    fileNames.map(async (fileName) => {
      try {
        await fs.unlink(path.join(PRODUCT_UPLOAD_ROOT, "product", fileName));
      } catch {
        // Preserve the original error path if cleanup fails.
      }
    })
  );
};

export const fetchAllProducts = async (req: Request, res: Response) => {
  try {
    const { category, is_active, search, page, limit } = req.query;
    const response = await getAllProducts(
      category as string,
      is_active as string,
      search as string,
      parseInt(page as string, 10) || 1,
      parseInt(limit as string, 10) || 20
    );
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

export const fetchProductById = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const response = await getProductById(productId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

export const addProduct = async (req: Request, res: Response) => {
  const uploadedFiles = getUploadedProductFiles(req);
  const savedFileNames: string[] = [];

  try {
    const { name, description, category, unit, image_url, sku, brand, tags, unit_size } = req.body;

    for (const file of uploadedFiles) {
      const savedFileName = await saveUploadedFile(file, PRODUCT_UPLOAD_ROOT, sku);
      savedFileNames.push(savedFileName);
    }

    const response = await createProduct({
      name,
      description,
      category,
      unit,
      image_url: savedFileNames.length > 0 ? savedFileNames.join(",") : image_url,
      sku,
      brand,
      tags,
      unit_size: unit_size ? parseInt(unit_size, 10) : undefined,
    });

    res.status(HttpStatusCode.CREATED).json(response);
  } catch (err) {
    await removeSavedFiles(savedFileNames);
    throw err;
  }
};

export const editProduct = async (req: Request, res: Response) => {
  const uploadedFiles = getUploadedProductFiles(req);
  const savedFileNames: string[] = [];

  try {
    const { productId } = req.params;
    const { name, description, category, unit, image_url, sku, brand, tags, unit_size } = req.body;

    let finalImageUrl = image_url;

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        const savedFileName = await saveUploadedFile(file, PRODUCT_UPLOAD_ROOT, sku || productId);
        savedFileNames.push(savedFileName);
      }
      finalImageUrl = savedFileNames.join(",");
    } else if (typeof image_url === "undefined" || (typeof image_url === "string" && image_url.includes("/uploads/products/"))) {
      finalImageUrl = await getStoredProductImageUrls(productId);
    }

    const response = await updateProduct(productId, {
      name,
      description,
      category,
      unit,
      image_url: finalImageUrl,
      sku,
      brand,
      tags,
      unit_size: unit_size ? parseInt(unit_size, 10) : undefined,
    });

    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    await removeSavedFiles(savedFileNames);
    throw err;
  }
};

export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      res.status(400).json({ success: false, message: "is_active must be a boolean" });
      return;
    }

    const response = await toggleProductStatus(productId, is_active);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

export const removeProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const response = await deleteProduct(productId);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};

export const removeProductImage = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { imageName } = req.body;

    if (!imageName || typeof imageName !== "string") {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "imageName is required",
      });
      return;
    }

    const response = await deleteStoredProductImage(productId, imageName);

    try {
      await fs.unlink(path.join(PRODUCT_UPLOAD_ROOT, "product", imageName));
    } catch {
      // If the DB update succeeded but the file is already missing, keep the API successful.
    }

    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    throw err;
  }
};
