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

// Create preview photo data using local images
const mockPhotos: Photo[] = Array.from({ length: 15 }, (_, i) => {
    const photoNum = String(i + 1).padStart(2, '0');
    return {
        id: `preview-${photoNum}`,
        src: `http://localhost:8000/uploads/data/preview/preview-${photoNum}.jpg`,
        alt: `Preview photo ${i + 1}`,
        width: 1200,
        height: 800,
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
            <header className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">Layouts & Branding</h1>
                <p className="mt-1 text-sm text-gray-500">Set the default gallery appearance for new projects.</p>
            </header>

            {/* Branding Section */}
            <div className="bg-white p-5 border border-gray-200 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
                <p className="text-sm text-gray-500 mt-1 mb-5">Customize the look and feel of your galleries to match your brand.</p>
                <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
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
                        <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 sm:w-10 sm:h-10 rounded-lg border-2 border-gray-300 overflow-hidden flex-shrink-0">
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
                                className="flex-1 px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] font-mono uppercase focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="typography" className="block text-sm font-medium text-gray-700 mb-2">Typography</label>
                        <select 
                            id="typography" 
                            name="typography"
                            value={typography}
                            onChange={(e) => onSetTypography(e.target.value)}
                            className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] bg-white text-gray-900 focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors">
                            <option>System Default (Inter & Cormorant)</option>
                            <option>Playfair Display & Montserrat</option>
                            <option>Lora & Lato</option>
                            <option>Roboto Slab & Roboto</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Layouts Section */}
            <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Layout</h2>
                <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-4">
                        <p className="text-sm text-gray-500">Select a template to be used for all new projects. This can be overridden per project.</p>
                        <select
                            value={defaultLayoutId}
                            onChange={(e) => onSetDefaultLayout(e.target.value as LayoutId)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-fast"
                        >
                            {layoutTemplates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="font-medium text-sm text-gray-900">{selectedLayoutTemplate.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{selectedLayoutTemplate.description}</p>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-2">
                        <p className="text-sm font-medium text-gray-600 mb-2">Live Preview</p>
                        <div className="bg-white rounded-lg shadow-inner overflow-hidden border border-gray-200">
                           <LayoutRenderer 
                                album={{...mockAlbum, layout: defaultLayoutId}} 
                                photos={mockPhotos}
                                title="Layout Preview"
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
