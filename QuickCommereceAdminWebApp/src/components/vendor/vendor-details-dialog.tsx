"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Building, Calendar, FileText, Mail, MapPin, ShieldCheck, UserCheck } from "lucide-react"
import type { Vendor } from "@/hooks/useVendors"
import { formatDateTime, getVendorStatusMeta, getVerificationMeta } from "@/lib/admin-display"

interface VendorDetailsDialogProps {
  vendor: Vendor | undefined 
  isOpen: boolean
  onClose: () => void
  onVerifyClick: () => void
}

export function VendorDetailsDialog({ vendor, isOpen, onClose, onVerifyClick }: VendorDetailsDialogProps) {
  if (!vendor) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Vendor Details
          </DialogTitle>
          <DialogDescription>Complete information about the vendor</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building className="w-4 h-4" />
              Business Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Vendor ID</Label>
                <p className="font-mono font-medium">{vendor.vendor_id}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Business Name</Label>
                <p className="font-medium">{vendor.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Owner Name</Label>
                <p className="font-medium">{vendor.business_owner_name || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">GST ID</Label>
                <p className="font-medium">{vendor.gstId}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">{vendor.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="font-medium">{vendor.phone}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Address Line 1</Label>
                <p className="font-medium">{vendor.address_line1}</p>
              </div>
              {vendor.address_line2 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Address Line 2</Label>
                  <p className="font-medium">{vendor.address_line2}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">City</Label>
                <p className="font-medium">{vendor.city}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">State</Label>
                <p className="font-medium">{vendor.state}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Postal Code</Label>
                <p className="font-medium">{vendor.postal_code}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Country</Label>
                <p className="font-medium">{vendor.country}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status & Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Status & Documents
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                {(() => {
                  const meta = getVendorStatusMeta(vendor.status)
                  const Icon = meta.icon
                  return (
                    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  )
                })()}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Document Status</Label>
                {(() => {
                  const meta = getVerificationMeta(vendor.isDocumentVerified === 1)
                  const Icon = meta.icon
                  return (
                    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  )
                })()}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Created At</Label>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <p className="font-medium">{formatDateTime(vendor.created_at)}</p>
                </div>
              </div>
              {vendor.remarks && (
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs text-muted-foreground">Remarks</Label>
                  <p className="font-medium">{vendor.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {(vendor.gstFile || vendor.tradeLicenseFile || vendor.store_image) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Uploaded Documents
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {vendor.gstFile && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">GST File</Label>
                      <p className="text-sm font-medium truncate">{vendor.gstFile}</p>
                    </div>
                  )}
                  {vendor.tradeLicenseFile && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Trade License</Label>
                      <p className="text-sm font-medium truncate">{vendor.tradeLicenseFile}</p>
                    </div>
                  )}
                  {vendor.store_image && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Store Image</Label>
                      <p className="text-sm font-medium truncate">{vendor.store_image}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {vendor.isDocumentVerified === 0 && (
            <Button onClick={onVerifyClick} className="gap-2">
              <UserCheck className="w-4 h-4" />
              Verify Vendor
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
