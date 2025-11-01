import React, { useState, useEffect } from 'react';
import type { Album, Client } from '../../types';
import { ArrowLeftIcon, PlusIcon, CameraIcon } from '../icons';
import CoverPhotoChanger from './CoverPhotoChanger';

interface ProjectDetailsPageProps {
  project: Album;
  clients: Client[];
  onBack: () => void;
  onUpdateProject: (album: Album) => void;
  onDeleteProject: (albumId: number) => void;
  onViewGallery: (album: Album) => void;
  onAddPhotos: () => void;
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ project, clients, onBack, onUpdateProject, onDeleteProject, onViewGallery, onAddPhotos }) => {
  const [details, setDetails] = useState(project);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCoverPhotoModalOpen, setCoverPhotoModalOpen] = useState(false);
  
  useEffect(() => {
    setDetails(project);
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: name === 'clientId' ? parseInt(value) : value }));
  };

  const handleSaveChanges = () => {
    onUpdateProject(details);
    alert('Changes saved!');
  };

  const handleUpdateCover = (newCoverSrc: string) => {
    const updatedDetails = { ...details, coverPhotoSrc: newCoverSrc };
    setDetails(updatedDetails);
    onUpdateProject(updatedDetails);
  };

  const handleDeleteConfirm = () => {
    onDeleteProject(project.id);
  }

  const clientName = clients.find(c => c.id === details.clientId)?.name || 'Unknown Client';
  const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";

  return (
    <div className="p-8 animate-fade-in">
        <header className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <p className="mt-1 text-gray-600">Managing project details and assets for <span className="font-semibold">{clientName}</span>.</p>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Cover Photo Section */}
                <div className="bg-white p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Cover Photo</h2>
                        <button
                            onClick={() => setCoverPhotoModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
                        >
                            <CameraIcon className="w-4 h-4" />
                            Change Cover
                        </button>
                    </div>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={details.coverPhotoSrc}
                            alt={`${details.title} cover`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                        This image represents your project in galleries and project listings.
                    </p>
                </div>

                {/* Project Metadata Section */}
                <div className="bg-white p-6 border border-gray-200 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Project Metadata</h2>
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Project Title</label>
                            <input type="text" id="title" name="title" value={details.title} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client</label>
                            <select id="clientId" name="clientId" value={details.clientId} onChange={handleChange} className={inputClasses}>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="shootDate" className="block text-sm font-medium text-gray-700">Shoot Date</label>
                            <input type="date" id="shootDate" name="shootDate" value={details.shootDate || ''} onChange={handleChange} className={inputClasses} />
                        </div>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white p-6 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
                    <div className="space-y-3">
                        <button onClick={onAddPhotos} className="w-full text-center py-2.5 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50">Add Photos</button>
                        <button onClick={() => onViewGallery(project)} className="w-full text-center py-2.5 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50">View Gallery</button>
                    </div>
                 </div>
                 <div className="bg-white p-6 border border-gray-200 rounded-lg">
                    <button onClick={handleSaveChanges} className="w-full mb-4 py-2.5 bg-gray-800 text-white rounded-md font-semibold hover:bg-gray-700">Save Changes</button>
                    <button onClick={() => setDeleteModalOpen(true)} className="w-full text-center text-sm text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md">Delete Project</button>
                 </div>
            </div>
        </div>

        {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setDeleteModalOpen(false)}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 p-6 text-center" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-gray-900">Are you sure?</h2>
                    <p className="mt-2 text-gray-600">This will permanently delete the project and all its photos. This action cannot be undone.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={() => setDeleteModalOpen(false)} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        <button onClick={handleDeleteConfirm} className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete Project</button>
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
