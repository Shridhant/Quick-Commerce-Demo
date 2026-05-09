// components/AddWarehouseDialog.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WarehouseFormData {
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: string;
  longitude: string;
}

interface AddWarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWarehouseAdded: (payload: {
    name: string
    address_line1: string
    address_line2: string | null
    city: string
    state: string
    postal_code: string
    country: string
    latitude: number | null
    longitude: number | null
  }) => Promise<void>
}

const AddWarehouseDialog: React.FC<AddWarehouseDialogProps> = ({
  open,
  onOpenChange,
  onWarehouseAdded,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: "",
    address_line1: "",
    address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        latitude: "",
        longitude: "",
      });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      latitude: "",
      longitude: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      await onWarehouseAdded(payload)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Warehouse</DialogTitle>
          <DialogDescription>
            Create a new warehouse location with complete address details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter warehouse name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Enter country"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                placeholder="Enter primary address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleInputChange}
                placeholder="Enter additional address details (optional)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Enter state"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="Enter postal code"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="Enter latitude (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="Enter longitude (optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Warehouse"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWarehouseDialog;
