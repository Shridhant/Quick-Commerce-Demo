"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Eye, Package, BarChart3 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { Warehouse } from "@/hooks/useWarehouses"
import { formatDate, getWarehouseStatusMeta } from "@/lib/admin-display"

interface WarehousesTableProps {
  warehouses: Warehouse[]
  onViewWarehouse: (id: string) => void
}

export function WarehousesTable({ warehouses, onViewWarehouse }: WarehousesTableProps) {
  const navigate = useNavigate()

  const getStatusBadge = (status: string) => {
    const meta = getWarehouseStatusMeta(status)
    const Icon = meta.icon
    return (
      <Badge variant="outline" className={meta.className}>
        <Icon className="mr-1 h-3 w-3" />
        {meta.label}
      </Badge>
    )
  }

  const handleViewProducts = (warehouseId: string) => {
    navigate(`/warehouse/${warehouseId}`)
  }

  const handleViewAnalytics = (warehouseId: string) => {
    navigate(`/warehouse/${warehouseId}/analytics`)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Warehouse ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((warehouse) => (
            <TableRow key={warehouse.warehouse_id} className="hover:bg-muted/50">
              <TableCell className="font-mono text-sm">{warehouse.warehouse_id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{warehouse.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-start gap-1">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {warehouse.city}, {warehouse.state}
                    </p>
                    <p className="text-muted-foreground">{warehouse.country}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(warehouse.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(warehouse.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewProducts(warehouse.warehouse_id)}
                    title="View Products"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Products
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewAnalytics(warehouse.warehouse_id)}
                    title="View Analytics"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onViewWarehouse(warehouse.warehouse_id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
