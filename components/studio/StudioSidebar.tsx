import React from 'react';
import type { DashboardView, NavItem } from '../../types';
import {
  DashboardIcon, ProjectsIcon, ClientsIcon, InvoicesIcon, AnalyticsIcon, SettingsIcon, WrenchScrewdriverIcon, BellIcon, ChevronDoubleLeftIcon, ArrowLeftOnRectangleIcon,
} from '../icons';

// Using a type assertion since the icon component is defined below in this file
type IconProps = React.SVGProps<SVGSVGElement>;
const LayoutIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251.023.501.05.75.082a2.25 2.25 0 012.25 2.25v2.812c0 .65-.25 1.25-.689 1.691L12 14.5M9.75 3.104a2.25 2.25 0 00-2.25 2.25v2.812c0 .65.25 1.25.689 1.691L12 14.5m-2.25-5.656a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 002.25-2.25V6.082a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25v2.812zM3 14.25a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25V12a2.25 2.25 0 00-2.25-2.25H5.25a2.25 2.25 0 00-2.25 2.25v2.25z" />
    </svg>
);
const ServicesIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

interface StudioSidebarProps {
  view: DashboardView;
  setView: (view: DashboardView) => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({ view, setView, onLogout, isMobileOpen, setMobileOpen, isCollapsed, onToggleCollapse }) => {
  const mainNavItems: NavItem[] = [
    { view: 'overview', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { view: 'projects', label: 'Projects', icon: <ProjectsIcon className="w-5 h-5" /> },
    { view: 'clients', label: 'Clients', icon: <ClientsIcon className="w-5 h-5" /> },
    { view: 'invoices', label: 'Invoices', icon: <InvoicesIcon className="w-5 h-5" /> },
    { view: 'analytics', label: 'Analytics', icon: <AnalyticsIcon className="w-5 h-5" /> },
  ];

  const settingsNavItems: NavItem[] = [
    { view: 'layouts', label: 'Layouts & Brand', icon: <LayoutIcon className="w-5 h-5" /> },
    { view: 'services', label: 'Services', icon: <ServicesIcon className="w-5 h-5" /> },
    { view: 'tools', label: 'AI Tools', icon: <WrenchScrewdriverIcon className="w-5 h-5" /> },
    { view: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" /> },
    { view: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const NavButton: React.FC<{ item: NavItem }> = ({ item }) => (
    <button
      onClick={() => {
        setView(item.view);
        setMobileOpen(false);
      }}
      title={isCollapsed ? item.label : undefined}
      className={`flex items-center w-full text-left py-2.5 rounded-md text-sm font-medium transition-colors ${
        isCollapsed ? 'px-3 justify-center' : 'px-3'
      } ${
        view === item.view
          ? 'bg-gray-900 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
    </button>
  );

  return (
    <aside className={`bg-gray-800 text-white flex flex-col h-screen fixed z-40 transition-all duration-300
      ${isCollapsed ? 'lg:w-20' : 'w-64'}
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
    `}>
      <div className={`px-4 py-5 border-b border-gray-700 text-center transition-all duration-300`}>
        <h1 className="text-xl font-bold tracking-wider uppercase truncate">{isCollapsed && 'TS' || 'The Scobeys'}</h1>
        <p className={`text-xs text-gray-400 mt-1 uppercase ${isCollapsed ? 'lg:hidden' : ''}`}>STUDIO</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map(item => <NavButton key={item.view} item={item} />)}
        
        <div className="pt-4 mt-4 border-t border-gray-700">
            <h3 className={`px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${isCollapsed ? 'lg:hidden' : ''}`}>Configuration</h3>
            <div className="space-y-1">
                {settingsNavItems.map(item => <NavButton key={item.view} item={item} />)}
            </div>
        </div>
      </nav>

      <div className="px-2 py-2 border-t border-gray-700">
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`hidden lg:flex items-center w-full text-left p-3 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
        >
          <ChevronDoubleLeftIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>Collapse</span>
        </button>
        <button
          onClick={onLogout}
          title="Logout"
          className={`flex items-center w-full text-left p-3 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white mt-1 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default StudioSidebar;