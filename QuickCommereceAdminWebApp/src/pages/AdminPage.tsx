"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AdminDetailsDialog } from "@/components/admin/AdminDetailsDialog"
import { AdminFormDialog } from "@/components/admin/AdminFormDialog"
import { AdminTable } from "@/components/admin/AdminTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { PageHeader } from "@/components/shared/PageHeader"
import { useAdmins, type Admin } from "@/hooks/useAdmins"

export default function AdminPage() {
  const { admins, activeWarehouses, isLoading, refetch, createAdmin } = useAdmins()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return admins.filter((admin) => {
      return (
        admin.name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query) ||
        admin.admin_id.toString().includes(searchTerm)
      )
    })
  }, [admins, searchTerm])

  if (isLoading) {
    return <LoadingSpinner message="Loading admins..." />
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Admin Management"
        description="Manage admin accounts and warehouse assignments."
        meta={<span>{admins.length} total admins</span>}
        actions={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search admins by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admins ({filteredAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAdmins.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No admins found"
              description={
                searchTerm
                  ? "No admins match your current search."
                  : "No admin users have been created yet."
              }
              action={
                <div className="flex gap-2">
                  {!searchTerm ? (
                    <Button onClick={() => setIsAddOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Admin
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={refetch}>
                    Refresh
                  </Button>
                </div>
              }
            />
          ) : (
            <AdminTable
              admins={filteredAdmins}
              onViewAdmin={(admin) => {
                setSelectedAdmin(admin)
                setIsDetailsOpen(true)
              }}
            />
          )}
        </CardContent>
      </Card>

      <AdminFormDialog open={isAddOpen} onOpenChange={setIsAddOpen} warehouses={activeWarehouses} onSubmit={createAdmin} />

      <AdminDetailsDialog admin={selectedAdmin} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
    </div>
  )
}
