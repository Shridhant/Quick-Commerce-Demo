"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Search, Users, Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VendorsTable } from "@/components/vendor/vendors-table"
import { VendorDetailsDialog } from "@/components/vendor/vendor-details-dialog"
import { VendorVerificationDialog } from "@/components/vendor/vendor-verificatio-dialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { useVendors } from "@/hooks/useVendors"

const EMPTY_VENDOR_FORM = {
  name: "",
  business_owner_name: "",
  phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  gstId: "",
  remarks: "",
}

type VendorFilter = "PENDING" | "VERIFIED" | "ALL"

export default function VendorPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState<VendorFilter>("ALL")
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isVerifyOpen, setIsVerifyOpen] = useState(false)

  // Add Vendor state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newVendor, setNewVendor] = useState(EMPTY_VENDOR_FORM)

  const { vendors, isLoading, totalCount, verifyVendor, createVendor, deleteVendor, toggleVendorStatus } = useVendors()

  const filteredVendors = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return vendors.filter((vendor) => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(query) ||
        vendor.phone.toLowerCase().includes(query) ||
        vendor.vendor_id.toLowerCase().includes(query) ||
        vendor.business_owner_name?.toLowerCase().includes(query)

      const isPending =
        vendor.status?.toUpperCase() === "PENDING" ||
        vendor.isDocumentVerified === 0

      const matchesFilter =
        vendorFilter === "ALL" ||
        (vendorFilter === "PENDING" && isPending) ||
        (vendorFilter === "VERIFIED" && vendor.isDocumentVerified === 1)

      return matchesSearch && matchesFilter
    })
  }, [searchTerm, vendorFilter, vendors])

  const selectedVendor = vendors.find((vendor) => vendor.vendor_id === selectedVendorId)
  const verifiedCount = vendors.filter((vendor) => vendor.isDocumentVerified === 1).length

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewVendor((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddVendor = async () => {
    try {
      setIsAdding(true)
      const success = await createVendor(newVendor)
      if (success) {
        setIsAddDialogOpen(false)
        setNewVendor(EMPTY_VENDOR_FORM)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    if (window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      await deleteVendor(vendorId)
    }
  }

  const handleToggleStatus = async (vendorId: string, currentlyActive: boolean) => {
    await toggleVendorStatus(vendorId, !currentlyActive)
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading vendors..." />
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Vendor Management"
        description="Review vendors, inspect details, and complete document verification."
        meta={
          <>
            <span>{totalCount} total vendors</span>
            <span>{verifiedCount} verified</span>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors by business name, owner, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={vendorFilter} onValueChange={(value) => setVendorFilter(value as VendorFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Vendors</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Vendor
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVendors.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No vendors found"
              description={
                searchTerm
                  ? "No vendors match your current search and filter."
                  : "No vendors are available for the selected filter."
              }
            />
          ) : (
            <VendorsTable
              vendors={filteredVendors}
              onViewVendor={(vendorId) => {
                setSelectedVendorId(vendorId)
                setIsDetailsOpen(true)
              }}
              onVerifyVendor={(vendorId) => {
                setSelectedVendorId(vendorId)
                setIsVerifyOpen(true)
              }}
              onDeleteVendor={handleDeleteVendor}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </CardContent>
      </Card>

      <VendorDetailsDialog
        vendor={selectedVendor}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onVerifyClick={() => {
          setIsDetailsOpen(false)
          setIsVerifyOpen(true)
        }}
      />

      <VendorVerificationDialog
        vendor={selectedVendor}
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onVerify={verifyVendor}
      />

      {/* Add Vendor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input id="name" name="name" value={newVendor.name} onChange={handleInputChange} placeholder="e.g. Fresh Mart" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_owner_name">Owner Name</Label>
                <Input id="business_owner_name" name="business_owner_name" value={newVendor.business_owner_name} onChange={handleInputChange} placeholder="Owner's full name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" value={newVendor.phone} onChange={handleInputChange} placeholder="e.g. +91 9876543210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={newVendor.email} onChange={handleInputChange} placeholder="vendor@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input id="address_line1" name="address_line1" value={newVendor.address_line1} onChange={handleInputChange} placeholder="Street address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input id="address_line2" name="address_line2" value={newVendor.address_line2} onChange={handleInputChange} placeholder="Apartment, suite, etc." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={newVendor.city} onChange={handleInputChange} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" value={newVendor.state} onChange={handleInputChange} placeholder="State" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input id="postal_code" name="postal_code" value={newVendor.postal_code} onChange={handleInputChange} placeholder="PIN code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" value={newVendor.country} onChange={handleInputChange} placeholder="e.g. India" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstId">GST ID</Label>
              <Input id="gstId" name="gstId" value={newVendor.gstId} onChange={handleInputChange} placeholder="GST number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" name="remarks" value={newVendor.remarks} onChange={handleInputChange} placeholder="Any notes about this vendor..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAddVendor} disabled={isAdding || !newVendor.name || !newVendor.phone}>
              {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
