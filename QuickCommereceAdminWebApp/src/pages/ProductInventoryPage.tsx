"use client"

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Loader2, PackagePlus, PencilLine, Save, Warehouse, UserRound, Boxes } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Product {
  product_id: string
  name: string
  sku: string
  image_url?: string | null
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
  price?: number | null
  offer_price?: number | null
  expiry_date?: string | null
  last_updated: string
}

interface ProductResponse {
  success: boolean
  message: string
  data: {
    product: Product
    inventoryBreakdown: InventoryItem[]
    summary: {
      totalQuantity: string
      warehouseCount: number
      vendorCount: number
    }
  }
}

interface WarehouseOption {
  warehouse_id: string
  name: string
  city: string
  state: string
  country: string
}

interface VendorOption {
  vendor_id: string
  name: string
  business_owner_name: string
  city: string
  state: string
}

type EditForm = {
  quantity: string
  price: string
  offer_price: string
  expiry_date: string
}

const fmtDate = (value?: string | null) => {
  if (!value) return "Not set"
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const fmtPrice = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "Not set"
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? `Rs. ${parsed.toFixed(2)}` : "Not set"
}

export default function ProductInventoryPage() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()

  const [product, setProduct] = useState<Product | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<ProductResponse["data"]["summary"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForms, setEditForms] = useState<Record<string, EditForm>>({})

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([])
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([])
  const [addForm, setAddForm] = useState({
    warehouse_id: "",
    vendor_id: "",
    quantity: "",
    price: "",
    offer_price: "",
    expiry_date: "",
  })

  const loadInventory = async () => {
    if (!productId) return

    setLoading(true)
    try {
      const response = await apiFetch(`/inventory/products/${productId}`)
      const data: ProductResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load inventory")
      }

      setProduct(data.data.product)
      setInventoryItems(data.data.inventoryBreakdown)
      setSummary(data.data.summary)
      setEditForms(
        Object.fromEntries(
          data.data.inventoryBreakdown.map((item) => [
            item.inventory_id,
            {
              quantity: String(item.quantity ?? 0),
              price: item.price === null || item.price === undefined ? "" : String(item.price),
              offer_price: item.offer_price === null || item.offer_price === undefined ? "" : String(item.offer_price),
              expiry_date: item.expiry_date ? item.expiry_date.split("T")[0] : "",
            },
          ])
        )
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  const loadAddOptions = async () => {
    try {
      const [warehouseResponse, vendorResponse] = await Promise.all([
        apiFetch("/inventory/warehouses/list"),
        apiFetch("/inventory/vendors/list"),
      ])

      const warehouseData = await warehouseResponse.json()
      const vendorData = await vendorResponse.json()

      if (warehouseResponse.ok && warehouseData.success) {
        setWarehouseOptions(warehouseData.result ?? warehouseData.data?.warehouses ?? warehouseData.data ?? [])
      }

      if (vendorResponse.ok && vendorData.success) {
        setVendorOptions(vendorData.data?.vendors ?? vendorData.result ?? [])
      }
    } catch {
      toast.error("Failed to load warehouse and vendor options")
    }
  }

  useEffect(() => {
    loadInventory()
  }, [productId])

  useEffect(() => {
    if (isAddOpen && (warehouseOptions.length === 0 || vendorOptions.length === 0)) {
      loadAddOptions()
    }
  }, [isAddOpen])

  const updateEditForm = (inventoryId: string, field: keyof EditForm, value: string) => {
    setEditForms((prev) => ({
      ...prev,
      [inventoryId]: {
        ...prev[inventoryId],
        [field]: value,
      },
    }))
  }

  const handleSaveInventoryItem = async (inventoryId: string) => {
    const form = editForms[inventoryId]
    if (!form) return

    const quantity = Number(form.quantity)
    const price = form.price === "" ? null : Number(form.price)
    const offerPrice = form.offer_price === "" ? null : Number(form.offer_price)

    if (!Number.isFinite(quantity) || quantity < 0) {
      toast.error("Quantity must be 0 or greater")
      return
    }

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      toast.error("Price must be 0 or greater")
      return
    }

    if (offerPrice !== null && (!Number.isFinite(offerPrice) || offerPrice < 0)) {
      toast.error("Offer price must be 0 or greater")
      return
    }

    if (price !== null && offerPrice !== null && offerPrice > price) {
      toast.error("Offer price cannot be greater than price")
      return
    }

    setSavingId(inventoryId)
    try {
      const response = await apiFetch(`/inventory/items/${inventoryId}`, {
        method: "PUT",
        body: JSON.stringify({
          quantity,
          price,
          offer_price: offerPrice,
          expiry_date: form.expiry_date || null,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update inventory item")
      }

      toast.success("Inventory updated successfully")
      setEditingId(null)
      await loadInventory()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update inventory item")
    } finally {
      setSavingId(null)
    }
  }

  const handleAddInventoryItem = async () => {
    if (!productId) return

    const quantity = Number(addForm.quantity)
    const price = addForm.price === "" ? null : Number(addForm.price)
    const offerPrice = addForm.offer_price === "" ? null : Number(addForm.offer_price)

    if (!addForm.warehouse_id || !addForm.vendor_id) {
      toast.error("Select both warehouse and vendor")
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      toast.error("Price must be 0 or greater")
      return
    }

    if (offerPrice !== null && (!Number.isFinite(offerPrice) || offerPrice < 0)) {
      toast.error("Offer price must be 0 or greater")
      return
    }

    if (price !== null && offerPrice !== null && offerPrice > price) {
      toast.error("Offer price cannot be greater than price")
      return
    }

    setIsAdding(true)
    try {
      const response = await apiFetch("/inventory/add", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: addForm.warehouse_id,
          vendor_id: addForm.vendor_id,
          quantity,
          price,
          offer_price: offerPrice,
          expiry_date: addForm.expiry_date || null,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add inventory item")
      }

      toast.success("Inventory entry saved")
      setIsAddOpen(false)
      setAddForm({
        warehouse_id: "",
        vendor_id: "",
        quantity: "",
        price: "",
        offer_price: "",
        expiry_date: "",
      })
      await loadInventory()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add inventory item")
    } finally {
      setIsAdding(false)
    }
  }

  if (loading && !product) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading inventory workspace...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Product not found.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/products/${product.product_id}`)} className="w-fit px-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to product
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <Badge variant="outline">{product.sku}</Badge>
          </div>
          <p className="text-muted-foreground">
            Manage stock, pricing, and expiry by location for <span className="font-medium text-foreground">{product.name}</span>.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)}>
          <PackagePlus className="mr-2 h-4 w-4" />
          Add Inventory Entry
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stock</p>
              <p className="text-2xl font-semibold">{summary?.totalQuantity ?? product.total_quantity}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warehouses</p>
              <p className="text-2xl font-semibold">{summary?.warehouseCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-amber-100 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendors</p>
              <p className="text-2xl font-semibold">{summary?.vendorCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>
            Each row is one warehouse-vendor inventory record. Edit it directly, then save.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inventoryItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No inventory entries yet. Create the first location record for this product.
            </div>
          ) : (
            inventoryItems.map((item) => {
              const form = editForms[item.inventory_id]
              const isEditing = editingId === item.inventory_id
              const isSavingThis = savingId === item.inventory_id

              return (
                <div key={item.inventory_id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{item.warehouse_name}</Badge>
                        <Badge variant="outline">{item.vendor_name}</Badge>
                        <span className="text-xs text-muted-foreground">{item.inventory_id}</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Warehouse</p>
                          <p className="font-medium">{item.warehouse_name}</p>
                          <p className="text-sm text-muted-foreground">{item.warehouse_city}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Vendor</p>
                          <p className="font-medium">{item.vendor_name}</p>
                          <p className="text-sm text-muted-foreground">{item.business_owner_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" onClick={() => setEditingId(null)} disabled={isSavingThis}>
                            Cancel
                          </Button>
                          <Button onClick={() => handleSaveInventoryItem(item.inventory_id)} disabled={isSavingThis}>
                            {isSavingThis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" onClick={() => setEditingId(item.inventory_id)}>
                          <PencilLine className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor={`qty-${item.inventory_id}`}>Quantity</Label>
                      <Input
                        id={`qty-${item.inventory_id}`}
                        type="number"
                        min="0"
                        value={form?.quantity ?? ""}
                        disabled={!isEditing || isSavingThis}
                        onChange={(e) => updateEditForm(item.inventory_id, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`price-${item.inventory_id}`}>Price</Label>
                      <Input
                        id={`price-${item.inventory_id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={form?.price ?? ""}
                        disabled={!isEditing || isSavingThis}
                        onChange={(e) => updateEditForm(item.inventory_id, "price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`offer-${item.inventory_id}`}>Offer Price</Label>
                      <Input
                        id={`offer-${item.inventory_id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={form?.offer_price ?? ""}
                        disabled={!isEditing || isSavingThis}
                        onChange={(e) => updateEditForm(item.inventory_id, "offer_price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`expiry-${item.inventory_id}`}>Expiry Date</Label>
                      <Input
                        id={`expiry-${item.inventory_id}`}
                        type="date"
                        value={form?.expiry_date ?? ""}
                        disabled={!isEditing || isSavingThis}
                        onChange={(e) => updateEditForm(item.inventory_id, "expiry_date", e.target.value)}
                      />
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-medium">{fmtPrice(item.price)}</p>
                      </div>
                      <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                        <p className="text-xs text-muted-foreground">Offer Price</p>
                        <p className="font-medium">{fmtPrice(item.offer_price)}</p>
                      </div>
                      <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                        <p className="text-xs text-muted-foreground">Expiry</p>
                        <p className="font-medium">{fmtDate(item.expiry_date)}</p>
                      </div>
                      <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                        <p className="text-xs text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{fmtDateTime(item.last_updated)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Add Inventory Entry</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={addForm.warehouse_id} onValueChange={(value) => setAddForm((prev) => ({ ...prev, warehouse_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseOptions.map((warehouse) => (
                      <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                        {warehouse.name} ({warehouse.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={addForm.vendor_id} onValueChange={(value) => setAddForm((prev) => ({ ...prev, vendor_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorOptions.map((vendor) => (
                      <SelectItem key={vendor.vendor_id} value={vendor.vendor_id}>
                        {vendor.name} ({vendor.business_owner_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-quantity">Quantity</Label>
                <Input id="add-quantity" type="number" min="1" value={addForm.quantity} onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-price">Price</Label>
                <Input id="add-price" type="number" min="0" step="0.01" value={addForm.price} onChange={(e) => setAddForm((prev) => ({ ...prev, price: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-offer-price">Offer Price</Label>
                <Input id="add-offer-price" type="number" min="0" step="0.01" value={addForm.offer_price} onChange={(e) => setAddForm((prev) => ({ ...prev, offer_price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-expiry-date">Expiry Date</Label>
                <Input id="add-expiry-date" type="date" value={addForm.expiry_date} onChange={(e) => setAddForm((prev) => ({ ...prev, expiry_date: e.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAddInventoryItem} disabled={isAdding}>
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
