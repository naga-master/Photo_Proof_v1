import React, { createContext, useContext, useEffect, useState } from 'react';

interface StudioTheme {
  id: string;
  name: string;
  subdomain: string | null;
  logo_url: string | null;
  brand_color: string;
  typography: string;
  custom_css: string | null;
}

interface StudioThemeContextType {
  theme: StudioTheme | null;
  loading: boolean;
  error: string | null;
  refreshTheme: () => Promise<void>;
}

const StudioThemeContext = createContext<StudioThemeContextType | undefined>(undefined);

export const useStudioTheme = () => {
  const context = useContext(StudioThemeContext);
  if (!context) {
    throw new Error('useStudioTheme must be used within StudioThemeProvider');
  }
  return context;
};

export function StudioThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<StudioTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTheme = async () => {
    try {
      console.log('[StudioTheme] Loading studio theme...');
      const response = await fetch('/api/studio/current');
      
      if (!response.ok) {
        // For 404, it might mean we're not accessing via a studio domain
        if (response.status === 404) {
          // In development, be more forgiving - just log a warning
          if (process.env.NODE_ENV === 'development') {
            console.warn('[StudioTheme] Studio not found. Using default theme for development.');
            throw new Error('Studio not found. Using default theme for development.');
          }
          throw new Error('Please access the application through a valid studio domain');
        }
        throw new Error('Failed to load studio theme');
      }
      
      const studioTheme = await response.json();
      console.log('[StudioTheme] Loaded theme:', studioTheme);
      
      // Apply CSS variables
      applyThemeVariables(studioTheme);
      
      // Apply custom CSS
      applyCustomCSS(studioTheme.custom_css);
      
      setTheme(studioTheme);
      setError(null);
      
      // Cache in localStorage for faster subsequent loads
      localStorage.setItem('studio_theme', JSON.stringify(studioTheme));
      localStorage.setItem('studio_theme_timestamp', Date.now().toString());
    } catch (err: any) {
      console.error('[StudioTheme] Failed to load studio theme:', err);
      setError(err.message || 'Failed to load studio theme');
      
      // Try to load from cache if available
      const cached = localStorage.getItem('studio_theme');
      const cacheTimestamp = localStorage.getItem('studio_theme_timestamp');
      
      if (cached && cacheTimestamp) {
        // Use cache if it's less than 30 minutes old
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < 30 * 60 * 1000) { // 30 minutes
          console.log('[StudioTheme] Using cached theme');
          const cachedTheme = JSON.parse(cached);
          applyThemeVariables(cachedTheme);
          applyCustomCSS(cachedTheme.custom_css);
          setTheme(cachedTheme);
          setError(null); // Clear error if cache is available
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const applyThemeVariables = (studioTheme: StudioTheme) => {
    const root = document.documentElement;
    
    // Convert hex to RGB for opacity support
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '99, 102, 241'; // Default indigo
    };
    
    // Set CSS variables
    root.style.setProperty('--brand-primary', studioTheme.brand_color);
    root.style.setProperty('--brand-primary-rgb', hexToRgb(studioTheme.brand_color));
    
    // Set typography if not default
    if (studioTheme.typography && studioTheme.typography !== 'System Default (Inter & Cormorant)') {
      // Extract font name from typography string
      const fontName = studioTheme.typography.split('(')[0].trim();
      root.style.setProperty('--font-family', `'${fontName}', system-ui, sans-serif`);
    } else {
      root.style.setProperty('--font-family', "'Inter', system-ui, sans-serif");
    }
    
    console.log('[StudioTheme] Applied theme variables:', {
      color: studioTheme.brand_color,
      typography: studioTheme.typography
    });
  };

  const applyCustomCSS = (customCSS: string | null) => {
    // Remove existing custom CSS
    const existingStyle = document.getElementById('studio-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Apply new custom CSS if provided
    if (customCSS) {
      const style = document.createElement('style');
      style.id = 'studio-custom-css';
      style.textContent = customCSS;
      document.head.appendChild(style);
      console.log('[StudioTheme] Applied custom CSS');
    }
  };

  useEffect(() => {
    loadTheme();
    
    // Refresh theme when window gets focus (useful for development)
    const handleFocus = () => {
      const cacheTimestamp = localStorage.getItem('studio_theme_timestamp');
      if (cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        // Refresh if cache is older than 5 minutes in development
        if (cacheAge > 5 * 60 * 1000) {
          console.log('[StudioTheme] Cache expired, refreshing theme');
          loadTheme();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <StudioThemeContext.Provider 
      value={{ 
        theme, 
        loading, 
        error,
        refreshTheme: loadTheme 
      }}
    >
      {children}
    </StudioThemeContext.Provider>
  );
}
