"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShieldCheck, Loader2 } from "lucide-react"
import type { Vendor } from "@/hooks/useVendors"
interface VendorVerificationDialogProps {
  vendor: Vendor | undefined
  isOpen: boolean
  onClose: () => void
  onVerify: (vendorId: string, remarks: string) => Promise<boolean>
}

export function VendorVerificationDialog({ vendor, isOpen, onClose, onVerify }: VendorVerificationDialogProps) {
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVerify = async () => {
    if (!vendor || !remarks.trim()) return

    setIsSubmitting(true)
    const success = await onVerify(vendor.vendor_id, remarks)
    setIsSubmitting(false)

    if (success) {
      setRemarks("")
      onClose()
    }
  }

  const handleClose = () => {
    setRemarks("")
    onClose()
  }

  if (!vendor) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Verify Vendor
          </DialogTitle>
          <DialogDescription>Verify and approve {vendor.name} as a registered vendor</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vendor ID</Label>
            <p className="font-mono font-medium text-sm">{vendor.vendor_id}</p>
          </div>

          <div className="space-y-2">
            <Label>Business Name</Label>
            <p className="font-medium text-sm">{vendor.name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">
              Remarks <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="remarks"
              placeholder="Enter verification remarks (e.g., 'Documents verified and approved')"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={!remarks.trim() || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Verify Vendor
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
