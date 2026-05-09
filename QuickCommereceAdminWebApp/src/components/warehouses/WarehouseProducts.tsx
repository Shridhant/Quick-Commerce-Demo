"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Package, Building2, User, Calendar, Tag } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface Warehouse {
  warehouse_id: string
  warehouse_name: string
  address_line1: string
  city: string
  state: string
  postal_code: string
  country: string
  status: string
  total_products: number
  total_quantity: string
  vendor_count: number
}

interface InventoryItem {
  inventory_id: string
  product_id: string
  product_name: string
  sku: string
  category: string
  price: string
  vendor_id: string
  vendor_name: string
  business_owner_name: string
  quantity: number
  last_updated: string
}

interface WarehouseResponse {
  success: boolean
  message: string
  code: string
  data: {
    warehouse: Warehouse
    inventory: InventoryItem[]
  }
}

const nf = new Intl.NumberFormat()
const fmtNum = (v: string | number) => {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? nf.format(n) : v
}

const fmtPrice = (v: string) => {
  const n = Number(v)
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : v
}

const fmtDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function WarehouseProducts() {
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWarehouseDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(`/inventory/warehouses/${warehouseId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch warehouse details")
      }

      const result: WarehouseResponse = await response.json()
      
      if (result.success) {
        setWarehouse(result.data.warehouse)
        setInventory(result.data.inventory)
      } else {
        throw new Error(result.message || "Failed to load warehouse details")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouseDetails()
  }, [warehouseId])

  const SkeletonCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted/60 animate-pulse rounded" />
          <div className="h-4 w-full bg-muted/60 animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted/60 animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="h-8 w-64 bg-muted/60 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !warehouse) {
    return (
      <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error || "Warehouse not found"}</span>
            <Button size="sm" variant="secondary" onClick={fetchWarehouseDetails}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
      {/* Warehouse Title */}
      <div>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{warehouse.warehouse_name}</h1>
          <Badge variant={warehouse.status === "ACTIVE" ? "default" : "secondary"}>
            {warehouse.status}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          {warehouse.address_line1}, {warehouse.city}, {warehouse.state} {warehouse.postal_code}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{warehouse.total_products}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{fmtNum(warehouse.total_quantity)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">{warehouse.vendor_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Details */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Warehouse ID</p>
              <p className="font-medium">{warehouse.warehouse_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={warehouse.status === "ACTIVE" ? "default" : "secondary"}>
                {warehouse.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-medium">{warehouse.address_line1}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">City</p>
              <p className="font-medium">{warehouse.city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">State</p>
              <p className="font-medium">{warehouse.state}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Postal Code</p>
              <p className="font-medium">{warehouse.postal_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Country</p>
              <p className="font-medium">{warehouse.country}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products in Warehouse */}
      <Card>
        <CardHeader>
          <CardTitle>Products in Warehouse</CardTitle>
          <CardDescription>
            All products currently stored in this warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No products in this warehouse</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.inventory_id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {item.category}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{item.vendor_name}</p>
                          <p className="text-xs text-muted-foreground">{item.vendor_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {item.business_owner_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {fmtPrice(item.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold tabular-nums">
                        {fmtNum(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(item.last_updated)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}