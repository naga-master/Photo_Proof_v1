import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Album, Folder } from '../types';
import { FolderIcon, CameraIcon } from './icons';
import { projectService } from '../services/projectService';

interface AlbumFoldersViewProps {
  album: Album;
  onBack: () => void;
  onSelectFolder: (folder: Folder) => void;
  onViewAllPhotos: () => void;
}

const AlbumFoldersView: React.FC<AlbumFoldersViewProps> = ({
  album,
  onBack,
  onSelectFolder,
  onViewAllPhotos
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoading(true);
        const response = await projectService.getProjectFolders(album.id);
        const fetchedFolders = (response.folders || []).map((folder: any) => ({
          ...folder,
          // Ensure cover photo src has full URL
          coverPhotoSrc: folder.coverPhotoSrc && !folder.coverPhotoSrc.startsWith('http') 
            ? `http://localhost:8000${folder.coverPhotoSrc}` 
            : folder.coverPhotoSrc
        }));
        setFolders(fetchedFolders);
        
        console.log('[AlbumFoldersView] Fetched folders:', {
          count: fetchedFolders.length,
          folders: fetchedFolders.map((f: any) => ({ name: f.name, photoCount: f.photoCount, hasCover: !!f.coverPhotoSrc }))
        });
        
        // Note: No auto-redirect here - parent component handles navigation
        // based on folder count before we even get here
      } catch (error: any) {
        console.error('[AlbumFoldersView] Failed to fetch folders:', error);
        toast.error('Failed to load folders');
        setFolders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [album.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading folders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{album.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {album.shootDate && `Shoot Date: ${new Date(album.shootDate).toLocaleDateString()}`}
              {' · '}
              {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
              {folders.length > 0 && ` in ${folders.length} ${folders.length === 1 ? 'folder' : 'folders'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {folders.length === 0 ? (
          /* No folders - show view all photos option */
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Folders</h3>
            <p className="text-gray-500 mb-6">
              This project doesn't have any folders. View all photos directly.
            </p>
            <button
              onClick={onViewAllPhotos}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <CameraIcon className="w-5 h-5" />
              View All Photos
            </button>
          </div>
        ) : (
          /* Show folders grid */
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Albums & Folders</h2>
              <button
                onClick={onViewAllPhotos}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                View all photos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onSelectFolder(folder)}
                  className="group bg-white rounded-lg border-2 border-gray-200 hover:border-gray-900 transition-all overflow-hidden text-left"
                >
                  {/* Folder Cover */}
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {folder.coverPhotoSrc ? (
                      <img
                        src={folder.coverPhotoSrc}
                        alt={folder.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderIcon className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Folder Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-600 transition-colors">
                      {folder.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {folder.photoCount} {folder.photoCount === 1 ? 'photo' : 'photos'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlbumFoldersView;
