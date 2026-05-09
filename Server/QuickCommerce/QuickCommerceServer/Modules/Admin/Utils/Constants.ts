// utils/constants.ts

export enum HttpStatusCode {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    Conflict = 409,
    InternalServerError = 500
  }
  
  export enum CustomCode {
    SuccessCode = "SUCCESS",
    ValidationError = "VALIDATION_ERROR",
    NotFound = "NOT_FOUND",
    Unauthorized = "UNAUTHORIZED",
    Forbidden = "FORBIDDEN",
    AlreadyExists = "ALREADY_EXISTS",
    InternalError = "INTERNAL_ERROR"
  }
  
  export enum OrderStatus {
    INITIATED = "INITIATED",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
  }
  
  export enum PaymentStatus {
    UNPAID = "UNPAID",
    PAID = "PAID",
    REFUNDED = "REFUNDED"
  }
  
  export enum DriverStatus {
    AVAILABLE = "AVAILABLE",
    BUSY = "BUSY",
    OFFLINE = "OFFLINE"
  }