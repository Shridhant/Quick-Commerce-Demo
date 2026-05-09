import { body, ValidationChain } from "express-validator";


export const customerOtpValidation: ValidationChain[] = [
  body("phone")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string")
];

export const customerLoginValidation: ValidationChain[] = [
  body("phone")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string"),
  body("otp")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string")
];