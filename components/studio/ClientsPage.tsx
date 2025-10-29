import React from 'react';

const ClientsPage: React.FC = () => {
    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
                <p className="mt-1 text-gray-600">This section will contain tools to manage your clients.</p>
            </header>
             <div className="bg-white border border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Client management interface coming soon.</p>
            </div>
        </div>
    );
};

export default ClientsPage;
