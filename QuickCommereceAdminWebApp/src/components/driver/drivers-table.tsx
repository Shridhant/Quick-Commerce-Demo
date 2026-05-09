"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Check,
  X,
  RefreshCw,
  ImageIcon,
  User,
  Mail,
  Phone,
  Car,
  BarChart3
} from "lucide-react"
import type { Driver } from "@/hooks/useDriver"
import { getDriverStatusMeta, getVerificationMeta } from "@/lib/admin-display"

interface DriversTableProps {
  drivers: Driver[]
  searchTerm: string
  onViewDriver: (driver: Driver) => void
  onViewAnalytics: (driver: Driver) => void
  onViewDocuments: (driver: Driver) => void
  onVerify: (driver: Driver) => void
  onReject: (driver: Driver) => void
  onUpdateStatus: (driver: Driver) => void
}

export function DriversTable({
  drivers,
  searchTerm,
  onViewDriver,
  onViewAnalytics,
  onViewDocuments,
  onVerify,
  onReject,
  onUpdateStatus,
}: DriversTableProps) {
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm) ||
      driver.driver_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const meta = getDriverStatusMeta(status)
    const Icon = meta.icon
    return (
      <Badge variant="outline" className={meta.className}>
        <Icon className="mr-1 size-3" />
        {meta.label}
      </Badge>
    )
  }

  const getDocumentBadge = (verified: boolean) => {
    const meta = getVerificationMeta(verified)
    const Icon = meta.icon
    return (
      <Badge variant="outline" className={meta.className}>
        <Icon className="mr-1 size-3" />
        {meta.label}
      </Badge>
    )
  }

  if (filteredDrivers.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="size-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No drivers found</h3>
        <p className="text-muted-foreground">
          {searchTerm ? "No drivers match your search criteria." : "No drivers available."}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDrivers.map((driver) => (
            <TableRow key={driver.driver_id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{driver.driver_id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="font-medium">{driver.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <Mail className="size-3 text-muted-foreground" />
                    <span className="truncate max-w-[150px]">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground" />
                    <span>{driver.phone}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {driver.vehicle_type && <p className="font-medium">{driver.vehicle_type}</p>}
                  {driver.vehicle_number && <p className="text-muted-foreground">{driver.vehicle_number}</p>}
                  {!driver.vehicle_type && !driver.vehicle_number && (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(driver.status)}</TableCell>
              <TableCell>{getDocumentBadge(driver.isDocumentVerified)}</TableCell>
              <TableCell>
                <div className="text-sm">{new Date(driver.created_at).toLocaleDateString()}</div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewDriver(driver)} title="View Details">
                    <Eye className="size-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewAnalytics(driver)} 
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    title="View Analytics & History"
                  >
                    <BarChart3 className="size-4" />
                  </Button>
                  {(driver.vehicle_image || driver.driving_license_file) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDocuments(driver)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      title="View Documents"
                    >
                      <ImageIcon className="size-4" />
                    </Button>
                  )}
                  {!driver.isDocumentVerified && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVerify(driver)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Verify Documents"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(driver)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Reject Documents"
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(driver)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Update Status"
                  >
                    <RefreshCw className="size-4" />
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
