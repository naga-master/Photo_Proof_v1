import React from 'react';
import type { Album } from '../types';
import { ArrowRightIcon } from './icons';
import AuthenticatedBackgroundImage from './AuthenticatedBackgroundImage';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';

interface CoverPageProps {
  album: Album;
  onOpenGallery: () => void;
}

const CoverPage: React.FC<CoverPageProps> = ({ album, onOpenGallery }) => {
  const { theme } = useStudioTheme();
  
  if (!album) {
    return (
        <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden bg-slate-900">
            <div className="relative z-20 text-center animate-fade-in p-4">
                <h1 className="font-serif text-5xl md:text-7xl tracking-wider">
                    No Album Found
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-300 tracking-wide">
                    Please contact the studio.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden">
      <AuthenticatedBackgroundImage
        photoId={album.coverPhotoId}
        quality="medium"
        className="absolute inset-0 z-0 animate-ken-burns"
        fallbackSrc={album.coverPhotoSrc}
      >
        <div></div>
      </AuthenticatedBackgroundImage>
      <div className="absolute inset-0 bg-black/50 z-10"></div>
      
      <div className="relative z-20 text-center animate-fade-in p-4">
        <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-wider text-shadow-lg">
          {album.title}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-slate-200 tracking-wide">
          {album.photoCount} Photos {album.shootDate && `| ${album.shootDate}`}
        </p>
        <button
          onClick={onOpenGallery}
          className="mt-8 inline-flex items-center gap-3 px-8 py-3 text-white text-base font-semibold uppercase tracking-widest transition-all duration-300 rounded shadow-lg transform hover:scale-105"
          style={{
            backgroundColor: theme?.brand_color || '#6366f1',
            borderColor: theme?.brand_color || '#6366f1',
          }}
          onMouseEnter={(e) => {
            if (theme?.brand_color) {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          View Gallery
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Studio branding at bottom */}
      {theme && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          {theme.logo_url ? (
            <img 
              src={theme.logo_url}
              alt={theme.name}
              className="h-10 opacity-80 studio-logo"
            />
          ) : (
            <span className="text-white/80 text-sm uppercase tracking-widest">
              {theme.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverPage;