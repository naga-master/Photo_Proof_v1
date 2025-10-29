
import React, { useState } from 'react';
import type { UserRole } from '../types';
import { ShoppingCartIcon } from './icons';

type Page = 'albums' | 'store' | 'about' | 'cart';

interface TopNavBarProps {
  onNavigate: (page: Page) => void;
  cartCount: number;
  userRole: UserRole;
  onLogout: () => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ onNavigate, cartCount, userRole, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks: { label: string, page: Page }[] = [
        { label: 'Gallery', page: 'albums' },
        { label: 'Store', page: 'store' },
        { label: 'About', page: 'about' },
    ];
    
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <span 
                            onClick={() => onNavigate('albums')} 
                            className="text-2xl font-serif tracking-widest uppercase cursor-pointer"
                        >
                            The Scobeys
                        </span>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navLinks.map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => onNavigate(link.page)}
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium tracking-wider uppercase"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center">
                         <button
                            onClick={() => onNavigate('cart')}
                            className="relative text-gray-600 hover:text-gray-900 p-2 rounded-full"
                            aria-label="Shopping Cart"
                        >
                            <ShoppingCartIcon className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {userRole && (
                             <button
                                onClick={onLogout}
                                className="ml-4 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium tracking-wider uppercase"
                            >
                                Logout
                            </button>
                        )}
                        <div className="md:hidden ml-2">
                             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none">
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={!isMenuOpen ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
             {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                         {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => { onNavigate(link.page); setIsMenuOpen(false); }}
                                className="w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
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
