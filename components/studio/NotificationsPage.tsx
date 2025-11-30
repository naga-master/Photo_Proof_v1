import React, { useState, useMemo, useEffect } from 'react';
import type { Notification, NotificationType } from '../../types';
import { BellIcon, ChatBubbleIcon, HeartIcon, InvoicesIcon, ShoppingCartIcon } from '../icons';
import ApiNotificationService from '../../services/apiNotificationService';

const UploadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

const notificationIcons: Record<NotificationType, React.ReactNode> = {
    comment: <ChatBubbleIcon className="w-6 h-6 text-sky-500" />,
    favorite: <HeartIcon className="w-6 h-6 text-red-500" />,
    order: <ShoppingCartIcon className="w-6 h-6 text-green-500" />,
    payment: <InvoicesIcon className="w-6 h-6 text-purple-500" />,
    system: <BellIcon className="w-6 h-6 text-slate-500" />,
    upload: <UploadIcon className="w-6 h-6 text-blue-500" />,
};

const groupNotifications = (notifications: Notification[]) => {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

  notifications.forEach(n => {
    const ts = n.timestamp?.toLowerCase() || '';
    // "Just now", "X minute(s) ago", "X hour(s) ago" = Today
    if (ts.includes('just now') || ts.includes('minute') || ts.includes('hour')) {
      today.push(n);
    } else if (ts.includes('1 day ago') || ts.includes('yesterday')) {
      yesterday.push(n);
    } else {
      older.push(n);
    }
  });

  return { today, yesterday, older };
};


const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [apiUnreadCount, setApiUnreadCount] = useState(0);

    // Fetch notifications from API
    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const typeParam = typeFilter === 'all' ? undefined : typeFilter;
                const { notifications: apiNotifications, unreadCount } = await ApiNotificationService.getNotifications(typeParam);
                setNotifications(apiNotifications);
                setApiUnreadCount(unreadCount);
                console.log('[NotificationsPage] Fetched', apiNotifications.length, 'notifications from API');
                console.log('[NotificationsPage] Notifications:', apiNotifications.map(n => ({ 
                    id: n.id, 
                    type: n.type, 
                    title: n.title, 
                    message: n.message,
                    timestamp: n.timestamp 
                })));
            } catch (error) {
                console.error('[NotificationsPage] Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchNotifications();
    }, [typeFilter]);

    const filteredNotifications = useMemo(() => {
        return filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
    }, [notifications, filter]);

    const groupedNotifications = useMemo(() => groupNotifications(filteredNotifications), [filteredNotifications]);

    const handleMarkAsRead = async (id: string) => {
        // Optimistically update UI
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setApiUnreadCount(prev => Math.max(0, prev - 1));
        
        // Call API
        await ApiNotificationService.markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setApiUnreadCount(0);
        
        // Call API
        await ApiNotificationService.markAllRead();
    };

    const totalCount = filteredNotifications.length;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
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
                          {notification.title || notification.text} <span className="font-semibold">{notification.message || notification.context}</span>
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
                <div className="p-4 border-b bg-white z-10">
                    {/* Top row: Read status filter + Mark all read */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                                All
                            </button>
                            <button onClick={() => setFilter('unread')} className={`px-3 py-1.5 text-sm font-semibold rounded-md ${filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                                Unread {apiUnreadCount > 0 && `(${apiUnreadCount})`}
                            </button>
                        </div>
                        <button onClick={handleMarkAllAsRead} className="text-sm font-semibold text-sky-600 hover:text-sky-800">
                            Mark all as read
                        </button>
                    </div>
                    
                    {/* Bottom row: Type filter */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 mr-1">Type:</span>
                        <button onClick={() => setTypeFilter('all')} className={`px-2 py-1 text-xs font-medium rounded ${typeFilter === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                            All
                        </button>
                        <button onClick={() => setTypeFilter('comment')} className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${typeFilter === 'comment' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <ChatBubbleIcon className="w-3 h-3" /> Comments
                        </button>
                        <button onClick={() => setTypeFilter('order')} className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${typeFilter === 'order' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <ShoppingCartIcon className="w-3 h-3" /> Orders
                        </button>
                        <button onClick={() => setTypeFilter('upload')} className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${typeFilter === 'upload' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <UploadIcon className="w-3 h-3" /> Uploads
                        </button>
                        <button onClick={() => setTypeFilter('system')} className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${typeFilter === 'system' ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <BellIcon className="w-3 h-3" /> System
                        </button>
                    </div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto">
                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-10">
                            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
                            <p className="mt-2 text-slate-500 text-sm">Loading notifications...</p>
                        </div>
                    )}

                    {/* Regular Notifications */}
                    {!loading && filteredNotifications.length > 0 ? (
                        <>
                            {renderNotificationList(groupedNotifications.today, "Today")}
                            {renderNotificationList(groupedNotifications.yesterday, "Yesterday")}
                            {renderNotificationList(groupedNotifications.older, "Older")}
                        </>
                    ) : !loading && (
                        <div className="text-center py-20 text-slate-500">
                            <BellIcon className="w-12 h-12 mx-auto text-slate-300" />
                            <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                            <p className="mt-1">You have no {filter === 'unread' ? 'unread' : ''} {typeFilter !== 'all' ? typeFilter : ''} notifications.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
