import type { LayoutTemplate } from '../types';

export const layoutTemplates: LayoutTemplate[] = [
    { 
        id: 'layout1', 
        name: 'Cover Masonry White', 
        description: 'A full-width cover with a classic masonry grid on a clean white background.',
        header: 'Cover', grid: 'Masonry', aspect: 'Portrait', theme: 'White'
    },
    { 
        id: 'layout2', 
        name: 'Cover Masonry Gray', 
        description: 'A full-width cover with a classic masonry grid on a modern gray background.',
        header: 'Cover', grid: 'Masonry', aspect: 'Portrait', theme: 'Gray'
    },
    { 
        id: 'layout3', 
        name: 'Title Masonry Gray', 
        description: 'A minimal title header with a masonry grid on a modern gray background.',
        header: 'Title Only', grid: 'Masonry', aspect: 'Portrait', theme: 'Gray'
    },
    { 
        id: 'layout4', 
        name: 'Cover Masonry Cream', 
        description: 'A warm, inviting cover page with a masonry grid and a soft cream theme.',
        header: 'Cover', grid: 'Masonry', aspect: 'Landscape', theme: 'Cream'
    },
    { 
        id: 'layout5', 
        name: 'Title Masonry Cream', 
        description: 'A minimal header with a landscape-oriented masonry grid on a cream background.',
        header: 'Title Only', grid: 'Masonry', aspect: 'Landscape', theme: 'Cream'
    },
    { 
        id: 'layout6', 
        name: 'Cover Grid Gray', 
        description: 'A dramatic cover followed by a structured, uniform grid of photos.',
        header: 'Cover', grid: 'Grid', aspect: 'Landscape', theme: 'Gray'
    },
    { 
        id: 'layout7', 
        name: 'Title Grid Black', 
        description: 'A high-contrast, dark-themed layout with a uniform grid and minimal header.',
        header: 'Title Only', grid: 'Grid', aspect: 'Portrait', theme: 'Black'
    },
    { 
        id: 'layout8', 
        name: 'Cover Stacked Black', 
        description: 'An immersive, full-screen stacked layout with a dark theme for cinematic storytelling.',
        header: 'Cover', grid: 'Stacked', aspect: 'Landscape', theme: 'Black'
    },
    { 
        id: 'layout9', 
        name: 'Title Stacked Cream', 
        description: 'A blog-style, single-column stacked layout with a minimal header and warm tones.',
        header: 'Title Only', grid: 'Stacked', aspect: 'Portrait', theme: 'Cream'
    }
];