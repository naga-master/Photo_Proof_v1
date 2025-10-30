

import React, { useMemo } from 'react';
import { useUpload } from './UploadContext';
import type { ProjectDetails, Client, LayoutId, ServicePackage } from '../../../types';
import { layoutTemplates } from '../../../data/layouts';

interface Step1ProjectSetupProps {
    clients: Client[];
    packages: ServicePackage[];
}

const Step1_ProjectSetup: React.FC<Step1ProjectSetupProps> = ({ clients, packages }) => {
    const { state, dispatch } = useUpload();
    const { projectDetails } = state;

    const isCreatingNewClient = projectDetails.clientId === 'new';
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        dispatch({
            type: 'SET_PROJECT_DETAILS',
            payload: { [e.target.name]: e.target.value }
        });
    };
    
    const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({
            type: 'SET_PROJECT_DETAILS',
            payload: { 
                newClientDetails: {
                    ...projectDetails.newClientDetails,
                    [e.target.name]: e.target.value
                }
            }
        });
    };

    const groupedPackages = useMemo(() => {
        // Fix: By typing the initial value of `reduce`, TypeScript correctly infers the
        // accumulator's type. This prevents `pkgs` from being `unknown` when iterating.
        return packages.reduce((acc, pkg) => {
            (acc[pkg.category] = acc[pkg.category] || []).push(pkg);
            return acc;
        }, {} as Record<string, ServicePackage[]>);
    }, [packages]);

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";
    const newClientInputClasses = "mt-1 block w-full bg-gray-50/50 text-gray-800 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm placeholder-gray-400";

    
    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Project Details</h3>
            <form className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Project Title</label>
                    <input type="text" id="title" name="title" value={projectDetails.title || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., Andrew & Samantha's Wedding" />
                </div>
                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client</label>
                    <select id="clientId" name="clientId" value={projectDetails.clientId || ''} onChange={handleChange} className={inputClasses}>
                        <option value="">Select an existing client</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                        <option value="new">+ Create new client</option>
                    </select>
                </div>
                
                {isCreatingNewClient && (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-4 animate-fade-in">
                        <h4 className="font-medium text-gray-600">New Client Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500">First Name</label>
                                <input type="text" name="firstName" value={projectDetails.newClientDetails?.firstName || ''} onChange={handleNewClientChange} className={newClientInputClasses} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Last Name</label>
                                <input type="text" name="lastName" value={projectDetails.newClientDetails?.lastName || ''} onChange={handleNewClientChange} className={newClientInputClasses} />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">Email Address</label>
                             <input type="email" name="email" value={projectDetails.newClientDetails?.email || ''} onChange={handleNewClientChange} className={newClientInputClasses} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Phone Number (Optional)</label>
                            <input type="tel" name="phone" value={projectDetails.newClientDetails?.phone || ''} onChange={handleNewClientChange} className={newClientInputClasses} />
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="shootDate" className="block text-sm font-medium text-gray-700">Shoot Date</label>
                    <input type="date" id="shootDate" name="shootDate" value={projectDetails.shootDate || ''} onChange={handleChange} className={inputClasses} />
                </div>
                
                <div>
                    <label htmlFor="packageId" className="block text-sm font-medium text-gray-700">Service Package</label>
                    <select id="packageId" name="packageId" value={projectDetails.packageId || ''} onChange={handleChange} className={inputClasses}>
                        <option value="">No package selected</option>
                        {Object.entries(groupedPackages).map(([category, pkgs]) => (
                           <optgroup label={category} key={category}>
                               {pkgs.map(pkg => (
                                   <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                               ))}
                           </optgroup>
                        ))}
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="layout" className="block text-sm font-medium text-gray-700">Layout Preset</label>
                        <select id="layout" name="layout" value={projectDetails.layout || ''} onChange={handleChange} className={inputClasses}>
                            {layoutTemplates.map(template => (
                               <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="watermark" className="block text-sm font-medium text-gray-700">Watermark</label>
                        <input type="text" id="watermark" name="watermark" value={projectDetails.watermark || ''} onChange={handleChange} className={inputClasses} placeholder="Default studio watermark" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Project Tags</label>
                    <input type="text" id="tags" name="tags" value={projectDetails.tags || ''} onChange={handleChange} className={inputClasses} placeholder="Wedding, Portrait, 2024" />
                </div>
            </form>
        </div>
    );
};

export default Step1_ProjectSetup;
