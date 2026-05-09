"use client"

import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "@/lib/api-client"

export interface Product {
  name: string
  sku: string
  brand: string
  price: string
  unit: string
  image: string
  description: string
  category: string
  tags: string
  requested_quantity: number
  offer_price?: string | null
  expiry_date?: string | null
  unit_size?: number | null
}

export interface Warehouse {
  warehouse_id: string
  name: string
  address_line1: string
  address_line2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Vendor {
  name: string
  business_owner_name: string
  vendor_id: string
}

export interface Order {
  order_id: string
  order_status: string
  created_at: string
  Warehouse?: Warehouse | null
  vendor: Vendor
  products: Product[]
}

interface OrdersResponse {
  success: boolean
  message: string
  code: string
  result: Order[]
  totalOrders: number
  totalPages: number
}

export interface ApprovalData {
  orderId: string
  vendorId: string
  remarks: string
  driverName: string
  driverPhone: string
  vehicleNumber: string
  pickupDate: string
  pickupTimeStart: string
  pickupTimeEnd: string
  pickupNotes: string
}

export function useOrders(status?: string, limit = 20) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      })

      if (status) {
        params.append("status", status)
      }

      const response = await apiFetch(`/orders/incoming?${params}`)

      const data: OrdersResponse = await response.json()

      if (data.success) {
        setOrders(data.result || [])
        setTotalOrders(data.totalOrders || 0)
        setTotalPages(data.totalPages || 1)
      } else {
        console.error("Failed to fetch orders:", data.message)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [status, currentPage, limit])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const approveOrder = async (approvalData: ApprovalData) => {
    try {
      setIsProcessing(approvalData.orderId)

      const response = await apiFetch(`/orders/newapprove`, {
        method: "POST",
        body: JSON.stringify(approvalData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchOrders()
        return { success: true, message: data.message }
      } else {
        console.error("Failed to approve order:", data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error("Error approving order:", error)
      return { success: false, message: "An error occurred while approving the order" }
    } finally {
      setIsProcessing(null)
    }
  }

  const rejectOrder = async (orderId: string, vendorId: string) => {
    try {
      setIsProcessing(orderId)

      const response = await apiFetch(`/orders/reject`, {
        method: "POST",
        body: JSON.stringify({
          orderId,
          vendorId,
          remarks: "Rejected by admin",
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchOrders()
      } else {
        console.error("Failed to reject order:", data.message)
      }
    } catch (error) {
      console.error("Error rejecting order:", error)
    } finally {
      setIsProcessing(null)
    }
  }

  return {
    orders,
    isLoading,
    currentPage,
    totalPages,
    totalOrders,
    setCurrentPage,
    refetch: fetchOrders,
    approveOrder,
    rejectOrder,
    isProcessing,
  }
}