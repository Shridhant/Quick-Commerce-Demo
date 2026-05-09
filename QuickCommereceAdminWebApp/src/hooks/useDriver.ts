"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export interface Driver {
  driver_id: string
  name: string
  email: string
  phone: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  vehicle_type?: string
  vehicle_number?: string
  vehicle_image?: string
  driving_license_file?: string
  status: string
  isActive: boolean
  isDocumentVerified: boolean
  isDocumentUploaded: boolean
  created_at: string
}

interface ApiResponse {
  success: boolean
  message: string
  result?: Driver[]
  count?: number
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDrivers = async () => {
    setIsLoading(true)

    try {
      const response = await apiFetch(`/drivers/drivers`)

      const data: ApiResponse = await response.json()

      if (response.ok && data.success) {
        setDrivers(data.result || [])
      } else {
        toast.error(data.message || "Failed to fetch drivers")
        setDrivers([])
      }
    } catch (error) {
      toast.error("Network error occurred")
      setDrivers([])
    } finally {
      setIsLoading(false)
    }
  }

  const verifyDriver = async (driverId: string, remarks: string) => {
    if (!remarks.trim()) {
      toast.warning("Please provide remarks")
      return
    }

    setActionLoading(driverId)
    try {
      const response = await apiFetch(`/drivers/drivers/${driverId}/verify`, {
        method: "PUT",
        body: JSON.stringify({ remarks }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Driver documents verified successfully!")
        await fetchDrivers()
      } else {
        toast.error(data.message || "Failed to verify driver")
      }
    } catch (error) {
      toast.error("Network error occurred")
    } finally {
      setActionLoading(null)
    }
  }

  const rejectDriver = async (driverId: string, remarks: string) => {
    if (!remarks.trim()) {
      toast.warning("Please provide remarks")
      return
    }

    setActionLoading(driverId)
    try {
      const response = await apiFetch(`/drivers/drivers/${driverId}/reject`, {
        method: "PUT",
        body: JSON.stringify({ remarks }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Driver documents rejected successfully!")
        await fetchDrivers()
      } else {
        toast.error(data.message || "Failed to reject driver")
      }
    } catch (error) {
      toast.error("Network error occurred")
    } finally {
      setActionLoading(null)
    }
  }

  const updateDriverStatus = async (driverId: string, newStatus: string, remarks?: string) => {
    if (!newStatus) {
      toast.warning("Please select a status")
      return
    }

    setActionLoading(driverId)
    try {
      const body: { status: string; remarks?: string } = { status: newStatus }
      if (remarks?.trim()) {
        body.remarks = remarks
      }

      const response = await apiFetch(`/drivers/drivers/${driverId}/status`, {
        method: "PUT",
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Driver status updated to ${newStatus} successfully!`)
        await fetchDrivers()
      } else {
        toast.error(data.message || "Failed to update driver status")
      }
    } catch (error) {
      toast.error("Network error occurred")
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  return {
    drivers,
    isLoading,
    actionLoading,
    refetch: fetchDrivers,
    verifyDriver,
    rejectDriver,
    updateDriverStatus,
  }
}
