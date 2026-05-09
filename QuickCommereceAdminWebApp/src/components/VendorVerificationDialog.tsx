// components/VendorVerificationDialog.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  UserCheck,
  Loader2,
  CheckCircle2,
  Building,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Updated Vendor interface to match your actual database
interface Vendor {
  vendor_id: string;
  business_owner_name: string;
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  status: string;
  isActive: number;
  isDocumentUploaded: number;
  isDocumentVerified: number;
  gstId: string;
  gstFile: string;
  tradeLicenseFile: string;
  store_image: string;
  remarks: string;
  created_at: string;
}

interface VendorVerificationDialogProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VendorVerificationDialog: React.FC<VendorVerificationDialogProps> = ({
  vendor,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerification = async () => {
    if (!vendor) return;

    setIsVerifying(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_PORT_ADMIN}/vendor/verify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vendorId: vendor.vendor_id }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Vendor verified and warehouse assigned successfully");
        onClose();
        onSuccess(); // Refresh the vendor list
      } else {
        toast.error(data.message || "Failed to verify vendor");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Network error occurred while verifying vendor");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center text-xl dark:text-white">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-3">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            Verify Vendor & Assign Warehouse
          </DialogTitle>
          <DialogDescription className="text-base dark:text-gray-400">
            Are you sure you want to verify this vendor and assign them a
            warehouse? This action will:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
              Mark vendor documents as verified
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Building className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
              Assign warehouse for inventory management
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <ShieldCheck className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
              Enable vendor to process orders
            </div>
          </div>

          {vendor && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor Details:
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-blue-500" />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {vendor.name}
                  </p>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-green-500" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {vendor.business_owner_name}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  ID: {vendor.vendor_id}
                </p>
                {vendor.gstId && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    GST: {vendor.gstId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isVerifying}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerification}
            disabled={isVerifying}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Verify & Assign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorVerificationDialog;
