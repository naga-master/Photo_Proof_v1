import React, { useState } from 'react';
import type { Client } from '../../types';
import { PlusIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from '../icons';
import { Avatar } from '../Avatar';

const PasswordDisplay: React.FC<{ password?: string, onTriggerClick?: (e: React.MouseEvent) => void }> = ({ password = '', onTriggerClick }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    
    if (!password) return <span className="text-gray-400 italic">Not set</span>;
    
    const handleClick = (e: React.MouseEvent) => {
        setIsRevealed(!isRevealed);
        if (onTriggerClick) {
            onTriggerClick(e);
        }
    };
    
    return (
        <div className="flex items-center gap-2">
            <span className="font-mono">{isRevealed ? password : '••••••••'}</span>
            <button
                onClick={handleClick}
                className="text-gray-500 hover:text-gray-800"
                aria-label={isRevealed ? 'Hide password' : 'Show password'}
            >
                {isRevealed ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        </div>
    );
};

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClient: (client: Omit<Client, 'id' | 'projects' | 'lastActivity' | 'username' | 'password'>) => void;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onCreateClient }) => {
    const [clientData, setClientData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        whatsappOptIn: false,
        emailOptIn: true,
        profilePicture: '',
    });

    const [previewUrl, setPreviewUrl] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setClientData(prev => ({ ...prev, profilePicture: result }));
                setPreviewUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePicture = () => {
        setClientData(prev => ({ ...prev, profilePicture: '' }));
        setPreviewUrl('');
    };

    const handleToggle = (name: 'whatsappOptIn' | 'emailOptIn') => {
        setClientData(prev => ({ ...prev, [name]: !prev[name] }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateClient(clientData);
        onClose();
        // Reset form
        setClientData({
            name: '', email: '', phone: '', address: '', whatsappOptIn: false, emailOptIn: true, profilePicture: '',
        });
        setPreviewUrl('');
    };

    if (!isOpen) return null;

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">Create New Client</h2>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (Optional)</label>
                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="relative">
                                        <img src={previewUrl} alt="Profile preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
                                        <button
                                            type="button"
                                            onClick={removeProfilePicture}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <XCircleIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <span className="text-gray-400 text-xs">No photo</span>
                                    </div>
                                )}
                                <label className="cursor-pointer">
                                    <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 inline-block">
                                        Choose File
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" name="name" value={clientData.name} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email" name="email" value={clientData.email} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input type="tel" name="phone" value={clientData.phone} onChange={handleChange} className={inputClasses} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea name="address" value={clientData.address} onChange={handleChange} rows={3} className={inputClasses}></textarea>
                        </div>
                        
                        <div className="pt-2">
                            <h3 className="text-sm font-medium text-gray-800 mb-2">Communication Preferences</h3>
                             <div className="space-y-3">
                                <div onClick={() => handleToggle('emailOptIn')} className="flex items-center justify-between p-3 border rounded-md cursor-pointer">
                                    <span className="font-medium text-gray-700">Email Communication</span>
                                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${clientData.emailOptIn ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${clientData.emailOptIn ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                                <div onClick={() => handleToggle('whatsappOptIn')} className="flex items-center justify-between p-3 border rounded-md cursor-pointer">
                                    <span className="font-medium text-gray-700">WhatsApp Integration</span>
                                     <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${clientData.whatsappOptIn ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${clientData.whatsappOptIn ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">Save Client</button>
                    </div>
                </form>
            </div>
        </div>
    )
}


interface ClientsPageProps {
  clients: Client[];
  onManageClient: (client: Client) => void;
  onCreateClient: (client: Omit<Client, 'id' | 'projects' | 'lastActivity' | 'username' | 'password'>) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, onManageClient, onCreateClient }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  
  return (
    <div className="p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-1 text-gray-600">Manage your client relationships and projects.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
            <PlusIcon className="w-5 h-5" />
            <span>New Client</span>
        </button>
      </header>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credentials</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                  <tr key={client.id} onClick={() => onManageClient(client)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Avatar 
                            name={client.name} 
                            profilePicture={client.profilePicture || client.avatarUrl} 
                            size={40}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                            <span className="font-semibold text-gray-700">User:</span> {client.username}
                        </div>
                         <div className="flex items-center">
                            <span className="font-semibold text-gray-700 mr-1">Pass:</span>
                            <PasswordDisplay password={client.password} onTriggerClick={(e) => e.stopPropagation()} />
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.totalProjects ?? client.projects.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.lastActivity}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <NewClientModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreateClient={onCreateClient} />
    </div>
  );
};

export default ClientsPage;