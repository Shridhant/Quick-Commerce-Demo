"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export interface Warehouse {
  warehouse_id: string
  name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  latitude?: number
  longitude?: number
  status: "ACTIVE" | "INACTIVE"
  created_at: string
  updated_at?: string
}

interface WarehousesResponse {
  success: boolean
  message: string
  result?: Warehouse[]
  totalWarehouses?: number
  totalPages?: number
  currentPage?: number
}

interface PaginationInfo {
  totalWarehouses: number
  totalPages: number
  currentPage: number
}

interface CreateWarehousePayload {
  name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  latitude: number | null
  longitude: number | null
}

export function useWarehouses(status: "ACTIVE" | "INACTIVE", page = 1, limit = 10) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalWarehouses: 0,
    totalPages: 0,
    currentPage: 1,
  })

  const fetchWarehouses = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: limit.toString(),
      })

      const response = await apiFetch(`/warehouses?${params.toString()}`)

      const data: WarehousesResponse = await response.json()

      if (response.ok && data.success) {
        setWarehouses(data.result || [])
        setPagination({
          totalWarehouses: data.totalWarehouses || 0,
          totalPages: data.totalPages || 0,
          currentPage: data.currentPage || 1,
        })
      } else {
        toast.error(data.message || "Failed to fetch warehouses")
        setWarehouses([])
      }
    } catch (error) {
      toast.error("Network error occurred while fetching warehouses")
      setWarehouses([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [status, page, limit])

  const createWarehouse = async (payload: CreateWarehousePayload) => {
    const response = await apiFetch("/warehouses", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to create warehouse")
    }

    toast.success("Warehouse created successfully")
    await fetchWarehouses()
    return data
  }

  return {
    warehouses,
    isLoading,
    pagination,
    refetch: fetchWarehouses,
    createWarehouse,
  }
}

// Warehouse Analytics Types
interface WarehouseAnalyticsOverview {
  total_warehouses: number
  active_warehouses: number
  total_inventory_items: number
  total_stock_quantity: number
  total_vendors_served: number
  unique_products_stored: number
}

interface WarehouseBreakdown {
  warehouse_id: string
  warehouse_name: string
  city: string
  state: string
  status: string
  inventory_items: number
  vendor_count: number
  product_count: number
  total_quantity: number
}

interface TopProduct {
  product_id: string
  product_name: string
  category: string
  brand: string
  warehouse_id?: string
  warehouse_name?: string
  total_stock: number
  vendor_count: number
}

interface VendorDistribution {
  warehouse_id: string
  warehouse_name: string
  vendor_id: string
  vendor_name: string
  vendor_city: string
  inventory_items: number
  total_stock: number
}

interface LowStockAlert {
  warehouse_id: string
  warehouse_name: string
  product_id: string
  product_name: string
  category: string
  vendor_id: string
  vendor_name: string
  quantity: number
  last_updated: string
}

interface CategoryDistribution {
  category: string
  inventory_items: number
  unique_products: number
  total_quantity: number
}

interface RecentUpdate {
  inventory_id: string
  warehouse_id: string
  warehouse_name: string
  product_id: string
  product_name: string
  vendor_id: string
  vendor_name: string
  quantity: number
  last_updated: string
}

interface WarehouseAnalytics {
  overview: WarehouseAnalyticsOverview
  warehouseBreakdown: WarehouseBreakdown[]
  topProducts: TopProduct[]
  vendorDistribution: VendorDistribution[]
  lowStockAlerts: LowStockAlert[]
  categoryDistribution: CategoryDistribution[]
  recentUpdates: RecentUpdate[]
}

interface AnalyticsResponse {
  success: boolean
  message: string
  code: string
  result: WarehouseAnalytics
}

export function useWarehouseAnalytics(warehouseId?: string) {
  const [analytics, setAnalytics] = useState<WarehouseAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalytics = async () => {
    setIsLoading(true)
    
    try {
      const params = warehouseId ? `?warehouse_id=${warehouseId}` : ''
      const response = await apiFetch(
        `/warehouses/analytics/warehouse/overview${params}`
      )

      const data: AnalyticsResponse = await response.json()

      if (response.ok && data.success) {
        setAnalytics(data.result)
      } else {
        toast.error(data.message || "Failed to fetch warehouse analytics")
        setAnalytics(null)
      }
    } catch (error) {
      toast.error("Network error occurred while fetching analytics")
      setAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [warehouseId])

  return {
    analytics,
    isLoading,
    refetch: fetchAnalytics,
  }
}

// Warehouse Activities Types
interface RecentActivity {
  order_id: string
  type: string
  order_status: string
  product_status: string
  warehouse_id: string | null
  warehouse_name: string | null
  vendor_id: string
  vendor_name: string
  driver_name: string | null
  driver_phone: string | null
  vehicle_number: string | null
  pickup_date: string | null
  pickup_time_start: string | null
  pickup_time_end: string | null
  created_at: string
}

interface ActivitiesResponse {
  success: boolean
  message: string
  code: string
  result: RecentActivity[]
}

export function useWarehouseActivities(warehouseId?: string, limit = 10) {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchActivities = async () => {
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (warehouseId) {
        params.append('warehouse_id', warehouseId)
      }

      const response = await apiFetch(
        `/warehouses/warehouse/recent-activities?${params.toString()}`
      )

      const data: ActivitiesResponse = await response.json()

      if (response.ok && data.success) {
        setActivities(data.result)
      } else {
        toast.error(data.message || "Failed to fetch recent activities")
        setActivities([])
      }
    } catch (error) {
      toast.error("Network error occurred while fetching activities")
      setActivities([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [warehouseId, limit])

  return {
    activities,
    isLoading,
    refetch: fetchActivities,
  }
}

// Export all types for use in components
export type {
  WarehouseAnalyticsOverview,
  WarehouseBreakdown,
  TopProduct,
  VendorDistribution,
  LowStockAlert,
  CategoryDistribution,
  RecentUpdate,
  WarehouseAnalytics,
  RecentActivity,
}
