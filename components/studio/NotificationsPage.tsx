import React, { useState, useMemo } from 'react';
import { mockNotifications as initialNotifications } from '../../data/notifications';
import type { Notification, NotificationType } from '../../types';
import { BellIcon, ChatBubbleIcon, HeartIcon, InvoicesIcon, ShoppingCartIcon } from '../icons';

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
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = useMemo(() => {
        return filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
    }, [notifications, filter]);

    const groupedNotifications = useMemo(() => groupNotifications(filteredNotifications), [filteredNotifications]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    
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
                    {filteredNotifications.length > 0 ? (
                        <>
                            {renderNotificationList(groupedNotifications.today, "Today")}
                            {renderNotificationList(groupedNotifications.yesterday, "Yesterday")}
                            {renderNotificationList(groupedNotifications.older, "Older")}
                        </>
                    ) : (
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
