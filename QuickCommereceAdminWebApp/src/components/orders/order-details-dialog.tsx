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
import { Label } from "@/components/ui/label"
import { Package, MapPin, Tag } from "lucide-react"
import type { Order } from "@/hooks/useOrders"

interface OrderDetailsDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "default"
      case "REJECTED":
      case "CANCELLED":
        return "destructive"
      case "PENDING":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const calculateTotal = () => {
    return order.products.reduce(
      (sum, product) => sum + Number.parseFloat(product.offer_price || product.price) * product.requested_quantity,
      0,
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Details
          </DialogTitle>
          <DialogDescription>Order ID: {order.order_id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Vendor Name</Label>
              <p className="font-medium">{order.vendor.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Business Owner</Label>
              <p className="font-medium">{order.vendor.business_owner_name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div>
                <Badge variant={getStatusVariant(order.order_status)}>{order.order_status}</Badge>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Warehouse Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Warehouse</Label>
            {order.Warehouse ? (
              <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {order.Warehouse.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.Warehouse.address_line1}
                  {order.Warehouse.address_line2 && `, ${order.Warehouse.address_line2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.Warehouse.city}, {order.Warehouse.state} {order.Warehouse.postal_code}
                </p>
                <p className="text-sm text-muted-foreground">{order.Warehouse.country}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned</p>
            )}
          </div>

          {/* Products */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Products ({order.products.length} items)</Label>
            <div className="space-y-3">
              {order.products.map((product, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {product.brand} • {product.unit} {product.unit_size ? `(${product.unit_size})` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex flex-col items-end">
                        <p className="font-semibold">
                          ₹{Number.parseFloat(product.offer_price || product.price).toLocaleString()}
                        </p>
                        {product.offer_price && product.offer_price !== product.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{Number.parseFloat(product.price).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">× {product.requested_quantity}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{product.sku}</Badge>
                      {product.tags && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Tag className="w-3 h-3" />
                          <span>{product.tags}</span>
                        </div>
                      )}
                      {product.expiry_date && (
                        <Badge variant="secondary" className="font-normal text-[10px]">
                          Exp: {new Date(product.expiry_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold">
                      Total: ₹{((Number.parseFloat(product.offer_price || product.price)) * product.requested_quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Total:</span>
                <span className="text-xl font-bold text-primary">₹{calculateTotal().toLocaleString()}</span>
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
