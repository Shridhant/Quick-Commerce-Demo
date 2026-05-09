import { body, ValidationChain } from "express-validator";

export const addFcmTokenValidation: ValidationChain[] = [
    body("fcmToken")
        .notEmpty().withMessage("fcmToken is required.")
        .isString().withMessage("fcmToken must be a string"),
    body("device_id")
        .notEmpty().withMessage("device_id is required.")
        .isString().withMessage("device_id must be a string"),

    body("user_type")
        .notEmpty().withMessage("user_type is required.")
        .isIn(["DRIVER", "VENDOR", "CUSTOMER"])
        .isString().withMessage("user_type must be a string"),

    body("appType")
        .notEmpty().withMessage("appType is required.")
        .isIn(["DRIVER_VENDOR_APP", "CUSTOMER_APP"])
        .isString().withMessage("appType must be a string"),

    body("phone")
        .optional({ nullable: true })
        .isString().withMessage("phone must be a string"),
    body("user_id")
        .optional({ nullable: true })
        .isString().withMessage("user_id must be a string"),

    body("deviceType")
        .notEmpty().withMessage("deviceType is required.")
        .isIn(["ANDROID", "IOS"]).withMessage("deviceType must be either ANDROID or IOS")
        .isString().withMessage("deviceType must be a string")
];