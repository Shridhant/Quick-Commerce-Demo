"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export interface Admin {
  admin_id: number
  name: string
  role: string
  email: string
  created_at: string
  assigned_warehouse?: string | null
}

export interface AdminWarehouse {
  warehouse_id: string
  name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface AdminsResponse {
  success: boolean
  message: string
  result?: Admin[]
}

interface WarehousesResponse {
  success: boolean
  message: string
  result?: AdminWarehouse[]
}

interface CreateAdminPayload {
  name: string
  email: string
  password: string
  assigned_warehouse: string | null
}

export function useAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [activeWarehouses, setActiveWarehouses] = useState<AdminWarehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiFetch("/admins")
      const data: AdminsResponse = await response.json()

      if (response.ok && data.success) {
        setAdmins(data.result || [])
      } else {
        toast.info(data.message || "No admins found")
        setAdmins([])
      }
    } catch (error) {
      console.error("Error fetching admins:", error)
      toast.error("Network error occurred while fetching admins")
      setAdmins([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchActiveWarehouses = useCallback(async () => {
    try {
      const response = await apiFetch("/warehouses?status=ACTIVE")
      const data: WarehousesResponse = await response.json()

      if (response.ok && data.success) {
        setActiveWarehouses(data.result || [])
      } else {
        toast.error(data.message || "Failed to fetch warehouses")
        setActiveWarehouses([])
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error)
      toast.error("Network error occurred while fetching warehouses")
      setActiveWarehouses([])
    }
  }, [])

  const createAdmin = useCallback(
    async (payload: CreateAdminPayload) => {
      const response = await apiFetch("/admins", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add admin")
      }

      toast.success("Admin added successfully")
      await fetchAdmins()
      return data
    },
    [fetchAdmins],
  )

  useEffect(() => {
    void fetchAdmins()
    void fetchActiveWarehouses()
  }, [fetchAdmins, fetchActiveWarehouses])

  return {
    admins,
    activeWarehouses,
    isLoading,
    refetch: fetchAdmins,
    createAdmin,
  }
}
