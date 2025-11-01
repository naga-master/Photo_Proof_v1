import React, { useState } from 'react';
import type { CommunicationSettings } from '../../types';

interface SettingsPageProps {
    settings: CommunicationSettings;
    onUpdateSettings: (settings: CommunicationSettings) => void;
}

type SettingsTab = 'general' | 'communication' | 'billing';

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('communication');
    const [localSettings, setLocalSettings] = useState(settings);

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

    const handleSaveChanges = () => {
        onUpdateSettings(localSettings);
        alert('Settings saved successfully!');
    };

    const inputClasses = "mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-colors sm:text-sm";
    const tabButtonClasses = (tab: SettingsTab) => `px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`;

    const renderContent = () => {
        switch (activeTab) {
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
            case 'general':
            case 'billing':
                return (
                    <div className="bg-white border border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                        <p className="text-gray-500">{`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings coming soon.`}</p>
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