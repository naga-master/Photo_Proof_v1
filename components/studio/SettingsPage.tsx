import React, { useState } from 'react';
import type { CommunicationSettings, LayoutId, InvoiceTemplateId, StudioUser, StudioUserRole, StudioUserPermissions } from '../../types';
import { PlusIcon, CheckIcon, XCircleIcon, EyeIcon } from '../icons';

interface SettingsPageProps {
    settings: CommunicationSettings;
    onUpdateSettings: (settings: CommunicationSettings) => void;
    branding: {
        logo: string | null;
        brandColor: string;
        typography: string;
        defaultLayoutId: LayoutId;
        defaultTemplateId: InvoiceTemplateId;
        studioPhoto: string | null;
        studioDescription: string;
        studioDisplayImage: string | null;
    };
    onUpdateBranding: {
        setLogo: (logo: string | null) => void;
        setBrandColor: (color: string) => void;
        setTypography: (font: string) => void;
        setDefaultLayoutId: (layoutId: LayoutId) => void;
        setDefaultTemplateId: (templateId: InvoiceTemplateId) => void;
        setStudioPhoto: (photo: string | null) => void;
        setStudioDescription: (description: string) => void;
        setStudioDisplayImage: (image: string | null) => void;
    };
}

type SettingsTab = 'general' | 'communication' | 'billing' | 'administration';

// Helper function to get default permissions based on role
const getDefaultPermissions = (role: StudioUserRole): StudioUserPermissions => {
    const basePermissions: StudioUserPermissions = {
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewProjects: false,
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canViewClients: false,
        canCreateInvoices: false,
        canEditInvoices: false,
        canDeleteInvoices: false,
        canViewInvoices: false,
        canViewAnalytics: false,
        canUploadPhotos: false,
        canEditPhotos: false,
        canDeletePhotos: false,
        canManageServices: false,
        canManagePackages: false,
        canManageSettings: false,
        canManageUsers: false,
        canManageBranding: false,
        canSendNotifications: false,
        canManageCommunication: false,
    };

    switch (role) {
        case 'admin':
            // Admin has all permissions
            return Object.keys(basePermissions).reduce((acc, key) => {
                acc[key as keyof StudioUserPermissions] = true;
                return acc;
            }, {} as StudioUserPermissions);
        
        case 'manager':
            // Manager has most permissions except user management and critical settings
            return {
                ...basePermissions,
                canCreateProjects: true,
                canEditProjects: true,
                canDeleteProjects: true,
                canViewProjects: true,
                canCreateClients: true,
                canEditClients: true,
                canDeleteClients: false,
                canViewClients: true,
                canCreateInvoices: true,
                canEditInvoices: true,
                canDeleteInvoices: false,
                canViewInvoices: true,
                canViewAnalytics: true,
                canUploadPhotos: true,
                canEditPhotos: true,
                canDeletePhotos: false,
                canManageServices: true,
                canManagePackages: true,
                canManageSettings: false,
                canManageUsers: false,
                canManageBranding: false,
                canSendNotifications: true,
                canManageCommunication: false,
            };
        
        case 'editor':
            // Editor can create and edit, but not delete
            return {
                ...basePermissions,
                canCreateProjects: true,
                canEditProjects: true,
                canViewProjects: true,
                canViewClients: true,
                canEditClients: true,
                canViewInvoices: true,
                canUploadPhotos: true,
                canEditPhotos: true,
                canSendNotifications: true,
            };
        
        case 'viewer':
            // Viewer has read-only access
            return {
                ...basePermissions,
                canViewProjects: true,
                canViewClients: true,
                canViewInvoices: true,
                canViewAnalytics: true,
            };
        
        default:
            return basePermissions;
    }
};

// User Editor Modal Component
interface UserEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: StudioUser) => void;
    existingUser: StudioUser | null;
}

const UserEditorModal: React.FC<UserEditorModalProps> = ({ isOpen, onClose, onSave, existingUser }) => {
    const [user, setUser] = useState<StudioUser>(
        existingUser || {
            id: `user_${Date.now()}`,
            name: '',
            email: '',
            username: '',
            role: 'viewer',
            permissions: getDefaultPermissions('viewer'),
            isActive: true,
            createdAt: new Date().toISOString(),
        }
    );

    // Update state when modal opens with different user
    React.useEffect(() => {
        if (isOpen) {
            if (existingUser) {
                setUser(existingUser);
            } else {
                setUser({
                    id: `user_${Date.now()}`,
                    name: '',
                    email: '',
                    username: '',
                    role: 'viewer',
                    permissions: getDefaultPermissions('viewer'),
                    isActive: true,
                    createdAt: new Date().toISOString(),
                });
            }
        }
    }, [isOpen, existingUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (role: StudioUserRole) => {
        setUser(prev => ({
            ...prev,
            role,
            permissions: getDefaultPermissions(role),
        }));
    };

    const handlePermissionToggle = (permission: keyof StudioUserPermissions) => {
        setUser(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permission]: !prev.permissions[permission],
            },
        }));
    };

    const handleSave = () => {
        onSave(user);
        onClose();
    };

    if (!isOpen) return null;

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm";

    const permissionGroups = {
        'Projects': [
            { key: 'canCreateProjects' as keyof StudioUserPermissions, label: 'Create Projects' },
            { key: 'canEditProjects' as keyof StudioUserPermissions, label: 'Edit Projects' },
            { key: 'canDeleteProjects' as keyof StudioUserPermissions, label: 'Delete Projects' },
            { key: 'canViewProjects' as keyof StudioUserPermissions, label: 'View Projects' },
        ],
        'Clients': [
            { key: 'canCreateClients' as keyof StudioUserPermissions, label: 'Create Clients' },
            { key: 'canEditClients' as keyof StudioUserPermissions, label: 'Edit Clients' },
            { key: 'canDeleteClients' as keyof StudioUserPermissions, label: 'Delete Clients' },
            { key: 'canViewClients' as keyof StudioUserPermissions, label: 'View Clients' },
        ],
        'Financial': [
            { key: 'canCreateInvoices' as keyof StudioUserPermissions, label: 'Create Invoices' },
            { key: 'canEditInvoices' as keyof StudioUserPermissions, label: 'Edit Invoices' },
            { key: 'canDeleteInvoices' as keyof StudioUserPermissions, label: 'Delete Invoices' },
            { key: 'canViewInvoices' as keyof StudioUserPermissions, label: 'View Invoices' },
            { key: 'canViewAnalytics' as keyof StudioUserPermissions, label: 'View Analytics' },
        ],
        'Content': [
            { key: 'canUploadPhotos' as keyof StudioUserPermissions, label: 'Upload Photos' },
            { key: 'canEditPhotos' as keyof StudioUserPermissions, label: 'Edit Photos' },
            { key: 'canDeletePhotos' as keyof StudioUserPermissions, label: 'Delete Photos' },
        ],
        'Services': [
            { key: 'canManageServices' as keyof StudioUserPermissions, label: 'Manage Services' },
            { key: 'canManagePackages' as keyof StudioUserPermissions, label: 'Manage Packages' },
        ],
        'Administration': [
            { key: 'canManageSettings' as keyof StudioUserPermissions, label: 'Manage Settings' },
            { key: 'canManageUsers' as keyof StudioUserPermissions, label: 'Manage Users' },
            { key: 'canManageBranding' as keyof StudioUserPermissions, label: 'Manage Branding' },
            { key: 'canSendNotifications' as keyof StudioUserPermissions, label: 'Send Notifications' },
            { key: 'canManageCommunication' as keyof StudioUserPermissions, label: 'Manage Communication' },
        ],
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {existingUser ? 'Edit Studio User' : 'Add New Studio User'}
                    </h2>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={user.name} 
                                onChange={handleChange} 
                                className={inputClasses} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={user.email} 
                                onChange={handleChange} 
                                className={inputClasses} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input 
                                type="text" 
                                name="username" 
                                value={user.username} 
                                onChange={handleChange} 
                                className={inputClasses} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Avatar URL (Optional)</label>
                            <input 
                                type="text" 
                                name="avatarUrl" 
                                value={user.avatarUrl || ''} 
                                onChange={handleChange} 
                                className={inputClasses} 
                                placeholder="https://..." 
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Role</label>
                        <div className="grid grid-cols-4 gap-3">
                            {(['admin', 'manager', 'editor', 'viewer'] as StudioUserRole[]).map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleRoleChange(role)}
                                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                                        user.role === role
                                            ? 'border-gray-800 bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <div className="font-semibold text-sm">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                        <div className="space-y-4">
                            {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                                <div key={groupName} className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-sm text-gray-900 mb-3">{groupName}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {permissions.map(({ key, label }) => (
                                            <label key={key} className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={user.permissions[key]}
                                                    onChange={() => handlePermissionToggle(key)}
                                                    className="h-4 w-4 text-gray-800 focus-visible:ring-gray-500 focus-visible:ring-2 border-gray-300 rounded outline-none"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSave} 
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
                    >
                        {existingUser ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings, branding, onUpdateBranding }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [localSettings, setLocalSettings] = useState(settings);
    const [localStudioPhoto, setLocalStudioPhoto] = useState(branding.studioPhoto);
    const [localStudioDescription, setLocalStudioDescription] = useState(branding.studioDescription);
    const [localStudioDisplayImage, setLocalStudioDisplayImage] = useState(branding.studioDisplayImage);
    const [localDefaultTemplateId, setLocalDefaultTemplateId] = useState(branding.defaultTemplateId);
    
    // Studio users state - Initialize with sample data
    const [studioUsers, setStudioUsers] = useState<StudioUser[]>([
        {
            id: 'user_1',
            name: 'Admin User',
            email: 'admin@napsterphotolab.com',
            username: 'admin',
            role: 'admin',
            permissions: getDefaultPermissions('admin'),
            avatarUrl: 'https://i.pravatar.cc/150?u=admin',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ]);
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<StudioUser | null>(null);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            email: { ...prev.email, [name]: value }
        }));
    };

    const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            whatsapp: { ...prev.whatsapp, [name]: value }
        }));
    };

    const handleStudioPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setLocalStudioPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleStudioDisplayImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setLocalStudioDisplayImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // User Management Handlers
    const handleCreateUser = () => {
        setEditingUser(null);
        setUserModalOpen(true);
    };

    const handleEditUser = (user: StudioUser) => {
        setEditingUser(user);
        setUserModalOpen(true);
    };

    const handleSaveUser = (user: StudioUser) => {
        const existingIndex = studioUsers.findIndex(u => u.id === user.id);
        if (existingIndex > -1) {
            const newUsers = [...studioUsers];
            newUsers[existingIndex] = user;
            setStudioUsers(newUsers);
        } else {
            setStudioUsers([...studioUsers, user]);
        }
    };

    const handleToggleUserStatus = (userId: string) => {
        setStudioUsers(studioUsers.map(u => 
            u.id === userId ? { ...u, isActive: !u.isActive } : u
        ));
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setStudioUsers(studioUsers.filter(u => u.id !== userId));
        }
    };

    const handleSaveChanges = () => {
        onUpdateSettings(localSettings);
        onUpdateBranding.setStudioPhoto(localStudioPhoto);
        onUpdateBranding.setStudioDescription(localStudioDescription);
        onUpdateBranding.setStudioDisplayImage(localStudioDisplayImage);
        onUpdateBranding.setDefaultTemplateId(localDefaultTemplateId);
        alert('Settings saved successfully!');
    };

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm";
    const tabButtonClasses = (tab: SettingsTab) => `px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`;

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-8">
                        {/* Studio Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Studio Information</h3>
                            <p className="text-sm text-gray-500 mt-1">Manage your studio's public-facing content for the About page.</p>
                            <div className="mt-4 p-6 bg-gray-50 border rounded-lg space-y-6">
                                {/* About Page Photo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">About Page Photo</label>
                                    <p className="text-xs text-gray-500 mb-3">This photo will be displayed on your client-facing About page.</p>
                                    {localStudioPhoto && (
                                        <div className="relative w-48 h-48 mb-3">
                                            <img src={localStudioPhoto} alt="Studio photo" className="w-full h-full object-cover rounded-lg" />
                                            <button
                                                onClick={() => setLocalStudioPhoto(null)}
                                                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleStudioPhotoUpload}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
                                    />
                                </div>

                                {/* About Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">About Description</label>
                                    <p className="text-xs text-gray-500 mb-3">Write a description about your studio for the About page.</p>
                                    <textarea
                                        value={localStudioDescription}
                                        onChange={(e) => setLocalStudioDescription(e.target.value)}
                                        rows={6}
                                        className="mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm"
                                        placeholder="Tell clients about your studio, your experience, your passion for photography..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Studio Branding */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Studio Branding</h3>
                            <p className="text-sm text-gray-500 mt-1">Configure your studio's display image for branding throughout the app.</p>
                            <div className="mt-4 p-6 bg-gray-50 border rounded-lg space-y-4">
                                {/* Studio Display Image */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Studio Display Image</label>
                                    <p className="text-xs text-gray-500 mb-3">This image can be used in place of your logo for branding purposes.</p>
                                    {localStudioDisplayImage && (
                                        <div className="relative w-48 h-32 mb-3">
                                            <img src={localStudioDisplayImage} alt="Studio display" className="w-full h-full object-cover rounded-lg" />
                                            <button
                                                onClick={() => setLocalStudioDisplayImage(null)}
                                                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleStudioDisplayImageUpload}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Invoice Settings */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Invoice Settings</h3>
                            <p className="text-sm text-gray-500 mt-1">Set your default invoice template.</p>
                            <div className="mt-4 p-6 bg-gray-50 border rounded-lg space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Default Invoice Template</label>
                                    <select
                                        value={localDefaultTemplateId}
                                        onChange={(e) => setLocalDefaultTemplateId(e.target.value as InvoiceTemplateId)}
                                        className="mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm"
                                    >
                                        <option value="modern">Modern</option>
                                        <option value="classic">Classic</option>
                                        <option value="minimal">Minimal</option>
                                        <option value="elegant">Elegant</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'communication':
                return (
                    <div className="space-y-8">
                        {/* Email Settings */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Email Settings</h3>
                            <p className="text-sm text-gray-500 mt-1">Configure your outbound email for notifications and invoices.</p>
                            <div className="mt-4 p-6 bg-gray-50 border rounded-lg space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">"From" Name</label>
                                    <input type="text" name="fromName" value={localSettings.email.fromName} onChange={handleEmailChange} className={inputClasses} placeholder="NAPSTER's Photo Lab" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">"From" Email Address</label>
                                    <input type="email" name="fromAddress" value={localSettings.email.fromAddress} onChange={handleEmailChange} className={inputClasses} placeholder="studio@thescobeys.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Provider API Key</label>
                                    <input type="password" name="apiKey" value={localSettings.email.apiKey} onChange={handleEmailChange} className={inputClasses} placeholder="e.g., SendGrid API Key" />
                                </div>
                            </div>
                        </div>
                        {/* WhatsApp Settings */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">WhatsApp Settings</h3>
                            <p className="text-sm text-gray-500 mt-1">Connect your WhatsApp Business account for client messaging.</p>
                             <div className="mt-4 p-6 bg-gray-50 border rounded-lg space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">WhatsApp Business Phone Number ID</label>
                                    <input type="text" name="phoneNumberId" value={localSettings.whatsapp.phoneNumberId} onChange={handleWhatsAppChange} className={inputClasses} placeholder="From your Meta Business dashboard" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">WhatsApp Business Account ID</label>
                                    <input type="text" name="businessAccountId" value={localSettings.whatsapp.businessAccountId} onChange={handleWhatsAppChange} className={inputClasses} placeholder="From your Meta Business dashboard" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">API Access Token</label>
                                    <input type="password" name="accessToken" value={localSettings.whatsapp.accessToken} onChange={handleWhatsAppChange} className={inputClasses} placeholder="A temporary or permanent access token" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'administration':
                return (
                    <div className="space-y-8">
                        {/* Studio Users Management */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Studio Users</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage studio team members and their access permissions.</p>
                                </div>
                                <button 
                                    onClick={handleCreateUser}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add User
                                </button>
                            </div>

                            {/* Users Table */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Permissions</th>
                                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {studioUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                                            user.role === 'editor' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleToggleUserStatus(user.id)}
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}
                                                        >
                                                            {user.isActive ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.permissions.canManageUsers && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                    Users
                                                                </span>
                                                            )}
                                                            {user.permissions.canManageSettings && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Settings
                                                                </span>
                                                            )}
                                                            {user.permissions.canDeleteProjects && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                    Delete
                                                                </span>
                                                            )}
                                                            {user.permissions.canViewAnalytics && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                    Analytics
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button 
                                                            onClick={() => handleEditUser(user)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            Edit
                                                        </button>
                                                        {user.role !== 'admin' && (
                                                            <button 
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Role Descriptions */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <h4 className="text-sm font-semibold text-purple-900 mb-2">Admin</h4>
                                    <p className="text-xs text-purple-700">Full access to all features including user management, settings, and critical operations.</p>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Manager</h4>
                                    <p className="text-xs text-blue-700">Can manage projects, clients, invoices, and services. Cannot manage users or critical settings.</p>
                                </div>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="text-sm font-semibold text-green-900 mb-2">Editor</h4>
                                    <p className="text-xs text-green-700">Can create and edit projects, upload photos, and manage day-to-day operations.</p>
                                </div>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Viewer</h4>
                                    <p className="text-xs text-gray-700">Read-only access to projects, clients, invoices, and analytics.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="bg-white border border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                        <p className="text-gray-500">Billing settings coming soon.</p>
                    </div>
                );
        }
    }

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Studio Settings</h1>
                    <p className="mt-1 text-gray-600">Configure your studio preferences and integrations.</p>
                </div>
                <button onClick={handleSaveChanges} className="px-5 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">
                    Save Changes
                </button>
            </header>

            <div className="flex gap-4 border-b mb-8">
                <button className={tabButtonClasses('general')} onClick={() => setActiveTab('general')}>General</button>
                <button className={tabButtonClasses('communication')} onClick={() => setActiveTab('communication')}>Communication</button>
                <button className={tabButtonClasses('administration')} onClick={() => setActiveTab('administration')}>Administration</button>
                <button className={tabButtonClasses('billing')} onClick={() => setActiveTab('billing')}>Billing</button>
            </div>
            
            <div className={activeTab === 'administration' ? 'max-w-full' : 'max-w-3xl'}>
                {renderContent()}
            </div>
            
            {/* User Edit Modal */}
            <UserEditorModal 
                isOpen={isUserModalOpen}
                onClose={() => setUserModalOpen(false)}
                onSave={handleSaveUser}
                existingUser={editingUser}
            />
        </div>
    );
};

export default SettingsPage;