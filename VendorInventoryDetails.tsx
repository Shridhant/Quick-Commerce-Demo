"use client"

import { useState, useEffect } from "react"
// import { useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Package, Warehouse, User, Calendar, MapPin } from "lucide-react"

interface Product {
  product_id: string
  name: string
  description: string
  category: string
  unit: string
  image_url: string | null
  price: string
  is_active: number
  sku: string
  brand: string
  tags: string
  created_at: string
  total_quantity: string
}

interface InventoryItem {
  inventory_id: string
  warehouse_id: string
  warehouse_name: string
  warehouse_city: string
  vendor_id: string
  vendor_name: string
  business_owner_name: string
  quantity: number
  last_updated: string
}

interface Summary {
  totalQuantity: string
  warehouseCount: number
  vendorCount: number
}

interface ProductResponse {
  success: boolean
  message: string
  code: string
  data: {
    product: Product
    inventoryBreakdown: InventoryItem[]
    summary: Summary
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

export default function VendorInventoryDetails() {
  const [product, setProduct] = useState<Product | null>(null)
  // const { vendorId } = useParams<{ vendorId: string;}>();
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProductDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const BASE_URL = import.meta.env.VITE_SERVER_PORT_ADMIN || "http://localhost:3000"

      const authToken = localStorage.getItem("authToken")
      const response = await fetch(`${BASE_URL}/inventory/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch product details")
      }

      const result: ProductResponse = await response.json()
      
      if (result.success) {
        setProduct(result.data.product)
        setInventory(result.data.inventoryBreakdown)
        setSummary(result.data.summary)
      } else {
        throw new Error(result.message || "Failed to load product details")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductDetails()
  }, [productId])

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

  if (error || !product) {
    return (
      <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
     
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error || "Product not found"}</span>
            <Button size="sm" variant="secondary" onClick={fetchProductDetails}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
     

      {/* Product Title */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <Badge variant={product.is_active ? "default" : "secondary"}>
            {product.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">{product.description}</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">{fmtNum(summary.totalQuantity)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Warehouse className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warehouses</p>
                  <p className="text-2xl font-bold">{summary.warehouseCount}</p>
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
                  <p className="text-2xl font-bold">{summary.vendorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Product ID</p>
              <p className="font-medium">{product.product_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">SKU</p>
              <p className="font-medium">{product.sku}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Category</p>
              <p className="font-medium">{product.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Brand</p>
              <p className="font-medium">{product.brand}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Unit</p>
              <p className="font-medium">{product.unit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="font-medium text-lg">{fmtPrice(product.price)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {product.tags.split(',').map((tag, idx) => (
                  <Badge key={idx} variant="outline">{tag.trim()}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created At</p>
              <p className="font-medium">{fmtDate(product.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Breakdown</CardTitle>
          <CardDescription>
            Stock distribution across warehouses and vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No inventory data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.inventory_id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.warehouse_name}</p>
                            <p className="text-xs text-muted-foreground">{item.warehouse_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {item.warehouse_city}
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