import { body, ValidationChain } from "express-validator";

export const vendorRegistrationValidation: ValidationChain[] = [
  body("password")
    .notEmpty().withMessage("password is required.")
    .isString().withMessage("password must be a string"),
  body("phone")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string")
];

export const vendorOtpValidation: ValidationChain[] = [
  body("phone")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string")
];

export const vendorLoginValidation: ValidationChain[] = [
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
  body("business_owner_name")
    .notEmpty().withMessage("business_owner_name is required.")
    .isString().withMessage("business_owner_name must be a string"),

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
    .optional({ nullable: true })
    .isString().withMessage("city must be a string"),

  body("state")
    .optional({ nullable: true })
    .isString().withMessage("state must be a string"),

  body("postal_code")
    .optional({ nullable: true })
    .isString().withMessage("postal_code must be a string"),

  body("latitude")
    .optional({ nullable: true })
    .isFloat().withMessage("latitude must be a number"),

  body("longitude")
    .optional({ nullable: true })
    .isFloat().withMessage("longitude must be a number"),

  body("country")
    .optional({ nullable: true })
    .isString().withMessage("country must be a string"),

  body("gstId")
    .notEmpty().withMessage("gstId is required.")
    .isString().withMessage("gstId must be a string"),
  body('warehouseIds')
    .isString().withMessage('Each warehouseIds must be a string')
    .notEmpty().withMessage('warehouseIds cannot be empty'),
];

export const vendorEditProfileValidation: ValidationChain[] = [
  body("name")
    .notEmpty().withMessage("name is required.")
    .isString().withMessage("name must be a string"),
  body("phone")
    .notEmpty().withMessage("phone is required.")
    .isString().withMessage("phone must be a string"),
  body("business_owner_name")
    .notEmpty().withMessage("business_owner_name is required.")
    .isString().withMessage("business_owner_name must be a string"),

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
    .optional({ nullable: true })
    .isString().withMessage("city must be a string"),

  body("state")
    .optional({ nullable: true })
    .isString().withMessage("state must be a string"),

  body("postal_code")
    .optional({ nullable: true })
    .isString().withMessage("postal_code must be a string"),

  body("latitude")
    .optional({ nullable: true })
    .isFloat().withMessage("latitude must be a number"),

  body("longitude")
    .optional({ nullable: true })
    .isFloat().withMessage("longitude must be a number")
];

// export const createOrAddProductValidation: ValidationChain[] = [
//   body("type")
//     .notEmpty().withMessage("type is required.")
//     .isIn(["ADD_PRODUCT", "UPDATE_PRODUCT"]).withMessage("type must be 'ADD_PRODUCT' or 'UPDATE_PRODUCT'."),

//   body("requested_quantity")
//     .notEmpty().withMessage("requested_quantity is required.")
//     .isInt({ gt: 0 }).withMessage("requested_quantity must be a positive integer."),

//   // Conditional fields based on 'type'
//   body("product_name")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_name is required for ADD_PRODUCT.")
//     .isString().withMessage("product_name must be a string."),

//   body("product_brand")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_brand is required for ADD_PRODUCT.")
//     .isString().withMessage("product_brand must be a string."),

//   body("product_category_id")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_category_id is required for ADD_PRODUCT.")
//     .isString().withMessage("product_category_id must be a string."),

//   body("product_unit")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_unit is required for ADD_PRODUCT.")
//     .isString().withMessage("product_unit must be a string."),

//   body("product_description")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .optional({ nullable: true })
//     .isString().withMessage("product_description must be a string."),

//   body("product_sku")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .isString().withMessage("product_sku must be a string."),

//   body("product_tags")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .optional({ nullable: true })
//     .isString().withMessage("product_tags must be a string."),

//   body("product_price")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .isFloat().withMessage("product_price must be a string.").toFloat(),

//   body("product_id")
//     .if(body("type").equals("UPDATE_PRODUCT"))
//     .notEmpty().withMessage("product_id is required for UPDATE_PRODUCT.")
//     .isString().withMessage("product_id must be a string.")
// ]
// export const createOrAddProductValidation: ValidationChain[] = [
//   body("type")
//     .notEmpty().withMessage("type is required.")
//     .isIn(["ADD_PRODUCT", "UPDATE_PRODUCT"]).withMessage("type must be 'ADD_PRODUCT' or 'UPDATE_PRODUCT'."),
//   body("warehouseId")
//     .notEmpty().withMessage("warehouseId is required.")
//     .isString().withMessage("warehouseId must be a string"),
//   body("products")
//     .isArray({ min: 1 }).withMessage("products must be a non-empty array."),

