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
      console.log('[API Client] Token refresh response:', { hasToken: !!data.token, hasAccessToken: !!data.access_token });
      
      // Store new access token for backwards compatibility
      // Backend returns 'token' not 'access_token'
      const newToken = data.token || data.access_token;
      if (newToken) {
        console.log('[API Client] ✅ Storing new token in localStorage');
        localStorage.setItem('auth_token', newToken);
        return newToken;
      }
      
      console.warn('[API Client] ⚠️ No token in refresh response');
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
            // Token refreshed successfully, throw with flag to let caller retry
            throw { ...error, tokenRefreshed: true };
          } else {
            // Refresh failed, clear auth
            this.clearAuth();
            throw error;
          }
        } else {
          // Another request is already refreshing, wait for it
          console.log('[API Client] ⏳ Waiting for token refresh to complete...');
          
          // Wait for the refresh to complete (max 5 seconds)
          const maxWait = 5000;
          const startTime = Date.now();
          while (this.isRefreshing && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Check if token was refreshed
          const token = localStorage.getItem('auth_token');
          if (token) {
            console.log('[API Client] ✅ Token refresh completed, retry this request');
            throw { ...error, tokenRefreshed: true };
          } else {
            console.log('[API Client] ❌ Token refresh failed');
            throw error;
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

  /**
   * Internal method to make HTTP requests with automatic retry on token refresh
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    options: {
      params?: Record<string, string>;
      data?: any;
      retryCount?: number;
    } = {}
  ): Promise<T> {
    const { params, data, retryCount = 0 } = options;
    const maxRetries = 1; // Only retry once after token refresh
    
    try {
      // Build URL
      let url: string;
      if (params) {
        const urlObj = new URL(`${this.baseUrl}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
        url = urlObj.toString();
      } else {
        url = `${this.baseUrl}${endpoint}`;
      }
      
      // Make fetch call
      const response = await fetch(url, {
        method,
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return await this.handleResponse<T>(response);
      
    } catch (error: any) {
      console.log('[API Client] Caught error:', {
        tokenRefreshed: error.tokenRefreshed,
        retryCount,
        maxRetries,
        canRetry: error.tokenRefreshed && retryCount < maxRetries,
        errorMessage: error.message,
        errorStatus: error.status
      });
      
      // Check if token was refreshed and we can retry
      if (error.tokenRefreshed && retryCount < maxRetries) {
        console.log(`[API Client] ✨ Token refreshed, retrying ${method} ${endpoint} (attempt ${retryCount + 2})`);
        
        // Wait a tiny bit for token to be fully stored
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry with new token (increment retry count)
        return this.makeRequest<T>(method, endpoint, {
          params,
          data,
          retryCount: retryCount + 1,
        });
      }
      
      // Not retryable or max retries reached
      console.log('[API Client] ❌ Not retrying:', 
        error.tokenRefreshed ? 'Max retries reached' : 'Token not refreshed'
      );
      
      // DISABLED: Don't logout automatically, just show error
      // The backend's /api/auth/refresh endpoint returns invalid tokens
      // Until that's fixed, we'll just show error messages instead of logging out
      // if (error.tokenRefreshed && retryCount >= maxRetries) {
      //   console.error('[API Client] ⚠️ Refreshed token is also invalid! Logging out...');
      //   this.clearAuth();
      // }
      
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, { params });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, { data });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, { data });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>('PATCH', endpoint, { data });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint);
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

  /**
   * Get raw Response for blob/binary data (like images)
   * Includes authentication headers
   */
  async getRaw(endpoint: string): Promise<Response> {
    const token = localStorage.getItem('auth_token');
    
    // If no token, return a fake 401 response to avoid unnecessary network requests
    if (!token) {
      console.debug('[API Client] No auth token for getRaw request:', endpoint);
      return new Response(JSON.stringify({ detail: 'No authentication token' }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      mode: 'cors',
      headers,
      credentials: 'include', // Send cookies
    });
    
    // Check for 401 and attempt token refresh
    if (!response.ok && response.status === 401) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;
        
        if (newToken) {
          // Retry with new token
          const retryHeaders: HeadersInit = {
            'Authorization': `Bearer ${newToken}`
          };
          
          return fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            mode: 'cors',
            headers: retryHeaders,
            credentials: 'include',
          });
        }
      }
    }
    
    return response;
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
