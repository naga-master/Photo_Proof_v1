import React from 'react';

const AnalyticsPage: React.FC = () => {
    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
                <p className="mt-1 text-gray-600">This section will show business intelligence and performance insights.</p>
            </header>
            <div className="bg-white border border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Analytics dashboard coming soon.</p>
            </div>
        </div>
    );
};

export default AnalyticsPage;
