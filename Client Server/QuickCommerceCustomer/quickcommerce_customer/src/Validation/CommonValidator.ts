import { body, ValidationChain } from "express-validator";


export const customerUpdateProfileValidation: ValidationChain[] = [
  body("name")
    .notEmpty().withMessage("name is required.")
    .isString().withMessage("name must be a string"),

  body("email")
    .optional({ nullable: true })
    .isEmail().withMessage("email must be valid"),

  body("phone")
    .optional({ nullable: true })
    .isString().withMessage("phone must be a string"),

];

export const addAddress: ValidationChain[] = [

  body("address_line1")
    .notEmpty().withMessage("address_line1 is required.")
    .isString().withMessage("address_line1 must be a string"),

  body("phone_number")
    .notEmpty().withMessage("phone_number is required.")
    .isString().withMessage("phone_number must be a string"),

  body("address_line2")
    .optional({ nullable: true })
    .isString().withMessage("address_line2 must be a string"),

  body("city")
    .notEmpty().withMessage("city is required.")
    .isString().withMessage("city must be a string"),

  body("state")
    .optional({ nullable: true })
    .isString().withMessage("state must be a string"),

  body("is_default")
    .optional({ nullable: true })
    .isBoolean().withMessage("is_default must be a true/false"),

  body("landmark")
    .optional({ nullable: true })
    .isString().withMessage("landmark must be a string"),

  body("postal_code")
    .notEmpty().withMessage("postal_code is required.")
    .isString().withMessage("postal_code must be a string"),

  body("latitude")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage("latitude must be between -90 and 90"),

  body("longitude")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage("longitude must be between -180 and 180"),
];

export const addProductToCardValidation: ValidationChain[] = [
  body("vendorId")
    .notEmpty().withMessage("vendorId is required.")
    .isString().withMessage("vendorId must be a string"),

  body("inventoryId")
    .notEmpty().withMessage("inventoryId is required.")
    .isString().withMessage("inventoryId must be a string"),

  body("productId")
    .notEmpty().withMessage("productId is required.")
    .isString().withMessage("productId must be a string"),

  body("quantity")
    .notEmpty().withMessage("quantity is required.")
    .isInt().withMessage("quantity must be valid")
];

export const paymentOrderCreateValidation: ValidationChain[] = [
  body("shippingAddressId").notEmpty().withMessage("shippingAddressId is required.").isInt({ gt: 0 }).withMessage("shippingAddressId must be a positive number"),
  body("totalAmount").notEmpty().withMessage("totalAmount is required.").isFloat({ gt: 0 }).withMessage("totalAmount must be greater than 0"),
  body("paymentMode").notEmpty().withMessage("paymentMode is required.").isString().withMessage("paymentMode must be a string"),
  body("items").isArray({ min: 1 }).withMessage("Items array is required and cannot be empty"),
  body("items.*.product_id").notEmpty().withMessage("product_id is required.").isString().withMessage("product_id must be a string"),
  body("items.*.vendorId").notEmpty().withMessage("vendorId is required.").isString().withMessage("vendorId must be a string"),
   body("items.*.cart_item_id")
    .notEmpty().withMessage("cart_item_id is required.")
    .isString().withMessage("cart_item_id must be a string"),
  body("items.*.inventory_id").notEmpty().withMessage("inventory_id is required.").isString().withMessage("inventory_id must be a string"),
  body("items.*.quantity").notEmpty().withMessage("quantity is required.").isInt({ gt: 0 }).withMessage("quantity must be a positive number"),
  body("items.*.price").notEmpty().withMessage("price is required.").isFloat({ gt: 0 }).withMessage("price must be greater than 0"),
  body("orderId").optional({nullable : true}).isString().withMessage("orderId must be a string")
];

export const verifyPaymentValidation: ValidationChain[] = [

  body("razorpay_order_id")
    .notEmpty().withMessage("razorpay_order_id is required.")
    .isString().withMessage("razorpay_order_id must be a string"),

  body("razorpay_payment_id")
    .notEmpty().withMessage("razorpay_payment_id is required.")
    .isString().withMessage("razorpay_payment_id must be a string"),

  body("razorpay_signature")
    .notEmpty().withMessage("razorpay_signature is required.")
    .isString().withMessage("razorpay_signature must be a string"),

  body("orderId")
    .notEmpty().withMessage("orderId is required.")
    .isString().withMessage("orderId must be a string")
];

export const createOrderValidation: ValidationChain[] = [
  body("total_amount")
    .notEmpty().withMessage("total_amount is required.")
    .isFloat({ gt: 0 })
    .withMessage("total_amount must be a positive number"),

  body("payment_method")
    .notEmpty().withMessage("payment_method is required.")
    .isIn(["COD", "CARD", "UPI", "BANK_TRANSFER"])
    .withMessage("Invalid payment_method"),

  body("shipping_address_id")
    .notEmpty().withMessage("shipping_address_id is required.")
    .isInt({ gt: 0 })
    .withMessage("shipping_address_id must be a positive integer"),

  // items must be an array with at least one object
  body("items")
    .isArray({ min: 1 })
    .withMessage("items must be an array with at least one item"),

  body("items.*.cart_item_id")
    .notEmpty().withMessage("cart_item_id is required.")
    .isString().withMessage("cart_item_id must be a string"),

  body("items.*.quantity")
    .notEmpty().withMessage("quantity is required.")
    .isInt({ gt: 0 })
    .withMessage("quantity must be a positive integer"),

  body("items.*.product_id")
    .notEmpty().withMessage("product_id is required.")
    .isString().withMessage("product_id must be a string"),

  body("items.*.price_at_purchase")
    .notEmpty().withMessage("price_at_purchase is required.")
    .isFloat({ gt: 0 })
    .withMessage("price_at_purchase must be a positive number"),
];

export const createSavePushTokenValidation: ValidationChain[] = [
  body("pushToken")
    .notEmpty().withMessage("pushToken is required.")
    .isString().withMessage("pushToken must be a string"),

  body("platform")
    .notEmpty().withMessage("platform is required.")
    .isIn(["ANDROID", "IOS", "WEB"])
    .withMessage("platform must be one of ANDROID, IOS, WEB"),

  body("deviceId")
    .optional({ nullable: true })
    .isString().withMessage("deviceId must be a string"),

  body("deviceModel")
    .optional({ nullable: true })
    .isString().withMessage("deviceModel must be a string"),

  body("appVersion")
    .optional({ nullable: true })
    .isString().withMessage("appVersion must be a string"),
];

export const cancelOrderValidation: ValidationChain[] = [
  body("orderId")
    .notEmpty().withMessage("orderId is required.")
    .isString().withMessage("orderId must be a string"),
  body("remarks")
    .notEmpty().withMessage("remarks is required.")
    .isString().withMessage("remarks must be a string")
];

export const createExchangeValidation = [
  body("orderId")
    .notEmpty()
    .withMessage("orderId is required")
    .isString()
    .withMessage("orderId must be string"),

  body("reason")
    .optional({nullable : true})
    .isString()
    .withMessage("reason must be string")
    .isLength({ max: 255 })
    .withMessage("reason max length is 255"),

  body("notes")
    .optional({nullable : true})
    .isString()
    .withMessage("notes must be string"),

  body("items")
    .custom((value) => Array.isArray(value) && value.length > 0)
    .withMessage("items must be a non-empty array"),

  body("items.*.vendorId")
    .notEmpty()
    .withMessage("vendorId is required")
    .isString(),

  body("items.*.productId")
    .notEmpty()
    .withMessage("productId is required")
    .isString(),

  body("items.*.inventoryId")
    .notEmpty()
    .withMessage("inventoryId is required")
    .isString(),

  body("items.*.quantity")
    .notEmpty()
    .withMessage("quantity is required")
    .isInt({ min: 1 })
    .withMessage("quantity must be at least 1"),
];

