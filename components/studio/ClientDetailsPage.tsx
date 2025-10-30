import React, { useState } from 'react';
import type { Album, Client, ServicePackage } from '../../types';
import { ArrowLeftIcon, PlusIcon, EyeIcon, EyeSlashIcon } from '../icons';

const PasswordDisplay: React.FC<{ password?: string }> = ({ password = '' }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    
    if (!password) return <span className="text-gray-400 italic">Not set</span>;
    
    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-gray-800">{isRevealed ? password : '••••••••'}</span>
            <button
                onClick={() => setIsRevealed(!isRevealed)}
                className="text-gray-500 hover:text-gray-800"
                aria-label={isRevealed ? 'Hide password' : 'Show password'}
            >
                {isRevealed ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>
    );
};

const PaymentStatusBadge: React.FC<{ status: Album['paymentStatus'] }> = ({ status }) => {
    const statusStyles: Record<Album['paymentStatus'], string> = {
        Paid: 'bg-green-100 text-green-800',
        Unpaid: 'bg-yellow-100 text-yellow-800',
        Due: 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};


interface ClientDetailsPageProps {
  client: Client;
  albums: Album[];
  packages: ServicePackage[];
  onBack: () => void;
  onManageProject: (album: Album) => void;
  onNewProjectForClient: (clientId: number) => void;
  onUpdateProject: (album: Album) => void;
  showToast: (message: string) => void;
}

const ClientDetailsPage: React.FC<ClientDetailsPageProps> = ({ client, albums, packages, onBack, onManageProject, onNewProjectForClient, onUpdateProject, showToast }) => {
    const clientProjects = albums.filter(album => client.projects.includes(album.id));

    const handleStatusChange = (album: Album, newStatus: Album['paymentStatus']) => {
        onUpdateProject({ ...album, paymentStatus: newStatus });
    };
    
    const handleGenerateInvoice = (album: Album) => {
        showToast(`Invoice generated for ${album.title}`);
    }

    const formatCurrency = (amount?: number) => {
        if (typeof amount !== 'number') return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex items-start justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0 mt-1">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex items-center gap-4">
                        <img src={client.avatarUrl} alt={client.name} className="w-16 h-16 rounded-full"/>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                            <p className="mt-1 text-gray-600">{client.email}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Client Projects ({clientProjects.length})</h2>
                        <button onClick={() => onNewProjectForClient(client.id)} className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
                            <PlusIcon className="w-4 h-4"/>
                            <span>New Project</span>
                        </button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {clientProjects.length > 0 ? (
                             <div className="divide-y divide-gray-200">
                                {clientProjects.map(album => (
                                    <div key={album.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <img src={album.coverPhotoSrc} alt={album.title} className="w-16 h-12 rounded-md object-cover"/>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-gray-800">{album.title}</p>
                                                <p className="text-xs text-gray-500">{album.photoCount} photos</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-800">{formatCurrency(album.price)}</p>
                                                <PaymentStatusBadge status={album.paymentStatus} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <select value={album.paymentStatus} onChange={(e) => handleStatusChange(album, e.target.value as Album['paymentStatus'])} className="text-xs bg-white border-gray-200 rounded-md shadow-sm">
                                                    <option value="Unpaid">Unpaid</option>
                                                    <option value="Due">Due</option>
                                                    <option value="Paid">Paid</option>
                                                </select>
                                                <button onClick={() => handleGenerateInvoice(album)} className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold">Invoice</button>
                                                <button onClick={() => onManageProject(album)} className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold">Manage</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-gray-500">This client doesn't have any projects yet.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Details</h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase">Login Credentials</h3>
                            <p className="text-gray-800"><span className="font-semibold">Username:</span> {client.username}</p>
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-800 mr-1">Password:</span>
                                <PasswordDisplay password={client.password} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase">Contact Info</h3>
                            <p className="text-gray-800">{client.phone || 'Not provided'}</p>
                            <p className="text-gray-800">{client.address || 'Not provided'}</p>
                        </div>
                         <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase">Preferences</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${client.emailOptIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>Email</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${client.whatsappOptIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>WhatsApp</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailsPage;