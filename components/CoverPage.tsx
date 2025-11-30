import React, { useState } from 'react';
import type { Album, UserRole } from '../types';
import { ArrowRightIcon, ShoppingCartIcon, ArrowLeftOnRectangleIcon } from './icons';
import AuthenticatedBackgroundImage from './AuthenticatedBackgroundImage';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';

type Page = 'albums' | 'store' | 'about' | 'cart' | 'contracts';

interface CoverPageProps {
  album: Album;
  onOpenGallery: () => void;
  onNavigate?: (page: Page) => void;
  onBack?: () => void;
  onLogout?: () => void;
  cartCount?: number;
  userRole?: UserRole;
}

const CoverPage: React.FC<CoverPageProps> = ({ 
  album, 
  onOpenGallery,
  onNavigate,
  onBack,
  onLogout,
  cartCount = 0,
  userRole
}) => {
  const { theme } = useStudioTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navLinks: { label: string, page: Page }[] = [
    { label: 'Gallery', page: 'albums' },
    { label: 'Store', page: 'store' },
    { label: 'Contracts', page: 'contracts' },
    { label: 'About', page: 'about' },
  ];
  
  if (!album) {
    return (
        <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden bg-slate-900">
            <div className="relative z-20 text-center animate-fade-in p-4">
                <h1 className="font-serif text-5xl md:text-7xl tracking-wider">
                    No Album Found
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-300 tracking-wide">
                    Please contact the studio.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden bg-black">
      {/* Background Image with Ken Burns effect */}
      <AuthenticatedBackgroundImage
        photoId={album.coverPhotoId}
        quality="medium"
        className="absolute inset-0 z-0 animate-ken-burns"
        fallbackSrc={album.coverPhotoSrc}
      >
        <div></div>
      </AuthenticatedBackgroundImage>
      
      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Transparent Header - Aura Style */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Back button + Logo */}
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-200"
                  title="Go back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              
              {/* Studio Logo/Name */}
              <div className="flex-shrink-0">
                {theme?.logo_url ? (
                  <img 
                    src={theme.logo_url}
                    alt={theme.name}
                    className="h-10 cursor-pointer brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
                    onClick={() => onNavigate?.('albums')}
                  />
                ) : (
                  <span 
                    onClick={() => onNavigate?.('albums')} 
                    className="text-xl md:text-2xl font-serif tracking-widest uppercase cursor-pointer text-white/90 hover:text-white transition-colors"
                  >
                    {theme?.name || "Photo Studio"}
                  </span>
                )}
              </div>
            </div>
            
            {/* Center: Navigation Links (Desktop) */}
            {onNavigate && (
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => onNavigate(link.page)}
                    className="text-white/70 hover:text-white px-4 py-2 text-sm font-medium tracking-wider uppercase transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            )}
            
            {/* Right: Cart + Logout + Mobile Menu */}
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('cart')}
                  className="relative text-white/70 hover:text-white p-2 transition-colors duration-200"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-white text-gray-900 text-xs flex items-center justify-center font-semibold">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              
              {userRole && onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 text-white/70 hover:text-white transition-colors duration-200"
                  title="Logout"
                >
                  <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                </button>
              )}
              
              {/* Mobile Menu Button */}
              {onNavigate && (
                <div className="md:hidden">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="p-2 text-white/70 hover:text-white transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d={!isMenuOpen ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} 
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMenuOpen && onNavigate && (
          <div className="md:hidden bg-black/80 backdrop-blur-sm border-t border-white/10">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => { onNavigate(link.page); setIsMenuOpen(false); }}
                  className="w-full text-left text-white/80 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium tracking-wider uppercase transition-colors duration-200"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content - Center */}
      <div className="relative z-20 text-center animate-fade-in p-4">
        <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-wider text-shadow-lg">
          {album.title}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-white/80 tracking-wide">
          {album.photoCount} Photos {album.shootDate && `| ${album.shootDate}`}
        </p>
        
        {/* Aura-style CTA Button - Cream/Off-white */}
        <button
          onClick={onOpenGallery}
          className="mt-8 inline-flex items-center gap-3 px-8 py-3 bg-white/90 hover:bg-white text-gray-900 text-base font-semibold uppercase tracking-widest transition-all duration-300 rounded shadow-lg transform hover:scale-105"
        >
          View Gallery
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Studio branding at bottom - removed since logo is in header now */}
    </div>
  );
};

export default CoverPage;