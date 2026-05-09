"use client"

import { useMemo, useState } from "react"
import { Building2, Filter, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import AddWarehouseDialog from "@/components/AddWarehouseDialog"
import { WarehousesTable } from "@/components/warehouses/warehouses-table"
import { WarehouseDetailsDialog } from "@/components/warehouses/warehouse-details-dialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { useWarehouses } from "@/hooks/useWarehouses"

type WarehouseStatus = "ACTIVE" | "INACTIVE"

export default function WarehousePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<WarehouseStatus>("ACTIVE")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { warehouses, isLoading, createWarehouse } = useWarehouses(statusFilter)

  const filteredWarehouses = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return warehouses.filter((warehouse) => {
      return (
        warehouse.name.toLowerCase().includes(query) ||
        warehouse.city.toLowerCase().includes(query) ||
        warehouse.state.toLowerCase().includes(query) ||
        warehouse.warehouse_id.toLowerCase().includes(query)
      )
    })
  }, [searchTerm, warehouses])

  const selectedWarehouse = warehouses.find((warehouse) => warehouse.warehouse_id === selectedWarehouseId)

  if (isLoading) {
    return <LoadingSpinner message="Loading warehouses..." />
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Warehouse Management"
        description="Manage warehouse locations, inventory views, and analytics."
        meta={<span>{warehouses.length} warehouses in {statusFilter.toLowerCase()} view</span>}
        actions={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px] bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  {statusFilter === "ACTIVE" ? "Active" : "Inactive"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("INACTIVE")}>Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouses ({filteredWarehouses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWarehouses.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No warehouses found"
              description={
                searchTerm || statusFilter !== "ACTIVE"
                  ? "No warehouses match your current filters."
                  : "Add your first warehouse to start tracking inventory locations."
              }
              action={
                !searchTerm && statusFilter === "ACTIVE" ? (
                  <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Warehouse
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <WarehousesTable warehouses={filteredWarehouses} onViewWarehouse={setSelectedWarehouseId} />
          )}
        </CardContent>
      </Card>

      <AddWarehouseDialog open={isAddOpen} onOpenChange={setIsAddOpen} onWarehouseAdded={createWarehouse} />

      <WarehouseDetailsDialog
        warehouse={selectedWarehouse}
        open={!!selectedWarehouseId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedWarehouseId(null)
          }
        }}
      />
    </div>
  )
}
