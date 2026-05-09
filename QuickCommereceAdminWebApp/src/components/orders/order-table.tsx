"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Eye, Check, X, Loader2, MapPin } from "lucide-react"
import type { Order } from "@/hooks/useOrders"

interface OrdersTableProps {
  orders: Order[]
  onViewOrder: (orderId: string) => void
  onApproveOrder: (orderId: string, vendorId: string) => void
  onRejectOrder: (orderId: string, vendorId: string) => void
  isProcessing: string | null
}

export function OrdersTable({ orders, onViewOrder, onApproveOrder, onRejectOrder, isProcessing }: OrdersTableProps) {
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

  const calculateTotal = (order: Order) => {
    return order.products.reduce(
      (sum, product) => sum + Number.parseFloat(product.price) * product.requested_quantity,
      0,
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.order_id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{order.order_id}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{order.vendor.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{order.vendor.business_owner_name}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getStatusVariant(order.order_status)}>{order.order_status}</Badge>
                </td>
                <td className="px-4 py-4">
                  {order.Warehouse ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{order.Warehouse.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.Warehouse.city}, {order.Warehouse.state}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not assigned</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline">{order.products.length} items</Badge>
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-sm">₹{calculateTotal(order).toLocaleString()}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewOrder(order.order_id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApproveOrder(order.order_id, order.vendor.vendor_id)}
                      disabled={isProcessing === order.order_id || order.order_status.toUpperCase() === "APPROVED"}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {isProcessing === order.order_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRejectOrder(order.order_id, order.vendor.vendor_id)}
                      disabled={isProcessing === order.order_id || order.order_status.toUpperCase() === "REJECTED"}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
