import React, { useState } from 'react';
import type { CommunicationSettings, LayoutId, InvoiceTemplateId } from '../../types';

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

type SettingsTab = 'general' | 'communication' | 'billing';

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings, branding, onUpdateBranding }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [localSettings, setLocalSettings] = useState(settings);
    const [localStudioPhoto, setLocalStudioPhoto] = useState(branding.studioPhoto);
    const [localStudioDescription, setLocalStudioDescription] = useState(branding.studioDescription);
    const [localStudioDisplayImage, setLocalStudioDisplayImage] = useState(branding.studioDisplayImage);
    const [localDefaultTemplateId, setLocalDefaultTemplateId] = useState(branding.defaultTemplateId);

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
                <button className={tabButtonClasses('billing')} onClick={() => setActiveTab('billing')}>Billing</button>
            </div>
            
            <div className="max-w-3xl">
                {renderContent()}
            </div>
        </div>
    );
};

export default SettingsPage;