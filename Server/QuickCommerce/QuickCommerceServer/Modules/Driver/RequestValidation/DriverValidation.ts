import { body, ValidationChain } from "express-validator";

export const registerDriverValidation: ValidationChain[] = [
  body("name")
    .notEmpty().withMessage("name is required.")
    .isString().withMessage("name must be a string"),

  body("email")
    .optional({ nullable: true })
    .isEmail().withMessage("email must be a valid email"),

  body("address_line1")
    .optional({ nullable: true })
    .isString().withMessage("address_line1 must be a string"),

  body("address_line2")
    .optional({ nullable: true })
    .isString().withMessage("address_line2 must be a string"),

  body("city")
    .optional({ nullable: true })
    .isString().withMessage("city must be a string"),

  body("state")
    .optional({ nullable: true })
    .isString().withMessage("state must be a string"),

  body("postal_code")
    .optional({ nullable: true })
    .isString().withMessage("postal_code must be a string"),

  body("vehicle_number")
    .notEmpty().withMessage("vehicle_number is required.")
    .isString().withMessage("vehicle_number must be a string"),

  body("vehicle_type")
    .optional({ nullable: true })
    .isString().withMessage("vehicle_type must be a string")
];
