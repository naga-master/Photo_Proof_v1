
import React, { useState, useRef, useEffect } from 'react';
import type { Photo } from '../types';
import { HeartIcon, HeartFilledIcon, DownloadIcon, ChatBubbleIcon, CheckIcon } from './icons';

interface PhotoItemProps {
  photo: Photo;
  onClick: () => void;
  isFavorite: boolean;
  isSelection: boolean;
  toggleFavorite: (photoId: number) => void;
  toggleSelection: (photoId: number) => void;
  onDownload: (photoSrc: string, photoAlt: string) => void;
  isInCompareList: boolean;
  isCompareMode: boolean;
  isSelectable?: boolean;
}

const useOnScreen = (options: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isIntersecting, setIntersecting] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIntersecting(true);
                observer.disconnect();
            }
        }, options);
        
        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [options]);

    return [ref, isIntersecting] as const;
};

const PhotoItem: React.FC<PhotoItemProps> = ({ photo, onClick, isFavorite, isSelection, toggleFavorite, toggleSelection, onDownload, isInCompareList, isCompareMode, isSelectable = false }) => {
  const hasComments = photo.comments && photo.comments.length > 0;
  
  const [ref, isVisible] = useOnScreen({ rootMargin: '100px' });
  
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const aspectRatio = (photo.height / photo.width) * 100;

  return (
    <div 
        ref={ref}
        className="relative group cursor-pointer break-inside-avoid bg-gray-100" 
        onClick={onClick}
        style={{ paddingTop: `${aspectRatio}%` }}
    >
      {isVisible && (
        <>
            <img
                src={photo.src}
                alt={photo.alt}
                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 animate-fade-in"
                loading="lazy"
            />
            <div 
                className={`absolute inset-0 transition-all duration-300 ${isCompareMode || (isSelectable && isSelection) ? 'ring-4 ring-blue-500 ring-inset' : ''} ${isCompareMode ? '' : 'bg-black group-hover:bg-opacity-30 bg-opacity-0'}`}
            ></div>
            
            {(isCompareMode || isSelectable) && (
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center pointer-events-none ring-1 ring-gray-400/50">
                {(isInCompareList || (isSelectable && isSelection)) && (
                    <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center animate-fade-in ring-2 ring-white">
                      <CheckIcon className="w-3 h-3 text-white"/>
                    </div>
                )}
                </div>
            )}

            {!isSelectable && (
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                    onClick={(e) => handleButtonClick(e, () => toggleSelection(photo.id))} 
                    className={`p-2 rounded-full transition-colors ${isSelection ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-800 hover:bg-white'}`} 
                    aria-label="Select"
                    >
                    <CheckIcon className="w-5 h-5" />
                    </button>
                    <button 
                    onClick={(e) => handleButtonClick(e, () => toggleFavorite(photo.id))} 
                    className="p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors" 
                    aria-label="Favorite"
                    >
                    {isFavorite ? <HeartFilledIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
                    </button>
                    <button 
                    onClick={(e) => handleButtonClick(e, () => onDownload(photo.src, photo.alt))} 
                    className="p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors" 
                    aria-label="Download"
                    >
                    <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            )}


            {hasComments && !isCompareMode && !isSelectable && (
                <div className="absolute bottom-2 left-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm" aria-label={`${photo.comments.length} comments`}>
                <ChatBubbleIcon className="w-5 h-5 text-gray-700" />
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default PhotoItem;
