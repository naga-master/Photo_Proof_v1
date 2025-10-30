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
        <div className="p-8 animate-fade-in space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Studio Dashboard</h1>
                    <p className="mt-1 text-slate-600">Welcome back, here's a summary of your studio.</p>
                </div>
                <div>
                    <button onClick={() => setView('upload')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-colors">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Create Project</span>
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 transition-shadow hover:shadow-lg hover:border-slate-300">
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-4xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
                    <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <ul className="divide-y divide-slate-200">
                        {recentComments.length === 0 && <li className="p-6 text-sm text-slate-500 text-center">No recent comments from clients.</li>}
                        {recentComments.map(comment => (
                                <li key={comment.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <img src={comment.photo.src} alt={comment.photo.alt} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-800">
                                                <span className={`font-semibold ${comment.author === 'Client' ? 'text-sky-600' : 'text-purple-600'}`}>{comment.author}</span> commented on a photo in <span className="font-semibold">{comment.album.title}</span>
                                            </p>
                                            <blockquote className="mt-1 text-sm text-slate-600 border-l-2 border-slate-300 pl-3 italic">
                                                "{comment.text}"
                                            </blockquote>
                                            <p className="mt-2 text-xs text-slate-400">{comment.timestamp}</p>
                                        </div>
                                    </div>
                                </li>
                        ))}
                        </ul>
                    </div>
                </div>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {quickActions.map(qa => (
                                <button key={qa.label} onClick={qa.action} className="p-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-center">
                                    {qa.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Projects Snapshot</h2>
                        <div className="mt-4 space-y-3">
                            {albums.slice(0, 3).map(album => (
                                <div key={album.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { /* Navigate to project */}}>
                                    <img src={album.coverPhotoSrc} alt={album.title} className="w-14 h-14 rounded-md object-cover"/>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-slate-800">{album.title}</p>
                                        <p className="text-xs text-slate-500">{album.photoCount} photos</p>
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