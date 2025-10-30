import React from 'react';
import { useUpload } from './UploadContext';
import type { ProjectDetails } from '../../../types';

const Step1_ProjectSetup: React.FC = () => {
    const { state, updateProjectDetails } = useUpload();
    const { projectDetails, mode } = state;
    const isCreatingClient = projectDetails.client === 'new';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'client' && value !== 'new') {
            updateProjectDetails({ 
                [name]: value,
                newClientDetails: { firstName: '', lastName: '', email: '', phone: '' }
            });
        } else {
            updateProjectDetails({ [name]: value });
        }
    };
    
    const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateProjectDetails({
            newClientDetails: {
                ...projectDetails.newClientDetails,
                [name]: value,
            },
        });
    };

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";
    
    const newClientLabelClasses = "block text-xs font-medium text-gray-500";
    const newClientInputClasses = "mt-1 block w-full bg-white text-gray-600 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm placeholder:text-gray-400";


    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Project Details</h3>
            <form className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Project Title</label>
                    <input type="text" id="title" name="title" value={projectDetails.title} onChange={handleChange} className={inputClasses} placeholder="e.g., Andrew & Samantha's Wedding" />
                </div>
                <div>
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700">Client</label>
                    <select id="client" name="client" value={projectDetails.client} onChange={handleChange} className={inputClasses}>
                        <option value="">Select an existing client</option>
                        <option value="client1">Andrew + Samantha</option>
                        {mode === 'new' && <option value="new">+ Create new client</option>}
                    </select>
                </div>

                {isCreatingClient && (
                    <div className="space-y-4 p-6 border border-gray-200 rounded-md bg-gray-50/50 animate-fade-in">
                        <h4 className="text-sm font-medium text-gray-600">New Client Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                             <div>
                                <label htmlFor="firstName" className={newClientLabelClasses}>First Name</label>
                                <input type="text" id="firstName" name="firstName" value={projectDetails.newClientDetails?.firstName} onChange={handleNewClientChange} className={newClientInputClasses} placeholder="NAGA RAJ" />
                            </div>
                             <div>
                                <label htmlFor="lastName" className={newClientLabelClasses}>Last Name</label>
                                <input type="text" id="lastName" name="lastName" value={projectDetails.newClientDetails?.lastName} onChange={handleNewClientChange} className={newClientInputClasses} placeholder="SEENIVASAN" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="email" className={newClientLabelClasses}>Email Address</label>
                                <input type="email" id="email" name="email" value={projectDetails.newClientDetails?.email} onChange={handleNewClientChange} className={newClientInputClasses} placeholder="client@example.com" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="phone" className={newClientLabelClasses}>Phone Number (Optional)</label>
                                <input type="tel" id="phone" name="phone" value={projectDetails.newClientDetails?.phone} onChange={handleNewClientChange} className={newClientInputClasses} placeholder="202-555-0177" />
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="shootDate" className="block text-sm font-medium text-gray-700">Shoot Date</label>
                    <input type="date" id="shootDate" name="shootDate" value={projectDetails.shootDate} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Project Tags</label>
                    <input type="text" id="tags" name="tags" value={projectDetails.tags} onChange={handleChange} className={inputClasses} placeholder="Wedding, Portrait, 2024" />
                </div>
                <div>
                    <label htmlFor="layoutPreset" className="block text-sm font-medium text-gray-700">Default Layout Preset</label>
                    <select id="layoutPreset" name="layoutPreset" value={projectDetails.layoutPreset} onChange={handleChange} className={inputClasses}>
                        <option>Modern Masonry</option>
                        <option>Classic Filmstrip</option>
                        <option>Minimalist Grid</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="watermark" className="block text-sm font-medium text-gray-700">Watermark</label>
                    <select id="watermark" name="watermark" value={projectDetails.watermark} onChange={handleChange} className={inputClasses}>
                        <option value="default">Default Studio Watermark</option>
                        <option value="none">No Watermark</option>
                        <option value="custom">Custom (Upload)</option>
                    </select>
                </div>
            </form>
        </div>
    );
};

export default Step1_ProjectSetup;