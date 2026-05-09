"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiFetch } from "@/lib/api-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Calendar, CreditCard, DollarSign, Mail, MapPin, Package, Phone, RefreshCw, ShoppingBag } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatCurrencyINR, formatDate } from "@/lib/admin-display"

interface Address {
  city: string
  state: string
  country: string
  landmark: string | null
  latitude: number
  longitude: number
  address_id: number
  is_default: number
  postal_code: string
  phone_number: string
  address_line1: string
  address_line2: string | null
}

interface CustomerDetails {
  customer_id: string
  first_name: string
  email: string
  phone: string
  addresses: Address[]
  total_orders: number
  lifetime_value: string
}

interface ShippingAddress {
  city: string
  state: string
  postal_code: string
  address_line1: string
  address_line2: string | null
}

interface Order {
  order_id: string
  customer_id: string
  total_amount: string
  order_status: string
  payment_status: string
  payment_method: string
  created_at: string
  shipping_address_id: number
  remarks: string | null
  shipping_address: ShippingAddress
  item_count: number
}

const getInitials = (name: string | null | undefined) => {
  if (!name || typeof name !== "string" || name.trim() === "") {
    return "??"
  }

  return name
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getOrderStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DELIVERED: "bg-emerald-100 text-emerald-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    PROCESSING: "bg-amber-100 text-amber-700",
    CANCELLED: "bg-red-100 text-red-700",
    INITIATED: "bg-gray-100 text-gray-700",
  }

  return classes[status] || "bg-gray-100 text-gray-700"
}

const getPaymentStatusClass = (status: string) =>
  status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"

export default function CustomersProfile() {
  const { customerId } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomerData = async () => {
    if (!customerId) return

    try {
      setLoading(true)
      setError(null)

      const [customerRes, ordersRes] = await Promise.all([apiFetch(`/users/${customerId}`), apiFetch(`/users/${customerId}/orders`)])
      const [customerData, ordersData] = await Promise.all([customerRes.json(), ordersRes.json()])

      if (!customerData.success) {
        throw new Error(customerData.message || "Failed to fetch customer details")
      }

      setCustomer(customerData.result)

      if (ordersData.success) {
        setOrders(ordersData.result)
        setTotalOrdersCount(ordersData.totalOrdersCount)
      } else {
        setOrders([])
        setTotalOrdersCount(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCustomerData()
  }, [customerId])

  const stats = useMemo(() => {
    return [
      {
        title: "Total Orders",
        value: customer?.total_orders || 0,
        icon: ShoppingBag,
      },
      {
        title: "Lifetime Value",
        value: formatCurrencyINR(customer?.lifetime_value || 0),
        icon: DollarSign,
      },
      {
        title: "Addresses",
        value: customer?.addresses?.length || 0,
        icon: MapPin,
      },
    ]
  }, [customer])

  if (loading) {
    return <LoadingSpinner message="Loading customer profile..." />
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Profile
            </CardTitle>
            <CardDescription>Something went wrong while fetching customer data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={fetchCustomerData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" className="gap-2 w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Button>

      <PageHeader
        title={customer?.first_name || "Customer Profile"}
        description="Customer details, saved addresses, and order history."
        meta={customer ? <Badge variant="secondary">{customer.customer_id}</Badge> : undefined}
        actions={
          <Button variant="outline" onClick={fetchCustomerData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {customer ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl font-bold">{getInitials(customer.first_name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Saved Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer?.addresses?.length ? (
              customer.addresses
                .filter((address) => address !== null && address !== undefined)
                .map((address) => (
                  <div
                    key={address.address_id}
                    className={`rounded-xl border p-4 ${address.is_default ? "border-primary/50 bg-primary/5" : "border-border/50"}`}
                  >
                    {address.is_default === 1 ? (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        Default
                      </Badge>
                    ) : null}
                    <p className="font-medium">{address.address_line1}</p>
                    {address.address_line2 ? <p className="text-sm text-muted-foreground">{address.address_line2}</p> : null}
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                    {address.landmark ? <p className="mt-2 text-xs italic text-muted-foreground">Landmark: {address.landmark}</p> : null}
                    <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {address.phone_number}
                    </div>
                  </div>
                ))
            ) : (
              <EmptyState icon={MapPin} title="No addresses saved" description="This customer has not saved any addresses yet." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>{totalOrdersCount} total orders</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.order_id} className="rounded-xl border border-border/50 p-4">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">#{order.order_id}</span>
                        <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-0.5 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={getOrderStatusClass(order.order_status)}>
                          {order.order_status}
                        </Badge>
                        <Badge variant="secondary" className={getPaymentStatusClass(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>{order.payment_method}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">
                            {order.shipping_address.address_line1}, {order.shipping_address.city}, {order.shipping_address.state}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrencyINR(order.total_amount)}</p>
                        {order.item_count > 0 ? <p className="text-sm text-muted-foreground">{order.item_count} items</p> : null}
                      </div>
                    </div>

                    {order.remarks ? (
                      <div className="mt-3 border-t border-border/50 pt-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Remarks:</span> {order.remarks}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Package} title="No orders yet" description="This customer has not placed any orders yet." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
