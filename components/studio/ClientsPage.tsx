import React, { useState } from 'react';
import type { Client } from '../../types';
import { PlusIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from '../icons';
import { Avatar } from '../Avatar';
import { clientService } from '../../services/clientService';
import { DuplicateDetectionModal } from '../../src/components/DuplicateDetectionModal';
import type { DuplicateInfo } from '../../src/services/photoService';

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
    const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
    const [pendingClientData, setPendingClientData] = useState<any>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // Try to create client
            const client = await clientService.createClient({
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                address: clientData.address,
                whatsapp_opt_in: clientData.whatsappOptIn,
                email_opt_in: clientData.emailOptIn
            });
            
            // Success - call parent callback
            onCreateClient(client as any);
            onClose();
            
            // Reset form
            setClientData({
                name: '', email: '', phone: '', address: '', whatsappOptIn: false, emailOptIn: true, profilePicture: '',
            });
            setPreviewUrl('');
        } catch (error: any) {
            // Check if it's a phone duplicate (409)
            if (error.response?.status === 409 && error.response?.data?.type === 'client_phone') {
                setDuplicateInfo(error.response.data);
                setPendingClientData(clientData);
                return;
            }
            
            // Show other errors
            alert('Failed to create client: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDuplicateAction = (action: string) => {
        if (action === 'use_existing') {
            // Use the existing client
            if (duplicateInfo?.existing_client) {
                onCreateClient(duplicateInfo.existing_client as any);
                onClose();
                setDuplicateInfo(null);
                setPendingClientData(null);
            }
        } else if (action === 'create_anyway') {
            // Force create with force=true parameter
            if (pendingClientData) {
                createClientWithForce(pendingClientData);
            }
        }
    };

    const createClientWithForce = async (data: any) => {
        try {
            // Call API with force=true
            const client = await clientService.createClient({
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                whatsapp_opt_in: data.whatsappOptIn,
                email_opt_in: data.emailOptIn
            }, true);
            
            onCreateClient(client as any);
            onClose();
            
            // Reset
            setDuplicateInfo(null);
            setPendingClientData(null);
            setClientData({
                name: '', email: '', phone: '', address: '', whatsappOptIn: false, emailOptIn: true, profilePicture: '',
            });
            setPreviewUrl('');
        } catch (error: any) {
            alert('Failed to create client: ' + (error.message || 'Unknown error'));
        }
    };

    if (!isOpen) return null;

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-lg m-0 sm:m-4 max-h-[85vh] sm:max-h-[75vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-b">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Create New Client</h2>
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 min-h-[44px] min-w-[44px] -mr-2"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input type="text" name="name" value={clientData.name} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] focus:ring-2 focus:ring-gray-500 focus:border-transparent" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input type="email" name="email" value={clientData.email} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] focus:ring-2 focus:ring-gray-500 focus:border-transparent" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input type="tel" name="phone" value={clientData.phone} onChange={handleChange} className="w-full px-3 sm:px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg min-h-[44px] focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <textarea name="address" value={clientData.address} onChange={handleChange} rows={3} className="w-full px-3 sm:px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"></textarea>
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
                    <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t bg-gray-50">
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 min-h-[44px]">Cancel</button>
                            <button type="submit" className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 min-h-[44px]">Save Client</button>
                        </div>
                    </div>
                </form>
            </div>
            {duplicateInfo && (
                <DuplicateDetectionModal
                    duplicateInfo={duplicateInfo}
                    onAction={handleDuplicateAction}
                    onClose={() => {
                        setDuplicateInfo(null);
                        setPendingClientData(null);
                    }}
                />
            )}
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
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Manage your client relationships and projects.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors min-h-[44px]">
            <PlusIcon className="w-5 h-5" />
            <span>New Client</span>
        </button>
      </header>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
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

      {/* Mobile Card View */}
      <div className="md:hidden bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {clients.map((client) => (
          <div key={client.id} onClick={() => onManageClient(client)} className="p-4 active:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <Avatar 
                name={client.name} 
                profilePicture={client.profilePicture || client.avatarUrl} 
                size={48}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate mb-1">{client.name}</h3>
                <p className="text-sm text-gray-600 truncate">{client.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Username:</span>
                <span className="text-gray-900 font-medium">{client.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Password:</span>
                <PasswordDisplay password={client.password} onTriggerClick={(e) => e.stopPropagation()} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Projects:</span>
                <span className="text-gray-900 font-medium">{client.totalProjects ?? client.projects.length}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>{client.lastActivity}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onManageClient(client);
                }}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <NewClientModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreateClient={onCreateClient} />
    </div>
  );
};

export default ClientsPage;