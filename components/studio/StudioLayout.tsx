import React, { useState, useCallback, useEffect } from 'react';
import type { Album, DashboardView } from '../../types';
import StudioSidebar from './StudioSidebar';
import StudioOverview from './StudioOverview';
import StudioProjects from './StudioProjects';
import UploadWizard from './upload/UploadWizard';
import ClientsPage from './ClientsPage';
import LayoutsPage from './LayoutsPage';
import InvoicesPage from './InvoicesPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import NotificationsPage from './NotificationsPage';
import CommandPalette from './CommandPalette';

interface StudioLayoutProps {
  onLogout: () => void;
  albums: Album[];
}

const StudioLayout: React.FC<StudioLayoutProps> = ({ onLogout, albums }) => {
  const [view, setView] = useState<DashboardView>('overview');
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const renderView = () => {
    switch (view) {
      case 'overview':
        return <StudioOverview albums={albums} setView={setView} />;
      case 'projects':
        return <StudioProjects albums={albums} setView={setView} />;
      case 'upload':
        return <UploadWizard onExit={() => setView('projects')} />;
      case 'clients':
        return <ClientsPage />;
      case 'layouts':
          return <LayoutsPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return <StudioOverview albums={albums} setView={setView}/>;
    }
  };
  
  const handleNavigation = useCallback((targetView: DashboardView) => {
    setView(targetView);
    setCommandPaletteOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <StudioSidebar activeView={view} setView={setView} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        setIsOpen={setCommandPaletteOpen}
        onNavigate={handleNavigation}
      />
    </div>
  );
};

export default StudioLayout;
