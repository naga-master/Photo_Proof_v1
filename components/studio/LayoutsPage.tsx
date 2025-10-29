import React from 'react';

const LayoutsPage: React.FC = () => {
    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Layouts & Branding</h1>
                <p className="mt-1 text-gray-600">Manage your gallery templates and brand tokens.</p>
            </header>
             <div className="bg-white border border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Layout preset editor coming soon.</p>
            </div>
        </div>
    );
};

export default LayoutsPage;
