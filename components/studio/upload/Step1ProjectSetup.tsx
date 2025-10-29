import React from 'react';

const Step1ProjectSetup: React.FC = () => {
    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";
    
    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Project Details</h3>
            <form className="space-y-6">
                <div>
                    <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700">Project Title</label>
                    <input type="text" id="projectTitle" className={inputClasses} placeholder="e.g., Andrew & Samantha's Wedding" />
                </div>
                <div>
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700">Client</label>
                    <select id="client" className={inputClasses}>
                        <option>Select an existing client</option>
                        <option>Andrew + Samantha</option>
                        <option>+ Create new client</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="shootDate" className="block text-sm font-medium text-gray-700">Shoot Date</label>
                    <input type="date" id="shootDate" className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Project Tags</label>
                    <input type="text" id="tags" className={inputClasses} placeholder="Wedding, Portrait, 2024" />
                </div>
                 <div>
                    <label htmlFor="layout" className="block text-sm font-medium text-gray-700">Default Layout Preset</label>
                    <select id="layout" className={inputClasses}>
                        <option>Modern Masonry</option>
                        <option>Classic Filmstrip</option>
                        <option>Minimalist Grid</option>
                    </select>
                </div>
            </form>
        </div>
    );
};

export default Step1ProjectSetup;