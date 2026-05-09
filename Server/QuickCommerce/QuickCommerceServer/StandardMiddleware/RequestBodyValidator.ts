import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../StandardUtility/AppError";
import { HttpStatusCode } from "../StandardUtility/HttpStatusCode";
import { CustomCode } from "../StandardUtility/CustomCode";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errorMap: Record<string, string[]> = {};

  result.array().forEach((err: any) => {
    if (!errorMap[err.path]) errorMap[err.path] = [];
    errorMap[err.path].push(err.msg);
  });

  const formattedErrors = Object.entries(errorMap).map(
    ([field, errors]) => ({
      field,
      errors,
    })
  );

  return next(
    new AppError(
      "Validation Failed",
      HttpStatusCode.BAD_REQUEST,
      CustomCode.BadRequestCode,
      formattedErrors
    )
  );
};
