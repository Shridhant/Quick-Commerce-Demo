"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Package, ShoppingCart, TrendingUp, Truck, User, Users } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { formatCurrencyINR } from "@/lib/admin-display"

interface DashboardData {
  total_orders: number
  active_users: number
  active_vendors: number
  active_drivers: number
  active_products: number
  today_revenue: string
  today_orders: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiFetch("/analytics/dashboard/overview")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          setDashboardData(result.data)
        } else {
          setError(result.message || "Failed to fetch dashboard data")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    void fetchDashboardData()
  }, [])

  const stats = useMemo(() => {
    if (!dashboardData) return []

    return [
      {
        title: "Total Orders",
        value: dashboardData.total_orders.toString(),
        subtitle: dashboardData.today_orders > 0 ? `+${dashboardData.today_orders} today` : "No orders today",
        icon: ShoppingCart,
      },
      {
        title: "Active Users",
        value: dashboardData.active_users.toString(),
        subtitle: "Currently active",
        icon: Users,
      },
      {
        title: "Active Vendors",
        value: dashboardData.active_vendors.toString(),
        subtitle: "Vendors online",
        icon: Users,
      },
      {
        title: "Active Drivers",
        value: dashboardData.active_drivers.toString(),
        subtitle: "Drivers available",
        icon: Truck,
      },
      {
        title: "Active Products",
        value: dashboardData.active_products.toString(),
        subtitle: "Products in inventory",
        icon: Package,
      },
      {
        title: "Today's Revenue",
        value: formatCurrencyINR(dashboardData.today_revenue),
        subtitle: dashboardData.today_orders > 0 ? `${dashboardData.today_orders} orders today` : "No sales today",
        icon: TrendingUp,
      },
    ]
  }, [dashboardData])

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." minHeightClassName="min-h-[50vh]" />
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back${user ? `, ${user.name}` : ""}. Here's a quick overview of the platform.`}
        meta={
          user ? (
            <Badge variant="outline" className="w-fit">
              <User className="mr-1 h-3 w-3" />
              {user.name}
            </Badge>
          ) : undefined
        }
      />

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admin ID</p>
              <p className="font-medium">{user.adminId}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                <p className="mt-2 text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
