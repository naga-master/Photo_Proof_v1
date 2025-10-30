import React, { useMemo, useRef } from 'react';
import { layoutTemplates } from '../../data/layouts';
import type { LayoutId, Photo } from '../../types';
import LayoutRenderer from '../layouts/LayoutRenderer';
import { XCircleIcon } from '../icons';

interface LayoutsPageProps {
    defaultLayoutId: LayoutId;
    onSetDefaultLayout: (layoutId: LayoutId) => void;
    logo: string | null;
    brandColor: string;
    typography: string;
    onSetLogo: (logo: string | null) => void;
    onSetBrandColor: (color: string) => void;
    onSetTypography: (font: string) => void;
}

// Create some bogus photo data for previews
const mockPhotos: Photo[] = Array.from({ length: 15 }, (_, i) => {
    const isPortrait = Math.random() > 0.5;
    return {
        id: i,
        src: `https://picsum.photos/seed/${i+50}/${isPortrait ? 600 : 900}/${isPortrait ? 900 : 600}`,
        alt: `Mock photo ${i}`,
        width: isPortrait ? 600 : 900,
        height: isPortrait ? 900 : 600,
        comments: [],
    }
});
const mockAlbum = {
    id: 99,
    title: 'Layout Preview Album',
    clientId: 99,
    coverPhotoSrc: mockPhotos[0].src,
    photoCount: mockPhotos.length,
    photos: mockPhotos,
    isLocked: false,
    layout: 'layout1' as LayoutId
};

const LayoutsPage: React.FC<LayoutsPageProps> = ({ 
    defaultLayoutId, 
    onSetDefaultLayout,
    logo,
    brandColor,
    typography,
    onSetLogo,
    onSetBrandColor,
    onSetTypography
}) => {
    const selectedLayoutTemplate = useMemo(() => {
        return layoutTemplates.find(lt => lt.id === defaultLayoutId) || layoutTemplates[0];
    }, [defaultLayoutId]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                onSetLogo(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Layouts & Branding</h1>
                <p className="mt-1 text-gray-600">Set the default gallery appearance for new projects.</p>
            </header>

            {/* Branding Section */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800">Branding</h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">Customize the look and feel of your galleries to match your brand.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Studio Logo</label>
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/svg+xml"
                        />
                        <div className="mt-1 flex items-center justify-center p-4 border-2 border-dashed rounded-md bg-gray-50 h-24">
                            {logo ? (
                                <div className="relative group">
                                    <img src={logo} alt="Studio Logo" className="h-16 object-contain" />
                                    <button onClick={() => onSetLogo(null)} className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={handleLogoUploadClick} className="text-sm text-gray-600 font-medium hover:text-gray-800">
                                    Upload Logo
                                </button>
                            )}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700">Brand Color</label>
                        <div className="mt-1 flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-md border border-gray-300 overflow-hidden">
                                <div className="w-full h-full" style={{ backgroundColor: brandColor }}></div>
                                <input 
                                    type="color" 
                                    value={brandColor}
                                    onChange={(e) => onSetBrandColor(e.target.value)}
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <input 
                                type="text" 
                                id="brandColor" 
                                name="brandColor" 
                                value={brandColor} 
                                onChange={(e) => onSetBrandColor(e.target.value)}
                                className="block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-gray-500 focus:border-gray-500"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="typography" className="block text-sm font-medium text-gray-700">Typography</label>
                        <select 
                            id="typography" 
                            name="typography"
                            value={typography}
                            onChange={(e) => onSetTypography(e.target.value)}
                            className="mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-gray-500 focus:border-gray-500">
                            <option>System Default (Inter & Cormorant)</option>
                            <option>Playfair Display & Montserrat</option>
                            <option>Lora & Lato</option>
                            <option>Roboto Slab & Roboto</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Layouts Section */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Default Layout</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-4">
                        <p className="text-sm text-gray-500">Select a template to be used for all new projects. This can be overridden per project.</p>
                        <select
                            value={defaultLayoutId}
                            onChange={(e) => onSetDefaultLayout(e.target.value as LayoutId)}
                            className="block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        >
                            {layoutTemplates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                        <div className="p-4 bg-gray-50 rounded-md border">
                            <p className="font-semibold text-sm text-gray-800">{selectedLayoutTemplate.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{selectedLayoutTemplate.description}</p>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-2">
                        <p className="text-sm font-medium text-gray-600 mb-2">Live Preview</p>
                        <div className="bg-white rounded-lg shadow-inner overflow-hidden border border-gray-200">
                           <LayoutRenderer 
                                album={{...mockAlbum, layout: defaultLayoutId}} 
                                photos={mockPhotos}
                                favorites={[]}
                                selections={[]}
                                toggleFavorite={() => {}}
                                toggleSelection={() => {}}
                                onAddComment={() => {}}
                                onDownload={() => {}}
                                openLightbox={() => {}}
                                isCompareMode={false}
                                compareList={[]}
                                isStudioPreview={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayoutsPage;
