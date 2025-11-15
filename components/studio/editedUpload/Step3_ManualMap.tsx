import React, { useEffect, useState } from 'react';
import { useEditedUpload } from './EditedUploadContext';
import { versionService } from '../../../services/versionService';
import { CameraIcon, EyeIcon, CheckIcon, CloseIcon } from '../../icons';
import type { Photo } from '../../../types';
import { memoryCacheManager } from '../../../src/services/cache/MemoryCacheManager';
import { indexedDBManager } from '../../../src/services/cache/IndexedDBManager';
import { configLoader } from '../../../src/services/ConfigLoader';
import type { GetOriginalPhotosResponse } from '../../../services/versionService';

// Cache key generator
const getCacheKey = (projectId: string): string => {
  return `original-photos:project-${projectId}`;
};

// Check memory cache
const getFromMemoryCache = (cacheKey: string): GetOriginalPhotosResponse | null => {
  if (!configLoader.isFeatureEnabled('memoryCache')) return null;
  
  const cached = memoryCacheManager.get<GetOriginalPhotosResponse>(cacheKey);
  if (cached) {
    console.log('[Step3_ManualMap] ✅ Memory cache HIT:', cacheKey);
    return cached;
  }
  
  console.log('[Step3_ManualMap] ❌ Memory cache MISS:', cacheKey);
  return null;
};

// Check IndexedDB cache
const getFromIndexedDBCache = async (cacheKey: string): Promise<GetOriginalPhotosResponse | null> => {
  if (!configLoader.isFeatureEnabled('indexedDBCache')) return null;
  
  const cached = await indexedDBManager.get<GetOriginalPhotosResponse>(cacheKey);
  if (cached) {
    console.log('[Step3_ManualMap] ✅ IndexedDB cache HIT:', cacheKey);
    
    // Populate memory cache for next access
    if (configLoader.isFeatureEnabled('memoryCache')) {
      memoryCacheManager.set(cacheKey, cached);
    }
    
    return cached;
  }
  
  console.log('[Step3_ManualMap] ❌ IndexedDB cache MISS:', cacheKey);
  return null;
};

// Store in caches
const storeInCache = async (cacheKey: string, data: GetOriginalPhotosResponse): Promise<void> => {
  // Memory cache
  if (configLoader.isFeatureEnabled('memoryCache')) {
    memoryCacheManager.set(cacheKey, data);
    console.log('[Step3_ManualMap] ✅ Stored in memory cache:', cacheKey);
  }
  
  // IndexedDB cache
  if (configLoader.isFeatureEnabled('indexedDBCache')) {
    await indexedDBManager.set(cacheKey, data);
    console.log('[Step3_ManualMap] ✅ Stored in IndexedDB:', cacheKey);
  }
};

const Step3_ManualMap: React.FC = () => {
  const { state, addManualMapping, skipFile, unskipFile } = useEditedUpload();
  const [originalPhotos, setOriginalPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hoveredPhotoId, setHoveredPhotoId] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadPhotos = async () => {
      if (hasLoaded) return; // Prevent multiple loads
      if (originalPhotos.length > 0) return; // Already loaded

      setIsLoading(true);
      setHasLoaded(true);

      try {
        const cacheKey = getCacheKey(state.projectId);
        console.log('[Step3_ManualMap] Loading photos with cache key:', cacheKey);
        
        // 1. Check memory cache
        let response = getFromMemoryCache(cacheKey);
        
        // 2. Check IndexedDB cache if memory miss
        if (!response) {
          response = await getFromIndexedDBCache(cacheKey);
        }
        
        // 3. Fetch from API if both caches miss
        if (!response) {
          console.log('[Step3_ManualMap] ⚠️ Cache MISS, fetching from API');
          response = await versionService.getOriginalPhotos(state.projectId);
          
          // Store in caches
          await storeInCache(cacheKey, response);
        }
        
        // Get API base URL to construct absolute image URLs
        const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
        
        console.log('[Step3_ManualMap] Loaded photos:', response.photos.length, 'API Base:', API_BASE_URL);
        
        // Map OriginalPhoto to Photo type for display
        const mappedPhotos = response.photos.map(p => {
          // Convert relative src to absolute URL
          const absoluteSrc = p.src.startsWith('http') ? p.src : `${API_BASE_URL}${p.src}`;
          const absoluteThumbnail = p.thumbnail_path 
            ? (p.thumbnail_path.startsWith('http') ? p.thumbnail_path : `${API_BASE_URL}${p.thumbnail_path}`)
            : undefined;
          
          return {
            id: String(p.id),
            src: absoluteSrc,
            alt: p.original_filename,
            width: 800,
            height: 600,
            comments: [],
            thumbnails: absoluteThumbnail ? { small: absoluteThumbnail } : undefined,
          };
        });
        
        setOriginalPhotos(mappedPhotos);
        
        // Auto-select first unmatched file
        if (state.unmatchedFiles.length > 0) {
          setSelectedFile(state.unmatchedFiles[0]);
        }
      } catch (error) {
        console.error('[Step3_ManualMap] Failed to load photos:', error);
        setHasLoaded(false); // Allow retry on error
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [state.projectId]);

  const filteredPhotos = originalPhotos.filter(photo => {
    const filename = photo.alt || photo.src.split('/').pop() || '';
    return filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleImageError = (photoId: string) => {
    console.log('[Step3_ManualMap] Image failed to load:', photoId);
    setImageErrors(prev => new Set(prev).add(photoId));
  };

  const handlePhotoSelect = (photoId: number) => {
    if (!selectedFile) {
      console.log('[Step3_ManualMap] No file selected');
      return;
    }

    console.log('[Step3_ManualMap] Mapping file to photo', {
      filename: selectedFile.name,
      photoId,
      currentMappings: state.manualMappings.size,
      unmatchedCount: state.unmatchedFiles.length
    });

    addManualMapping(selectedFile.name, photoId);
    
    // Select next unmatched file
    const currentIndex = state.unmatchedFiles.findIndex(f => f.name === selectedFile.name);
    if (currentIndex < state.unmatchedFiles.length - 1) {
      setSelectedFile(state.unmatchedFiles[currentIndex + 1]);
    } else {
      setSelectedFile(null);
    }
    
    setSearchQuery('');
  };

  const handleSkip = (file: File) => {
    skipFile(file.name);
    
    // Select next unmatched file
    const currentIndex = state.unmatchedFiles.findIndex(f => f.name === file.name);
    if (currentIndex < state.unmatchedFiles.length - 1) {
      setSelectedFile(state.unmatchedFiles[currentIndex + 1]);
    } else {
      setSelectedFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-800 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading Photos...</h3>
        </div>
      </div>
    );
  }

  const remainingCount = state.unmatchedFiles.length;
  const skippedCount = state.skippedFiles.size;
  const mappedCount = state.manualMappings.size;

  console.log('[Step3_ManualMap] Render state', {
    remainingCount,
    skippedCount,
    mappedCount,
    selectedFile: selectedFile?.name,
    unmatchedFiles: state.unmatchedFiles.map(f => f.name)
  });

  return (
    <div className="w-full max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Manual Mapping</h2>
        <p className="text-slate-600 mb-6">
          Select a file below, then click on the original photo it should replace
        </p>

        {/* Progress */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Remaining Files</span>
            <span className="text-sm font-bold text-slate-800">{remainingCount} files</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 mt-2">
            {mappedCount > 0 && <span className="text-green-600">✓ {mappedCount} mapped</span>}
            {skippedCount > 0 && <span className="text-amber-600">⊘ {skippedCount} skipped</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Unmatched Files */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Files to Map</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {state.unmatchedFiles.map((file, index) => (
                <UnmatchedFileCard
                  key={`${file.name}-${index}`}
                  file={file}
                  isSelected={selectedFile?.name === file.name}
                  onSelect={() => setSelectedFile(file)}
                  onSkip={() => handleSkip(file)}
                />
              ))}
              {state.unmatchedFiles.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <CheckIcon className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">All files mapped!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Original Photos Grid */}
          <div>
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Select Original Photo</h3>
              <div className="relative">
                <EyeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto p-1">
              {filteredPhotos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => handlePhotoSelect(Number(photo.id))}
                  onMouseEnter={() => setHoveredPhotoId(Number(photo.id))}
                  onMouseLeave={() => setHoveredPhotoId(null)}
                  disabled={!selectedFile}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedFile
                      ? 'cursor-pointer hover:border-blue-500 hover:scale-105'
                      : 'cursor-not-allowed opacity-50'
                  } ${
                    hoveredPhotoId === Number(photo.id)
                      ? 'border-blue-500 shadow-lg'
                      : 'border-slate-200'
                  }`}
                  title={`${photo.alt}\nID: ${photo.id}`}
                >
                  {imageErrors.has(photo.id) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                      <CameraIcon className="w-10 h-10 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 px-2 text-center">{photo.alt}</p>
                    </div>
                  ) : (
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(photo.id)}
                    />
                  )}
                  {hoveredPhotoId === Number(photo.id) && selectedFile && (
                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate font-medium">
                      {photo.alt}
                    </p>
                    <p className="text-[10px] text-white/70 truncate">
                      ID: {photo.id}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {filteredPhotos.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <CameraIcon className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">No photos found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface UnmatchedFileCardProps {
  file: File;
  isSelected: boolean;
  onSelect: () => void;
  onSkip: () => void;
}

const UnmatchedFileCard: React.FC<UnmatchedFileCardProps> = ({ 
  file, 
  isSelected, 
  onSelect, 
  onSkip 
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnail(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        <p className="text-xs text-slate-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      {/* Skip Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Skip this file"
      >
        <CloseIcon className="w-4 h-4" />
      </button>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default Step3_ManualMap;
