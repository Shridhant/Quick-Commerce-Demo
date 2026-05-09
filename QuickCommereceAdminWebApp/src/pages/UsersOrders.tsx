import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Package, Search, ChevronLeft, ChevronRight, MapPin, Phone, Mail, Truck, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface Order {
  order_id: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: string
  order_status: string
  payment_status: string
  payment_method: string | null
  shipping_address_id: number
  remarks: string | null
  created_at: string
  shipping_address: string
  shipping_phone: string
  items_count: number
  driver_id: string | null
  driver_name: string | null
  driver_phone: string | null
  vehicle_number: string | null
  vehicle_type: string | null
  driver_assigned_at: string | null
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalOrders: number
  ordersPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Which order_status values allow which admin action.
// Everything not listed here gets no action button.
const PACKABLE_STATUS = "CONFIRMED"
const READY_STATUS = "PACKING"

export default function UsersOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Per-order action loading state: tracks which order_id is mid-request
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const res = await apiFetch(`/usersorders/users/orders?page=${currentPage}`)
      const data = await res.json()

      if (data.success) {
        setOrders(data.result.orders)
        setPagination(data.result.pagination)
      } else {
        throw new Error(data.message || "Failed to fetch orders")
      }
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [currentPage])

  // Initial fetch + re-fetch when page changes
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Auto-refresh every 3 seconds (silent — no loading spinner)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true)
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchOrders])

  // ─── STEP 7: Admin packs an ACTIVE order ──────────────────────────────────
  const handlePackOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId)
      const res = await apiFetch(
        `/usersorders/${orderId}/pack`,
        { method: "PUT" }
      )
      const data = await res.json()
      if (data.success) {
        fetchOrders() // refresh the list
      } else {
        setError(data.message || "Failed to pack order")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pack order")
    } finally {
      setActionLoading(null)
    }
  }

  // ─── STEP 8: Admin marks a PACKING order ready for pickup ───────────────────
  const handleMarkReady = async (orderId: string) => {
    try {
      setActionLoading(orderId)
      const res = await apiFetch(
        `/usersorders/${orderId}/ready`,
        { method: "PUT" }
      )
      const data = await res.json()
      if (data.success) {
        fetchOrders()
      } else {
        setError(data.message || "Failed to mark order as ready")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark order as ready")
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount))
  }

  // ─── Status → Tailwind colour mapping (all real statuses from the schema) ──
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      INITIATED:            "bg-slate-50 text-slate-600 border-slate-200",
      PAYMENT_PENDING:      "bg-orange-50 text-orange-700 border-orange-200",
      PAYMENT_CONFIRMED:    "bg-amber-50 text-amber-700 border-amber-200",
      ACTIVE:               "bg-blue-50 text-blue-700 border-blue-200",
      PACKING:               "bg-violet-50 text-violet-700 border-violet-200",
      READY_FOR_PICKUP:     "bg-cyan-50 text-cyan-700 border-cyan-200",
      ASSIGNED_TO_DRIVER:   "bg-indigo-50 text-indigo-700 border-indigo-200",
      OUT_FOR_DELIVERY:     "bg-amber-50 text-amber-700 border-amber-200",
      DELIVERED:            "bg-emerald-50 text-emerald-700 border-emerald-200",
      CANCELLED:            "bg-red-50 text-red-700 border-red-200",
    }
    return colors[status] || "bg-slate-50 text-slate-600 border-slate-200"
  }

  const getPaymentStatusColor = (status: string) => {
    return status === "PAID"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-orange-50 text-orange-700 border-orange-200"
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.order_status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCustomerClick = (customerId: string) => {
    navigate(`/admin/customers/${customerId}`)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-5">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and track all customer orders</p>
        </div>

        {/* ── Summary cards ────────────────────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  {loading ? (
                    <Skeleton className="h-6 w-12 mt-0.5" />
                  ) : (
                    <p className="text-xl font-semibold">{pagination?.totalOrders || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active — needs packing */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active (to pack)</p>
                  {loading ? (
                    <Skeleton className="h-6 w-12 mt-0.5" />
                  ) : (
                    <p className="text-xl font-semibold">
                      {orders.filter((o) => o.order_status === "ACTIVE").length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packing — ready to release */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Packing (to release)</p>
                  {loading ? (
                    <Skeleton className="h-6 w-12 mt-0.5" />
                  ) : (
                    <p className="text-xl font-semibold">
                      {orders.filter((o) => o.order_status === "PACKING").length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivered */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                  {loading ? (
                    <Skeleton className="h-6 w-12 mt-0.5" />
                  ) : (
                    <p className="text-xl font-semibold">
                      {orders.filter((o) => o.order_status === "DELIVERED").length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Search + filter bar ──────────────────────────────────────────── */}
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="INITIATED">Initiated</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PACKING">Packing</SelectItem>
                  <SelectItem value="READY_FOR_PICKUP">Ready for Pickup</SelectItem>
                  <SelectItem value="ASSIGNED_TO_DRIVER">Assigned to Driver</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Orders table ─────────────────────────────────────────────────── */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium">
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Order</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Customer</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Driver</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Shipping</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Amount</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Status</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Payment</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10">Date</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground h-10 w-32">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* ── Loading skeleton ───────────────────────────────────── */}
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-7 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    /* ── Empty state ─────────────────────────────────────── */
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="h-8 w-8" />
                          <p className="text-sm">No orders found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    /* ── Data rows ────────────────────────────────────────── */
                    filteredOrders.map((order) => (
                      <TableRow
                        key={order.order_id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/users/orders/${order.order_id}`)}
                      >
                        {/* Order ID */}
                        <TableCell className="py-3">
                          <span className="text-xs font-medium">{order.order_id}</span>
                          {order.items_count > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{order.items_count} item{order.items_count !== 1 ? "s" : ""}</p>
                          )}
                        </TableCell>

                        {/* Customer */}
                        <TableCell className="py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCustomerClick(order.customer_id) }}
                            className="text-left hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                          >
                            <p className="text-sm font-medium text-foreground hover:underline">{order.customer_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                                {order.customer_email}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                            </div>
                          </button>
                        </TableCell>

                        {/* Driver — read-only info; drivers self-assign via their app */}
                        <TableCell className="py-3">
                          {order.driver_id ? (
                            <div>
                              <p className="text-sm font-medium">{order.driver_name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.driver_phone}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Truck className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.vehicle_number}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Not assigned</span>
                          )}
                        </TableCell>

                        {/* Shipping address */}
                        <TableCell className="py-3">
                          <div className="flex items-start gap-1 max-w-[180px]">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground line-clamp-2">{order.shipping_address}</span>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="py-3">
                          <span className="text-xs font-semibold">{formatCurrency(order.total_amount)}</span>
                        </TableCell>

                        {/* Order status badge */}
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 font-medium ${getStatusColor(order.order_status)}`}
                          >
                            {order.order_status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>

                        {/* Payment */}
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 font-medium w-fit ${getPaymentStatusColor(order.payment_status)}`}
                            >
                              {order.payment_status}
                            </Badge>
                            {order.payment_method && (
                              <span className="text-[10px] text-muted-foreground">{order.payment_method}</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="py-3">
                          <div>
                            <p className="text-xs">{formatDate(order.created_at)}</p>
                            <p className="text-[10px] text-muted-foreground">{formatTime(order.created_at)}</p>
                          </div>
                        </TableCell>

                        {/* ── Action button — context-sensitive ──────────────
                            ACTIVE  → "Pack"
                            PACKING  → "Ready"
                            anything else → nothing ──────────────────────── */}
                        <TableCell className="py-3">
                          {order.order_status === PACKABLE_STATUS && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              disabled={actionLoading === order.order_id}
                              onClick={(e) => { e.stopPropagation(); handlePackOrder(order.order_id) }}
                            >
                              {actionLoading === order.order_id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Package className="h-3 w-3 mr-1" />
                              )}
                              Pack
                            </Button>
                          )}

                          {order.order_status === READY_STATUS && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                              disabled={actionLoading === order.order_id}
                              onClick={(e) => { e.stopPropagation(); handleMarkReady(order.order_id) }}
                            >
                              {actionLoading === order.order_id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Truck className="h-3 w-3 mr-1" />
                              )}
                              Ready
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ─────────────────────────────────────────────── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-transparent"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 bg-transparent"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}