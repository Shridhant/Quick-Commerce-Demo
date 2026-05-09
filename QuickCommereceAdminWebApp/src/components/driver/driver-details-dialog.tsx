
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Car, FileText } from "lucide-react"

import type { Driver } from "@/hooks/useDriver"
import { getDriverStatusMeta, getVerificationMeta } from "@/lib/admin-display"

interface DriverDetailsDialogProps {
  driver: Driver | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DriverDetailsDialog({ driver, open, onOpenChange }: DriverDetailsDialogProps) {
  if (!driver) return null

  const getStatusBadge = (status: string) => {
    const meta = getDriverStatusMeta(status)
    const Icon = meta.icon
    return (
      <Badge variant="outline" className={meta.className}>
        <Icon className="mr-1 size-3" />
        {meta.label}
      </Badge>
    )
  }

  const getDocumentBadge = (verified: boolean) => {
    const meta = getVerificationMeta(verified)
    const Icon = meta.icon
    return (
      <Badge variant="outline" className={meta.className}>
        <Icon className="mr-1 size-3" />
        {meta.label}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="size-5" />
            {driver.name}
          </DialogTitle>
          <DialogDescription>Driver Details - ID: {driver.driver_id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">{getStatusBadge(driver.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Document Status</label>
              <div className="mt-1">{getDocumentBadge(driver.isDocumentVerified)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm">{driver.email}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <div className="mt-1 flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span className="text-sm">{driver.phone}</span>
              </div>
            </div>
          </div>

          {(driver.address_line1 || driver.city || driver.state) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <div className="mt-1 text-sm space-y-1">
                {driver.address_line1 && <div>{driver.address_line1}</div>}
                {driver.address_line2 && <div>{driver.address_line2}</div>}
                <div>{[driver.city, driver.state, driver.postal_code].filter(Boolean).join(", ")}</div>
                {driver.country && <div>{driver.country}</div>}
              </div>
            </div>
          )}

          {(driver.vehicle_type || driver.vehicle_number || driver.driving_license_file) && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Vehicle Information</label>
              <div className="mt-1 space-y-2">
                {driver.vehicle_type && (
                  <div className="flex items-center gap-2">
                    <Car className="size-4 text-muted-foreground" />
                    <span className="text-sm">Type: {driver.vehicle_type}</span>
                  </div>
                )}
                {driver.vehicle_number && (
                  <div className="flex items-center gap-2">
                    <span className="size-4" />
                    <span className="text-sm">Number: {driver.vehicle_number}</span>
                  </div>
                )}
                {driver.driving_license_file && (
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="text-sm">License File: Available</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Joined</label>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-sm">{new Date(driver.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Document Upload Status</label>
              <div className="mt-1">
                <Badge variant={driver.isDocumentUploaded ? "default" : "secondary"}>
                  {driver.isDocumentUploaded ? "Uploaded" : "Not Uploaded"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
