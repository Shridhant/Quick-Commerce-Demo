"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronRight, Clock, CreditCard, DollarSign, Package, RefreshCw, TrendingUp, UserCheck, Users } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { formatCurrencyINR, formatDate } from "@/lib/admin-display"

interface OverviewData {
  total_customers: number
  active_customers: number
  total_orders: number
  total_revenue: string
  avg_order_value: string
}

interface TopCustomer {
  customer_id: string
  name: string
  email: string
  phone: string
  order_count: number
  total_spent: string
}

interface OrderStatus {
  order_status: string
  count: number
  total_amount: string
}

interface RecentOrder {
  order_id: string
  customer_id: string
  customer_name: string
  email: string
  total_amount: string
  order_status: string
  payment_status: string
  created_at: string
}

export default function CustomersAnalyticsPage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [orderStatus, setOrderStatus] = useState<OrderStatus[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [analyticsRes, recentOrdersRes] = await Promise.all([
        apiFetch("/users/analytics/overview"),
        apiFetch("/users/orders/recent"),
      ])

      const [analyticsData, recentOrdersData] = await Promise.all([analyticsRes.json(), recentOrdersRes.json()])

      if (!analyticsData.success) {
        throw new Error(analyticsData.message || "Failed to fetch customer analytics")
      }

      setOverview(analyticsData.result.overview)
      setTopCustomers(analyticsData.result.topCustomers)
      setOrderStatus(analyticsData.result.orderStatus)

      if (recentOrdersData.success) {
        setRecentOrders(recentOrdersData.result)
      } else {
        setRecentOrders([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAllData()
  }, [])

  const stats = useMemo(() => {
    return [
      {
        title: "Total Customers",
        value: overview?.total_customers || 0,
        icon: Users,
      },
      {
        title: "Active Customers",
        value: overview?.active_customers || 0,
        icon: UserCheck,
      },
      {
        title: "Total Revenue",
        value: formatCurrencyINR(overview?.total_revenue || 0),
        icon: DollarSign,
      },
      {
        title: "Avg Order Value",
        value: formatCurrencyINR(Number(overview?.avg_order_value || 0).toFixed(2)),
        icon: TrendingUp,
      },
    ]
  }, [overview])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DELIVERED: "bg-emerald-100 text-emerald-700",
      SHIPPED: "bg-blue-100 text-blue-700",
      PROCESSING: "bg-amber-100 text-amber-700",
      CANCELLED: "bg-red-100 text-red-700",
      INITIATED: "bg-gray-100 text-gray-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
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

  const handleCustomerClick = (customerId: string) => {
    navigate(`/users/profile/${customerId}`)
  }

  if (loading) {
    return <LoadingSpinner message="Loading customer analytics..." />
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Data
            </CardTitle>
            <CardDescription>Something went wrong while fetching customer analytics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchAllData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Customer Analytics"
        description="View customer metrics, recent orders, and top spenders."
        actions={
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Status
            </CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderStatus.map((status) => (
              <div key={status.order_status} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={getStatusColor(status.order_status)}>
                    {status.order_status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{status.count} orders</span>
                </div>
                <span className="font-semibold">{formatCurrencyINR(status.total_amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.order_id}
                  className="group flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  onClick={() => handleCustomerClick(order.customer_id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(order.customer_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{order.customer_name}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">#{order.order_id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrencyINR(order.total_amount)}</p>
                      <Badge variant="secondary" className={`mt-1 text-xs ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Top Customers
          </CardTitle>
          <CardDescription>Customers ranked by total spent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {topCustomers.slice(0, 5).map((customer, index) => (
              <div
                key={customer.customer_id}
                className="group cursor-pointer rounded-xl border p-4 text-center transition-all hover:bg-muted/30 hover:shadow-sm"
                onClick={() => handleCustomerClick(customer.customer_id)}
              >
                <div className="relative inline-block">
                  <Avatar className="mx-auto h-14 w-14">
                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                  </Avatar>
                  {index < 3 ? (
                    <span
                      className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                        index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : "bg-amber-700"
                      }`}
                    >
                      {index + 1}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 truncate font-medium">{customer.name}</p>
                <p className="mt-1 text-xl font-bold text-primary">{formatCurrencyINR(customer.total_spent)}</p>
                <p className="text-xs text-muted-foreground">{customer.order_count} orders</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
