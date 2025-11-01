import React, { useState } from 'react';
import type { UserRole } from '../types';
import { ShoppingCartIcon, ArrowLeftOnRectangleIcon } from './icons';

type Page = 'albums' | 'store' | 'about' | 'cart';

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

    const navLinks: { label: string, page: Page }[] = [
        { label: 'Gallery', page: 'albums' },
        { label: 'Store', page: 'store' },
        { label: 'About', page: 'about' },
    ];
    
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        {/* Back button for studio owners and clients (when not on entry page) */}
                        {showBackButton && onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
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
                        
                        {/* Brand name - always visible */}
                        <div className="flex-shrink-0">
                            <span 
                                onClick={() => onNavigate('albums')} 
                                className="text-2xl font-serif tracking-widest uppercase cursor-pointer text-slate-800"
                            >
                                NAPSTER's Photo Lab
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <nav className="ml-10 flex items-baseline space-x-2">
                            {navLinks.map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => onNavigate(link.page)}
                                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-md text-sm font-medium tracking-wider uppercase"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center">
                         <button
                            onClick={() => onNavigate('cart')}
                            className="relative text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCartIcon className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center border-2 border-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {userRole && (
                             <button
                                onClick={onLogout}
                                className="ml-2 p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                title="Logout"
                            >
                                <ArrowLeftOnRectangleIcon className="h-6 w-6"/>
                            </button>
                        )}
                        <div className="md:hidden ml-2">
                             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:ring-2 focus:ring-slate-200 transition-colors">
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={!isMenuOpen ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
             {isMenuOpen && (
                <div className="md:hidden border-t border-slate-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 animate-slide-down">
                         {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => { onNavigate(link.page); setIsMenuOpen(false); }}
                                className="w-full text-left text-slate-600 hover:text-slate-900 hover:bg-slate-100 block px-3 py-2 rounded-md text-base font-medium tracking-wider uppercase"
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