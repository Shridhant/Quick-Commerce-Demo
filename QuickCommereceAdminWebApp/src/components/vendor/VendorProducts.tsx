"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Package, 
  Warehouse, 
  User, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  Building,
  ShoppingCart
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface Vendor {
  vendor_id: string
  vendor_name: string
  business_owner_name: string
  email: string
  phone: string
  city: string
  state: string
  status: string
  isActive: number
  total_products: number
  total_quantity: string
  warehouse_count: number
}

interface InventoryItem {
  inventory_id: string
  product_id: string
  product_name: string
  sku: string
  category: string
  price: string
  warehouse_id: string
  warehouse_name: string
  quantity: number
  last_updated: string
}

interface VendorResponse {
  success: boolean
  message: string
  code: string
  data: {
    vendor: Vendor
    inventory: InventoryItem[]
  }
}

// interface VendorDetailsProps {
//   vendorId: string
//   onBack?: () => void
// }

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

export default function VendorProducts() {
    const { vendorId } = useParams<{ vendorId: string;}>();
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVendorDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(`/inventory/vendors/${vendorId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch vendor details")
      }

      const result: VendorResponse = await response.json()
      
      if (result.success) {
        setVendor(result.data.vendor)
        setInventory(result.data.inventory)
      } else {
        throw new Error(result.message || "Failed to load vendor details")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendorDetails()
  }, [vendorId])

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

  if (error || !vendor) {
    return (
      <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
        {/* <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button> */}
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error || "Vendor not found"}</span>
            <Button size="sm" variant="secondary" onClick={fetchVendorDetails}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
      {/* Back Button
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Vendors
      </Button> */}

      {/* Vendor Title */}
      <div>
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{vendor.vendor_name}</h1>
          <Badge variant={vendor.status === "ACTIVE" ? "default" : "secondary"}>
            {vendor.status}
          </Badge>
          
        </div>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          <User className="h-4 w-4" />
          Managed by {vendor.business_owner_name}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{vendor.total_products}</p>
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
                <p className="text-2xl font-bold">{fmtNum(vendor.total_quantity)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Warehouse className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warehouses</p>
                <p className="text-2xl font-bold">{vendor.warehouse_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Details */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vendor ID</p>
              <p className="font-medium font-mono">{vendor.vendor_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Business Owner</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{vendor.business_owner_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{vendor.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{vendor.phone}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{vendor.city}, {vendor.state}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={vendor.isActive === 1 ? "default" : "secondary"}>
                {vendor.isActive === 1 ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>
            Products supplied by this vendor across warehouses
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
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
                            <p className="text-xs text-muted-foreground">{item.product_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.warehouse_name}</p>
                            <p className="text-xs text-muted-foreground">{item.warehouse_id}</p>
                          </div>
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