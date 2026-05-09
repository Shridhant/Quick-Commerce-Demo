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
import { Textarea } from "@/components/ui/textarea"
import { Truck, Calendar, Clock, Phone, FileText, Loader2 } from "lucide-react"

interface ApprovalDialogProps {
  orderId: string
  vendorId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (data: ApprovalData) => Promise<void>
}

export interface ApprovalData {
  orderId: string
  vendorId: string
  remarks: string
  driverName: string
  driverPhone: string
  vehicleNumber: string
  pickupDate: string
  pickupTimeStart: string
  pickupTimeEnd: string
  pickupNotes: string
}

export function ApprovalDialog({ orderId, vendorId, open, onOpenChange, onApprove }: ApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Omit<ApprovalData, 'orderId' | 'vendorId'>>({
    remarks: "Approved for delivery",
    driverName: "",
    driverPhone: "",
    vehicleNumber: "",
    pickupDate: "",
    pickupTimeStart: "",
    pickupTimeEnd: "",
    pickupNotes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.driverName.trim()) {
      newErrors.driverName = "Driver name is required"
    }

    if (!formData.driverPhone.trim()) {
      newErrors.driverPhone = "Driver phone is required"
    } else if (!/^\+?[\d\s-()]+$/.test(formData.driverPhone)) {
      newErrors.driverPhone = "Invalid phone number format"
    }

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = "Vehicle number is required"
    }

    if (!formData.pickupDate) {
      newErrors.pickupDate = "Pickup date is required"
    }

    if (!formData.pickupTimeStart) {
      newErrors.pickupTimeStart = "Start time is required"
    }

    if (!formData.pickupTimeEnd) {
      newErrors.pickupTimeEnd = "End time is required"
    }

    if (formData.pickupTimeStart && formData.pickupTimeEnd) {
      if (formData.pickupTimeStart >= formData.pickupTimeEnd) {
        newErrors.pickupTimeEnd = "End time must be after start time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onApprove({
        orderId,
        vendorId,
        ...formData,
      })
      onOpenChange(false)
      // Reset form
      setFormData({
        remarks: "Approved for delivery",
        driverName: "",
        driverPhone: "",
        vehicleNumber: "",
        pickupDate: "",
        pickupTimeStart: "",
        pickupTimeEnd: "",
        pickupNotes: "",
      })
    } catch (error) {
      console.error("Error approving order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Approve Order & Schedule Pickup
          </DialogTitle>
          <DialogDescription>
            Enter driver and pickup details to approve order {orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="w-4 h-4" />
              Driver Information
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverName">
                  Driver Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="driverName"
                  placeholder="John Doe"
                  value={formData.driverName}
                  onChange={(e) => handleChange("driverName", e.target.value)}
                  className={errors.driverName ? "border-red-500" : ""}
                />
                {errors.driverName && (
                  <p className="text-xs text-red-500">{errors.driverName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverPhone">
                  Driver Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="driverPhone"
                    placeholder="+1234567890"
                    value={formData.driverPhone}
                    onChange={(e) => handleChange("driverPhone", e.target.value)}
                    className={`pl-10 ${errors.driverPhone ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.driverPhone && (
                  <p className="text-xs text-red-500">{errors.driverPhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">
                Vehicle Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vehicleNumber"
                placeholder="ABC-1234"
                value={formData.vehicleNumber}
                onChange={(e) => handleChange("vehicleNumber", e.target.value.toUpperCase())}
                className={errors.vehicleNumber ? "border-red-500" : ""}
              />
              {errors.vehicleNumber && (
                <p className="text-xs text-red-500">{errors.vehicleNumber}</p>
              )}
            </div>
          </div>

          {/* Pickup Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Pickup Schedule
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupDate">
                Pickup Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pickupDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.pickupDate}
                onChange={(e) => handleChange("pickupDate", e.target.value)}
                className={errors.pickupDate ? "border-red-500" : ""}
              />
              {errors.pickupDate && (
                <p className="text-xs text-red-500">{errors.pickupDate}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupTimeStart">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pickupTimeStart"
                    type="time"
                    value={formData.pickupTimeStart}
                    onChange={(e) => handleChange("pickupTimeStart", e.target.value)}
                    className={`pl-10 ${errors.pickupTimeStart ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.pickupTimeStart && (
                  <p className="text-xs text-red-500">{errors.pickupTimeStart}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupTimeEnd">
                  End Time <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pickupTimeEnd"
                    type="time"
                    value={formData.pickupTimeEnd}
                    onChange={(e) => handleChange("pickupTimeEnd", e.target.value)}
                    className={`pl-10 ${errors.pickupTimeEnd ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.pickupTimeEnd && (
                  <p className="text-xs text-red-500">{errors.pickupTimeEnd}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" />
              Additional Information
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupNotes">Pickup Notes</Label>
              <Textarea
                id="pickupNotes"
                placeholder="Please call before arrival"
                value={formData.pickupNotes}
                onChange={(e) => handleChange("pickupNotes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Approved for delivery"
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}