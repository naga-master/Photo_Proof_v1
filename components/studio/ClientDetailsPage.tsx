import React, { useState, useEffect, useMemo } from 'react';
import type { Client, Album, Invoice, ServicePackage } from '../../types';
import { ArrowLeftIcon, PlusIcon } from '../icons';
import { AvatarLarge } from '../Avatar';

interface ClientDetailsPageProps {
    client: Client;
    albums: Album[];
    invoices: Invoice[];
    packages: ServicePackage[];
    onBack: () => void;
    onUpdateClient: (client: Client) => void;
    onCreateProject: (clientId: number) => void;
    onCreateInvoice: (client: Client, project: Album) => void;
    onPreviewInvoice: (invoice: Invoice) => void;
    onViewProject: (project: Album) => void;
}

const ClientDetailsPage: React.FC<ClientDetailsPageProps> = ({ client, albums, invoices, packages, onBack, onUpdateClient, onCreateProject, onCreateInvoice, onPreviewInvoice, onViewProject }) => {
    const [details, setDetails] = useState(client);
    const [isEditingProfilePic, setIsEditingProfilePic] = useState(false);
    const [profilePicPreview, setProfilePicPreview] = useState<string>(client.profilePicture || client.avatarUrl || '');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    useEffect(() => {
        setDetails(client);
        setProfilePicPreview(client.profilePicture || client.avatarUrl || '');
    }, [client]);

    const clientProjects = useMemo(() => albums.filter(a => a.clientId === client.id), [albums, client.id]);
    const clientInvoices = useMemo(() => invoices.filter(i => i.clientId === client.id), [invoices, client.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingPhoto(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const result = reader.result as string;
                    const updatedDetails = { ...details, profilePicture: result };
                    setDetails(updatedDetails);
                    setProfilePicPreview(result);
                    setIsEditingProfilePic(false);
                    
                    // Auto-save the profile picture immediately
                    await onUpdateClient(updatedDetails);
                } finally {
                    setIsUploadingPhoto(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePicture = async () => {
        setIsUploadingPhoto(true);
        try {
            const updatedDetails = { ...details, profilePicture: '' };
            setDetails(updatedDetails);
            setProfilePicPreview(client.avatarUrl || '');
            setIsEditingProfilePic(false);
            
            // Auto-save the removal immediately
            await onUpdateClient(updatedDetails);
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSaveChanges = () => {
        onUpdateClient(details);
        // Toast notification is now shown in StudioLayout handleUpdateClient
    };

    const getProjectPackageName = (packageId?: string) => {
        if (!packageId) return 'N/A';
        return packages.find(p => p.id === packageId)?.name || 'Unknown Package';
    };

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm";

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </button>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                        <p className="mt-1 text-gray-600">Managing client profile and associated projects.</p>
                    </div>
                    <button onClick={handleSaveChanges} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover">
                        Save Changes
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 border border-gray-200 rounded-lg">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative group mb-4">
                                <AvatarLarge 
                                    name={details.name}
                                    profilePicture={profilePicPreview}
                                />
                                {isUploadingPhoto && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-full">
                                        <div className="text-white text-xs font-medium">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-1"></div>
                                            <span>Uploading...</span>
                                        </div>
                                    </div>
                                )}
                                {!isUploadingPhoto && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <label className="cursor-pointer text-white text-xs font-medium">
                                            <span>Change Photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProfilePicChange}
                                                className="hidden"
                                                disabled={isUploadingPhoto}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                            {details.profilePicture && !isUploadingPhoto && (
                                <button 
                                    onClick={removeProfilePicture}
                                    className="text-xs text-red-600 hover:text-red-800 mb-2"
                                    disabled={isUploadingPhoto}
                                >
                                    Remove custom photo
                                </button>
                            )}
                            <h2 className="text-xl font-semibold">{details.name}</h2>
                            <p className="text-sm text-gray-500">{details.email}</p>
                        </div>
                    </div>
                     <div className="bg-white p-6 border border-gray-200 rounded-lg">
                         <h3 className="font-semibold text-gray-800 mb-4">Contact Information</h3>
                         <form className="space-y-4 text-sm">
                             <div>
                                 <label className="font-medium text-gray-600">Full Name</label>
                                 <input type="text" name="name" value={details.name} onChange={handleChange} className={inputClasses} />
                             </div>
                             <div>
                                 <label className="font-medium text-gray-600">Email</label>
                                 <input type="email" name="email" value={details.email} onChange={handleChange} className={inputClasses} />
                             </div>
                             <div>
                                 <label className="font-medium text-gray-600">Phone</label>
                                 <input type="tel" name="phone" value={details.phone || ''} onChange={handleChange} className={inputClasses} />
                             </div>
                             <div>
                                 <label className="font-medium text-gray-600">Address</label>
                                 <textarea name="address" value={details.address || ''} onChange={handleChange} rows={3} className={inputClasses}></textarea>
                             </div>
                         </form>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Projects</h3>
                            <button onClick={() => onCreateProject(client.id)} className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                <PlusIcon className="w-4 h-4" /> New Project
                            </button>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {clientProjects.map(proj => (
                                <li 
                                    key={proj.id} 
                                    className="py-3 flex justify-between items-center hover:bg-gray-50 -mx-6 px-6 cursor-pointer transition-colors"
                                    onClick={() => onViewProject(proj)}
                                >
                                    <div>
                                        <p className="font-semibold">{proj.title}</p>
                                        <p className="text-xs text-gray-500">{getProjectPackageName(proj.packageId)}</p>
                                    </div>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${proj.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{proj.paymentStatus}</span>
                                </li>
                            ))}
                            {clientProjects.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No projects yet.</p>}
                        </ul>
                    </div>
                     <div className="bg-white p-6 border border-gray-200 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Invoices</h3>
                        <ul className="divide-y divide-gray-200">
                            {clientInvoices.map(inv => (
                                <li key={inv.id} className="py-3 flex justify-between items-center hover:bg-gray-50 -mx-6 px-6 cursor-pointer" onClick={() => onPreviewInvoice(inv)}>
                                    <div>
                                        <p className="font-semibold">{inv.invoiceNumber}</p>
                                        <p className="text-xs text-gray-500">Due: {inv.dueDate}</p>
                                    </div>
                                    <p className="font-mono font-semibold">${inv.total.toFixed(2)}</p>
                                </li>
                            ))}
                             {clientInvoices.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No invoices yet.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailsPage;