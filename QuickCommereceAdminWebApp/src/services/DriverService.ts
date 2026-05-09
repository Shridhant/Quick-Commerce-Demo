import type { Driver, DriverStatus, DocumentFilter, ApiResponse } from '../types/Drivers'
import { apiClient } from './ApiClient'

class DriverService {
  private readonly baseUrl = '/admin/v1/drivers'

  async getDrivers(filters: {
    status?: DriverStatus
    documentVerified?: DocumentFilter
    page?: number
    limit?: number
  }): Promise<ApiResponse<Driver[]>> {
    const params = new URLSearchParams()
    
    if (filters.status && filters.status !== 'PENDING') {
      params.append('status', filters.status)
    }
    if (filters.documentVerified && filters.documentVerified !== 'ALL') {
      params.append('documentVerified', filters.documentVerified)
    }
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    return apiClient.get<ApiResponse<Driver[]>>(`${this.baseUrl}/all?${params.toString()}`)
  }

  async verifyDriver(driverId: string): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/${driverId}/verify`, {})
  }

  async rejectDriver(driverId: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/${driverId}/reject`, { rejectionReason: reason })
  }

  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/${driverId}/status`, { status })
  }
}

export const driverService = new DriverService()