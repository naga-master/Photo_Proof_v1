/**
 * API Client for Photo Proof Backend
 * 
 * Centralized HTTP client with authentication and error handling
 * Uses httpOnly cookies for secure authentication with fallback to Authorization header
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface ApiError {
  message: string;
  status: number;
  detail?: any;
}

export class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    // For backwards compatibility and non-cookie scenarios
    const token = localStorage.getItem('auth_token');
    console.log('[API Client] Token in localStorage:', token ? `${token.substring(0, 20)}...` : 'NONE');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header as fallback if token exists in localStorage
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[API Client] Added Authorization header');
    } else {
      console.warn('[API Client] No token found in localStorage');
    }
    
    return headers;
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      // Call refresh endpoint - backend will use refresh_token from httpOnly cookie
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: send cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Store new access token for backwards compatibility
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        return data.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth data on refresh failure
      this.clearAuth();
      return null;
    }
  }

  private clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    localStorage.removeItem('client_id');
    window.dispatchEvent(new Event('unauthorized'));
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };
      
      try {
        const errorData = await response.json();
        error.detail = errorData.detail || errorData;
        error.message = errorData.detail || errorData.message || response.statusText;
      } catch {
        // Response body might not be JSON
      }
      
      // Handle 401 - unauthorized
      if (response.status === 401) {
        // Try to refresh token
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          
          if (newToken) {
            this.onRefreshed(newToken);
            // Token refreshed successfully, but still throw to let caller retry
            throw { ...error, tokenRefreshed: true };
          } else {
            // Refresh failed, clear auth
            this.clearAuth();
          }
        }
      }
      
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include', // Include cookies
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include', // Include cookies
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include', // Include cookies
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include', // Include cookies
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include', // Include cookies
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies
      body: formData,
    });

    return this.handleResponse(response);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Helper to check if backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { 
      method: 'GET',
      credentials: 'include'
    });
    return response.ok;
  } catch {
    return false;
  }
}
