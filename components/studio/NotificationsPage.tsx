import React from 'react';

const NotificationsPage: React.FC = () => {
    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-1 text-gray-600">Review recent activity from clients and your team.</p>
            </header>
             <div className="bg-white border border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Notification center coming soon.</p>
            </div>
        </div>
    );
};

export default NotificationsPage;
