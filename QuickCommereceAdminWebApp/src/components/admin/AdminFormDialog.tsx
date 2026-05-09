"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminWarehouse } from "@/hooks/useAdmins"
import { Loader2, Plus, Warehouse } from "lucide-react"

interface AdminFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouses: AdminWarehouse[]
  onSubmit: (payload: {
    name: string
    email: string
    password: string
    assigned_warehouse: string | null
  }) => Promise<void>
}

const initialForm = {
  name: "",
  email: "",
  password: "",
  assignedWarehouse: "none",
}

export function AdminFormDialog({ open, onOpenChange, warehouses, onSubmit }: AdminFormDialogProps) {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setIsSubmitting(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: form.name,
        email: form.email,
        password: form.password,
        assigned_warehouse: form.assignedWarehouse === "none" ? null : form.assignedWarehouse,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Admin
          </DialogTitle>
          <DialogDescription>Create a new admin account with optional warehouse assignment.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Full Name</Label>
            <Input
              id="admin-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter admin's full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-warehouse">Assign Warehouse</Label>
            <Select
              value={form.assignedWarehouse}
              onValueChange={(value) => setForm((prev) => ({ ...prev, assignedWarehouse: value }))}
            >
              <SelectTrigger id="admin-warehouse">
                <SelectValue placeholder="Select a warehouse (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No warehouse assignment</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      <span>{warehouse.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter secure password"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.name || !form.email || !form.password}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Admin"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
