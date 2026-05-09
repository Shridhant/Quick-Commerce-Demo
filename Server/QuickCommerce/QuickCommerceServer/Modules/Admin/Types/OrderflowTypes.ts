import { RowDataPacket } from "mysql2";

// ─── Order Status Values ────────────────────────────────────────────────────
export enum OrderStatus {
    CREATED = "CREATED",
    CONFIRMED = "CONFIRMED",
    INITIATED = "INITIATED",
    PACKING = "PACKING",
    READY_FOR_PICKUP = "READY_FOR_PICKUP",
    ASSIGNED_TO_DRIVER = "ASSIGNED_TO_DRIVER",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    RETURNED = "RETURNED"
  }
  
  // ─── Delivery Status Values ─────────────────────────────────────────────────
  export enum DeliveryStatus {
    ASSIGNED = "ASSIGNED",
    PICKED_UP = "PICKED_UP",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
  }
  
  // ─── Push Token User Types ──────────────────────────────────────────────────
  export enum PushTokenUserType {
    DRIVER = "DRIVER",
    VENDOR = "VENDOR",
    CUSTOMER = "CUSTOMER",
  }
  
  // ─── Service Params ─────────────────────────────────────────────────────────
  export interface PackOrderParams {
    orderId: string;
  }
  
  export interface MarkReadyParams {
    orderId: string;
  }
  
  export interface GetAvailableOrdersParams {
    page: number;
    limit: number;
    sortOrder?: "ASC" | "DESC";
  }
  
  export interface AcceptOrderParams {
    orderId: string;
    driverId: string;
  }
  
  export interface PickupOrderParams {
    orderId: string;
    driverId: string;
  }
  
  export interface DeliverOrderParams {
    orderId: string;
    driverId: string;
  }
  
  // ─── DB Row Shapes (for typed query results) ───────────────────────────────
  export interface CustomerOrderRow extends RowDataPacket {
    order_id: string;
    customer_id: string;
    total_amount: number;
    order_status: string;
    payment_status: string;
    payment_method: string | null;
    created_at: Date;
    shipping_address_id: number;
    driver_id: string | null;
    driver_assigned_at: Date | null;
    remarks: string | null;
  }
  
  export interface OrderDeliveryRow {
    delivery_id: string;
    order_id: string;
    driver_id: string;
    delivery_status: string;
    assigned_at: string;
    picked_up_at: string | null;
    delivered_at: string | null;
  }
  
  export interface PushTokenRow {
    fcm_token: string;
    user_id: string;
  }