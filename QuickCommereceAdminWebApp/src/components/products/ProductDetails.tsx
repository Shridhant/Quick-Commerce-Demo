"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Package, Warehouse, User, Calendar, MapPin, Pencil, Trash2, Power, Loader2, Boxes } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  product_id: string
  name: string
  description: string
  category: string
  unit: string
  image_url: string | null
  image_urls?: string[]
  price: string
  is_active: number
  sku: string
  brand: string
  tags: string
  created_at: string
  total_quantity: string
  offer_price?: string | null
  expiry_date?: string | null
  unit_size?: number | null
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

interface Category {
  category_id: number
  name: string
  status: string
}

const nf = new Intl.NumberFormat()
const fmtNum = (v: string | number) => {
  const n = typeof v === "string" ? Number(v) : v
  return Number.isFinite(n) ? nf.format(n) : v
}

const fmtPrice = (v: string) => {
  const n = Number(v)
  return Number.isFinite(n) ? `Rs. ${n.toFixed(2)}` : v
}

const fmtDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ProductDetails() {
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const { productId } = useParams<{ productId: string }>()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [deletingImageName, setDeletingImageName] = useState<string | null>(null)
  const [productFiles, setProductFiles] = useState<File[]>([])

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    sku: "",
    unit: "",
    tags: "",
    image_url: "",
    unit_size: "",
  })

  const fetchProductDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(`/inventory/products/${productId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch product details")
      }

      const result: ProductResponse = await response.json()

      if (result.success) {
        setProduct(result.data.product)
        setInventory(result.data.inventoryBreakdown)
        setSummary(result.data.summary)

        const p = result.data.product
        setEditForm({
          name: p.name || "",
          description: p.description || "",
          category: p.category || "",
          brand: p.brand || "",
          sku: p.sku || "",
          unit: p.unit || "",
          tags: p.tags || "",
          image_url: p.image_url || "",
          unit_size: p.unit_size ? String(p.unit_size) : "",
        })
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

  useEffect(() => {
    if (isEditDialogOpen && categories.length === 0) {
      fetchCategories()
    }
  }, [isEditDialogOpen, categories.length])

  const fetchCategories = async () => {
    try {
      const response = await apiFetch(`/products/categories`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.result)
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async () => {
    try {
      setIsSaving(true)

      const payload = {
        unit_size: editForm.unit_size ? parseInt(editForm.unit_size) : null,
      }

      const formData = new FormData()
      formData.append("name", editForm.name)
      formData.append("description", editForm.description)
      formData.append("category", editForm.category)
      formData.append("brand", editForm.brand)
      formData.append("sku", editForm.sku)
      formData.append("unit", editForm.unit)
      formData.append("tags", editForm.tags)
      formData.append("image_url", editForm.image_url)
      if (payload.unit_size !== null) {
        formData.append("unit_size", String(payload.unit_size))
      }
      productFiles.forEach((file) => {
        formData.append("product", file)
      })

      const response = await apiFetch(`/products/${productId}`, {
        method: "PUT",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setIsEditDialogOpen(false)
        setProductFiles([])
        fetchProductDetails()
        toast.success("Product updated successfully")
      } else {
        toast.error(data.message || "Failed to edit product")
      }
    } catch (err) {
      toast.error("Error editing product")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!product) return
    try {
      setIsToggling(true)

      const newStatus = product.is_active ? false : true

      const response = await apiFetch(`/products/${productId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: newStatus }),
      })

      const data = await response.json()
      if (data.success) {
        fetchProductDetails()
      } else {
        alert(data.message || "Failed to toggle status")
      }
    } catch (err) {
      alert("Error toggling status")
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await apiFetch(`/products/${productId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        window.history.back()
      } else {
        alert(data.message || "Failed to delete product")
      }
    } catch (err) {
      alert("Error deleting product")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    if (!product) return

    const imageName = imageUrl.split("/").pop()
    if (!imageName) {
      toast.error("Invalid image reference")
      return
    }

    setDeletingImageName(imageName)
    try {
      const response = await apiFetch(`/products/${product.product_id}/images`, {
        method: "DELETE",
        body: JSON.stringify({ imageName }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete product image")
      }

      toast.success("Product image deleted successfully")
      await fetchProductDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product image")
    } finally {
      setDeletingImageName(null)
    }
  }

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

  if (loading && !product) {
    return (
      <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
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
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <Badge variant={product.is_active ? "default" : "secondary"}>
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{product.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/products/${product.product_id}/inventory`)}>
            <Boxes className="w-4 h-4 mr-2" />
            Manage Inventory
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleStatus} disabled={isToggling}>
            {isToggling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Power className="w-4 h-4 mr-2" />}
            {product.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          {product.image_urls && product.image_urls.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="overflow-hidden rounded-xl border bg-muted/20">
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="h-80 w-full object-cover"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {product.image_urls.map((imageUrl, index) => {
                  const imageName = imageUrl.split("/").pop() || imageUrl
                  const isDeletingImage = deletingImageName === imageName

                  return (
                    <div key={imageUrl} className="rounded-xl border p-3">
                      <div className="overflow-hidden rounded-lg border bg-muted/20">
                        <img
                          src={imageUrl}
                          alt={`${product.name} ${index + 1}`}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Image {index + 1}</p>
                          <p className="truncate text-xs text-muted-foreground">{imageName}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteImage(imageUrl)}
                          disabled={isDeletingImage}
                        >
                          {isDeletingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
              <p className="font-medium">
                {product.unit} {product.unit_size ? `(${product.unit_size})` : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <div className="flex flex-col">
                <span className="font-medium text-lg text-primary">{fmtPrice(product.offer_price || product.price)}</span>
                {product.offer_price && product.offer_price !== product.price && (
                  <span className="text-sm text-muted-foreground line-through">{fmtPrice(product.price)}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {product.tags.split(",").map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created At</p>
              <p className="font-medium">{fmtDate(product.created_at)}</p>
            </div>
            {product.expiry_date && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expiry Date</p>
                <p className="font-medium text-amber-600">{fmtDate(product.expiry_date)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Breakdown</CardTitle>
          <CardDescription>Stock distribution across warehouses and vendors</CardDescription>
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
                      <td className="px-4 py-3 text-sm text-right font-semibold tabular-nums">{fmtNum(item.quantity)}</td>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" value={editForm.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" value={editForm.sku} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input id="unit" name="unit" value={editForm.unit} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_size">Unit Size</Label>
                <Input id="unit_size" name="unit_size" type="number" value={editForm.unit_size} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" value={editForm.brand} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" name="image_url" value={editForm.image_url} onChange={handleInputChange} />
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Price, offer price, and expiry date are managed from inventory entries, not the product record.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_product_files">Replace Product Images</Label>
              <Input
                id="edit_product_files"
                type="file"
                accept=".jpg,.jpeg,.png"
                multiple
                onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
              />
              {productFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">{productFiles.length} file(s) selected for upload</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={editForm.description} onChange={handleInputChange} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" value={editForm.tags} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSaving || !editForm.name || !editForm.sku}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. If inventory exists for "{product.name}", deletion will be blocked until
              those inventory entries are removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Yes, Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
