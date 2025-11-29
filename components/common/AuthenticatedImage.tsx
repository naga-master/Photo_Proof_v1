import React, { useState, useEffect } from 'react';
import { getCachedPhotoVariant } from '../../services/photoService';
import { ImagePlaceholder } from './ImagePlaceholder';

type ColorVariant = 'auto' | 'slate' | 'blue' | 'purple' | 'green' | 'amber' | 'rose' | 'indigo';

interface AuthenticatedImageProps {
  photoId: string | number;
  quality?: 'thumbnail' | 'low' | 'medium' | 'high' | 'print';
  alt: string;
  className?: string;
  aspectRatio?: string;
  colorVariant?: ColorVariant;
}

const COLOR_VARIANTS = ['slate', 'blue', 'purple', 'green', 'amber', 'rose', 'indigo'] as const;

function getColorForPhotoId(photoId: string | number): typeof COLOR_VARIANTS[number] {
  const id = typeof photoId === 'string' ? parseInt(photoId) || 0 : photoId;
  return COLOR_VARIANTS[id % COLOR_VARIANTS.length];
}

export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  photoId,
  quality = 'medium',
  alt,
  className,
  aspectRatio,
  colorVariant = 'auto'
}) => {
  const selectedColor = colorVariant === 'auto' ? getColorForPhotoId(photoId) : colorVariant;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        console.log('[AuthenticatedImage] Fetching photo:', photoId, 'quality:', quality);
        const url = await getCachedPhotoVariant(photoId, quality);
        
        if (mounted) {
          console.log('[AuthenticatedImage] Photo loaded successfully:', photoId);
          setBlobUrl(url);
          setLoading(false);
        }
      } catch (err: any) {
        // Use debug level for auth errors (expected when user lacks access)
        if (err?.message?.includes('Auth error')) {
          console.debug('[AuthenticatedImage] Auth error for photo:', photoId);
        } else {
          console.error('[AuthenticatedImage] Failed to load photo:', photoId, err);
        }
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };
    
    fetchImage();
    
    return () => {
      mounted = false;
      // Note: We don't revoke blob URL here as it's cached and might be used elsewhere
    };
  }, [photoId, quality]);

  if (loading) {
    return (
      <ImagePlaceholder
        title="Loading..."
        aspectRatio={aspectRatio}
        showShimmer={true}
        className={className}
        colorVariant={selectedColor}
      />
    );
  }

  if (error || !blobUrl) {
    return (
      <ImagePlaceholder
        title="Photo unavailable"
        subtitle="Unable to load image"
        aspectRatio={aspectRatio}
        showShimmer={false}
        className={className}
        colorVariant={selectedColor}
      />
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onError={() => {
        console.error('[AuthenticatedImage] Image element failed to load:', photoId);
        setError(true);
      }}
    />
  );
};
