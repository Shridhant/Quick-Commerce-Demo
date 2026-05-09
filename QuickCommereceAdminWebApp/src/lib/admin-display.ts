import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  FileText,
  Shield,
  User,
  XCircle,
} from "lucide-react"

export interface BadgeMeta {
  label: string
  icon: LucideIcon
  className: string
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

export function formatCurrencyINR(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value))
}

export function getRoleMeta(role: string): BadgeMeta {
  const normalizedRole = role.toLowerCase()

  switch (normalizedRole) {
    case "super_admin":
    case "superadmin":
      return {
        label: "Super Admin",
        icon: Crown,
        className: "border-red-200 bg-red-50 text-red-700",
      }
    case "admin":
      return {
        label: "Admin",
        icon: Shield,
        className: "border-blue-200 bg-blue-50 text-blue-700",
      }
    case "moderator":
      return {
        label: "Moderator",
        icon: User,
        className: "border-green-200 bg-green-50 text-green-700",
      }
    default:
      return {
        label: role,
        icon: User,
        className: "border-gray-200 bg-gray-50 text-gray-700",
      }
  }
}

export function getDriverStatusMeta(status: string): BadgeMeta {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        icon: CheckCircle2,
        className: "border-green-200 bg-green-50 text-green-700",
      }
    case "INACTIVE":
      return {
        label: "Inactive",
        icon: AlertCircle,
        className: "border-gray-200 bg-gray-50 text-gray-700",
      }
    case "REJECTED":
      return {
        label: "Rejected",
        icon: XCircle,
        className: "border-red-200 bg-red-50 text-red-700",
      }
    default:
      return {
        label: status,
        icon: AlertCircle,
        className: "border-gray-200 bg-gray-50 text-gray-700",
      }
  }
}

export function getWarehouseStatusMeta(status: string): BadgeMeta {
  return status === "ACTIVE"
    ? {
        label: "Active",
        icon: CheckCircle2,
        className: "border-green-200 bg-green-50 text-green-700",
      }
    : {
        label: "Inactive",
        icon: XCircle,
        className: "border-gray-200 bg-gray-50 text-gray-700",
      }
}

export function getVendorStatusMeta(status: string): BadgeMeta {
  const normalizedStatus = status.toUpperCase()

  switch (normalizedStatus) {
    case "ACTIVE":
    case "APPROVED":
      return {
        label: status,
        icon: CheckCircle2,
        className: "border-green-200 bg-green-50 text-green-700",
      }
    case "PENDING":
      return {
        label: "Pending",
        icon: AlertCircle,
        className: "border-amber-200 bg-amber-50 text-amber-700",
      }
    default:
      return {
        label: status,
        icon: XCircle,
        className: "border-red-200 bg-red-50 text-red-700",
      }
  }
}

export function getVerificationMeta(isVerified: boolean): BadgeMeta {
  return isVerified
    ? {
        label: "Verified",
        icon: CheckCircle2,
        className: "border-blue-200 bg-blue-50 text-blue-700",
      }
    : {
        label: "Pending",
        icon: FileText,
        className: "border-orange-200 bg-orange-50 text-orange-700",
      }
}
