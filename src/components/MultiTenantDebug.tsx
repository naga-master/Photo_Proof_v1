import React from 'react';
import { useStudioTheme } from '../providers/StudioThemeProvider';

export function MultiTenantDebug() {
  const { theme, loading, error } = useStudioTheme();
  
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Hide if explicitly disabled via localStorage
  const isHidden = localStorage.getItem('hideMultiTenantDebug') === 'true';
  if (isHidden) {
    return null;
  }
  
  const handleClose = () => {
    localStorage.setItem('hideMultiTenantDebug', 'true');
    window.location.reload();
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-xs z-50 shadow-xl">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-sm">🏢 Multi-Tenant Debug</h3>
        <button 
          onClick={handleClose}
          className="ml-2 text-gray-400 hover:text-white"
          title="Hide (refresh to show again)"
        >
          ✕
        </button>
      </div>
      
      {loading && (
        <p className="text-yellow-400">Loading theme...</p>
      )}
      
      {error && (
        <div className="text-red-400">
          <p className="font-semibold">Error:</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}
      
      {theme && (
        <div className="space-y-1">
          <div className="border-b border-gray-700 pb-1 mb-1">
            <p><span className="text-gray-400">Studio:</span> {theme.name}</p>
            <p className="text-xs opacity-75">ID: {theme.id}</p>
          </div>
          
          <p>
            <span className="text-gray-400">Subdomain:</span> {theme.subdomain || 'none'}
          </p>
          
          <p>
            <span className="text-gray-400">Color:</span> 
            <span 
              className="inline-block ml-1 w-3 h-3 rounded-full align-middle" 
              style={{ backgroundColor: theme.brand_color }}
            />
            <span className="ml-1 font-mono">{theme.brand_color}</span>
          </p>
          
          <p>
            <span className="text-gray-400">Logo:</span> 
            <span className={theme.logo_url ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
              {theme.logo_url ? '✓ Present' : '✗ None'}
            </span>
          </p>
          
          <p>
            <span className="text-gray-400">Typography:</span> 
            <span className="ml-1 text-xs">{theme.typography || 'Default'}</span>
          </p>
          
          <p>
            <span className="text-gray-400">Custom CSS:</span> 
            <span className={theme.custom_css ? 'text-green-400 ml-1' : 'text-gray-500 ml-1'}>
              {theme.custom_css ? '✓ Active' : '✗ None'}
            </span>
          </p>
        </div>
      )}
      
      {!loading && !error && !theme && (
        <p className="text-yellow-400">No theme loaded</p>
      )}
      
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
        <p className="text-gray-400">
          Host: <span className="text-white">{window.location.host}</span>
        </p>
        <p className="text-gray-400">
          Cache Age: {getCacheAge()}
        </p>
      </div>
    </div>
  );
}

function getCacheAge(): string {
  const timestamp = localStorage.getItem('studio_theme_timestamp');
  if (!timestamp) return 'No cache';
  
  const age = Date.now() - parseInt(timestamp);
  const minutes = Math.floor(age / (1000 * 60));
  
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}
