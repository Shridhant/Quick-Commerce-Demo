"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Check, X, RefreshCw } from "lucide-react"
import type { Driver } from "@/hooks/useDriver"

interface DriverActionDialogsProps {
  driver: Driver | null
  mode: "verify" | "reject" | "status" | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onSubmit: (payload: { remarks: string; status?: string }) => Promise<void> | void
}

export function DriverActionDialogs({
  driver,
  mode,
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: DriverActionDialogsProps) {
  const [remarks, setRemarks] = useState("")
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    if (open && driver && mode === "status") {
      setNewStatus(driver.status)
    }

    if (!open) {
      setRemarks("")
      setNewStatus("")
    }
  }, [driver, mode, open])

  if (!driver || !mode) return null

  const handleSubmit = async () => {
    await onSubmit({
      remarks,
      status: mode === "status" ? newStatus : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            className={`flex items-center gap-2 ${
              mode === "verify" ? "text-green-600" : mode === "reject" ? "text-red-600" : "text-blue-600"
            }`}
          >
            {mode === "verify" ? <Check className="size-5" /> : null}
            {mode === "reject" ? <X className="size-5" /> : null}
            {mode === "status" ? <RefreshCw className="size-5" /> : null}
            {mode === "verify" ? "Verify Driver Documents" : null}
            {mode === "reject" ? "Reject Driver Documents" : null}
            {mode === "status" ? "Update Driver Status" : null}
          </DialogTitle>
          <DialogDescription>
            {mode === "verify" ? `Verify the documents for ${driver.name}` : null}
            {mode === "reject" ? `Provide a reason for rejecting ${driver.name}'s documents` : null}
            {mode === "status" ? `Change the status for ${driver.name}` : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {mode === "status" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div>
            <label className="mb-2 block text-sm font-medium">
              {mode === "status" ? "Remarks (Optional)" : "Remarks"}
            </label>
            <Textarea
              placeholder={
                mode === "verify"
                  ? "e.g., All documents verified successfully"
                  : mode === "reject"
                    ? "e.g., License image is blurry. Please upload a clear photo."
                    : "e.g., Status updated after review"
              }
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (mode !== "status" && !remarks.trim()) ||
              (mode === "status" && (!newStatus || newStatus === driver.status))
            }
            variant={mode === "reject" ? "destructive" : "default"}
            className={mode === "verify" ? "bg-green-600 hover:bg-green-700" : undefined}
          >
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {mode === "verify" ? "Verify Documents" : null}
            {mode === "reject" ? "Reject Documents" : null}
            {mode === "status" ? "Update Status" : null}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