//   body("products.*.requested_quantity")
//     .notEmpty().withMessage("requested_quantity is required.")
//     .isInt({ gt: 0 }).withMessage("requested_quantity must be a positive integer."),

//   body("products.*.product_id")
//     .if(body("type").equals("UPDATE_PRODUCT"))
//     .notEmpty().withMessage("product_id is required for UPDATE_PRODUCT.")
//     .isString().withMessage("product_id must be a string."),

//   body("products.*.product_name")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_name is required.")
//     .isString(),

//   body("products.*.product_brand")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_brand is required.")
//     .isString(),

//   body("products.*.product_category")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_category is required.")
//     .isString(),

//   body("products.*.product_unit")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_unit is required.")
//     .isString(),

//   body("products.*.product_description")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .optional({ nullable: true }).isString(),

//   body("products.*.product_sku")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .optional({ nullable: true }).isString(),

//   body("products.*.product_tags")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .optional({ nullable: true }).isString(),

//   body("products.*.offer_price")
//     .optional({ nullable: true }).isInt(),

//   body("products.*. unit_size")
//     .optional({ nullable: true }).isInt(),

//   body("products.*.expiry_date")
//     .optional({ nullable: true })
//     .matches(/^\d{4}-\d{2}-\d{2}$/)
//     .isISO8601({ strict: true })
//     .withMessage("expiry_date must be a valid date in YYYY-MM-DD format"),

//   body("products.*.product_price")
//     .if(body("type").equals("ADD_PRODUCT"))
//     .notEmpty().withMessage("product_price is required.")
//     .isFloat().withMessage("product_price must be a number.").toFloat()
// ];

