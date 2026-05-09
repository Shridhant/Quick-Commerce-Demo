"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AlertCircle, RefreshCw, Users } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"

interface UserGrowthData {
  date: string
  new_registrations: number
  user_type: string
}

interface ApiResponse {
  success: boolean
  message: string
  code: string
  data: UserGrowthData[]
}

interface ChartData {
  date: string
  customers: number
  vendors: number
  drivers: number
  total: number
}

export default function UserGrowthAnalyticsPage() {
  const [data, setData] = useState<UserGrowthData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("30")
  const [userType, setUserType] = useState("all")

  const fetchUserGrowthData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        period,
        userType,
      })

      const response = await apiFetch(`/analytics/users/growth?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch user growth data")
      }

      setData(result.data)
    } catch (err) {
      console.error("Error fetching user growth data:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUserGrowthData()
  }, [period, userType])

  const chartData = useMemo<ChartData[]>(() => {
    const dateMap = new Map<string, ChartData>()

    data.forEach((item) => {
      const date = new Date(item.date).toLocaleDateString()

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          customers: 0,
          vendors: 0,
          drivers: 0,
          total: 0,
        })
      }

      const entry = dateMap.get(date)!

      switch (item.user_type) {
        case "customer":
          entry.customers += item.new_registrations
          break
        case "vendor":
          entry.vendors += item.new_registrations
          break
        case "driver":
          entry.drivers += item.new_registrations
          break
      }

      entry.total = entry.customers + entry.vendors + entry.drivers
    })

    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])

  const totals = useMemo(() => {
    const totalRegistrations = data.reduce((sum, item) => sum + item.new_registrations, 0)
    const byType = (type: string) => data.filter((item) => item.user_type === type).reduce((sum, item) => sum + item.new_registrations, 0)

    return {
      totalRegistrations,
      customers: byType("customer"),
      vendors: byType("vendor"),
      drivers: byType("driver"),
    }
  }, [data])

  if (loading) {
    return <LoadingSpinner message="Loading user growth analytics..." />
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchUserGrowthData} variant="outline">
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
        title="User Growth Analytics"
        description="Track registration trends across customers, vendors, and drivers."
        actions={
          <Button variant="outline" onClick={fetchUserGrowthData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="vendors">Vendors</SelectItem>
                <SelectItem value="drivers">Drivers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Last {period} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Badge variant="secondary">Customer</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.customers}</div>
            <p className="text-xs text-muted-foreground">New customer registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Badge variant="outline">Vendor</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.vendors}</div>
            <p className="text-xs text-muted-foreground">New vendor registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drivers</CardTitle>
            <Badge>Driver</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.drivers}</div>
            <p className="text-xs text-muted-foreground">New driver registrations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registration Trends</CardTitle>
            <CardDescription>Daily user registrations over time</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden p-6">
              <ChartContainer
                config={{
                  customers: { label: "Customers", color: "hsl(var(--chart-1))" },
                  vendors: { label: "Vendors", color: "hsl(var(--chart-2))" },
                  drivers: { label: "Drivers", color: "hsl(var(--chart-3))" },
                  total: { label: "Total", color: "hsl(var(--chart-4))" },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="customers" stroke="var(--color-customers)" name="Customers" />
                    <Line type="monotone" dataKey="vendors" stroke="var(--color-vendors)" name="Vendors" />
                    <Line type="monotone" dataKey="drivers" stroke="var(--color-drivers)" name="Drivers" />
                    {userType === "all" ? (
                      <Line type="monotone" dataKey="total" stroke="var(--color-total)" name="Total" strokeWidth={2} />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Distribution</CardTitle>
            <CardDescription>User type breakdown by date</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden p-6">
              <ChartContainer
                config={{
                  customers: { label: "Customers", color: "hsl(var(--chart-1))" },
                  vendors: { label: "Vendors", color: "hsl(var(--chart-2))" },
                  drivers: { label: "Drivers", color: "hsl(var(--chart-3))" },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="customers" fill="var(--color-customers)" name="Customers" />
                    <Bar dataKey="vendors" fill="var(--color-vendors)" name="Vendors" />
                    <Bar dataKey="drivers" fill="var(--color-drivers)" name="Drivers" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
