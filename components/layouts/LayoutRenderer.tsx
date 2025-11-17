import React from 'react';
import type { Album, Photo, LayoutId } from '../../types';

// Import all layout templates
import Layout1 from './templates/Layout1';
import Layout2 from './templates/Layout2';
import Layout3 from './templates/Layout3';
import Layout4 from './templates/Layout4';
import Layout5 from './templates/Layout5';
import Layout6 from './templates/Layout6';
import Layout7 from './templates/Layout7';
import Layout8 from './templates/Layout8';
import Layout9 from './templates/Layout9';


export interface LayoutComponentProps {
    album: Album;
    photos: Photo[];
    title: string;
    favorites: number[] | string[];
    selections: number[] | string[];
    toggleFavorite: (photoId: number | string) => void;
    toggleSelection: (photoId: number | string) => void;
    onAddComment: (photoId: number, commentText: string, parentId?: number) => void;
    onDownload: (photoSrc: string, photoAlt: string) => void;
    openLightbox: (index: number) => void;
    onBack?: () => void;
    isStudioPreview?: boolean;
    
    // Props for controls
    isCompareMode: boolean;
    setCompareMode?: (isCompare: boolean) => void;
    compareList: Photo[];
    setCompareList?: (photos: Photo[]) => void;
    setCompareModalOpen?: (isOpen: boolean) => void;
    activeFilter?: 'all' | 'favorites' | 'selections';
    setActiveFilter?: (filter: 'all' | 'favorites' | 'selections') => void;
    toggleCompare?: (photo: Photo) => void;
}

const layouts: Record<LayoutId, React.FC<LayoutComponentProps>> = {
    layout1: Layout1,
    layout2: Layout2,
    layout3: Layout3,
    layout4: Layout4,
    layout5: Layout5,
    layout6: Layout6,
    layout7: Layout7,
    layout8: Layout8,
    layout9: Layout9,
};

const LayoutRenderer: React.FC<LayoutComponentProps> = (props) => {
    const { album } = props;
    const LayoutComponent = layouts[album.layout] || layouts.layout1; // Fallback to layout1

    return <LayoutComponent {...props} />;
};

export default LayoutRenderer;