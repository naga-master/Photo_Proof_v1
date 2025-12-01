import React from 'react';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';

interface StudioLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Reusable Studio Logo component with intelligent fallback
 * 
 * Displays:
 * 1. Studio logo if available (from theme.logo_url)
 * 2. Initials in a colored circle if no logo (using brand color)
 * 3. Default "ST" if no name available
 */
export function StudioLogo({ 
  size = 'md', 
  showName = false, 
  className = '',
  onClick 
}: StudioLogoProps) {
  const { theme } = useStudioTheme();
  
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };
  
  const logoSizes = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };
  
  const nameSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // Generate initials from studio name
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'ST';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const initials = getInitials(theme?.name);
  const brandColor = theme?.brand_color || '#1e293b';
  
  const containerClasses = `flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''} ${className}`;

  if (theme?.logo_url) {
    return (
      <div className={containerClasses} onClick={onClick}>
        <img 
          src={theme.logo_url} 
          alt={theme.name || 'Studio Logo'} 
          className={`${logoSizes[size]} object-contain`}
        />
        {showName && theme.name && (
          <span className={`font-semibold text-gray-900 ${nameSizes[size]}`}>
            {theme.name}
          </span>
        )}
      </div>
    );
  }
  
  // Fallback: Initials in colored circle
  return (
    <div className={containerClasses} onClick={onClick}>
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: brandColor }}
      >
        <span className="text-white font-bold">
          {initials}
        </span>
      </div>
      {showName && theme?.name && (
        <span className={`font-semibold text-gray-900 ${nameSizes[size]}`}>
          {theme.name}
        </span>
      )}
    </div>
  );
}

/**
 * Collapsed version for sidebar - shows only initials or small logo
 */
export function StudioLogoCollapsed({ className = '' }: { className?: string }) {
  const { theme } = useStudioTheme();
  
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'ST';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const initials = getInitials(theme?.name);
  const brandColor = theme?.brand_color || '#1e293b';

  if (theme?.logo_url) {
    return (
      <img 
        src={theme.logo_url} 
        alt={theme.name || 'Studio'} 
        className={`h-8 w-8 object-contain ${className}`}
      />
    );
  }
  
  return (
    <div 
      className={`h-8 w-8 rounded-lg flex items-center justify-center ${className}`}
      style={{ backgroundColor: brandColor }}
    >
      <span className="text-white font-bold text-xs">
        {initials}
      </span>
    </div>
  );
}

export default StudioLogo;
