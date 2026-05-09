"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Building,
  Calendar,
  Eye,
  MapPin,
  MoreVertical,
  Phone,
  Power,
  Trash2,
  User,
  UserCheck,
  Users,
  Package,
} from "lucide-react"
import type { Vendor } from "@/hooks/useVendors"
import { AddInventoryDialog } from "./AddInventoryDialog"
import { formatDate, getVendorStatusMeta, getVerificationMeta } from "@/lib/admin-display"

interface VendorsTableProps {
  vendors: Vendor[]
  onViewVendor: (vendorId: string) => void
  onVerifyVendor: (vendorId: string) => void
  onDeleteVendor?: (vendorId: string) => void
  onToggleStatus?: (vendorId: string, currentlyActive: boolean) => void
}

export function VendorsTable({ vendors, onViewVendor, onVerifyVendor, onDeleteVendor, onToggleStatus }: VendorsTableProps) {
  const navigate = useNavigate()
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string } | null>(null)
  
  const handleVendorsProductClick = (vendorId: string) => {
    navigate(`/vendor/${vendorId}`)
  }

  const handleAddInventory = (vendorId: string, vendorName: string) => {
    setSelectedVendor({ id: vendorId, name: vendorName })
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No vendors found</h3>
        <p className="text-muted-foreground">No vendors match your search criteria.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor ID</TableHead>
              <TableHead>Business Info</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.vendor_id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-sm font-medium">{vendor.vendor_id}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center font-medium">
                      <Building className="w-4 h-4 mr-2 text-primary" />
                      {vendor.name}
                    </div>
                    {vendor.business_owner_name && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="w-3 h-3 mr-1" />
                        {vendor.business_owner_name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="w-3 h-3 mr-1" />
                    {vendor.phone}
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.address_line1 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="line-clamp-1">{vendor.address_line1}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const meta = getVendorStatusMeta(vendor.status)
                    const Icon = meta.icon
                    return (
                      <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const meta = getVerificationMeta(vendor.isDocumentVerified === 1)
                    const Icon = meta.icon
                    return (
                      <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(vendor.created_at)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewVendor(vendor.vendor_id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleVendorsProductClick(vendor.vendor_id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Vendor's Products
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddInventory(vendor.vendor_id, vendor.name)}>
                        <Package className="w-4 h-4 mr-2" />
                        Add Inventory
                      </DropdownMenuItem>
                      {vendor.isDocumentVerified === 0 && (
                        <DropdownMenuItem onClick={() => onVerifyVendor(vendor.vendor_id)}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Verify Vendor
                        </DropdownMenuItem>
                      )}
                      {onToggleStatus && (
                        <DropdownMenuItem onClick={() => onToggleStatus(vendor.vendor_id, vendor.isActive === 1)}>
                          <Power className="w-4 h-4 mr-2" />
                          {vendor.isActive === 1 ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      )}
                      {onDeleteVendor && (
                        <DropdownMenuItem
                          onClick={() => onDeleteVendor(vendor.vendor_id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Vendor
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Inventory Dialog */}
      <AddInventoryDialog
        open={!!selectedVendor}
        onOpenChange={(open) => !open && setSelectedVendor(null)}
        vendorId={selectedVendor?.id || ""}
        vendorName={selectedVendor?.name || ""}
      />
    </>
  )
}
