
import React, { useState, useRef, useEffect } from 'react';
import type { Photo } from '../types';
import { HeartIcon, HeartFilledIcon, DownloadIcon, ChatBubbleIcon, CheckIcon } from './icons';
import { AuthenticatedImage } from './common/AuthenticatedImage';

interface PhotoItemProps {
  photo: Photo;
  onClick: () => void;
  isFavorite: boolean;
  isSelection: boolean;
  toggleFavorite: (photoId: string) => void;
  toggleSelection: (photoId: string) => void;
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
  
  const [ref, isVisible] = useOnScreen({ rootMargin: '200px' });
  
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const aspectRatio = (photo.height / photo.width) * 100;
  const isSelected = (isSelectable && isSelection) || (isCompareMode && isInCompareList);

  return (
    <div 
        ref={ref}
        className="relative group cursor-pointer break-inside-avoid bg-slate-200 rounded-lg overflow-hidden" 
        onClick={onClick}
        style={{ paddingTop: `${aspectRatio}%` }}
    >
      {isVisible && (
        <>
            <AuthenticatedImage
                photoId={photo.id}
                quality="medium"
                alt={photo.alt}
                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 animate-fade-in"
                colorVariant="auto"
            />
            <div 
                className={`absolute inset-0 transition-all duration-300 ring-4 ring-inset ${isSelected ? 'ring-sky-500' : 'ring-transparent'} ${isCompareMode ? '' : 'bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100'}`}
            ></div>
            
            {(isCompareMode || isSelectable) && (
                <div className={`absolute top-3 left-3 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center pointer-events-none ring-1 ring-slate-400/50 transition-all duration-300 ${isSelected ? 'bg-sky-500 ring-sky-600' : ''}`}>
                {isSelected && (
                    <CheckIcon className="w-4 h-4 text-white"/>
                )}
                </div>
            )}

            {!isSelectable && (
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-hover:animate-slide-down transition-all duration-300">
                    <button 
                    onClick={(e) => handleButtonClick(e, () => toggleSelection(photo.id))} 
                    className={`p-2 rounded-full transition-all transform hover:scale-110 ${isSelection ? 'bg-sky-500 text-white' : 'bg-white/80 text-slate-800 hover:bg-white'}`} 
                    aria-label="Select"
                    >
                    <CheckIcon className="w-5 h-5" />
                    </button>
                    <button 
                    onClick={(e) => handleButtonClick(e, () => toggleFavorite(photo.id))} 
                    className="p-2 rounded-full bg-white/80 text-slate-800 hover:bg-white transition-all transform hover:scale-110" 
                    aria-label="Favorite"
                    >
                    {isFavorite ? <HeartFilledIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
                    </button>
                    <button 
                    onClick={(e) => handleButtonClick(e, () => onDownload(photo.src, photo.alt))} 
                    className="p-2 rounded-full bg-white/80 text-slate-800 hover:bg-white transition-all transform hover:scale-110" 
                    aria-label="Download"
                    >
                    <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {hasComments && !isCompareMode && !isSelectable && (
                <div className="absolute bottom-3 left-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-hover:animate-slide-up transition-all duration-300" aria-label={`${photo.comments.length} comments`}>
                    <ChatBubbleIcon className="w-5 h-5 text-slate-700" />
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default PhotoItem;