import React, { useState } from 'react';
import type { UserRole } from '../types';
import { ShoppingCartIcon, ArrowLeftOnRectangleIcon } from './icons';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';

type Page = 'albums' | 'store' | 'about' | 'cart' | 'contracts';

interface TopNavBarProps {
  onNavigate: (page: Page) => void;
  cartCount: number;
  userRole: UserRole;
  onLogout: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ onNavigate, cartCount, userRole, onLogout, showBackButton, onBack }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme } = useStudioTheme();

    const navLinks: { label: string, page: Page }[] = [
        { label: 'Gallery', page: 'albums' },
        { label: 'Store', page: 'store' },
        { label: 'Contracts', page: 'contracts' },
        { label: 'About', page: 'about' },
    ];
    
    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        {/* Back button for studio owners and clients (when not on entry page) */}
                        {showBackButton && onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-fast"
                                title="Go back"
                            >
                                <svg 
                                    className="w-5 h-5" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                                    />
                                </svg>
                            </button>
                        )}
                        
                        {/* Brand name or logo - always visible */}
                        <div className="flex-shrink-0">
                            {theme?.logo_url ? (
                                <img 
                                    src={theme.logo_url}
                                    alt={theme.name}
                                    className="h-10 cursor-pointer studio-logo transition-opacity hover:opacity-80"
                                    onClick={() => onNavigate('albums')}
                                />
                            ) : (
                                <span 
                                    onClick={() => onNavigate('albums')} 
                                    className="text-xl font-semibold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ 
                                        color: theme?.brand_color || '#0f172a',
                                        fontFamily: theme?.typography?.includes('Inter') ? undefined : 'inherit'
                                    }}
                                >
                                    {theme?.name || "NAPSTER's Photo Lab"}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <nav className="ml-10 flex items-baseline space-x-1">
                            {navLinks.map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => onNavigate(link.page)}
                                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-fast"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-1">
                         <button
                            onClick={() => onNavigate('cart')}
                            className="relative text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-all duration-fast"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCartIcon className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 block h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center border-2 border-white font-medium">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {userRole && (
                             <button
                                onClick={onLogout}
                                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-fast"
                                title="Logout"
                            >
                                <ArrowLeftOnRectangleIcon className="h-5 w-5"/>
                            </button>
                        )}
                        <div className="md:hidden">
                             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary/20 outline-none transition-all duration-fast">
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={!isMenuOpen ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
             {isMenuOpen && (
                <div className="md:hidden border-t border-gray-200/80 bg-white">
                    <div className="px-3 pt-2 pb-3 space-y-1 animate-slide-down">
                         {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => { onNavigate(link.page); setIsMenuOpen(false); }}
                                className="w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 block px-4 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-fast"
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default TopNavBar;