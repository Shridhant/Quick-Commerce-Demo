import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertCircle,
  ArrowLeft,
  Package,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Truck,
  User,
  CreditCard,
  Clock,
} from "lucide-react"

interface OrderDetail {
  order_id: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: string
  order_status: string
  payment_status: string
  payment_method: string | null
  remarks: string | null
  created_at: string
  shipping_address: string
  shipping_phone: string
  driver_id: string | null
  driver_name: string | null
  driver_phone: string | null
  driver_email: string | null
  vehicle_number: string | null
  vehicle_type: string | null
  driver_assigned_at: string | null
}

interface OrderItem {
  item_id: number
  product_id: number
  quantity: number
  price: string
  product_name: string
  product_image: string | null
  unit_size: string | null
}

const PACKABLE_STATUS = "CONFIRMED"
const READY_STATUS = "PACKING"

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [items, setItems] = useState<OrderItem[]>([] as OrderItem[])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem("authToken")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    }
  }

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_PORT_ADMIN}/usersorders/orders/${orderId}`,
        { headers: getAuthHeaders() }
      )
      const data = await res.json()
      if (data.success) {
        setOrder(data.result)
        setItems(data.result.items ?? [])
      } else {
        throw new Error(data.message || "Failed to fetch order")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handlePackOrder = async () => {
    if (!orderId) return
    try {
      setActionLoading(true)
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_PORT_ADMIN}/usersorders/${orderId}/pack`,
        { method: "PUT", headers: getAuthHeaders() }
      )
      const data = await res.json()
      if (data.success) {
        fetchOrder()
      } else {
        setError(data.message || "Failed to pack order")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pack order")
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkReady = async () => {
    if (!orderId) return
    try {
      setActionLoading(true)
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_PORT_ADMIN}/usersorders/${orderId}/ready`,
        { method: "PUT", headers: getAuthHeaders() }
      )
      const data = await res.json()
      if (data.success) {
        fetchOrder()
      } else {
        setError(data.message || "Failed to mark order as ready")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark order as ready")
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount))

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      INITIATED:          "bg-slate-50 text-slate-600 border-slate-200",
      CONFIRMED:          "bg-amber-50 text-amber-700 border-amber-200",
      PACKING:            "bg-violet-50 text-violet-700 border-violet-200",
      READY_FOR_PICKUP:   "bg-cyan-50 text-cyan-700 border-cyan-200",
      ASSIGNED_TO_DRIVER: "bg-indigo-50 text-indigo-700 border-indigo-200",
      OUT_FOR_DELIVERY:   "bg-amber-50 text-amber-700 border-amber-200",
      DELIVERED:          "bg-emerald-50 text-emerald-700 border-emerald-200",
      CANCELLED:          "bg-red-50 text-red-700 border-red-200",
    }
    return colors[status] || "bg-slate-50 text-slate-600 border-slate-200"
  }

  const getPaymentStatusColor = (status: string) =>
    status === "PAID" || status === "captured"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-orange-50 text-orange-700 border-orange-200"

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/users/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-5">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("/users/orders")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {loading
                  ? <Skeleton className="inline-block h-6 w-32" />
                  : `Order #${order?.order_id ?? ""}`
                }
              </h1>
              <div className="text-sm text-muted-foreground">
                {loading
                  ? <Skeleton className="h-4 w-48 mt-1" />
                  : order?.created_at
                    ? `Placed on ${formatDate(order.created_at)} at ${formatTime(order.created_at)}`
                    : null
                }
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!loading && order && (
            <div className="flex gap-2">
              {order.order_status === PACKABLE_STATUS && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={actionLoading}
                  onClick={handlePackOrder}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                  Start Packing
                </Button>
              )}
              {order.order_status === READY_STATUS && (
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={actionLoading}
                  onClick={handleMarkReady}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                  Mark Ready for Pickup
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Status + Payment row ── */}
        {loading ? (
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        ) : order && (
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className={`px-3 py-1 font-medium ${getStatusColor(order.order_status)}`}>
              {order.order_status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className={`px-3 py-1 font-medium ${getPaymentStatusColor(order.payment_status)}`}>
              {order.payment_status}
            </Badge>
            {order.payment_method && (
              <Badge variant="outline" className="px-3 py-1 font-medium bg-slate-50 text-slate-600 border-slate-200">
                <CreditCard className="h-3 w-3 mr-1" /> {order.payment_method}
              </Badge>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {/* ── Left column: Order items ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border shadow-none">
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-medium">
                  Order Items ({loading ? "…" : (items?.length ?? 0)})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-medium text-muted-foreground h-9">Product</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground h-9 text-center">Qty</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground h-9 text-right">Price</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground h-9 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="py-3"><Skeleton className="h-10 w-48" /></TableCell>
                          <TableCell className="py-3 text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                          <TableCell className="py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          <TableCell className="py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : items?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                          No items in this order
                        </TableCell>
                      </TableRow>
                    ) : (
                      (items ?? []).map((item) => (
                        <TableRow key={item.item_id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="h-10 w-10 rounded-lg object-cover border"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">{item.product_name}</p>
                                {item.unit_size && (
                                  <p className="text-xs text-muted-foreground">{item.unit_size}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-center text-sm font-medium">{item.quantity}</TableCell>
                          <TableCell className="py-3 text-right text-sm">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="py-3 text-right text-sm font-semibold">
                            {formatCurrency(Number(item.price) * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Total */}
                {!loading && order && (
                  <div className="border-t px-4 py-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-lg font-bold">{formatCurrency(order.total_amount)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Remarks */}
            {!loading && order?.remarks && (
              <Card className="border shadow-none">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-medium">Remarks</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.remarks}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right column: Customer, Shipping, Driver ── */}
          <div className="space-y-5">
            {/* Customer */}
            <Card className="border shadow-none">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" /> Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </>
                ) : order && (
                  <>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {order.customer_email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {order.customer_phone}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card className="border shadow-none">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : order && (
                  <>
                    <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                    {order.shipping_phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Phone className="h-3 w-3" /> {order.shipping_phone}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Driver */}
            <Card className="border shadow-none">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Driver
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : order?.driver_id ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{order.driver_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {order.driver_phone}
                    </div>
                    {order.vehicle_number && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" /> {order.vehicle_number} ({order.vehicle_type})
                      </div>
                    )}
                    {order.driver_assigned_at && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> Assigned {formatDate(order.driver_assigned_at)} at {formatTime(order.driver_assigned_at)}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not assigned yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}