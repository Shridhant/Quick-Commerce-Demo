export interface Driver {
    driver_id: string
    name: string
    email: string
    phone: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    vehicle_type?: string
    vehicle_number?: string
    vehicle_image?: string
    driving_license_file?: string
    status: DriverStatus
    isActive: boolean
    isDocumentVerified: boolean
    isDocumentUploaded: boolean
    created_at: string
  }



export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'PENDING'
export type DocumentFilter = 'true' | 'false' | 'ALL'

export interface ApiResponse<T> {
  success: boolean
  message: string
  result?: T
  count?: number
}
