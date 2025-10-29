import React from 'react';
import { useUpload } from './UploadContext';
import type { ProjectDetails } from '../../../types';

const Step1_ProjectSetup: React.FC = () => {
    const { state, updateProjectDetails } = useUpload();
    const { projectDetails } = state;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        updateProjectDetails({ [e.target.name]: e.target.value });
    };

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";
    
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
                        <option value="new">+ Create new client</option>
                    </select>
                </div>
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
