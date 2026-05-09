export interface DashboardOverview {
    total_orders: number;
    active_users: number;
    active_vendors: number;
    active_drivers: number;
    active_products: number;
    today_revenue: number;
    today_orders: number;
  }
  
  export interface OrderTrend {
    date: string;
    order_count: number;
    completed_orders: number;
    pending_orders: number;
    cancelled_orders: number;
  }
  
  export interface RevenueData {
    period: string;
    revenue: number;
    discounted_revenue: number;
    order_count: number;
    avg_order_value: number;
  }
  
  export interface ProductPerformance {
    product_id: string;
    product_name: string;
    product_category: string;
    product_brand: string;
    total_quantity_sold: number;
    order_count: number;
    total_revenue: number;
    avg_price: number;
    avg_quantity_per_order: number;
  }
  
  export interface VendorPerformance {
    vendor_id: string;
    vendor_name: string;
    city: string;
    state: string;
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    unique_products_sold: number;
    completion_rate: number;
  }
  
  export interface GeographicData {
    location: string;
    order_count: number;
    total_revenue: number;
    vendor_count: number;
    avg_order_value: number;
  }
  
  export interface InventoryAnalytics {
    warehouseStats: {
      warehouse_id: string;
      warehouse_name: string;
      city: string;
      total_products: number;
      total_stock: number;
      avg_stock_per_product: number;
      low_stock_products: number;
      out_of_stock_products: number;
    }[];
    categoryInventory: {
      category: string;
      product_count: number;
      total_stock: number;
      avg_stock: number;
    }[];
  }