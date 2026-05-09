"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiFetch } from "@/lib/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, TrendingUp, Package, Clock, XCircle, AlertCircle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AnalyticsData {
  driverId: string
  driverName: string
  lifetime: {
    totalDeliveries: number
    totalAssigned: number
    totalCancelled: number
    completionRate: string
    cancellationRate: string
    totalEarnings: number
    avgDeliveryTimeMinutes: number
  }
  thisMonth: {
    deliveries: number
    earnings: number
  }
}

interface PayoutRecord {
  delivery_id: string
  order_id: string
  earning_amount: string
  payout_date: string
  status: string
  description: string
}

interface PayoutsData {
  payouts: PayoutRecord[]
  pagination: {
    currentPage: number
    totalPages: number
    totalRecords: number
    limit: number
  }
  note: string
}

export default function DriverAnalyticsPage() {
  const { driver_id } = useParams<{ driver_id: string }>()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [payoutsData, setPayoutsData] = useState<PayoutsData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Date Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (driver_id) {
      if (activeTab === "overview") {
        fetchAnalytics()
      } else if (activeTab === "history") {
        fetchPayouts(1)
      }
    }
  }, [driver_id, activeTab])

  const fetchAnalytics = async () => {
    if (!driver_id) return
    setLoading(true)
    setError(null)
    try {
      let url = `/drivers/drivers/${driver_id}/analytics`
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (params.toString()) url += `?${params.toString()}`

      const response = await apiFetch(url)
      
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.result)
      } else {
        setError(data.message || "Failed to load analytics.")
      }
    } catch (err) {
      setError("Network error fetching analytics.")
    } finally {
      setLoading(false)
    }
  }

  const fetchPayouts = async (page: number) => {
    if (!driver_id) return
    setLoading(true)
    setError(null)
    try {
      let url = `/drivers/drivers/${driver_id}/payouts?page=${page}&limit=5`
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`

      const response = await apiFetch(url)
      
      const data = await response.json()
      if (data.success) {
        setPayoutsData(data.result)
        setCurrentPage(page)
      } else {
        setError(data.message || "Failed to load history.")
      }
    } catch (err) {
      setError("Network error fetching history.")
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    if (activeTab === "overview") {
      fetchAnalytics()
    } else {
      fetchPayouts(1)
    }
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    // We defer the fetch until after state updates via a short timeout or let user click apply again
    setTimeout(() => {
      if (activeTab === "overview") {
        fetchAnalytics()
      } else {
        fetchPayouts(1)
      }
    }, 0)
  }

  return (
    <div className="space-y-6 flex flex-col h-full w-full p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/drivers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Analytics</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Performance metrics and delivery history for {analytics?.driverName || driver_id}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Start Date</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">End Date</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters}>Apply Filter</Button>
            {(startDate || endDate) && (
              <Button variant="ghost" onClick={clearFilters}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="history">Delivery History</TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/50 dark:text-blue-400">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Total Delivered</p>
                        <h3 className="text-2xl font-bold">{analytics.lifetime.totalDeliveries}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 text-green-700 rounded-full dark:bg-green-900/50 dark:text-green-400">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Earnings</p>
                        <h3 className="text-2xl font-bold">₹{analytics.lifetime.totalEarnings.toFixed(2)}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900/50 dark:text-purple-400">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Avg. Delivery</p>
                        <h3 className="text-2xl font-bold">{analytics.lifetime.avgDeliveryTimeMinutes}m</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 text-orange-700 rounded-full dark:bg-orange-900/50 dark:text-orange-400">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Cancellations</p>
                        <h3 className="text-2xl font-bold">{analytics.lifetime.cancellationRate}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>This Month</CardTitle>
                    <CardDescription>Performance for the current month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-muted-foreground">Deliveries Completed</span>
                        <span className="font-medium text-lg">{analytics.thisMonth.deliveries}</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-muted-foreground">Earnings Generated</span>
                        <span className="font-medium text-lg text-green-600 dark:text-green-400">₹{analytics.thisMonth.earnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ratios</CardTitle>
                    <CardDescription>Assigned vs Completed orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-muted-foreground">Orders Assigned</span>
                        <span className="font-medium">{analytics.lifetime.totalAssigned}</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-muted-foreground">Orders Cancelled</span>
                        <span className="font-medium text-red-600 dark:text-red-400">{analytics.lifetime.totalCancelled}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{analytics.lifetime.completionRate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">No analytics data found.</p>
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payoutsData ? (
            <Card>
              <CardHeader>
                <CardTitle>Delivery History</CardTitle>
                <CardDescription>{payoutsData.note}</CardDescription>
              </CardHeader>
              <CardContent>
                {payoutsData.payouts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No delivery history found for this period.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Delivery ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutsData.payouts.map((p) => (
                          <TableRow key={p.delivery_id}>
                            <TableCell className="font-medium text-xs font-mono">{p.delivery_id.split('-')[0]}...</TableCell>
                            <TableCell>{p.description}</TableCell>
                            <TableCell>{new Date(p.payout_date).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{parseFloat(p.earning_amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination Controls */}
                    {payoutsData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-end space-x-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchPayouts(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {payoutsData.pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchPayouts(currentPage + 1)}
                          disabled={currentPage === payoutsData.pagination.totalPages || loading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-center py-8">No history data found.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
