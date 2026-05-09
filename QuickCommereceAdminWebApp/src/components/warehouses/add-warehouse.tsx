"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface AddWarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWarehouseAdded: () => void
}

export function AddWarehouseDialog({ open, onOpenChange, onWarehouseAdded }: AddWarehouseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
        const authToken = localStorage.getItem('authToken')
      const response = await fetch("/warehouses", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Warehouse added successfully")
        onWarehouseAdded()
        onOpenChange(false)
        setFormData({
          name: "",
          address_line1: "",
          address_line2: "",
          city: "Dimapur",
          state: "",
          postal_code: "",
          country: "",
        })
      } else {
        toast.error(data.message || "Failed to add warehouse")
      }
    } catch (error) {
      toast.error("Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Warehouse</DialogTitle>
          <DialogDescription>Enter the details for the new warehouse location</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Warehouse Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Warehouse
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
