import { Request, Response, NextFunction } from "express";
import { AppError } from "../Config/AppError";
import { HttpStatusCode } from "../Config/HttpStatusCode";
import { CustomCode } from "../Config/CustomCode";
import { NODE_ENV } from "../Config/SettingReader";


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
