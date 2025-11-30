import React, { useState, useEffect } from 'react';
import type { Album, Comment, Photo, DashboardView, Notification } from '../../types';
import { PlusIcon, ChatBubbleIcon, ShoppingCartIcon, BellIcon, UploadCloudIcon, DocumentTextIcon, CurrencyDollarIcon } from '../icons';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { ImagePlaceholder } from '../common/ImagePlaceholder';
import ApiNotificationService from '../../services/apiNotificationService';

interface StudioOverviewProps {
  albums: Album[];
  setView: (view: DashboardView) => void;
}

// Activity type to icon mapping
const activityIcons: Record<string, React.ReactNode> = {
    upload: <UploadCloudIcon className="w-5 h-5 text-blue-500" />,
    comment: <ChatBubbleIcon className="w-5 h-5 text-sky-500" />,
    order: <ShoppingCartIcon className="w-5 h-5 text-green-500" />,
    contract: <DocumentTextIcon className="w-5 h-5 text-purple-500" />,
    payment: <CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />,
    system: <BellIcon className="w-5 h-5 text-slate-500" />,
    download: <BellIcon className="w-5 h-5 text-indigo-500" />,
};

const StudioOverview: React.FC<StudioOverviewProps> = ({ albums, setView }) => {
    const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);

    const totalProjects = albums.length;
    const totalImages = albums.reduce((sum, album) => sum + album.photoCount, 0);
    const totalComments = albums.reduce((sum, album) => sum + (album.totalComments || 0), 0);

    // Fetch recent activity from API
    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const { notifications } = await ApiNotificationService.getNotifications();
                setRecentActivity(notifications.slice(0, 8));
            } catch (err) {
                console.error('[StudioOverview] Failed to fetch activity:', err);
            } finally {
                setActivityLoading(false);
            }
        };
        fetchActivity();
    }, []);

    const stats = [
        { label: 'Total Projects', value: totalProjects },
        { label: 'Total Images', value: totalImages.toLocaleString() },
        { label: 'Total Comments', value: totalComments.toLocaleString() },
        { label: 'Active Clients', value: new Set(albums.map(a => a.clientId)).size },
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
                            {activityLoading && (
                                <li className="p-6 text-sm text-slate-500 text-center">
                                    <div className="animate-pulse flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                                        <span>Loading activity...</span>
                                    </div>
                                </li>
                            )}
                            {!activityLoading && recentActivity.length === 0 && (
                                <li className="p-6 text-sm text-slate-500 text-center">No recent activity.</li>
                            )}
                            {!activityLoading && recentActivity.map(activity => (
                                <li key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                                            {activityIcons[activity.category || activity.type] || activityIcons.system}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                {activity.title || activity.text}
                                            </p>
                                            <p className="text-sm text-slate-600 truncate">
                                                {activity.message || activity.context}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">{activity.timestamp}</p>
                                        </div>
                                        {!activity.isRead && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                                        )}
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
                                    {album.coverPhotoId ? (
                                        <AuthenticatedImage
                                            photoId={album.coverPhotoId}
                                            quality="thumbnail"
                                            alt={album.title}
                                            className="w-14 h-14 rounded-md object-cover"
                                            aspectRatio="1/1"
                                            colorVariant="auto"
                                        />
                                    ) : (
                                        <ImagePlaceholder
                                            aspectRatio="1/1"
                                            showShimmer={false}
                                            className="w-14 h-14 rounded-md"
                                        />
                                    )}
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