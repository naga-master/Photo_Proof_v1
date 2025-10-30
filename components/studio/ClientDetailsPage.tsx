import React, { useState } from 'react';
import type { Client, Album, Invoice } from '../../types';
import { ArrowLeftIcon, PlusIcon, EnvelopeIcon, PhoneIcon } from '../icons';

interface ClientDetailsPageProps {
    client: Client;
    albums: Album[];
    invoices: Invoice[];
    onBack: () => void;
    onUpdateClient: (client: Client) => void;
    onDeleteClient: (clientId: number) => void;
    onCreateInvoice: (client: Client, project: Album) => void;
    onViewProject: (album: Album) => void;
    onViewInvoice: (invoice: Invoice) => void;
}

const ClientDetailsPage: React.FC<ClientDetailsPageProps> = (props) => {
    const { client, albums, invoices, onBack, onUpdateClient, onDeleteClient, onCreateInvoice, onViewProject, onViewInvoice } = props;
    
    const [details, setDetails] = useState(client);
    const clientProjects = albums.filter(a => a.clientId === client.id);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onUpdateClient(details);
        // Maybe show a toast here
    };

    const getPaymentStatusColor = (status?: 'Paid' | 'Unpaid' | 'Due') => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Unpaid': return 'bg-red-100 text-red-800';
            case 'Due': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const formatCurrency = (amount?: number) => {
        if (amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex items-center gap-4">
                         <img src={details.avatarUrl} alt={details.name} className="w-16 h-16 rounded-full" />
                         <div>
                            <h1 className="text-3xl font-bold text-gray-900">{details.name}</h1>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5"><EnvelopeIcon className="w-4 h-4" /> {details.email}</span>
                                {details.phone && <span className="flex items-center gap-1.5"><PhoneIcon className="w-4 h-4" /> {details.phone}</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                     <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">Save Changes</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 border rounded-lg">
                        <h3 className="font-semibold mb-4 text-gray-800">Client Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Full Name</label>
                                <input type="text" name="name" value={details.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900" />
                            </div>
                             <div>
                                <label className="text-xs font-medium text-gray-500">Email Address</label>
                                <input type="email" name="email" value={details.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900" />
                            </div>
                             <div>
                                <label className="text-xs font-medium text-gray-500">Phone</label>
                                <input type="tel" name="phone" value={details.phone || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900" />
                            </div>
                             <div>
                                <label className="text-xs font-medium text-gray-500">Address</label>
                                <textarea name="address" value={details.address || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-gray-900" />
                            </div>
                        </div>
                    </div>
                     <div className="bg-white p-6 border rounded-lg">
                         <button onClick={() => onDeleteClient(client.id)} className="w-full text-center text-sm text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md">
                            Delete Client
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-semibold text-gray-800">Projects ({clientProjects.length})</h3>
                          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">
                            <PlusIcon className="w-4 h-4" /> Start New Project
                        </button>
                    </div>
                    <div className="space-y-4">
                        {clientProjects.map(p => {
                            const projectInvoices = invoices.filter(inv => inv.projectId === p.id);
                            return (
                                <div key={p.id} className="bg-white border rounded-lg overflow-hidden">
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <img src={p.coverPhotoSrc} alt={p.title} className="w-20 h-20 rounded-md object-cover" />
                                            <div>
                                                <p className="font-semibold text-gray-800">{p.title}</p>
                                                <p className="text-sm text-gray-500">{p.photoCount} photos</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(p.paymentStatus)}`}>
                                                        {p.paymentStatus || 'No Status'}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(p.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onViewProject(p)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Manage</button>
                                        </div>
                                    </div>
                                    {(projectInvoices.length > 0) && (
                                        <div className="bg-gray-50 border-t px-4 py-3">
                                            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Invoices</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {projectInvoices.map(inv => (
                                                    <button key={inv.id} onClick={() => onViewInvoice(inv)} className="text-sm font-mono text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-md">{inv.invoiceNumber}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                     <div className="bg-gray-50/50 border-t px-4 py-2">
                                         <button onClick={() => onCreateInvoice(client, p)} className="text-sm font-medium text-gray-600 hover:text-gray-900">+ Generate Invoice</button>
                                     </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailsPage;