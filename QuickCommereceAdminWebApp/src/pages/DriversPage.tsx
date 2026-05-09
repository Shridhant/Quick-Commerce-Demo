"use client"

import { useMemo, useState } from "react"
import { Car, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DriverActionDialogs } from "@/components/driver/driver-action-dialogs"
import { DriverDetailsDialog } from "@/components/driver/driver-details-dialog"
import { DriverDocumentsDialog } from "@/components/driver/driver-document-dialog"
import { DriversTable } from "@/components/driver/drivers-table"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { useDrivers, type Driver } from "@/hooks/useDriver"

type DriverDialogMode = "verify" | "reject" | "status" | null

export default function DriversPage() {
  const navigate = useNavigate()
  const { drivers, isLoading, actionLoading, verifyDriver, rejectDriver, updateDriverStatus } = useDrivers()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DriverDialogMode>(null)

  const filteredDrivers = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return drivers.filter((driver) => {
      return (
        driver.name?.toLowerCase().includes(query) ||
        driver.email?.toLowerCase().includes(query) ||
        driver.phone?.includes(searchTerm) ||
        driver.driver_id?.toLowerCase().includes(query)
      )
    })
  }, [drivers, searchTerm])

  const isActionDialogOpen = dialogMode !== null

  if (isLoading) {
    return <LoadingSpinner message="Loading drivers..." />
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Drivers Management"
        description="Manage drivers, review documents, and update status."
        meta={<span>{drivers.length} total drivers</span>}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drivers ({filteredDrivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDrivers.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No drivers found"
              description={searchTerm ? "No drivers match your current search." : "No drivers are available right now."}
            />
          ) : (
            <DriversTable
              drivers={drivers}
              searchTerm={searchTerm}
              onViewDriver={(driver) => {
                setSelectedDriver(driver)
                setIsDetailsOpen(true)
              }}
              onViewAnalytics={(driver) => {
                navigate(`/drivers/${driver.driver_id}/analytics`)
              }}
              onViewDocuments={(driver) => {
                setSelectedDriver(driver)
                setIsDocumentsOpen(true)
              }}
              onVerify={(driver) => {
                setSelectedDriver(driver)
                setDialogMode("verify")
              }}
              onReject={(driver) => {
                setSelectedDriver(driver)
                setDialogMode("reject")
              }}
              onUpdateStatus={(driver) => {
                setSelectedDriver(driver)
                setDialogMode("status")
              }}
            />
          )}
        </CardContent>
      </Card>

      <DriverDetailsDialog driver={selectedDriver} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />

      <DriverDocumentsDialog driver={selectedDriver} open={isDocumentsOpen} onOpenChange={setIsDocumentsOpen} />

      <DriverActionDialogs
        driver={selectedDriver}
        mode={dialogMode}
        open={isActionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null)
          }
        }}
        isSubmitting={selectedDriver ? actionLoading === selectedDriver.driver_id : false}
        onSubmit={async ({ remarks, status }) => {
          if (!selectedDriver) return

          if (dialogMode === "verify") {
            await verifyDriver(selectedDriver.driver_id, remarks)
          } else if (dialogMode === "reject") {
            await rejectDriver(selectedDriver.driver_id, remarks)
          } else if (dialogMode === "status" && status) {
            await updateDriverStatus(selectedDriver.driver_id, status, remarks)
          }

          setDialogMode(null)
        }}
      />
    </div>
  )
}
