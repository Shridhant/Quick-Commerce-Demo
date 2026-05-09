import { Request, Response, NextFunction } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../Services/CategoryService'
import { AppError } from "../../../StandardUtility/AppError";
import { HttpStatusCode } from "../../../StandardUtility/HttpStatusCode";
import { CustomCode } from "../../../StandardUtility/CustomCode";


export const fetchCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getAllCategories();
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    next(err);
  }
};

export const fetchCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError("Invalid category ID", HttpStatusCode.BAD_REQUEST);
    }

    const response = await getCategoryById(id);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    next(err);
  }
};

export const addCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, status } = req.body;
    if (!name || !status) {
      throw new AppError("Name and status are required", HttpStatusCode.BAD_REQUEST);
    }

    const response = await createCategory(name, status);
    res.status(HttpStatusCode.CREATED).json(response);
  } catch (err) {
    next(err);
  }
};

export const editCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { name, status } = req.body;
    if (isNaN(id) || !name || !status) {
      throw new AppError("Invalid input", HttpStatusCode.BAD_REQUEST);
    }

    const response = await updateCategory(id, name, status);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    next(err);
  }
};

export const removeCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError("Invalid category ID", HttpStatusCode.BAD_REQUEST);
    }

    const response = await deleteCategory(id);
    res.status(HttpStatusCode.OK).json(response);
  } catch (err) {
    next(err);
  }
};
