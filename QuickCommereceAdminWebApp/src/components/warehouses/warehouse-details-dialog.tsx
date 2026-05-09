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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin } from "lucide-react"
import type { Warehouse } from "@/hooks/useWarehouses"
import { formatDateTime, getWarehouseStatusMeta } from "@/lib/admin-display"

interface WarehouseDetailsDialogProps {
  warehouse?: Warehouse
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WarehouseDetailsDialog({ warehouse, open, onOpenChange }: WarehouseDetailsDialogProps) {
  if (!warehouse) return null

  const getStatusBadge = (status: string) => {
    const meta = getWarehouseStatusMeta(status)
    const Icon = meta.icon
    return (
      <Badge variant="outline" className={meta.className}>
        <Icon className="mr-1 h-3 w-3" />
        {meta.label}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {warehouse.name}
          </DialogTitle>
          <DialogDescription>Warehouse ID: {warehouse.warehouse_id}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Status and Created Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div className="mt-2">{getStatusBadge(warehouse.status)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Created</Label>
              <p className="mt-2 text-sm">{formatDateTime(warehouse.created_at)}</p>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Full Address</Label>
            <div className="mt-2 flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p>{warehouse.address_line1}</p>
                {warehouse.address_line2 && <p>{warehouse.address_line2}</p>}
                <p>
                  {warehouse.city}, {warehouse.state} {warehouse.postal_code}
                </p>
                <p className="text-muted-foreground">{warehouse.country}</p>
              </div>
            </div>
          </div>

          {/* Coordinates */}
          {warehouse.latitude && warehouse.longitude && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Coordinates</Label>
              <div className="mt-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {warehouse.latitude.toFixed(6)}, {warehouse.longitude.toFixed(6)}
                </Badge>
              </div>
            </div>
          )}
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
