// components/VendorDetailsDialog.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,

  CreditCard,
} from "lucide-react";

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

interface VendorDetailsDialogProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifyClick: () => void;
}

const VendorDetailsDialog: React.FC<VendorDetailsDialogProps> = ({
  vendor,
  isOpen,
  onClose,
  onVerifyClick,
}) => {
  const getStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return {
          label: "Active",
          icon: CheckCircle2,
          color: "bg-green-500 dark:bg-green-400",
        };
      case "INACTIVE":
        return {
          label: "Inactive",
          icon: XCircle,
          color: "bg-gray-400 dark:bg-gray-500",
        };
      case "PENDING":
        return {
          label: "Pending",
          icon: Clock,
          color: "bg-yellow-500 dark:bg-yellow-400",
        };
      default:
        return {
          label: status || "Unknown",
          icon: AlertCircle,
          color: "bg-gray-400 dark:bg-gray-500",
        };
    }
  };

  const getDocumentDisplay = (verified: number) => {
    return verified === 1
      ? {
          label: "Verified",
          icon: ShieldCheck,
          color: "bg-green-500 dark:bg-green-400",
        }
      : {
          label: "Pending",
          icon: FileText,
          color: "bg-orange-500 dark:bg-orange-400",
        };
  };

  if (!vendor) return null;

  const statusDisplay = getStatusDisplay(vendor.status);
  const documentDisplay = getDocumentDisplay(vendor.isDocumentVerified);
  const StatusIcon = statusDisplay.icon;
  const DocumentIcon = documentDisplay.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center text-2xl font-bold">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            {vendor.name}
          </DialogTitle>
          <DialogDescription className="text-base ml-13">
            Vendor ID:{" "}
            <span className="font-mono font-semibold">{vendor.vendor_id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Document Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Current Status
                  </p>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${statusDisplay.color}`}
                    ></div>
                    <span className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                      {statusDisplay.label}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                  <StatusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    Document Status
                  </p>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${documentDisplay.color}`}
                    ></div>
                    <span className="font-semibold text-green-900 dark:text-green-100 text-lg">
                      {documentDisplay.label}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                  <DocumentIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                Business Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Business Name
                      </p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {vendor.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Business Owner
                      </p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {vendor.business_owner_name}
                      </p>
                    </div>
                  </div>

                  {vendor.gstId && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          GST ID
                        </p>
                        <p className="text-base font-mono font-medium text-gray-900 dark:text-white">
                          {vendor.gstId}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Registration Date
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">
                      {new Date(vendor.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Account Status
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">
                      {vendor.isActive === 1
                        ? "Active Account"
                        : "Inactive Account"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Phone className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Contact Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center mb-2">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Email Address
                    </span>
                  </div>
                  <p className="font-mono text-blue-900 dark:text-blue-100">
                    {vendor.email}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center mb-2">
                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Phone Number
                    </span>
                  </div>
                  <p className="font-mono text-green-900 dark:text-green-100">
                    {vendor.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Business Address
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Primary Address
                  </p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {vendor.address_line1}
                  </p>
                </div>
              </div>

              {vendor.address_line2 && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Secondary Address
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {vendor.address_line2}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    City
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">
                    {vendor.city}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    State
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">
                    {vendor.state}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Postal Code
                  </p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white text-base">
                    {vendor.postal_code}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Country
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">
                    {vendor.country}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Files */}
          {(vendor.gstFile || vendor.tradeLicenseFile) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                  Document Files
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendor.gstFile && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center mb-2">
                        <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          GST Document
                        </span>
                      </div>
                      <p className="font-mono text-sm text-orange-900 dark:text-orange-100 truncate">
                        {vendor.gstFile}
                      </p>
                    </div>
                  )}
                  {vendor.tradeLicenseFile && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center mb-2">
                        <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Trade License
                        </span>
                      </div>
                      <p className="font-mono text-sm text-green-900 dark:text-green-100 truncate">
                        {vendor.tradeLicenseFile}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          {vendor.remarks && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                  Remarks
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {vendor.remarks}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </Button>
          {vendor.isDocumentVerified === 0 && (
            <Button
              onClick={onVerifyClick}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 px-6 rounded-xl"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Verify & Assign Warehouse
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorDetailsDialog;
