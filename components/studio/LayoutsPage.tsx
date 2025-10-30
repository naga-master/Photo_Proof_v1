import React, { useState } from 'react';
import { layoutTemplates } from '../../data/layouts';
import type { LayoutId, LayoutTemplate, Photo } from '../../types';
import { CheckCircleIcon, CloseIcon } from '../icons';
import LayoutRenderer from '../layouts/LayoutRenderer';

interface LayoutsPageProps {
    defaultLayoutId: LayoutId;
    onSetDefaultLayout: (layoutId: LayoutId) => void;
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

const LayoutsPage: React.FC<LayoutsPageProps> = ({ defaultLayoutId, onSetDefaultLayout }) => {
    const [previewLayout, setPreviewLayout] = useState<LayoutTemplate | null>(null);

    const handleSetDefault = (e: React.MouseEvent, layoutId: LayoutId) => {
        e.stopPropagation();
        onSetDefaultLayout(layoutId);
    }
    
    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Layouts & Branding</h1>
                <p className="mt-1 text-gray-600">Manage your gallery templates and set a default for new projects.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {layoutTemplates.map(layout => (
                    <div key={layout.id} className="bg-white border rounded-lg shadow-sm flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="p-5 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">{layout.name}</h2>
                            <p className="text-sm text-gray-500 mt-1">{layout.description}</p>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                             <div className="text-xs space-y-2 mb-4">
                                <div className="flex justify-between items-center"><span className="text-gray-500">Header</span> <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{layout.header}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-500">Grid Type</span> <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{layout.grid}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-500">Theme</span> <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{layout.theme}</span></div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setPreviewLayout(layout)} className="w-full text-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50 text-sm">
                                    Preview
                                </button>
                                {defaultLayoutId === layout.id ? (
                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md font-semibold text-sm">
                                        <CheckCircleIcon className="w-5 h-5"/>
                                        <span>Default</span>
                                    </div>
                                ) : (
                                    <button onClick={(e) => handleSetDefault(e, layout.id)} className="w-full text-center px-4 py-2 bg-gray-800 text-white rounded-md font-semibold hover:bg-gray-700 text-sm">
                                        Set as Default
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

             {previewLayout && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in" onClick={() => setPreviewLayout(null)}>
                    <div className="bg-gray-100 w-[95vw] h-[90vh] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-4 border-b bg-white flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-semibold">Preview: {previewLayout.name}</h2>
                            <button onClick={() => setPreviewLayout(null)} className="p-2 rounded-full hover:bg-gray-100">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto">
                            <LayoutRenderer 
                                album={{...mockAlbum, layout: previewLayout.id}} 
                                // Mock props for the layout renderer
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
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayoutsPage;