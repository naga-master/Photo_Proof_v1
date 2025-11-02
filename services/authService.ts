/**
 * Authentication Service
 * Handles user login, registration, and token management
 */

import { apiClient } from '../lib/api-client';

export interface LoginCredentials {
  username: string;  // Backend expects 'username' not 'email'
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  studio_name?: string;
}

export interface AuthResponse {
  token: string;  // Backend returns 'token' not 'access_token'
  refresh_token?: string;  // Optional refresh token
  user: User;
  client_id?: number | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  studio_id?: string | null;
  is_active: boolean;
  email_verified: boolean;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

class AuthService {
  /**
   * Studio user login
   */
  async studioLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/studio/login', credentials);
    this.storeAuthData(response);
    return response;
  }

  /**
   * Client user login
   */
  async clientLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/client/login', credentials);
    this.storeAuthData(response);
    return response;
  }

  /**
   * Studio user registration
   */
  async studioRegister(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/studio/register', data);
    this.storeAuthData(response);
    return response;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/api/auth/me');
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/refresh');
    this.storeAuthData(response);
    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout to clear httpOnly cookies
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');
      localStorage.removeItem('client_id');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Get user role
   */
  getUserRole(): 'studio' | 'client' | null {
    return localStorage.getItem('user_role') as 'studio' | 'client' | null;
  }

  /**
   * Store authentication data
   * Note: With httpOnly cookies, tokens are stored securely in cookies by the backend.
   * localStorage is used as fallback for backwards compatibility and client-side checks.
   */
  private storeAuthData(response: AuthResponse): void {
    // Store token in localStorage for backwards compatibility and header-based auth
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_data', JSON.stringify(response.user));
    localStorage.setItem('user_role', response.user.role);
    if (response.client_id) {
      localStorage.setItem('client_id', String(response.client_id));
    }
    // Note: refresh_token is stored in httpOnly cookie by backend, not in localStorage
  }
}

export const authService = new AuthService();
