import React from 'react';
import type { DashboardView, NavItem } from '../../types';
import {
  DashboardIcon, ProjectsIcon, ClientsIcon, InvoicesIcon, AnalyticsIcon, SettingsIcon, BellIcon, ChevronDoubleLeftIcon, ArrowLeftOnRectangleIcon,
} from '../icons';

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
const AIToolsIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
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

  const configNavItems: NavItem[] = [
    { view: 'layouts', label: 'Layouts & Brand', icon: <LayoutIcon className="w-5 h-5" /> },
    { view: 'services', label: 'Services', icon: <ServicesIcon className="w-5 h-5" /> },
    { view: 'tools', label: 'AI Tools', icon: <AIToolsIcon className="w-5 h-5" /> },
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
      className={`flex items-center w-full text-left py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isCollapsed ? 'px-3 justify-center' : 'px-4'
      } ${
        view === item.view
          ? 'bg-slate-900 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
    </button>
  );

  return (
    <>
      {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setMobileOpen(false)}></div>
      )}
      <aside className={`fixed inset-y-0 left-0 bg-slate-800 text-white flex-shrink-0 flex flex-col z-40 transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className={`px-4 py-6 border-b border-slate-700 text-center transition-all duration-300`}>
          <h1 className="text-xl font-bold tracking-wider uppercase truncate">{isCollapsed ? 'NPL' : "NAPSTER's Photo Lab"}</h1>
          <p className={`text-xs text-slate-400 mt-1 uppercase ${isCollapsed ? 'lg:hidden' : ''}`}>STUDIO</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map(item => <NavButton key={item.view} item={item} />)}
          
          <div className="pt-4 mt-4">
              <h3 className={`px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ${isCollapsed ? 'lg:hidden' : ''}`}>Configuration</h3>
              <div className="space-y-1">
                  {configNavItems.map(item => <NavButton key={item.view} item={item} />)}
              </div>
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-slate-700">
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={`hidden lg:flex items-center w-full text-left p-3 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
          >
            <ChevronDoubleLeftIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>Collapse</span>
          </button>
          <button
            onClick={onLogout}
            title="Logout"
            className={`flex items-center w-full text-left p-3 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white mt-1 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default StudioSidebar;