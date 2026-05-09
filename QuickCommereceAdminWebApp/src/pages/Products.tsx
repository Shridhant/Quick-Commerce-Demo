import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Package, Plus, Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Product {
  product_id: string
  product_name: string
  product_description: string
  name?: string
  description?: string
  category: string
  brand: string
  sku: string
  price?: string
  total_quantity: string
  unit: string
  vendor_count: number
  warehouse_count: number
  is_active: number
  image_url: string
  tags: string
  offer_price?: string | null
  expiry_date?: string | null
  unit_size?: number | null
}

interface InventoryResponse {
  success: boolean
  message: string
  code?: string
  data: {
    products: Product[]
    totalInventory: number
    totalProducts: number
  }
}

interface Category {
  category_id: number
  name: string
  status: string
}

const Products: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalStats, setTotalStats] = useState<{ totalProducts: number; totalInventory: number } | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  // Add Product State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [newProduct, setNewProduct] = useState({
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

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (isAddDialogOpen && categories.length === 0) {
      fetchCategories()
    }
  }, [isAddDialogOpen])

  const fetchCategories = async (): Promise<Category[]> => {
    try {
      const response = await apiFetch(`/products/categories`)
      const data = await response.json()
      if (data.success) {
        const categoryList = data.result || []
        setCategories(categoryList)
        return categoryList
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
    return []
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)

      const response = await apiFetch(`/inventory/products/`)

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const result: InventoryResponse = await response.json()
      if (result.success && result.data?.products) {
        setProducts(result.data.products)
        setTotalStats({
          totalProducts: result.data.totalProducts,
          totalInventory: result.data.totalInventory,
        })
      } else {
        setError(result.message || "Failed to fetch product data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleAddCategoryFromProduct = async () => {
    const categoryName = newCategoryName.trim()

    if (!categoryName) {
      toast.error("Category name is required")
      return
    }

    try {
      setIsAddingCategory(true)

      const response = await apiFetch(`/products/categories`, {
        method: "POST",
        body: JSON.stringify({
          name: categoryName,
          status: "Active",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to add category")
        return
      }

      toast.success("Category added successfully")
      setNewCategoryName("")
      setIsCategoryFormOpen(false)

      const updatedCategories = await fetchCategories()
      const createdCategory =
        updatedCategories.find((category) => category.name.toLowerCase() === categoryName.toLowerCase()) ||
        (data.result && !Array.isArray(data.result) ? data.result : null) ||
        data.category ||
        data.data

      if (createdCategory?.category_id) {
        setNewProduct((prev) => ({ ...prev, category: createdCategory.category_id.toString() }))
      }
    } catch (error) {
      toast.error("Network error occurred while adding category")
      console.error(error)
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      setIsAdding(true)

      const formData = new FormData()
      formData.append("name", newProduct.name)
      formData.append("description", newProduct.description)
      formData.append("category", newProduct.category)
      formData.append("brand", newProduct.brand)
      formData.append("sku", newProduct.sku)
      formData.append("unit", newProduct.unit)
      formData.append("tags", newProduct.tags)
      formData.append("image_url", newProduct.image_url)
      if (newProduct.unit_size) {
        formData.append("unit_size", newProduct.unit_size)
      }
      productFiles.forEach((file) => {
        formData.append("product", file)
      })

      const response = await apiFetch(`/products`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        setIsAddDialogOpen(false)
        setProductFiles([])
        setNewProduct({
          name: "", description: "", category: "", brand: "", 
          sku: "", unit: "", tags: "", image_url: "",
          unit_size: ""
        })
        fetchProducts() // Refresh list
        toast.success("Product created successfully")
      } else {
        toast.error(data.message || "Failed to add product")
      }
    } catch (error) {
      toast.error("An error occurred while adding product")
      console.error(error)
    } finally {
      setIsAdding(false)
    }
  }

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading product inventory...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-300">Error Loading Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <Button className="mt-4" onClick={fetchProducts}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">Products Inventory</h1>
            {user && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>{user.name}</span>
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Browse and manage all products available in inventory.</p>
        </div>

        <div className="flex space-x-4 items-center">
          {totalStats && (
            <>
              <Badge variant="secondary">Total Products: {totalStats.totalProducts}</Badge>
              <Badge variant="secondary">Total Inventory: {totalStats.totalInventory}</Badge>
            </>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <Card 
              key={product.product_id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => handleProductClick(product.product_id)}
            >
              <div className="flex aspect-square w-full items-center justify-center bg-muted/40 p-3">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name || product.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground/60" />
                )}
              </div>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
                <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug">{product.product_name || product.name}</CardTitle>
                <Package className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                <div className="flex items-start justify-between gap-2">
                  {product.price && (
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-primary">₹{product.offer_price || product.price}</span>
                      {product.offer_price && product.offer_price !== product.price && (
                        <span className="text-xs text-muted-foreground line-through">₹{product.price}</span>
                      )}
                    </div>
                  )}
                  <Badge
                    className={
                      product.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                    }
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <p className="line-clamp-2 text-xs text-muted-foreground">{product.product_description || product.description}</p>

                <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline">{product.brand}</Badge>
                  <Badge variant="outline">{product.category}</Badge>
                  <Badge variant="outline">{product.unit} {product.unit_size ? `(${product.unit_size})` : ''}</Badge>
                  {product.expiry_date && (
                    <Badge variant="secondary" className="font-normal">
                      Exp: {new Date(product.expiry_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <div className="mt-2 flex justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">SKU: {product.sku}</span>
                  <span>Qty: {product.total_quantity || 0}</span>
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  Vendors: {product.vendor_count || 0} | Warehouses: {product.warehouse_count || 0}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No products found in inventory.
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" value={newProduct.name} onChange={handleInputChange} placeholder="e.g. Fresh Milk 1L" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" value={newProduct.sku} onChange={handleInputChange} placeholder="e.g. MILK-1L-AMUL" />
              </div>
            </div>
            


            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input id="unit" name="unit" value={newProduct.unit} onChange={handleInputChange} placeholder="e.g. L, ml, Kg, g" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_size">Unit Size</Label>
                <Input id="unit_size" name="unit_size" type="number" value={newProduct.unit_size} onChange={handleInputChange} placeholder="Numeric value" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsCategoryFormOpen((open) => !open)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Category
                  </Button>
                </div>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}
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
                {isCategoryFormOpen && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="quick-category-name" className="text-xs">
                        New Category Name
                      </Label>
                      <Input
                        id="quick-category-name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Dairy"
                        disabled={isAddingCategory}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsCategoryFormOpen(false)
                          setNewCategoryName("")
                        }}
                        disabled={isAddingCategory}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCategoryFromProduct}
                        disabled={isAddingCategory || !newCategoryName.trim()}
                      >
                        {isAddingCategory ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Category"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" value={newProduct.brand} onChange={handleInputChange} placeholder="e.g. Amul, Britannia" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" name="image_url" value={newProduct.image_url} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_files">Product Images</Label>
              <Input
                id="product_files"
                type="file"
                accept=".jpg,.jpeg,.png"
                multiple
                onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
              />
              {productFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">{productFiles.length} file(s) selected</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={newProduct.description} onChange={handleInputChange} placeholder="Product description..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" value={newProduct.tags} onChange={handleInputChange} placeholder="e.g. fresh, daily, morning" />
            </div>

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Price, offer price, expiry date, and stock are managed through inventory after the product is created.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={isAdding || !newProduct.name || !newProduct.sku}>
              {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Products
