/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, AuthResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, isStudio: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state by validating with backend on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing authentication...');
      const storedUser = authService.getStoredUser();
      const hasToken = authService.isAuthenticated();
      
      console.log('[AuthContext] Stored user:', storedUser ? storedUser.email : 'NONE');
      console.log('[AuthContext] Has token:', hasToken);
      
      // Only validate with backend if we have both stored user and token
      if (storedUser && hasToken) {
        try {
          console.log('[AuthContext] Validating session with backend...');
          // Validate the session with backend (checks httpOnly cookies)
          const currentUser = await authService.getCurrentUser();
          console.log('[AuthContext] ✅ Session valid, user:', currentUser.email);
          setUser(currentUser);
        } catch (error: any) {
          // Session invalid or expired, clear local data
          console.error('[AuthContext] ❌ Session validation failed:', error?.message || error);
          await authService.logout();
          setUser(null);
        }
      } else {
        console.log('[AuthContext] ⏭️  Skipping validation (no stored user or token)');
      }
      
      setIsLoading(false);
      console.log('[AuthContext] Initialization complete');
    };

    initializeAuth();

    // Listen for unauthorized events to clear auth
    const handleUnauthorized = () => {
      console.log('[AuthContext] Unauthorized event received, clearing user');
      setUser(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: LoginCredentials, isStudio: boolean) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = isStudio
        ? await authService.studioLogin(credentials)
        : await authService.clientLogin(credentials);
      
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = () => {
    const storedUser = authService.getStoredUser();
    setUser(storedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Export using named exports for Fast Refresh compatibility
export { AuthProvider, useAuth };
