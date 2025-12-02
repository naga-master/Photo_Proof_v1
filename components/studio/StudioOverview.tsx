import React, { useState, useEffect } from 'react';
import type { Album, Comment, Photo, DashboardView, Notification } from '../../types';
import { PlusIcon, ChatBubbleIcon, ShoppingCartIcon, BellIcon, UploadCloudIcon, DocumentTextIcon, CurrencyDollarIcon } from '../icons';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { ImagePlaceholder } from '../common/ImagePlaceholder';
import { useNotifications } from '../../contexts/NotificationContext';
import { studioService, DashboardMetrics } from '../../services/studioService';
import { useAccessControl } from '../../contexts/AccessControlContext';

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
    const { hasPermission } = useAccessControl();
    const { notifications, isLoading: activityLoading } = useNotifications();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [metricsLoading, setMetricsLoading] = useState(true);

    // Get recent activity from notification context (limited to 8 items)
    const recentActivity = notifications.slice(0, 8);

    // Fetch dashboard metrics from API (accurate counts)
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await studioService.getDashboardMetrics();
                setMetrics(data);
            } catch (err) {
                console.error('[StudioOverview] Failed to fetch metrics:', err);
                // Fallback to calculated values from albums prop
                setMetrics({
                    total_projects: albums.length,
                    total_photos: albums.reduce((sum, album) => sum + album.photoCount, 0),
                    total_comments: albums.reduce((sum, album) => sum + (album.totalComments || 0), 0),
                    active_clients: new Set(albums.map(a => a.clientId)).size,
                    projects_delta: 0,
                    photos_delta: 0,
                    comments_delta: 0,
                    clients_delta: 0
                });
            } finally {
                setMetricsLoading(false);
            }
        };
        fetchMetrics();
    }, [albums]);

    // Use dynamic metrics or fallback to calculated values
    const totalProjects = metrics?.total_projects ?? albums.length;
    const totalImages = metrics?.total_photos ?? albums.reduce((sum, album) => sum + album.photoCount, 0);
    const totalComments = metrics?.total_comments ?? albums.reduce((sum, album) => sum + (album.totalComments || 0), 0);
    const activeClients = metrics?.active_clients ?? new Set(albums.map(a => a.clientId)).size;

    // Format delta for display
    const formatDelta = (delta: number | undefined): string => {
        if (delta === undefined) return '—';
        return delta >= 0 ? `+${delta}` : `${delta}`;
    };

    // Stats with loading state and dynamic deltas
    const stats = [
        { 
            label: 'Total Projects', 
            value: metricsLoading ? '...' : totalProjects, 
            delta: formatDelta(metrics?.projects_delta), 
            deltaType: (metrics?.projects_delta ?? 0) >= 0 ? 'positive' as const : 'negative' as const, 
            context: 'vs last month' 
        },
        { 
            label: 'Total Images', 
            value: metricsLoading ? '...' : totalImages.toLocaleString(), 
            delta: formatDelta(metrics?.photos_delta), 
            deltaType: (metrics?.photos_delta ?? 0) >= 0 ? 'positive' as const : 'negative' as const, 
            context: 'vs last month' 
        },
        { 
            label: 'Total Comments', 
            value: metricsLoading ? '...' : totalComments.toLocaleString(), 
            delta: formatDelta(metrics?.comments_delta), 
            deltaType: (metrics?.comments_delta ?? 0) >= 0 ? 'positive' as const : 'negative' as const, 
            context: 'vs last month' 
        },
        { 
            label: 'Active Clients', 
            value: metricsLoading ? '...' : activeClients, 
            delta: formatDelta(metrics?.clients_delta), 
            deltaType: (metrics?.clients_delta ?? 0) >= 0 ? 'positive' as const : 'negative' as const, 
            context: 'vs last month' 
        },
    ];

    const quickActions = [
        hasPermission('canCreateProjects') && { label: 'New Project', action: () => setView('upload') },
        hasPermission('canCreateInvoices') && { label: 'Create Invoice', action: () => setView('invoices') },
        hasPermission('canCreateClients') && { label: 'Invite Client', action: () => setView('clients') },
        { label: 'New Layout', action: () => setView('layouts') },
    ].filter(Boolean) as { label: string; action: () => void }[]

    return (
        <div className="p-6 lg:p-8 animate-fade-in space-y-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">Studio Dashboard</h1>
                    <p className="mt-1 text-gray-500 text-sm">Welcome back, here's a summary of your studio.</p>
                </div>
                {hasPermission('canCreateProjects') && (
                    <div>
                        <button onClick={() => setView('upload')} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-primary-hover hover:shadow-md transition-all duration-fast">
                            <PlusIcon className="w-5 h-5"/>
                            <span>Create Project</span>
                        </button>
                    </div>
                )}
            </header>
            
            {/* Stats Grid - Brisk Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5">
                        <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                stat.deltaType === 'positive' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-red-50 text-red-700'
                            }`}>
                                {stat.delta}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{stat.context}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {activityLoading && (
                                <li className="p-6 text-sm text-gray-500 text-center">
                                    <div className="animate-pulse flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                                        <span>Loading activity...</span>
                                    </div>
                                </li>
                            )}
                            {!activityLoading && recentActivity.length === 0 && (
                                <li className="p-6 text-sm text-gray-500 text-center">No recent activity.</li>
                            )}
                            {!activityLoading && recentActivity.map(activity => (
                                <li key={activity.id} className="p-4 hover:bg-gray-50 transition-colors duration-fast cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                                            {activityIcons[activity.category || activity.type] || activityIcons.system}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {activity.title || activity.text}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {activity.message || activity.context}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">{activity.timestamp}</p>
                                        </div>
                                        {!activity.isRead && (
                                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map(qa => (
                                <button key={qa.label} onClick={qa.action} className="p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-fast text-center">
                                    {qa.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Projects Snapshot */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects Snapshot</h2>
                        <div className="space-y-3">
                            {albums.slice(0, 3).map(album => (
                                <div key={album.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-4 hover:bg-gray-50 hover:border-gray-300 transition-all duration-fast cursor-pointer" onClick={() => { /* Navigate to project */}}>
                                    {album.coverPhotoId ? (
                                        <AuthenticatedImage
                                            photoId={album.coverPhotoId}
                                            quality="thumbnail"
                                            alt={album.title}
                                            className="w-12 h-12 rounded-lg object-cover"
                                            aspectRatio="1/1"
                                            colorVariant="auto"
                                        />
                                    ) : (
                                        <ImagePlaceholder
                                            aspectRatio="1/1"
                                            showShimmer={false}
                                            className="w-12 h-12 rounded-lg"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">{album.title}</p>
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