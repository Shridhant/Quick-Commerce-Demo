"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"


export interface Vendor {
  vendor_id: string
  business_owner_name: string
  name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  latitude: number
  longitude: number
  status: string
  isActive: number
  isDocumentUploaded: number
  isDocumentVerified: number
  gstId: string
  gstFile: string | null
  tradeLicenseFile: string | null
  store_image: string | null
  remarks: string | null
  created_at: string
}

interface VendorsResponse {
  success: boolean
  message: string
  result: Vendor[]
  totalVendorsCount: number
  totalPages: number
}

interface VendorFilters {
  status?: "ACTIVE" | "INACTIVE"
  documentVerified?: 0 | 1
  page?: number
  limit?: number
}

export function useVendors(initialFilters?: VendorFilters) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialFilters?.page || 1)

  const fetchVendors = async (filters?: VendorFilters) => {
    setIsLoading(true)
    
    try {
      // Build query params dynamically
      const params = new URLSearchParams()
      
      const finalFilters = { ...initialFilters, ...filters }
      
      if (finalFilters.status) {
        params.append('status', finalFilters.status)
      }
      
      if (finalFilters.documentVerified !== undefined) {
        params.append('documentVerified', finalFilters.documentVerified.toString())
      }
      
      params.append('page', (finalFilters.page || currentPage).toString())
      params.append('limit', (finalFilters.limit || 15).toString())

      const response = await apiFetch(`/vendors?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch vendors")
      }

      const data: VendorsResponse = await response.json()

      if (data.success) {
        setVendors(data.result || [])
        setTotalCount(data.totalVendorsCount || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        toast.error(data.message || "Failed to fetch vendors")
        setVendors([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
      toast.error("Failed to load vendors")
      setVendors([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }


  const verifyVendor = async (vendorId: string, remarks: string) => {
    try {
      const response = await apiFetch(`/vendors/verify`, {
        method: "POST",
        body: JSON.stringify({ vendorId, remarks }),
      })

      if (!response.ok) {
        throw new Error("Failed to verify vendor")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Vendor verified successfully")
        fetchVendors()
        return true
      } else {
        toast.error(data.message || "Failed to verify vendor")
        return false
      }
    } catch (error) {
      console.error("Error verifying vendor:", error)
      toast.error("Failed to verify vendor")
      return false
    }
  }

  const createVendor = async (vendorData: Record<string, any>) => {
    try {
      const response = await apiFetch(`/vendors`, {
        method: "POST",
        body: JSON.stringify(vendorData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Vendor created successfully")
        fetchVendors()
        return true
      } else {
        toast.error(data.message || "Failed to create vendor")
        return false
      }
    } catch (error) {
      console.error("Error creating vendor:", error)
      toast.error("Failed to create vendor")
      return false
    }
  }

  const updateVendor = async (vendorId: string, vendorData: Record<string, any>) => {
    try {
      const response = await apiFetch(`/vendors/${vendorId}`, {
        method: "PUT",
        body: JSON.stringify(vendorData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Vendor updated successfully")
        fetchVendors()
        return true
      } else {
        toast.error(data.message || "Failed to update vendor")
        return false
      }
    } catch (error) {
      console.error("Error updating vendor:", error)
      toast.error("Failed to update vendor")
      return false
    }
  }

  const toggleVendorStatus = async (vendorId: string, isActive: boolean) => {
    try {
      const response = await apiFetch(`/vendors/${vendorId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || `Vendor ${isActive ? "activated" : "deactivated"}`)
        fetchVendors()
        return true
      } else {
        toast.error(data.message || "Failed to update status")
        return false
      }
    } catch (error) {
      console.error("Error toggling vendor status:", error)
      toast.error("Failed to update vendor status")
      return false
    }
  }

  const deleteVendor = async (vendorId: string) => {
    try {
      const response = await apiFetch(`/vendors/${vendorId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Vendor deleted successfully")
        fetchVendors()
        return true
      } else {
        toast.error(data.message || "Failed to delete vendor")
        return false
      }
    } catch (error) {
      console.error("Error deleting vendor:", error)
      toast.error("Failed to delete vendor")
      return false
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  return {
    vendors,
    isLoading,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    verifyVendor,
    createVendor,
    updateVendor,
    toggleVendorStatus,
    deleteVendor,
    refetch: fetchVendors,
  }
}