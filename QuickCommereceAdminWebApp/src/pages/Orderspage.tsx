"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Package, Loader2, Search, Filter, RotateCcw, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react"
import { OrderDetailsDialog } from "@/components/orders/order-details-dialog"
import { OrdersTable } from "@/components/orders/order-table"
import { ApprovalDialog, type ApprovalData } from "@/components/orders/ApprovalDialog"
import { useOrders } from "@/hooks/useOrders"
import { toast } from "sonner"


type OrderStatus = "APPROVED" | "CANCELLED" | "PENDING" | "REJECTED"

const STATUS_OPTIONS: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("PENDING")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [orderToApprove, setOrderToApprove] = useState<{ orderId: string; vendorId: string } | null>(null)
  
 

  const {
    orders,
    isLoading,
    currentPage,
    totalPages,
    totalOrders,
    setCurrentPage,
    refetch,
    approveOrder,
    rejectOrder,
    isProcessing,
  } = useOrders(statusFilter)

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      order.order_id.toLowerCase().includes(searchLower) ||
      order.vendor.name.toLowerCase().includes(searchLower) ||
      order.vendor.business_owner_name.toLowerCase().includes(searchLower)
    )
  })

  const selectedOrder = orders.find((o) => o.order_id === selectedOrderId)

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsViewDialogOpen(true)
  }

  const handleApproveClick = (orderId: string, vendorId: string) => {
    setOrderToApprove({ orderId, vendorId })
    setIsApprovalDialogOpen(true)
  }

    const handleApproveOrder = async (approvalData: ApprovalData) => {
      const result = await approveOrder(approvalData)
      if (result.success) {
        toast("Order Approved",{
    
          description: `Order ${approvalData.orderId} has been approved successfully.`,
          duration: 5000,
        })
      } else {
        toast.error("Approval Failed",{
         
          description: result.message || "Failed to approve order. Please try again.",
       
        })
      }
    }

  const getFilterLabel = () => {
    return STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label || "All Status"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track incoming vendor orders</p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by order ID, vendor name, or business owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[160px] bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  {getFilterLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.value} onClick={() => setStatusFilter(option.value)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Orders
              </CardTitle>
              <CardDescription className="mt-1">
                Showing {filteredOrders.length} of {totalOrders} orders
              </CardDescription>
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "No orders have been placed yet"}
              </p>
            </div>
          ) : (
            <>
              <OrdersTable
                orders={filteredOrders}
                onViewOrder={handleViewOrder}
                onApproveOrder={handleApproveClick}
                onRejectOrder={rejectOrder}
                isProcessing={isProcessing}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-9 h-9"
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <OrderDetailsDialog order={selectedOrder} open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} />
      )}

      {/* Approval Dialog */}
      {orderToApprove && (
        <ApprovalDialog
          orderId={orderToApprove.orderId}
          vendorId={orderToApprove.vendorId}
          open={isApprovalDialogOpen}
          onOpenChange={setIsApprovalDialogOpen}
          onApprove={handleApproveOrder}
        />
      )}
    </div>
  )
}