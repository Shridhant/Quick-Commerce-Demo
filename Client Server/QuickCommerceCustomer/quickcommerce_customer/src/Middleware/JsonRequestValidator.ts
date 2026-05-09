import { AppError } from "../Config/AppError";
import { CustomCode } from "../Config/CustomCode";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import { Request, Response, NextFunction } from "express";

export const parseItemsJson = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.items) {
      req.body.items = JSON.parse(req.body.items);
    }
    next();
  } catch (error) {
    return next(
      new AppError(
        "Invalid JSON format in items",
        HttpStatusCode.BAD_REQUEST,
        CustomCode.BadRequestCode
      )
    );
  }
};
