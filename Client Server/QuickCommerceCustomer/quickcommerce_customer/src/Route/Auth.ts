import express, { Request, Response, NextFunction } from "express";
import { customerLoginValidation, customerOtpValidation } from "../Validation/AuthValidator";
import { validateRequest } from "../Middleware/RequestBodyValidator";
import { loginCustomer, sendOtpToCustomer } from "../Controller/AuthController";

const router = express.Router();

 router.post("/send-otp", customerOtpValidation, validateRequest, sendOtpToCustomer);

 router.post("/validateLogin",customerLoginValidation , validateRequest,loginCustomer);

export default router;