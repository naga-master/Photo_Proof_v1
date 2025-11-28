import React, { useState, useMemo, useEffect } from 'react';
import type { Notification, NotificationType } from '../../types';
import { BellIcon, ChatBubbleIcon, HeartIcon, InvoicesIcon, ShoppingCartIcon } from '../icons';
import { uploadHistoryStore, type UploadHistoryEntry } from '../../services/uploadHistoryStore';

// TODO: Fetch notifications from /api/notifications
const initialNotifications: Notification[] = [];

// Helper to format timestamp
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
};

const notificationIcons: Record<NotificationType, React.ReactNode> = {
    comment: <ChatBubbleIcon className="w-6 h-6 text-sky-500" />,
    favorite: <HeartIcon className="w-6 h-6 text-red-500" />,
    order: <ShoppingCartIcon className="w-6 h-6 text-green-500" />,
    payment: <InvoicesIcon className="w-6 h-6 text-purple-500" />,
    system: <BellIcon className="w-6 h-6 text-slate-500" />,
};

const groupNotifications = (notifications: Notification[]) => {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

  notifications.forEach(n => {
    if (n.timestamp.includes('minute') || n.timestamp.includes('hour')) {
      today.push(n);
    } else if (n.timestamp.includes('1 day ago')) {
      yesterday.push(n);
    } else {
      older.push(n);
    }
  });

  return { today, yesterday, older };
};


const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    // Load upload history and listen for updates
    useEffect(() => {
        // Load initial history
        const initial = uploadHistoryStore.getHistory();
        console.log('[NotificationsPage] Initial upload history loaded:', initial.length, 'entries');
        setUploadHistory(initial);
        
        // Listen for updates
        const handleUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<UploadHistoryEntry[]>;
            console.log('[NotificationsPage] Upload history update received:', customEvent.detail.length, 'entries');
            
            // Force new array reference to ensure React detects state change
            setUploadHistory([...customEvent.detail]);
        };
        
        window.addEventListener('uploadHistoryUpdate', handleUpdate);
        return () => window.removeEventListener('uploadHistoryUpdate', handleUpdate);
    }, []);

    const filteredNotifications = useMemo(() => {
        return filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
    }, [notifications, filter]);

    const filteredUploadHistory = useMemo(() => {
        return filter === 'unread' ? uploadHistory.filter(n => !n.isRead) : uploadHistory;
    }, [uploadHistory, filter]);

    const groupedNotifications = useMemo(() => groupNotifications(filteredNotifications), [filteredNotifications]);

    // Debug logging for state changes (must be after useMemo definitions)
    useEffect(() => {
        console.log('[NotificationsPage] uploadHistory state updated:', uploadHistory.length, 'entries');
        console.log('[NotificationsPage] Filtered upload history:', filteredUploadHistory.length, 'entries');
    }, [uploadHistory, filteredUploadHistory]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleUploadMarkAsRead = (id: string) => {
        uploadHistoryStore.markAsRead(id);
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        uploadHistoryStore.markAllAsRead();
    };

    const totalCount = filteredNotifications.length + filteredUploadHistory.length;
    const unreadCount = notifications.filter(n => !n.isRead).length + uploadHistory.filter(n => !n.isRead).length;
    
    const renderNotificationList = (list: Notification[], title: string) => (
      list.length > 0 && (
        <div key={title}>
          <h3 className="px-6 py-2 text-sm font-semibold text-slate-500 bg-slate-50">{title}</h3>
          <ul>
            {list.map(notification => (
              <li key={notification.id} onClick={() => handleMarkAsRead(notification.id)} className="flex items-start gap-4 p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                  <div className="relative flex-shrink-0">
                      {notification.avatarUrl ? (
                          <img src={notification.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />
                      ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              {notificationIcons[notification.type]}
                          </div>
                      )}
                      {!notification.isRead && (
                          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-white"></span>
                      )}
                  </div>
                  <div className="flex-1">
                      <p className="text-sm text-slate-800">
                          {notification.text} <span className="font-semibold">{notification.context}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{notification.timestamp}</p>
                  </div>
              </li>
            ))}
          </ul>
        </div>
      )
    );

    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                <p className="mt-1 text-slate-600">Review recent activity from clients and your team.</p>
            </header>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-white z-10">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                            All
                        </button>
                        <button onClick={() => setFilter('unread')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                            Unread
                        </button>
                    </div>
                    <button onClick={handleMarkAllAsRead} className="text-sm font-semibold text-sky-600 hover:text-sky-800">
                        Mark all as read
                    </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto">
                    {/* Upload History Notifications */}
                    {filteredUploadHistory.length > 0 && (
                        <div>
                            <h3 className="px-6 py-2 text-sm font-semibold text-slate-500 bg-slate-50">
                                Recent Uploads
                            </h3>
                            <ul>
                                {filteredUploadHistory.map(entry => (
                                    <li 
                                        key={entry.id} 
                                        onClick={() => handleUploadMarkAsRead(entry.id)} 
                                        className={`flex items-start gap-4 p-4 cursor-pointer border-b border-slate-100 transition-colors ${
                                            entry.isRead 
                                                ? 'bg-white hover:bg-slate-50' 
                                                : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                                        }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                entry.status === 'success' ? 'bg-green-100' :
                                                entry.status === 'partial' ? 'bg-orange-100' :
                                                'bg-red-100'
                                            }`}>
                                                {entry.status === 'success' ? (
                                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                ) : entry.status === 'partial' ? (
                                                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            {!entry.isRead && (
                                                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-white"></span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-800">
                                                {entry.status === 'success' ? (
                                                    <>Upload Complete - <span className="font-semibold">{entry.projectName}</span></>
                                                ) : entry.status === 'partial' ? (
                                                    <>Upload Partially Complete - <span className="font-semibold">{entry.projectName}</span></>
                                                ) : (
                                                    <>Upload Failed - <span className="font-semibold">{entry.projectName}</span></>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {entry.completedFiles}/{entry.totalFiles} files uploaded
                                                {entry.failedFiles > 0 && (
                                                    <span className="text-red-500"> ({entry.failedFiles} failed)</span>
                                                )}
                                                <span className="mx-1">•</span>
                                                {formatTimestamp(entry.timestamp)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Regular Notifications */}
                    {filteredNotifications.length > 0 ? (
                        <>
                            {renderNotificationList(groupedNotifications.today, "Today")}
                            {renderNotificationList(groupedNotifications.yesterday, "Yesterday")}
                            {renderNotificationList(groupedNotifications.older, "Older")}
                        </>
                    ) : filteredUploadHistory.length === 0 && (
                        <div className="text-center py-20 text-slate-500">
                            <BellIcon className="w-12 h-12 mx-auto text-slate-300" />
                            <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                            <p className="mt-1">You have no {filter === 'unread' ? 'unread' : ''} notifications.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
