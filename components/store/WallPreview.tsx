import React from 'react';
import type { Photo } from '../../types';

interface WallPreviewProps {
    photo: Photo;
    mockupSrc: string;
    isThumbnail?: boolean;
}

const WallPreview: React.FC<WallPreviewProps> = ({ photo, mockupSrc, isThumbnail = false }) => {
    if (isThumbnail) {
        return (
             <div className="relative w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${mockupSrc})` }}>
                <div className="absolute inset-0 grid place-items-center p-8">
                     <img src={photo.src} alt={photo.alt} className="max-w-full max-h-full object-contain border-2 border-white shadow-lg"/>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full grid place-items-center bg-gray-100">
            <img
                src={mockupSrc}
                alt="Wall preview background"
                className="w-full h-full object-contain col-start-1 row-start-1"
            />
            {/* This container defines the 'frame' area on the mockup */}
            <div className="w-1/2 h-1/2 col-start-1 row-start-1 flex items-center justify-center pointer-events-none">
                 <img
                    src={photo.src}
                    alt={photo.alt}
                    className="max-w-full max-h-full object-contain border-4 md:border-8 border-white shadow-2xl"
                />
            </div>
        </div>
    );
};

export default WallPreview;