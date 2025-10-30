import React from 'react';
import type { DashboardView, NavItem } from '../../types';
import { 
    DashboardIcon,
    ProjectsIcon,
    ClientsIcon,
    InvoicesIcon,
    AnalyticsIcon,
    SettingsIcon,
    LayoutTemplateIcon,
    BellIcon,
    WrenchScrewdriverIcon,
    TagIcon,
} from '../icons';

interface StudioSidebarProps {
    activeView: DashboardView;
    setView: (view: DashboardView) => void;
    onLogout: () => void;
}

const navItems: NavItem[] = [
    { view: 'overview', label: 'Overview', icon: <DashboardIcon className="w-5 h-5" /> },
    { view: 'projects', label: 'Projects', icon: <ProjectsIcon className="w-5 h-5" /> },
    { view: 'clients', label: 'Clients', icon: <ClientsIcon className="w-5 h-5" /> },
    { view: 'services', label: 'Services', icon: <TagIcon className="w-5 h-5" /> },
    { view: 'layouts', label: 'Layouts', icon: <LayoutTemplateIcon className="w-5 h-5" /> },
    { view: 'invoices', label: 'Invoices', icon: <InvoicesIcon className="w-5 h-5" /> },
    { view: 'analytics', label: 'Analytics', icon: <AnalyticsIcon className="w-5 h-5" /> },
    { view: 'tools', label: 'Tools', icon: <WrenchScrewdriverIcon className="w-5 h-5" /> },
];

const secondaryNavItems: NavItem[] = [
    { view: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" /> },
    { view: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
];

const StudioSidebar: React.FC<StudioSidebarProps> = ({ activeView, setView, onLogout }) => {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
                 <h1 className="text-xl font-bold tracking-widest uppercase text-gray-800">THE SCOBEYS</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setView(item.view)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                            activeView === item.view 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-200">
                 <nav className="space-y-2 mb-4">
                    {secondaryNavItems.map(item => (
                        <button
                            key={item.view}
                            onClick={() => setView(item.view)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                                activeView === item.view 
                                ? 'bg-gray-100 text-gray-900' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                 </nav>
                <button
                    onClick={onLogout}
                    className="w-full text-left text-sm font-medium text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
                >
                    Logout
                </button>
                 <p className="text-xs text-gray-400 mt-4 text-center">Press <kbd className="font-sans">⌘K</kbd> for commands</p>
            </div>
        </aside>
    );
};

export default StudioSidebar;