class ApiClient {
    private readonly baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  
    private getAuthHeaders(): HeadersInit {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    }
  
    private async handleResponse<T>(response: Response): Promise<T> {
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }
      return response.json()
    }
  
    async get<T>(endpoint: string): Promise<T> {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
      return this.handleResponse<T>(response)
    }
  
    async put<T>(endpoint: string, data: unknown): Promise<T> {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      })
      return this.handleResponse<T>(response)
    }
  }
  
  export const apiClient = new ApiClient()