

import React from 'react';
import type { Photo } from '../../../types';
import { HeartIcon, CheckIcon, CompareIcon } from '../../icons';

interface GalleryControlsProps {
    favoritesCount: number;
    selectionsCount: number;
    isCompareMode: boolean;
    // Fix: Made props optional to support contexts where they aren't provided (e.g., previews).
    setCompareMode?: (isCompare: boolean) => void;
    compareList: Photo[];
    setCompareModalOpen?: (isOpen: boolean) => void;
    activeFilter?: 'all' | 'favorites' | 'selections';
    setActiveFilter?: (filter: 'all' | 'favorites' | 'selections') => void;
    theme: 'light' | 'dark';
}

const GalleryControls: React.FC<GalleryControlsProps> = ({
    favoritesCount,
    selectionsCount,
    isCompareMode,
    // Fix: Provided default empty functions and values for optional props.
    // FIX: Update default function definitions to accept arguments, resolving TypeScript errors.
    setCompareMode = (_isCompare: boolean) => {},
    compareList,
    // FIX: Update default function definitions to accept arguments, resolving TypeScript errors.
    setCompareModalOpen = (_isOpen: boolean) => {},
    activeFilter = 'all',
    // FIX: Update default function definitions to accept arguments, resolving TypeScript errors.
    setActiveFilter = (_filter: 'all' | 'favorites' | 'selections') => {},
    theme
}) => {
    const baseClasses = "flex items-center rounded-md border p-0.5 text-sm";
    const buttonBase = "px-3 py-1.5 rounded transition-colors flex items-center gap-1.5";
    
    const lightTheme = {
        container: "bg-gray-100 border-gray-200 text-gray-600",
        activeButton: "bg-white shadow-sm text-gray-900",
        inactiveButton: "hover:bg-gray-200",
        compareButton: "text-gray-800 hover:bg-gray-100 border-gray-300",
        compareActive: "bg-blue-50 border-blue-200 text-blue-700",
        compareBannerBg: "bg-blue-50",
        compareBannerText: "text-blue-800"
    };

    const darkTheme = {
        container: "bg-gray-700 border-gray-600 text-gray-300",
        activeButton: "bg-gray-900 shadow-sm text-white",
        inactiveButton: "hover:bg-gray-600",
        compareButton: "text-gray-200 hover:bg-gray-700 border-gray-500",
        compareActive: "bg-blue-900/50 border-blue-700 text-blue-300",
        compareBannerBg: "bg-blue-900/50",
        compareBannerText: "text-blue-200"
    };

    const currentTheme = theme === 'light' ? lightTheme : darkTheme;

    return (
        <>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className={`${baseClasses} ${currentTheme.container}`}>
                    <button onClick={() => setActiveFilter('all')} className={`${buttonBase} ${activeFilter === 'all' ? currentTheme.activeButton : currentTheme.inactiveButton}`}>All</button>
                    <button onClick={() => setActiveFilter('favorites')} className={`${buttonBase} ${activeFilter === 'favorites' ? currentTheme.activeButton : currentTheme.inactiveButton}`}>
                        <HeartIcon className="w-4 h-4" /> Favorites ({favoritesCount})
                    </button>
                    <button onClick={() => setActiveFilter('selections')} className={`${buttonBase} ${activeFilter === 'selections' ? currentTheme.activeButton : currentTheme.inactiveButton}`}>
                        <CheckIcon className="w-4 h-4" /> Selections ({selectionsCount})
                    </button>
                </div>
                <button 
                onClick={() => setCompareMode(!isCompareMode)} 
                className={`p-2.5 rounded-md flex items-center gap-2 border transition-colors ${isCompareMode ? currentTheme.compareActive : currentTheme.compareButton}`}
                >
                <CompareIcon className="w-5 h-5"/>
                </button>
            </div>
             {isCompareMode && (
                <div className={`w-full text-center text-sm py-2 border-t mt-4 ${currentTheme.compareBannerBg} ${currentTheme.compareBannerText}`}>
                    {compareList.length > 0 ? 
                    `Selected ${compareList.length} photos for comparison. ` : 
                    'Select up to 4 photos to compare side-by-side. '}
                    {compareList.length > 1 && (
                    <button onClick={() => setCompareModalOpen(true)} className="font-semibold underline ml-2">Compare Now</button>
                    )}
                </div>
            )}
        </>
    );
};

export default GalleryControls;