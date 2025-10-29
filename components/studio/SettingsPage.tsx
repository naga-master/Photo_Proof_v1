import React from 'react';

const SettingsPage: React.FC = () => {
    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Studio Settings</h1>
                <p className="mt-1 text-gray-600">This section will allow you to configure your studio preferences.</p>
            </header>
             <div className="bg-white border border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Settings panel coming soon.</p>
            </div>
        </div>
    );
};

export default SettingsPage;
