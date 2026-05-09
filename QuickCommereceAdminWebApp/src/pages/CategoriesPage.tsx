"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Tag, Loader2, AlertCircle, CheckCircle2, Eye, Edit, Trash2, Plus } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface Category {
  category_id: number
  name: string
  status: string
  created_at: string
  updated_at?: string
}

interface ApiResponse {
  success: boolean
  message: string
  result?: Category[]
  count?: number
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryStatus, setNewCategoryStatus] = useState("Active")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await apiFetch(`/products/categories`)

      const data: ApiResponse = await response.json()

      if (response.ok && data.success) {
        setCategories(data.result || [])
        if (data.count === 0) {
          toast.info("No categories found")
        }
      } else {
        toast.error(data.message || "Failed to fetch categories")
        setCategories([])
      }
    } catch (error) {
      toast.error("Network error occurred while fetching categories")
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category)
    setIsViewDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryStatus(category.status)
    setIsEditDialogOpen(true)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiFetch(`/products/categories`, {
        method: "POST",
        body: JSON.stringify({
          name: newCategoryName.trim(),
          status: newCategoryStatus,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Category added successfully")
        setIsAddDialogOpen(false)
        setNewCategoryName("")
        setNewCategoryStatus("Active")
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to add category")
      }
    } catch (error) {
      toast.error("Network error occurred while adding category")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!selectedCategory || !newCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }

    if (!selectedCategory.category_id) {
      toast.error("Category ID is missing. Please try again.")
      return
    }

    setIsSubmitting(true)
    try {
      const categoryId = selectedCategory.category_id

      const response = await apiFetch(`/products/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: newCategoryName.trim(),
          status: newCategoryStatus,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Category updated successfully")
        setIsEditDialogOpen(false)
        setSelectedCategory(null)
        setNewCategoryName("")
        setNewCategoryStatus("Active")
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to update category")
      }
    } catch (error) {
      toast.error("Network error occurred while updating category")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return
    }

    try {
      const response = await apiFetch(`/products/categories/${categoryId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Category deleted successfully")
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to delete category")
      }
    } catch (error) {
      toast.error("Network error occurred while deleting category")
    }
  }

  const getStatusDisplay = (status: string) => {
    if (status === "Active") {
      return {
        label: "Active",
        variant: "default" as const,
        icon: CheckCircle2,
        color: "text-green-600 bg-green-50 border-green-200",
      }
    } else {
      return {
        label: "Inactive",
        variant: "secondary" as const,
        icon: AlertCircle,
        color: "text-gray-600 bg-gray-50 border-gray-200",
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-h-screen min-w-fit p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
          <p className="text-muted-foreground">Manage your product categories and classifications</p>
        </div>

        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            Categories ({categories.length})
          </CardTitle>
          <CardDescription>Manage and view all product categories</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first category.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const statusDisplay = getStatusDisplay(category.status)
                    const StatusIcon = statusDisplay.icon

                    return (
                      <TableRow key={category.category_id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Tag className="w-4 h-4 mr-2 text-green-600" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <Badge
                            variant={statusDisplay.variant}
                            className={`${statusDisplay.color} dark:text-white dark:border-gray-600 font-medium px-3 py-1 ${
                              category.status === "Active"
                                ? "dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                                : "dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                            }`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusDisplay.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(category.created_at).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {category.updated_at ? new Date(category.updated_at).toLocaleDateString() : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewCategory(category)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.category_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Category
            </DialogTitle>
            <DialogDescription>Create a new product category for your inventory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="Enter category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-status">Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-start bg-transparent">
                    {newCategoryStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setNewCategoryStatus("Active")}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNewCategoryStatus("Inactive")}>Inactive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setNewCategoryName("")
                setNewCategoryStatus("Active")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Edit Category
            </DialogTitle>
            <DialogDescription>Update the category information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                placeholder="Enter category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-status">Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-start bg-transparent">
                    {newCategoryStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setNewCategoryStatus("Active")}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNewCategoryStatus("Inactive")}>Inactive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedCategory(null)
                setNewCategoryName("")
                setNewCategoryStatus("Active")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Category Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>Category Details - ID: {selectedCategory?.category_id}</DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const statusDisplay = getStatusDisplay(selectedCategory.status)
                      const StatusIcon = statusDisplay.icon
                      return (
                        <Badge variant={statusDisplay.variant}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusDisplay.label}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="mt-1 text-sm">{new Date(selectedCategory.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedCategory.updated_at && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="mt-1 text-sm">{new Date(selectedCategory.updated_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CategoriesPage
