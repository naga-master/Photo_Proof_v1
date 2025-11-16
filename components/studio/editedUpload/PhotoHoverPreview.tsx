import React, { useEffect, useState } from 'react';
import type { Photo } from '../../../types';
import { CameraIcon } from '../../icons';

interface PhotoHoverPreviewProps {
  photo: Photo;
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * Photo Hover Preview Component
 * Shows a larger preview of the photo with metadata on hover
 * Smart positioning to avoid screen edges
 */
const PhotoHoverPreview: React.FC<PhotoHoverPreviewProps> = ({ photo, position, onClose }) => {
  const [previewPosition, setPreviewPosition] = useState({ x: position.x, y: position.y });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Calculate smart positioning to avoid edges
  useEffect(() => {
    const previewWidth = 320; // Preview width in pixels
    const previewHeight = 380; // Preview height in pixels (including metadata)
    const offset = 15; // Offset from cursor
    const padding = 20; // Padding from screen edges
    
    let x = position.x + offset;
    let y = position.y + offset;
    
    // Check right edge
    if (x + previewWidth + padding > window.innerWidth) {
      x = position.x - previewWidth - offset;
    }
    
    // Check bottom edge
    if (y + previewHeight + padding > window.innerHeight) {
      y = position.y - previewHeight - offset;
    }
    
    // Check left edge
    if (x < padding) {
      x = padding;
    }
    
    // Check top edge
    if (y < padding) {
      y = padding;
    }
    
    setPreviewPosition({ x, y });
  }, [position]);
  
  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };
  
  // Format date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };
  
  // Get dimensions string
  const getDimensions = (): string => {
    if (photo.width && photo.height) {
      return `${photo.width} × ${photo.height}`;
    }
    return 'Unknown';
  };
  
  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: `${previewPosition.x}px`,
        top: `${previewPosition.y}px`,
      }}
      onClick={onClose}
    >
      <div className="bg-white rounded-lg shadow-2xl border-2 border-slate-300 overflow-hidden transition-opacity duration-200 opacity-100">
        {/* Preview Image */}
        <div className="w-80 h-80 bg-slate-100 relative">
          {imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <CameraIcon className="w-16 h-16 text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 px-4 text-center">{photo.alt}</p>
            </div>
          ) : (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-slate-600" />
                </div>
              )}
              <img
                src={photo.src}
                alt={photo.alt}
                className={`w-full h-full object-contain transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
              />
            </>
          )}
        </div>
        
        {/* Metadata */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 truncate mb-2" title={photo.alt}>
            {photo.alt}
          </h4>
          
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">ID:</span>
              <span className="font-medium">{photo.id}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Dimensions:</span>
              <span className="font-medium">{getDimensions()}</span>
            </div>
            
            {photo.metadata?.fileSize && (
              <div className="flex justify-between">
                <span className="text-slate-500">Size:</span>
                <span className="font-medium">{formatFileSize(photo.metadata.fileSize)}</span>
              </div>
            )}
            
            {photo.metadata?.capturedAt && (
              <div className="flex justify-between">
                <span className="text-slate-500">Captured:</span>
                <span className="font-medium text-xs">{formatDate(photo.metadata.capturedAt)}</span>
              </div>
            )}
          </div>
          
          <div className="mt-2 pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center italic">
              Click photo to map
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoHoverPreview;