export const createOrAddProductValidation: ValidationChain[] = [
  body("type")
    .notEmpty().withMessage("type is required.")
    .isIn(["ADD_PRODUCT"]).withMessage("type must be 'ADD_PRODUCT'."),

  body("order_id")
    .if(body("type").equals("UPDATE_PRODUCT"))
    .notEmpty().withMessage("order_id is required for UPDATE_PRODUCT.")
    .isString().withMessage("order_id must be a string."),

  body("warehouseId")
    .notEmpty().withMessage("warehouseId is required.")
    .isString().withMessage("warehouseId must be a string"),

  body("products")
    .customSanitizer(value => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          throw new Error("Invalid JSON in products field");
        }
      }
      return value;
    })
    .isArray({ min: 1 }).withMessage("products must be a non-empty array."),

  body("products.*.requested_quantity")
    .notEmpty().withMessage("requested_quantity is required.")
    .isInt({ gt: 0 }).withMessage("requested_quantity must be a positive integer."),

  body("products.*.product_id")
    .if(body("type").equals("UPDATE_PRODUCT"))
    .notEmpty().withMessage("product_id is required for UPDATE_PRODUCT.")
    .isString().withMessage("product_id must be a string."),

  body("products.*.product_name")
    .if(body("type").equals("ADD_PRODUCT"))
    .notEmpty().withMessage("product_name is required.")
    .isString(),

  body("products.*.product_brand")
    .if(body("type").equals("ADD_PRODUCT"))
    .notEmpty().withMessage("product_brand is required.")
    .isString(),

  body("products.*.product_category")
    .if(body("type").equals("ADD_PRODUCT"))
    .notEmpty().withMessage("product_category is required.")
    .isString(),

  body("products.*.product_unit")
    .if(body("type").equals("ADD_PRODUCT"))
    .notEmpty().withMessage("product_unit is required.")
    .isString(),

  body("products.*.product_description")
    .if(body("type").equals("ADD_PRODUCT"))
    .optional({ nullable: true }).isString(),

  body("products.*.product_sku")
    .if(body("type").equals("ADD_PRODUCT"))
    .optional({ nullable: true }).isString(),

  body("products.*.product_tags")
    .if(body("type").equals("ADD_PRODUCT"))
    .optional({ nullable: true }).isString(),

  body("products.*.offer_price")
    .optional({ nullable: true }).isFloat().withMessage("offer_price must be a number."),

  body("products.*.unit_size") // ✅ fixed space
    .optional({ nullable: true }).isInt().withMessage("unit_size must be an integer."),

  body("products.*.expiry_date")
    .optional({ nullable: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("expiry_date must be a valid date in YYYY-MM-DD format"),

  body("products.*.product_price")
    .notEmpty().withMessage("product_price is required.")
    .isFloat().withMessage("product_price must be a number.").toFloat(),
];

export const validateUpdateOrderProduct: ValidationChain[] = [
  body("orderId")
    .notEmpty().withMessage("orderId is required.")
    .isString().withMessage("orderId must be a valid string."),

  body("product_id")
    .notEmpty().withMessage("product_id is required.")
    .isString().withMessage("product_id must be a string."),

  body("product_brand")
    .optional({ nullable: true }).isString()
    .isString().withMessage("product_brand must be a string."),

  body("product_category")
    .notEmpty().withMessage("product_category is required.")
    .isString().withMessage("product_category must be a string."),

  body("product_unit")
    .optional({ nullable: true }).isString()
    .isString().withMessage("product_unit must be a string."),

  body("product_description")
    .optional({ nullable: true }).isString().withMessage("product_description must be a string."),

  body("product_tags")
    .optional({ nullable: true }).isString().withMessage("product_tags must be a string."),

  body("offer_price")
    .optional({ nullable: true }).isFloat().withMessage("offer_price must be a number."),

  body("unit_size")
    .optional({ nullable: true }).isInt().withMessage("unit_size must be an integer."),

  body("expiry_date")
    .optional({ nullable: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("expiry_date must be a valid date in YYYY-MM-DD format"),

  body("product_price")
    .notEmpty().withMessage("product_price is required.")
    .isFloat().withMessage("product_price must be a number.").toFloat(),
]

export const validateInventoryProductUpdate: ValidationChain[] = [
  body("product_id")
    .notEmpty().withMessage("product_id is required.")
    .isString().withMessage("product_id must be a string."),

  body("inventory_id")
    .notEmpty().withMessage("inventory_id is required.")
    .isString().withMessage("inventory_id must be a string."),

  body("product_brand")
    .optional({ nullable: true }).isString()
    .isString().withMessage("product_brand must be a string."),

  body("product_category")
    .notEmpty().withMessage("product_category is required.")
    .isString().withMessage("product_category must be a string."),

  body("product_description")
    .optional({ nullable: true }).isString().withMessage("product_description must be a string."),

  body("product_tags")
    .optional({ nullable: true }).isString().withMessage("product_tags must be a string."),

  body("offer_price")
    .optional({ nullable: true }).isFloat().withMessage("offer_price must be a number."),

  body("expiry_date")
    .optional({ nullable: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("expiry_date must be a valid date in YYYY-MM-DD format"),

  body("product_price")
    .notEmpty().withMessage("product_price is required.")
    .isFloat().withMessage("product_price must be a number.").toFloat(),
]

export const validateChCOdeArray: ValidationChain[] = [
  body('warehouseIds')
    .isArray({ min: 1 }).withMessage('warehouseIds must be a non-empty array'),
  body('warehouseIds.*')
    .isString().withMessage('Each warehouseIds must be a string')
    .notEmpty().withMessage('warehouseIds cannot be empty'),
];

export const createAndUpdateProductQuantityValidator = [
  body("warehouseId")
    .exists().withMessage("warehouseId is required")
    .bail()
    .isString().withMessage("warehouseId must be a string")
    .bail()
    .notEmpty().withMessage("warehouseId cannot be empty"),

  body("products")
    .exists().withMessage("products array is required")
    .bail()
    .isArray({ min: 1 }).withMessage("products must be a non-empty array"),

  body("products.*.productId")
    .exists().withMessage("productId is required for each product")
    .bail()
    .isString().withMessage("productId must be a string")
    .bail()
    .notEmpty().withMessage("productId cannot be empty"),

  body("products.*.quantity")
    .exists().withMessage("quantity is required for each product")
    .bail()
    .isInt({ gt: 0 }).withMessage("quantity must be a positive integer"),
];

export const registerSRValidation: ValidationChain[] = [

  body("subject")
    .exists().withMessage("subject is required")
    .bail()
    .isString().withMessage("subject must be a string")
    .bail()
    .notEmpty().withMessage("subject cannot be empty"),
  body("description")
    .optional({ nullable: true })
    .isString().withMessage("description must be a string"),

];

