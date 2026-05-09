"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Admin } from "@/hooks/useAdmins"
import { formatDateTime, getRoleMeta } from "@/lib/admin-display"
import { Mail, Users } from "lucide-react"

interface AdminDetailsDialogProps {
  admin: Admin | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminDetailsDialog({ admin, open, onOpenChange }: AdminDetailsDialogProps) {
  if (!admin) return null

  const roleMeta = getRoleMeta(admin.role)
  const RoleIcon = roleMeta.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Details
          </DialogTitle>
          <DialogDescription>Admin ID: #{admin.admin_id}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <p className="mt-1 font-medium">{admin.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div className="mt-1">
                <Badge variant="outline" className={roleMeta.className}>
                  <RoleIcon className="mr-1 h-3 w-3" />
                  {roleMeta.label}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Email Address</Label>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{admin.email}</span>
            </div>
          </div>

          {admin.assigned_warehouse ? (
            <div>
              <Label className="text-xs text-muted-foreground">Assigned Warehouse</Label>
              <p className="mt-1 text-sm">{admin.assigned_warehouse}</p>
            </div>
          ) : null}

          <div>
            <Label className="text-xs text-muted-foreground">Created At</Label>
            <p className="mt-1 text-sm">{formatDateTime(admin.created_at)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
