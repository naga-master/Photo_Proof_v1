
import React, { useEffect, useMemo, useState } from 'react';
import { useUpload } from './UploadContext';
import type { ProjectDetails, Client, LayoutId, ServicePackage } from '../../../types';
import { XCircleIcon } from '../../icons';
import { layoutTemplates } from '../../../data/layoutTemplates';
import { validateStep1 } from '../../../lib/validators';

interface Step1ProjectSetupProps {
    clients: Client[];
    packages: ServicePackage[];
}

const Step1_ProjectSetup: React.FC<Step1ProjectSetupProps> = ({ clients, packages }) => {
    const { state, dispatch } = useUpload();
    const { projectDetails } = state;
    const [profilePicPreview, setProfilePicPreview] = useState<string>('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const isCreatingNewClient = projectDetails.clientId === 'new';
    
    // Get validation errors
    const validation = validateStep1(projectDetails);
    const errors = validation.errors;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTouched({ ...touched, [e.target.name]: true });
        dispatch({
            type: 'SET_PROJECT_DETAILS',
            payload: { [e.target.name]: e.target.value }
        });
    };
    
    const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTouched({ ...touched, [`newClient${e.target.name.charAt(0).toUpperCase() + e.target.name.slice(1)}`]: true });
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

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                dispatch({
                    type: 'SET_PROJECT_DETAILS',
                    payload: { 
                        newClientDetails: {
                            ...projectDetails.newClientDetails,
                            profilePicture: result
                        }
                    }
                });
                setProfilePicPreview(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePicture = () => {
        dispatch({
            type: 'SET_PROJECT_DETAILS',
            payload: { 
                newClientDetails: {
                    ...projectDetails.newClientDetails,
                    profilePicture: ''
                }
            }
        });
        setProfilePicPreview('');
    };

    const groupedPackages = useMemo(() => {
        // Fix: By typing the initial value of `reduce`, TypeScript correctly infers the
        // accumulator's type. This prevents `pkgs` from being `unknown` when iterating.
        return packages.reduce((acc, pkg) => {
            (acc[pkg.category] = acc[pkg.category] || []).push(pkg);
            return acc;
        }, {} as Record<string, ServicePackage[]>);
    }, [packages]);

    const inputClasses = (fieldName: string) => {
        const baseClasses = "mt-1 block w-full bg-white text-gray-900 rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm";
        const hasError = touched[fieldName] && errors[fieldName];
        const borderClass = hasError ? "border-red-500 focus-visible:border-red-500" : "border-gray-300 focus-visible:border-gray-500";
        return `${baseClasses} ${borderClass}`;
    };
    
    const newClientInputClasses = (fieldName: string) => {
        const baseClasses = "mt-1 block w-full bg-gray-50/50 text-gray-800 rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm placeholder-gray-400";
        const hasError = touched[fieldName] && errors[fieldName];
        const borderClass = hasError ? "border-red-500 focus-visible:border-red-500" : "border-gray-300 focus-visible:border-gray-500";
        return `${baseClasses} ${borderClass}`;
    };

    const ErrorMessage: React.FC<{ fieldName: string }> = ({ fieldName }) => {
        if (!touched[fieldName] || !errors[fieldName]) return null;
        return <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>;
    };

    
    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Project Details</h3>
            <form className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Project Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="title" 
                        name="title" 
                        value={projectDetails.title || ''} 
                        onChange={handleChange}
                        onBlur={() => setTouched({ ...touched, title: true })}
                        className={inputClasses('title')} 
                        placeholder="e.g., Andrew & Samantha's Wedding" 
                    />
                    <ErrorMessage fieldName="title" />
                </div>
                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                        Client <span className="text-red-500">*</span>
                    </label>
                    <select 
                        id="clientId" 
                        name="clientId" 
                        value={projectDetails.clientId || ''} 
                        onChange={handleChange}
                        onBlur={() => setTouched({ ...touched, clientId: true })}
                        className={inputClasses('clientId')}
                    >
                        <option value="">Select an existing client</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                        <option value="new">+ Create new client</option>
                    </select>
                    <ErrorMessage fieldName="clientId" />
                </div>
                
                {isCreatingNewClient && (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-4 animate-fade-in">
                        <h4 className="font-medium text-gray-600">New Client Information</h4>
                        <div>
                            <label className="text-xs text-gray-500 mb-2 block">Profile Picture (Optional)</label>
                            <div className="flex items-center gap-4">
                                {profilePicPreview || projectDetails.newClientDetails?.profilePicture ? (
                                    <div className="relative">
                                        <img 
                                            src={profilePicPreview || projectDetails.newClientDetails?.profilePicture} 
                                            alt="Profile preview" 
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" 
                                        />
                                        <button
                                            type="button"
                                            onClick={removeProfilePicture}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                        >
                                            <XCircleIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <span className="text-gray-400 text-xs">No photo</span>
                                    </div>
                                )}
                                <label className="cursor-pointer">
                                    <span className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 inline-block">
                                        Choose File
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePicChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="firstName" 
                                    value={projectDetails.newClientDetails?.firstName || ''} 
                                    onChange={handleNewClientChange}
                                    onBlur={() => setTouched({ ...touched, firstName: true })}
                                    className={newClientInputClasses('firstName')} 
                                />
                                <ErrorMessage fieldName="firstName" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    value={projectDetails.newClientDetails?.lastName || ''} 
                                    onChange={handleNewClientChange}
                                    onBlur={() => setTouched({ ...touched, lastName: true })}
                                    className={newClientInputClasses('lastName')} 
                                />
                                <ErrorMessage fieldName="lastName" />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500">
                                Email Address <span className="text-red-500">*</span>
                             </label>
                             <input 
                                type="email" 
                                name="email" 
                                value={projectDetails.newClientDetails?.email || ''} 
                                onChange={handleNewClientChange}
                                onBlur={() => setTouched({ ...touched, email: true })}
                                className={newClientInputClasses('email')} 
                             />
                             <ErrorMessage fieldName="email" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Phone Number (Optional)</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={projectDetails.newClientDetails?.phone || ''} 
                                onChange={handleNewClientChange} 
                                className={newClientInputClasses('phone')} 
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="shootDate" className="block text-sm font-medium text-gray-700">
                        Shoot Date <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="date" 
                        id="shootDate" 
                        name="shootDate" 
                        value={projectDetails.shootDate || ''} 
                        onChange={handleChange}
                        onBlur={() => setTouched({ ...touched, shootDate: true })}
                        className={inputClasses('shootDate')} 
                    />
                    <ErrorMessage fieldName="shootDate" />
                </div>
                
                <div>
                    <label htmlFor="packageId" className="block text-sm font-medium text-gray-700">
                        Service Package <span className="text-red-500">*</span>
                    </label>
                    <select 
                        id="packageId" 
                        name="packageId" 
                        value={projectDetails.packageId || ''} 
                        onChange={handleChange}
                        onBlur={() => setTouched({ ...touched, packageId: true })}
                        className={inputClasses('packageId')}
                    >
                        <option value="">No package selected</option>
                        {Object.entries(groupedPackages).map(([category, pkgs]) => (
                           <optgroup label={category} key={category}>
                               {(pkgs as ServicePackage[]).map(pkg => (
                                   <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                               ))}
                           </optgroup>
                        ))}
                    </select>
                    <ErrorMessage fieldName="packageId" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="layout" className="block text-sm font-medium text-gray-700">
                            Layout Preset <span className="text-red-500">*</span>
                        </label>
                        <select 
                            id="layout" 
                            name="layout" 
                            value={projectDetails.layout || ''} 
                            onChange={handleChange}
                            onBlur={() => setTouched({ ...touched, layout: true })}
                            className={inputClasses('layout')}
                        >
                            {layoutTemplates.map(template => (
                               <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                        <ErrorMessage fieldName="layout" />
                    </div>
                    <div>
                        <label htmlFor="watermark" className="block text-sm font-medium text-gray-700">Watermark</label>
                        <input 
                            type="text" 
                            id="watermark" 
                            name="watermark" 
                            value={projectDetails.watermark || ''} 
                            onChange={handleChange} 
                            className={inputClasses('watermark')} 
                            placeholder="Default studio watermark" 
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Project Tags</label>
                    <input type="text" id="tags" name="tags" value={projectDetails.tags || ''} onChange={handleChange} onBlur={() => setTouched({ ...touched, tags: true })} className={inputClasses('tags')} placeholder="Wedding, Portrait, 2024" />
                    <ErrorMessage fieldName="tags" />
                </div>
            </form>
        </div>
    );
};

export default Step1_ProjectSetup;