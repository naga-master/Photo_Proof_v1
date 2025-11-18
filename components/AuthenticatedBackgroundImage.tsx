import React, { useEffect, useState } from 'react';
import { getCachedPhotoVariant } from '../services/photoService';

interface AuthenticatedBackgroundImageProps {
  photoId: string | number | null | undefined;
  quality?: 'thumbnail' | 'low' | 'medium' | 'high' | 'print';
  children: React.ReactNode;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Component that fetches an authenticated photo and uses it as a background image
 * Similar to AuthenticatedImage but for background-image CSS property
 */
const AuthenticatedBackgroundImage: React.FC<AuthenticatedBackgroundImageProps> = ({
  photoId,
  quality = 'medium',
  children,
  className = '',
  fallbackSrc
}) => {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!photoId) {
      if (fallbackSrc) {
        setBackgroundUrl(fallbackSrc);
      }
      return;
    }

    let mounted = true;

    const fetchBackground = async () => {
      try {
        const blobUrl = await getCachedPhotoVariant(photoId, quality);
        if (mounted) {
          setBackgroundUrl(blobUrl);
        }
      } catch (err) {
        console.error(`[AuthenticatedBackgroundImage] Failed to load photo ${photoId}:`, err);
        if (mounted) {
          setError(err as Error);
          if (fallbackSrc) {
            setBackgroundUrl(fallbackSrc);
          }
        }
      }
    };

    fetchBackground();

    return () => {
      mounted = false;
    };
  }, [photoId, quality, fallbackSrc]);

  const style: React.CSSProperties = backgroundUrl
    ? {
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : {};

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default AuthenticatedBackgroundImage;
