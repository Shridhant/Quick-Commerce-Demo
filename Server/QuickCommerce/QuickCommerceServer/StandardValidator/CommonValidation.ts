import { body, ValidationChain } from "express-validator";


export const userOtpValidation: ValidationChain[] = [
  body("phone")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string")
];

export const userLoginValidation: ValidationChain[] = [
  body("phone")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string"),
  body("otp")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string")
];

export const vendorUpdateProfileValidation: ValidationChain[] = [
  body("name")
    .notEmpty().withMessage("name is required.")
    .isString().withMessage("name must be a string"),

  body("email")
    .optional({ nullable: true })
    .isString().withMessage("email must be a string"),

  body("address_line1")
    .notEmpty().withMessage("address_line1 is required.")
    .isString().withMessage("address_line1 must be a string"),

  body("address_line2")
    .optional({ nullable: true })
    .isString().withMessage("address_line2 must be a string"),

  body("city")
    .notEmpty().withMessage("city is required.")
    .isString().withMessage("city must be a string"),

  body("state")
    .notEmpty().withMessage("state is required.")
    .isString().withMessage("state must be a string"),

  body("postal_code")
    .notEmpty().withMessage("postal_code is required.")
    .isString().withMessage("postal_code must be a string"),

  body("latitude")
    .notEmpty().withMessage("latitude is required.")
    .isFloat().withMessage("latitude must be a number"),

  body("longitude")
    .notEmpty().withMessage("longitude is required.")
    .isFloat().withMessage("longitude must be a number"),

  body("country")
    .notEmpty().withMessage("country is required.")
    .isString().withMessage("country must be a string"),

  body("gstId")
    .notEmpty().withMessage("gstId is required.")
    .isString().withMessage("gstId must be a string"),
];
