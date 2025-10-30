import React, { useState } from 'react';
import type { Album, DashboardView } from '../../types';
import { ArrowLeftIcon } from '../icons';

interface ProjectDetailsPageProps {
  project: Album;
  onBack: () => void;
  onUpdateProject: (updatedProject: Album) => void;
  onViewGallery: (project: Album) => void;
  setView: (view: DashboardView) => void;
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ project, onBack, onUpdateProject, onViewGallery, setView }) => {
    const [details, setDetails] = useState({
        title: project.title,
        clientName: project.clientName || 'Andrew + Samantha',
        shootDate: project.shootDate || new Date().toISOString().split('T')[0],
    });
    const [isModalOpen, setModalOpen] = useState(false);
    const [pendingClient, setPendingClient] = useState(details.clientName);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClient = e.target.value;
        if (newClient !== details.clientName) {
            setPendingClient(newClient);
            setModalOpen(true);
        }
    };
    
    const confirmClientChange = () => {
        setDetails(prev => ({ ...prev, clientName: pendingClient }));
        setModalOpen(false);
    };

    const handleSave = () => {
        onUpdateProject({ ...project, ...details });
        // onBack(); // Stay on page after saving
    };

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Project</h1>
                        <p className="mt-1 text-gray-600">Editing "{project.title}"</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">
                        Save Changes
                    </button>
                     <button onClick={() => onViewGallery(project)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        View Gallery
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-lg border border-gray-200">
                     <form className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Project Title</label>
                            <input type="text" id="title" name="title" value={details.title} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client</label>
                            <select id="clientName" name="clientName" value={details.clientName} onChange={handleClientChange} className={inputClasses}>
                                <option>Andrew + Samantha</option>
                                <option>Jessica & Tom</option>
                                <option>Maria & Carlos</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="shootDate" className="block text-sm font-medium text-gray-700">Shoot Date</label>
                            <input type="date" id="shootDate" name="shootDate" value={details.shootDate} onChange={handleChange} className={inputClasses} />
                        </div>
                    </form>
                </div>
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-800">Project Actions</h3>
                        <div className="mt-4 space-y-3">
                            <button onClick={() => setView('upload')} className="w-full text-center p-3 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50 text-sm">
                                Add Photos
                            </button>
                             <button className="w-full text-center p-3 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50 text-sm">
                                Manage Albums
                            </button>
                             <button className="w-full text-center p-3 bg-red-50 text-red-700 border border-red-200 rounded-md font-semibold hover:bg-red-100 text-sm">
                                Archive Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all p-6">
                        <h3 className="text-lg font-bold text-gray-900">Confirm Client Change</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Changing the client for this project may affect associated invoices and client communications. Are you sure you want to proceed?
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={confirmClientChange} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                Confirm Change
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailsPage;