import { body, ValidationChain } from "express-validator";

export const adminLoginValidation: ValidationChain[] = [
  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isString()
    .withMessage("Email must be a string.")
    .isEmail()
    .withMessage("Email must be a valid email address."),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isString()
    .withMessage("Password must be a string."),
];

export const addWarehouseValidation: ValidationChain[] = [
  body("name")
    .notEmpty()
    .withMessage("name is required.")
    .isString()
    .withMessage("name must be a string"),
  body("address_line1")
    .notEmpty()
    .withMessage("address_line1 is required.")
    .isString()
    .withMessage("address_line1 must be a string"),
  body("address_line2")
    .optional({ nullable: true })
    .isString()
    .withMessage("address_line2 must be a string"),
  body("city")
    .notEmpty()
    .withMessage("city is required.")
    .isString()
    .withMessage("city must be a string"),
  body("state")
    .notEmpty()
    .withMessage("state is required.")
    .isString()
    .withMessage("state must be a string"),
  body("postal_code")
    .notEmpty()
    .withMessage("postal_code is required.")
    .isString()
    .withMessage("postal_code must be a string"),
  body("country")
    .notEmpty()
    .withMessage("country is required.")
    .isString()
    .withMessage("country must be a string"),
  body("latitude")
    .notEmpty()
    .withMessage("latitude is required.")
    .isFloat()
    .withMessage("latitude must be a number"),
  body("longitude")
    .notEmpty()
    .withMessage("longitude is required.")
    .isFloat()
    .withMessage("longitude must be a number"),
];

export const approveOrderValidation: ValidationChain[] = [
  body("orderId")
    .notEmpty()
    .withMessage("orderId is required.")
    .isString()
    .withMessage("orderId must be a string"),
  body("vendorId")
    .notEmpty()
    .withMessage("vendorId is required.")
    .isString()
    .withMessage("vendorId must be a string"),
];

export const vendorListingValidation: ValidationChain[] = [
  body("status")
    .notEmpty()
    .withMessage("status is required.")
    .isString()
    .withMessage("status must be a string")
    .isIn(["PENDING", "ACTIVE", "INACTIVE"])
    .withMessage("type must be 'PENDING' or 'ACTIVE' or 'INACTIVE'."),

  body("documentVerified")
    .notEmpty()
    .withMessage("documentVerified is required.")
    .isInt()
    .withMessage("documentVerified must be number")
    .isIn([1, 0])
    .withMessage("type must be 1 or 0."),
];

export const verifyVendorAndAssignWarehouseValidation: ValidationChain[] = [
  body("vendorId")
    .notEmpty()
    .withMessage("vendorId is required.")
    .isString()
    .withMessage("vendorId must be a string"),
];

export const addAdminValidation: ValidationChain[] = [
  body("name")
    .notEmpty()
    .withMessage("name is required.")
    .isString()
    .withMessage("name must be a string"),
  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isString()
    .withMessage("Email must be a string.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  body("assigned_warehouse")
    .optional({ nullable: true })
    .isString()
    .withMessage("assigned_warehouse must be a string"),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isString()
    .withMessage("Password must be a string."),
];
