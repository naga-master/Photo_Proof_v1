import React, { useState, useEffect, useMemo } from 'react';
import type { DashboardView, NavItem } from '../../types';
import {
  DashboardIcon, ProjectsIcon, ClientsIcon, InvoicesIcon, AnalyticsIcon, SettingsIcon, BellIcon, ChevronDoubleLeftIcon, ArrowLeftOnRectangleIcon,
} from '../icons';
import { uploadHistoryStore } from '../../services/uploadHistoryStore';
import ApiNotificationService from '../../services/apiNotificationService';
import { useStudioTheme } from '../../src/providers/StudioThemeProvider';
import { StudioLogo, StudioLogoCollapsed } from '../StudioLogo';
import { useAccessControl } from '../../contexts/AccessControlContext';

type IconProps = React.SVGProps<SVGSVGElement>;
// Swatches icon - for Layouts & Brand (color palette / branding)
const LayoutIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
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
const ContractsIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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
  const { theme } = useStudioTheme();
  const { hasPermission, isFeatureEnabled } = useAccessControl();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [apiUnreadCount, setApiUnreadCount] = useState(0);
  const [uploadUnreadCount, setUploadUnreadCount] = useState(0);

  // Track unread notifications from API
  useEffect(() => {
    const fetchApiUnreadCount = async () => {
      try {
        const count = await ApiNotificationService.getUnreadCount();
        setApiUnreadCount(count);
        console.log('[StudioSidebar] API unread count:', count);
      } catch (error) {
        console.error('[StudioSidebar] Failed to fetch API unread count:', error);
      }
    };
    
    fetchApiUnreadCount();
    
    // Refresh count periodically (every 60 seconds)
    const interval = setInterval(fetchApiUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Track unread notifications from upload history
  useEffect(() => {
    // Load initial unread count
    const initialCount = uploadHistoryStore.getUnreadCount();
    setUploadUnreadCount(initialCount);
    console.log('[StudioSidebar] Initial upload unread count:', initialCount);
    
    // Listen for upload history updates
    const handleHistoryUpdate = () => {
      const newCount = uploadHistoryStore.getUnreadCount();
      setUploadUnreadCount(newCount);
      console.log('[StudioSidebar] Upload unread count updated:', newCount);
    };
    
    window.addEventListener('uploadHistoryUpdate', handleHistoryUpdate);
    return () => window.removeEventListener('uploadHistoryUpdate', handleHistoryUpdate);
  }, []);

  // Combine counts
  useEffect(() => {
    setUnreadNotificationCount(apiUnreadCount + uploadUnreadCount);
  }, [apiUnreadCount, uploadUnreadCount]);

  // Define nav items with their required permissions
  const allMainNavItems: (NavItem & { permission?: string; feature?: string })[] = [
    { view: 'overview', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { view: 'projects', label: 'Projects', icon: <ProjectsIcon className="w-5 h-5" />, permission: 'canViewProjects', feature: 'projects_module' },
    { view: 'clients', label: 'Clients', icon: <ClientsIcon className="w-5 h-5" />, permission: 'canViewClients', feature: 'clients_module' },
    { view: 'invoices', label: 'Invoices', icon: <InvoicesIcon className="w-5 h-5" />, permission: 'canViewInvoices', feature: 'invoices_module' },
    { view: 'contracts', label: 'Contracts', icon: <ContractsIcon className="w-5 h-5" />, permission: 'canViewContracts', feature: 'contracts_module' },
    { view: 'analytics', label: 'Analytics', icon: <AnalyticsIcon className="w-5 h-5" />, permission: 'canViewAnalytics', feature: 'analytics_module' },
  ];

  const allConfigNavItems: (NavItem & { permission?: string; feature?: string })[] = [
    { view: 'layouts', label: 'Layouts & Brand', icon: <LayoutIcon className="w-5 h-5" />, permission: 'canManageBranding' },
    { view: 'services', label: 'Services', icon: <ServicesIcon className="w-5 h-5" />, permission: 'canManageServices', feature: 'services_module' },
    { view: 'tools', label: 'AI Tools', icon: <AIToolsIcon className="w-5 h-5" />, permission: 'canUseAITools' },
    { view: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" />, permission: 'canViewNotifications', feature: 'notifications_module' },
    { view: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" />, feature: 'settings_module' },
  ];

  // Filter nav items based on permissions and features
  const mainNavItems = useMemo(() => {
    console.log('[Sidebar] Filtering mainNavItems...');
    return allMainNavItems.filter(item => {
      // Check feature flag first (if specified)
      if (item.feature && !isFeatureEnabled(item.feature)) {
        console.log(`[Sidebar] ${item.label}: HIDDEN (feature ${item.feature} disabled)`);
        return false;
      }
      // Check permission (if specified)
      if (item.permission) {
        const hasPerm = hasPermission(item.permission);
        console.log(`[Sidebar] ${item.label}: permission ${item.permission} = ${hasPerm}`);
        if (!hasPerm) {
          return false;
        }
      }
      return true;
    });
  }, [hasPermission, isFeatureEnabled]);

  const configNavItems = useMemo(() => {
    return allConfigNavItems.filter(item => {
      // Check feature flag first (if specified)
      if (item.feature && !isFeatureEnabled(item.feature)) {
        return false;
      }
      // Check permission (if specified)
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }
      return true;
    });
  }, [hasPermission, isFeatureEnabled]);

  const NavButton: React.FC<{ item: NavItem }> = ({ item }) => (
    <button
      onClick={() => {
        setView(item.view);
        setMobileOpen(false);
      }}
      title={isCollapsed ? item.label : undefined}
      className={`flex items-center w-full text-left py-2.5 rounded-lg text-sm font-medium transition-all duration-fast ${
        isCollapsed ? 'px-3 justify-center' : 'px-3'
      } ${
        view === item.view
          ? 'bg-primary text-white shadow-[0_2px_8px_rgba(10,88,208,0.25)]'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
      {/* Notification Badge */}
      {item.view === 'notifications' && unreadNotificationCount > 0 && (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setMobileOpen(false)}></div>
      )}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col z-40 transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Header / Logo */}
        <div className={`px-4 py-5 border-b border-gray-200 transition-all duration-300`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <StudioLogoCollapsed />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <StudioLogo size="md" />
              <h1 className="text-sm font-semibold tracking-wide truncate text-center text-gray-900 mt-2 max-w-full">
                {theme?.name || 'Studio'}
              </h1>
            </div>
          )}
          <p className={`text-[11px] text-gray-400 mt-1 uppercase tracking-wider text-center ${isCollapsed ? 'lg:hidden' : ''}`}>STUDIO</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map(item => <NavButton key={item.view} item={item} />)}
          
          {/* Configuration Section */}
          <div className="pt-5 mt-4 border-t border-gray-200">
              <h3 className={`px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 ${isCollapsed ? 'lg:hidden' : ''}`}>Configuration</h3>
              <div className="space-y-1">
                  {configNavItems.map(item => <NavButton key={item.view} item={item} />)}
              </div>
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="px-3 py-3 border-t border-gray-200">
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={`hidden lg:flex items-center w-full text-left p-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-fast ${isCollapsed ? 'justify-center' : ''}`}
          >
            <ChevronDoubleLeftIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>Collapse</span>
          </button>
          <button
            onClick={onLogout}
            title="Logout"
            className={`flex items-center w-full text-left p-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-fast mt-1 ${isCollapsed ? 'justify-center' : ''}`}
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