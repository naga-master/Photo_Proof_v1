/**
 * Auth Debug Utilities
 * Helper functions to debug authentication issues
 */

export interface AuthDebugInfo {
  hasToken: boolean;
  tokenPreview: string | null;
  isExpired: boolean;
  expiresAt: Date | null;
  tokenAge: string | null;
  userData: any;
  userRole: string | null;
  clientId: string | null;
  cookies: string;
  payload: any;
}

/**
 * Get comprehensive auth debug information
 */
export function getAuthDebugInfo(): AuthDebugInfo {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  const userRole = localStorage.getItem('user_role');
  const clientId = localStorage.getItem('client_id');
  
  let isExpired = false;
  let expiresAt: Date | null = null;
  let tokenAge: string | null = null;
  let payload: any = null;
  
  if (token) {
    try {
      // Decode JWT (basic parsing, no verification)
      const parts = token.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(atob(parts[1]));
        
        if (payload.exp) {
          expiresAt = new Date(payload.exp * 1000);
          isExpired = new Date() > expiresAt;
        }
        
        if (payload.iat) {
          const issuedAt = new Date(payload.iat * 1000);
          const ageMs = Date.now() - issuedAt.getTime();
          const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
          const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
          tokenAge = `${ageHours}h ${ageMinutes}m`;
        }
      }
    } catch (e) {
      console.error('[AuthDebug] Failed to decode token:', e);
    }
  }
  
  return {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 30)}...` : null,
    isExpired,
    expiresAt,
    tokenAge,
    userData: userData ? JSON.parse(userData) : null,
    userRole,
    clientId,
    cookies: document.cookie || 'none',
    payload,
  };
}

/**
 * Log auth debug info to console
 */
export function logAuthDebug(label = 'Auth Debug') {
  const info = getAuthDebugInfo();
  
  console.group(`🔐 ${label}`);
  console.log('Has Token:', info.hasToken);
  if (info.hasToken) {
    console.log('Token Preview:', info.tokenPreview);
    console.log('Token Age:', info.tokenAge);
    console.log('Expires At:', info.expiresAt?.toLocaleString() || 'unknown');
    console.log('Is Expired:', info.isExpired ? '❌ YES' : '✅ NO');
    console.log('Payload:', info.payload);
  }
  console.log('User Data:', info.userData);
  console.log('User Role:', info.userRole);
  console.log('Client ID:', info.clientId);
  console.log('Cookies:', info.cookies);
  console.groupEnd();
  
  return info;
}

/**
 * Check if localStorage is working properly
 */
export function testLocalStorage(): boolean {
  try {
    const testKey = '__storage_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      console.error('[AuthDebug] localStorage test failed: value mismatch');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('[AuthDebug] localStorage test failed:', e);
    return false;
  }
}

/**
 * Monitor auth token changes
 */
export function monitorAuthToken(callback: (token: string | null) => void) {
  let lastToken = localStorage.getItem('auth_token');
  
  // Poll every second
  const interval = setInterval(() => {
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken !== lastToken) {
      console.warn('[AuthDebug] Token changed!', {
        from: lastToken ? `${lastToken.substring(0, 20)}...` : 'null',
        to: currentToken ? `${currentToken.substring(0, 20)}...` : 'null',
      });
      lastToken = currentToken;
      callback(currentToken);
    }
  }, 1000);
  
  return () => clearInterval(interval);
}

// Auto-log on page load (only in development)
if (import.meta.env.DEV) {
  console.log('[AuthDebug] Running auto-diagnostics...');
  
  // Test localStorage
  const storageWorks = testLocalStorage();
  console.log('[AuthDebug] localStorage working:', storageWorks ? '✅' : '❌');
  
  // Log current auth state
  logAuthDebug('Page Load');
  
  // Monitor changes (optional, can be commented out if too noisy)
  // monitorAuthToken(() => logAuthDebug('Token Changed'));
}
