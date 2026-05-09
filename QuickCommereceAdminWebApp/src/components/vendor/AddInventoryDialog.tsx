import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Warehouse, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  vendorName: string
}

interface Product {
  product_id: string
  name: string
  description: string
  category: string
  unit: string
  sku: string
  brand: string
  image_url: string
  is_active: number
  tags: string
}

interface Vendor {
  vendor_id: string
  vendor_name: string
  business_owner_name: string
  total_products: number
  total_quantity: string
}

interface WarehouseItem {
  warehouse_id: string
  name: string
  city: string
  state: string
  country: string
}

export function AddInventoryDialog({ open, onOpenChange, vendorId, vendorName }: AddInventoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [_vendors, setVendors] = useState<Vendor[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (open) {
      fetchInventoryData()
    }
  }, [open])

  const fetchInventoryData = async () => {
    setFetchingData(true)
    try {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) {
        setError("No authentication token found")
        setFetchingData(false)
        return
      }

      // Fetch products
      const productsResponse = await fetch(`${import.meta.env.VITE_SERVER_PORT_ADMIN}/inventory/products/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })
      const productsData = await productsResponse.json()
      
      if (productsData.success) {
        setProducts(productsData.data.products || [])
      }

      // Fetch vendors (to get warehouse info if needed)
      const vendorsResponse = await fetch(`${import.meta.env.VITE_SERVER_PORT_ADMIN}/inventory/vendors/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })
      const vendorsData = await vendorsResponse.json()
      
      if (vendorsData.success) {
        setVendors(vendorsData.data.vendors || [])
      }

      // Fetch warehouses
      const warehousesResponse = await fetch(`${import.meta.env.VITE_SERVER_PORT_ADMIN}/inventory/warehouses/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })
      const warehousesData = await warehousesResponse.json()
      
      if (warehousesData.success) {
        setWarehouses(warehousesData.result || [])
      }
    } catch (err) {
      console.error('Failed to fetch inventory data:', err)
      setError('Failed to load inventory data')
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async () => {
    setError("")
    setSuccess("")

    if (!selectedProduct || !warehouseId || !quantity) {
      setError("Please fill in all fields")
      return
    }

    const quantityNum = parseInt(quantity)
    if (quantityNum <= 0) {
      setError("Quantity must be greater than 0")
      return
    }

    setLoading(true)

    try {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER_PORT_ADMIN}/inventory/inventory/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          product_id: selectedProduct,
          vendor_id: vendorId,
          quantity: quantityNum
        })
      })

      const data = await response.json()

      if (data.success) {
        const result = data.result
        setSuccess(`Successfully ${result.action} inventory! ${result.product_name} quantity: ${result.previous_quantity || 0} → ${result.new_quantity}`)
        
        // Reset form and refresh data
        setTimeout(() => {
          setSelectedProduct("")
          setWarehouseId("")
          setQuantity("")
          setSuccess("")
          fetchInventoryData() // Refresh the product list
          onOpenChange(false)
        }, 2000)
      } else {
        setError(data.message || "Failed to add inventory")
      }
    } catch (err) {
      setError("An error occurred while adding inventory")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedProduct("")
    setWarehouseId("")
    setQuantity("")
    setError("")
    setSuccess("")
    onOpenChange(false)
  }

  const selectedProductData = products.find(p => p.product_id === selectedProduct)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Inventory for {vendorName}</DialogTitle>
          <DialogDescription>
            Add products to inventory for vendor {vendorId}
          </DialogDescription>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading inventory data...</span>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.product_id} value={product.product_id} textValue={product.name}>
                      <div className="flex flex-col items-start py-1">
                        <div className="flex items-center font-medium">
                          <Package className="w-4 h-4 mr-2" />
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground ml-6 space-y-0.5">
                          <div>SKU: {product.sku} • {product.category} • {product.unit}</div>
                          <div>Brand: {product.brand}{product.tags ? ` • ${product.tags}` : ''}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProductData && (
                <p className="text-sm text-muted-foreground">
                  {selectedProductData.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id} textValue={warehouse.name}>
                      <div className="flex flex-col items-start py-1">
                        <div className="flex items-center font-medium">
                          <Warehouse className="w-4 h-4 mr-2" />
                          {warehouse.name}
                        </div>
                        <div className="text-xs text-muted-foreground ml-6 mt-0.5">
                          {warehouse.city}, {warehouse.state}, {warehouse.country}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({selectedProductData?.unit || 'units'})</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading || fetchingData}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || fetchingData}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Inventory"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}