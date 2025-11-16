



import React, { useMemo, useRef, useState } from 'react';
import { useUpload } from './UploadContext';
import { CheckCircleIcon, XCircleIcon } from '../../icons';
import CoverPhotoSelector from './CoverPhotoSelector';
import type { ProjectDetails, UploadFile, Album } from '../../../types';
import { projectService } from '../../../services/projectService';

interface Step5_SummaryProps {
  onExit: () => void;
  onProjectCreated: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[], coverPhotoIndex?: number, backendProjectId?: string) => Album;
  // Fix: Updated onViewGallery prop to accept an Album object.
  onViewGallery: (album: Album) => void;
  showToast: (message: string) => void;
}

const Step5_Summary: React.FC<Step5_SummaryProps> = ({ onExit, onProjectCreated, onViewGallery, showToast }) => {
  const { state, retryFailedUploads } = useUpload();
  const { uploadQueue, projectDetails, backendProjectId, mode } = state;
  const createdAlbumRef = useRef<Album | null>(null);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null);
  const [isSavingCoverPhoto, setIsSavingCoverPhoto] = useState(false);
  
  // State for existing project details
  const [projectName, setProjectName] = useState<string>('');
  const [existingCoverPhotoId, setExistingCoverPhotoId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Determine button text based on mode
  const isAddingToExisting = mode === 'existing';
  const publishButtonText = isAddingToExisting ? 'Update Project' : 'Publish Project';

  // Fetch project details for existing projects
  React.useEffect(() => {
    console.log('[Step5_Summary] useEffect triggered:', { mode, backendProjectId, title: projectDetails.title });
    
    if (mode === 'existing' && backendProjectId) {
      setIsLoadingProject(true);
      console.log('[Step5_Summary] Fetching project details for ID:', backendProjectId);
      
      projectService.getProject(backendProjectId)
        .then(project => {
          console.log('[Step5_Summary] ✅ Fetched project details:', project);
          
          // Handle both "name" (current backend) and "title" (future backend)
          const projectTitle = project.title || project.name || 'Untitled Project';
          console.log('[Step5_Summary] Project title resolved:', projectTitle);
          setProjectName(projectTitle);
          
          setExistingCoverPhotoId(project.cover_photo_id || null);
        })
        .catch(err => {
          console.error('[Step5_Summary] ❌ Failed to fetch project:', err);
          console.error('[Step5_Summary] Error details:', {
            message: err.message,
            response: err.response,
            status: err.status
          });
          setProjectName('Untitled Project');
        })
        .finally(() => setIsLoadingProject(false));
    } else {
      // For new projects, use projectDetails
      console.log('[Step5_Summary] Using projectDetails.title:', projectDetails.title);
      setProjectName(projectDetails.title || 'Untitled Project');
    }
  }, [mode, backendProjectId, projectDetails.title]);

  const { successCount, failedCount } = useMemo(() => {
    return {
      successCount: uploadQueue.filter(f => f.status === 'success').length,
      failedCount: uploadQueue.filter(f => f.status === 'failed').length,
    };
  }, [uploadQueue]);

  const failedFiles = uploadQueue.filter(f => f.status === 'failed');
  
  // Determine if cover selector should show
  // Don't show while loading project details for existing projects
  const shouldShowCoverSelector = 
    successCount > 0 && 
    !isLoadingProject &&  // Don't show while loading
    (mode === 'new' || !existingCoverPhotoId);
  
  console.log('[Step5_Summary] Cover selector decision:', {
    shouldShowCoverSelector,
    successCount,
    mode,
    existingCoverPhotoId,
    isLoadingProject,
    calculation: `${successCount} > 0 && !${isLoadingProject} && (${mode} === 'new' || !${existingCoverPhotoId})`
  });

  // Determine if we should update the cover photo
  const shouldUpdateCoverPhoto = () => {
    // User manually selected a cover photo - always update
    if (selectedCoverIndex !== null) {
      console.log('[Step5_Summary] Should update cover: User selected cover');
      return true;
    }
    
    // New project - always set a cover
    if (mode === 'new') {
      console.log('[Step5_Summary] Should update cover: New project');
      return true;
    }
    
    // Existing project without cover - set a cover
    if (mode === 'existing' && !existingCoverPhotoId) {
      console.log('[Step5_Summary] Should update cover: Existing project without cover');
      return true;
    }
    
    // Existing project with cover, no user selection - DON'T update
    console.log('[Step5_Summary] Should NOT update cover: Existing project has cover, preserving it');
    return false;
  };

  const setCoverPhotoOnBackend = async () => {
    if (!backendProjectId) {
      console.error('[Step5_Summary] No backend project ID available');
      return;
    }

    const successfulFiles = uploadQueue.filter(f => f.status === 'success');
    
    if (successfulFiles.length === 0) {
      console.warn('[Step5_Summary] No successful uploads to set as cover photo');
      return;
    }

    // If no cover photo selected, pick a random one
    let coverIndex = selectedCoverIndex;
    if (coverIndex === null) {
      coverIndex = Math.floor(Math.random() * successfulFiles.length);
      console.log(`[Step5_Summary] Auto-selected random cover photo at index ${coverIndex}`);
    }

    const coverFile = successfulFiles[coverIndex];

    if (!coverFile || !coverFile.photoId) {
      console.warn('[Step5_Summary] No cover photo available or no photo ID');
      return;
    }

    try {
      setIsSavingCoverPhoto(true);
      await projectService.setCoverPhoto(backendProjectId, coverFile.photoId);
      console.log('[Step5_Summary] ✅ Cover photo set successfully');
      showToast('Cover photo updated');
    } catch (error: any) {
      console.error('[Step5_Summary] Failed to set cover photo:', error);
      showToast(error?.message || 'Failed to set cover photo');
    } finally {
      setIsSavingCoverPhoto(false);
    }
  };

  const getOrCreateAlbum = () => {
    if (!createdAlbumRef.current) {
      // Use selected cover index, or default to first successful upload if none selected
      const coverIndex = selectedCoverIndex !== null 
        ? selectedCoverIndex 
        : uploadQueue.findIndex(f => f.status === 'success');
      
      createdAlbumRef.current = onProjectCreated(projectDetails, uploadQueue, coverIndex >= 0 ? coverIndex : undefined, backendProjectId);
    }
    return createdAlbumRef.current;
  };

  const handlePublish = async () => {
    // Only update cover photo if appropriate (new project, no existing cover, or user selected)
    if (shouldUpdateCoverPhoto()) {
      await setCoverPhotoOnBackend();
    } else {
      console.log('[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo');
    }
    
    getOrCreateAlbum();
    onExit();
  };

  const handleViewGallery = async () => {
    // Only update cover photo if appropriate (new project, no existing cover, or user selected)
    if (shouldUpdateCoverPhoto()) {
      await setCoverPhotoOnBackend();
    } else {
      console.log('[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo');
    }
    
    const album = getOrCreateAlbum();
    if (album) {
        onViewGallery(album);
    }
  };

  const handleNotifyClient = () => {
    showToast('Client has been notified!');
  };

  return (
    <div className="w-full max-w-2xl text-center bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
      <h2 className="mt-4 text-3xl font-bold text-gray-800">Upload Complete</h2>
      <p className="mt-2 text-gray-500">
        Project "<span className="font-semibold">
          {isLoadingProject ? (
            <span className="inline-block animate-pulse">Loading...</span>
          ) : (
            projectName || 'Untitled Project'
          )}
        </span>" has been processed.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="font-semibold text-green-800">Successfully Uploaded</p>
              <p className="text-2xl font-bold text-green-900">{successCount} files</p>
          </div>
          <div className={`p-4 rounded-lg border ${failedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`font-semibold ${failedCount > 0 ? 'text-red-800' : 'text-gray-800'}`}>Failed</p>
              <p className={`text-2xl font-bold ${failedCount > 0 ? 'text-red-900' : 'text-gray-900'}`}>{failedCount} files</p>
          </div>
      </div>
        
      {failedCount > 0 && (
          <div className="mt-6 text-left">
              <h4 className="font-semibold text-gray-800">Failed Files</h4>
              <ul className="mt-2 text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-md border">
                  {failedFiles.map(f => <li key={f.id} className="flex items-center gap-2"><XCircleIcon className="w-4 h-4 text-red-500" /> {f.file.name}</li>)}
              </ul>
              <button onClick={retryFailedUploads} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">Retry Failed Uploads</button>
          </div>
      )}

      {/* Cover Photo Selector - Only show for new projects or existing without cover */}
      {shouldShowCoverSelector && (
        <CoverPhotoSelector
          uploadQueue={uploadQueue}
          selectedCoverIndex={selectedCoverIndex}
          onSelectCover={setSelectedCoverIndex}
        />
      )}
      
      {/* Informational message for existing projects with cover */}
      {mode === 'existing' && existingCoverPhotoId && successCount > 0 && selectedCoverIndex === null && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ℹ️ This project already has a cover photo. It will be preserved.
            {!shouldShowCoverSelector && (
              <span> You can change it later from the project details page.</span>
            )}
          </p>
        </div>
      )}

      <div className="mt-8 border-t pt-6">
        <h3 className="font-semibold text-gray-800">What's next?</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={handlePublish} className="p-3 bg-gray-800 text-white rounded-md font-semibold hover:bg-gray-700">{publishButtonText}</button>
            <button onClick={handleNotifyClient} className="p-3 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50">Notify Client</button>
            <button onClick={handleViewGallery} className="p-3 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50">View Gallery</button>
        </div>
      </div>
    </div>
  );
};

export default Step5_Summary;
