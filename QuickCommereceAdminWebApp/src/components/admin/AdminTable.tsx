"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Mail, User, Users } from "lucide-react"
import type { Admin } from "@/hooks/useAdmins"
import { formatDate, getRoleMeta } from "@/lib/admin-display"

interface AdminTableProps {
  admins: Admin[]
  onViewAdmin: (admin: Admin) => void
}

export function AdminTable({ admins, onViewAdmin }: AdminTableProps) {
  if (admins.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Users className="mx-auto mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium text-foreground">No admins found</h3>
        <p className="mt-1 text-sm">Try adjusting your search or add a new admin.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => {
            const roleMeta = getRoleMeta(admin.role)
            const RoleIcon = roleMeta.icon

            return (
              <TableRow key={admin.admin_id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">#{admin.admin_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{admin.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleMeta.className}>
                    <RoleIcon className="mr-1 h-3 w-3" />
                    {roleMeta.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(admin.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onViewAdmin(admin)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
