import React, { useState, useEffect } from 'react';
import type { Album, Client } from '../../types';
import { ArrowLeftIcon, PlusIcon, CameraIcon } from '../icons';
import CoverPhotoChanger from './CoverPhotoChanger';
import { useAccessControl } from '../../contexts/AccessControlContext';

interface ProjectDetailsPageProps {
  project: Album;
  clients: Client[];
  onBack: () => void;
  onUpdateProject: (album: Album) => void;
  onDeleteProject: (albumId: string) => Promise<void>;
  onViewGallery: (album: Album) => void;
  onAddPhotos: () => void;
  onUploadEditedPhotos: (album: Album) => void;
  onGenerateInvoice: (album: Album) => void;
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ project, clients, onBack, onUpdateProject, onDeleteProject, onViewGallery, onAddPhotos, onUploadEditedPhotos, onGenerateInvoice }) => {
  const [details, setDetails] = useState(project);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCoverPhotoModalOpen, setCoverPhotoModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission } = useAccessControl();
  
  useEffect(() => {
    setDetails(project);
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    onUpdateProject(details);
    alert('Changes saved!');
  };

  const handleUpdateCover = async (newCoverSrc: string) => {
    const updatedDetails = { ...details, coverPhotoSrc: newCoverSrc };
    setDetails(updatedDetails);
    onUpdateProject(updatedDetails);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDeleteProject(project.id);
      setDeleteModalOpen(false);
    } catch (error) {
      // Error is already handled in parent component
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const clientName = clients.find(c => c.id === details.clientId)?.name || 'Unknown Client';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <header className="flex flex-col sm:flex-row items-start gap-4 mb-6 sm:mb-8">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px]">
                <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{project.title}</h1>
                <p className="mt-1 text-sm sm:text-base text-gray-600">Managing project for <span className="font-semibold">{clientName}</span></p>
            </div>
        </header>

        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            <div className="lg:col-span-2 space-y-6">
                {/* Cover Photo Section */}
                <div className="bg-white p-4 sm:p-6 border border-gray-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Cover Photo</h2>
                        <button
                            onClick={() => setCoverPhotoModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors min-h-[44px]"
                        >
                            <CameraIcon className="w-4 h-4" />
                            <span>Change Cover</span>
                        </button>
                    </div>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={details.coverPhotoSrc}
                            alt={`${details.title} cover`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="mt-3 text-xs sm:text-sm text-gray-500">
                        This image represents your project in galleries and project listings.
                    </p>
                </div>

                {/* Project Metadata Section */}
                <div className="bg-white p-4 sm:p-6 border border-gray-200 rounded-lg">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Project Metadata</h2>
                    <form className="space-y-4 sm:space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                            <input type="text" id="title" name="title" value={details.title} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] focus:ring-2 focus:ring-gray-500" />
                        </div>
                        <div>
                            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                            <select id="clientId" name="clientId" value={details.clientId} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] bg-white focus:ring-2 focus:ring-gray-500">
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="shootDate" className="block text-sm font-medium text-gray-700 mb-2">Shoot Date</label>
                            <input type="date" id="shootDate" name="shootDate" value={details.shootDate || ''} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] focus:ring-2 focus:ring-gray-500" />
                        </div>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white p-4 sm:p-6 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
                    <div className="space-y-3">
                        {hasPermission('canCreateInvoices') && (
                            <button 
                                onClick={() => onGenerateInvoice(project)} 
                                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 min-h-[44px]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate Invoice
                            </button>
                        )}
                        <button onClick={onAddPhotos} className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 min-h-[44px]">Add Photos</button>
                        <button 
                            onClick={() => onUploadEditedPhotos(project)} 
                            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover flex items-center justify-center gap-2 min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Upload Edited Photos
                        </button>
                        <button onClick={() => onViewGallery(project)} className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 min-h-[44px]">View Gallery</button>
                    </div>
                 </div>
                 <div className="bg-white p-4 sm:p-6 border border-gray-200 rounded-lg">
                    <button onClick={handleSaveChanges} className="w-full mb-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover min-h-[44px]">Save Changes</button>
                    <button onClick={() => setDeleteModalOpen(true)} className="w-full py-3 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg font-medium min-h-[44px]">Delete Project</button>
                 </div>
            </div>
        </div>

        {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => !isDeleting && setDeleteModalOpen(false)}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
                    <div className="text-center">
                        {/* Warning Icon */}
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        
                        <h2 className="mt-4 text-xl font-bold text-gray-900">Delete Project?</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">"{project.title}"</span>?
                        </p>
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800 font-medium">
                                ⚠️ This action cannot be undone
                            </p>
                            <p className="mt-1 text-xs text-red-700">
                                All photos, comments, and project data will be permanently deleted.
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                        <button 
                            onClick={() => setDeleteModalOpen(false)} 
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDeleteConfirm} 
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Project'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isCoverPhotoModalOpen && (
            <CoverPhotoChanger
                project={details}
                onUpdateCover={handleUpdateCover}
                onClose={() => setCoverPhotoModalOpen(false)}
            />
        )}
    </div>
  );
};

export default ProjectDetailsPage;
