import api from './axios'

// Generic API service with automatic loading state handling
export class ApiService {
  /**
   * Perform a GET request
   */
  static async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await api.get<T>(url, { params })
    return response.data
  }

  /**
   * Perform a POST request
   */
  static async post<T>(url: string, data?: any): Promise<T> {
    const response = await api.post<T>(url, data)
    return response.data
  }

  /**
   * Perform a PUT request
   */
  static async put<T>(url: string, data?: any): Promise<T> {
    const response = await api.put<T>(url, data)
    return response.data
  }

  /**
   * Perform a PATCH request
   */
  static async patch<T>(url: string, data?: any): Promise<T> {
    const response = await api.patch<T>(url, data)
    return response.data
  }

  /**
   * Perform a DELETE request
   */
  static async delete<T>(url: string): Promise<T> {
    const response = await api.delete<T>(url)
    return response.data
  }

  /**
   * Upload a file with progress tracking
   */
  static async upload<T>(
    url: string, 
    formData: FormData, 
    onProgress?: (percentage: number) => void
  ): Promise<T> {
    const response = await api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentage)
        }
      },
    })
    return response.data
  }
} 