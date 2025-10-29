import React from 'react';
import type { Album, Comment, Photo, DashboardView } from '../../types';
import { PlusIcon } from '../icons';

interface StudioOverviewProps {
  albums: Album[];
  setView: (view: DashboardView) => void;
}

const StudioOverview: React.FC<StudioOverviewProps> = ({ albums, setView }) => {
    const totalProjects = albums.length;
    const totalImages = albums.reduce((sum, album) => sum + album.photoCount, 0);
    const allComments: (Comment & { photo: Photo, album: Album })[] = albums.flatMap(album =>
        album.photos.flatMap(photo =>
            (photo.comments || []).map(comment => ({ ...comment, photo, album }))
        )
    );
    const totalComments = allComments.length;
    const recentComments = allComments.slice(-5).reverse();

    const stats = [
        { label: 'Total Projects', value: totalProjects },
        { label: 'Total Images', value: totalImages.toLocaleString() },
        { label: 'Pending Selections', value: '1,204' },
        { label: 'Unpaid Invoices', value: '3' },
    ];

    const quickActions = [
        { label: 'New Project', action: () => setView('upload') },
        { label: 'Create Invoice', action: () => setView('invoices') },
        { label: 'Invite Client', action: () => setView('clients') },
        { label: 'New Layout', action: () => setView('layouts') },
    ]

    return (
        <div className="p-8 animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Studio Dashboard</h1>
                    <p className="mt-1 text-gray-600">Welcome back, here's a summary of your studio.</p>
                </div>
                <div>
                    <button onClick={() => setView('upload')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Create Project</span>
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                    <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                        {recentComments.length === 0 && <li className="p-4 text-sm text-gray-500">No recent comments from clients.</li>}
                        {recentComments.map(comment => (
                                <li key={comment.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                        <img src={comment.photo.src} alt={comment.photo.alt} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800">
                                                <span className={`font-semibold ${comment.author === 'Client' ? 'text-blue-600' : 'text-purple-600'}`}>{comment.author}</span> commented on a photo in <span className="font-semibold">{comment.album.title}</span>
                                            </p>
                                            <blockquote className="mt-1 text-sm text-gray-600 border-l-2 border-gray-300 pl-2 italic">
                                                "{comment.text}"
                                            </blockquote>
                                            <p className="mt-1 text-xs text-gray-400">{comment.timestamp}</p>
                                        </div>
                                    </div>
                                </li>
                        ))}
                        </ul>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                     <div className="mt-4 grid grid-cols-2 gap-4">
                        {quickActions.map(qa => (
                            <button key={qa.label} onClick={qa.action} className="p-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-center">
                                {qa.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-900">Projects Snapshot</h2>
                        <div className="mt-4 space-y-3">
                            {albums.slice(0, 3).map(album => (
                                <div key={album.id} className="p-3 bg-white border border-gray-200 rounded-lg flex items-center gap-4">
                                    <img src={album.coverPhotoSrc} alt={album.title} className="w-12 h-12 rounded-md object-cover"/>
                                    <div>
                                        <p className="font-semibold text-sm">{album.title}</p>
                                        <p className="text-xs text-gray-500">{album.photoCount} photos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudioOverview;
