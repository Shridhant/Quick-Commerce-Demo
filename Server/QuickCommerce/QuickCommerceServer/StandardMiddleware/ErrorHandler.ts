import { Request, Response, NextFunction } from "express";
import { AppError } from "../StandardUtility/AppError";
import { HttpStatusCode } from "../StandardUtility/HttpStatusCode";
import { CustomCode } from "../StandardUtility/CustomCode";
import { NODE_ENV } from "../Modules/StandardConfig/SettingsReader";


export const errorHandler = async (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = (err as AppError).status || HttpStatusCode.INTERNAL_SERVER_ERROR;

  const errorResponse: Record<string, any> = {
    status,
    message: err.message || "Internal Server Error",
    errors: (err as AppError).errors || [],
    code: (err as AppError).code || CustomCode.ServerErrorCode,
  };

  if (NODE_ENV !== "production") {
    errorResponse.stackTrace = err.stack;
  }

  res.status(status).json(errorResponse);
};
