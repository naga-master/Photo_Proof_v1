import React, { useState, useCallback, useEffect } from 'react';
import type { Album, DashboardView, ProjectDetails, UploadFile } from '../../types';
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
import StudioToolsPage from './tools/StudioToolsPage';
import ProjectDetailsPage from './ProjectDetailsPage';
import CommandPalette from './CommandPalette';

interface StudioLayoutProps {
  onLogout: () => void;
  albums: Album[];
  onProjectCreated: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]) => Album;
  onViewGallery: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]) => void;
  onViewExistingProject: (album: Album, from: DashboardView) => void;
  onUpdateProject: (album: Album) => void;
  showToast: (message: string) => void;
  initialView?: DashboardView;
  initialProject?: Album | null;
}

const StudioLayout: React.FC<StudioLayoutProps> = ({ 
  onLogout, 
  albums, 
  onProjectCreated, 
  onViewGallery, 
  onViewExistingProject, 
  onUpdateProject, 
  showToast,
  initialView = 'overview',
  initialProject = null,
}) => {
  const [view, setView] = useState<DashboardView>(initialView);
  const [selectedProject, setSelectedProject] = useState<Album | null>(initialProject);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    setView(initialView);
    setSelectedProject(initialProject);
  }, [initialView, initialProject]);

  const handleManageProject = (album: Album) => {
    setSelectedProject(album);
    setView('projectDetails');
  };

  const renderView = () => {
    switch (view) {
      case 'overview':
        return <StudioOverview albums={albums} setView={setView} />;
      case 'projects':
        return <StudioProjects albums={albums} setView={setView} onManageProject={handleManageProject} />;
      case 'upload':
        return <UploadWizard 
          onExit={() => setView('projects')}
          onProjectCreated={onProjectCreated}
          onViewGallery={onViewGallery}
          showToast={showToast}
        />;
      case 'tools':
        return <StudioToolsPage />;
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
      case 'projectDetails':
        return selectedProject ? (
          <ProjectDetailsPage
            project={selectedProject}
            onBack={() => setView('projects')}
            onViewGallery={(project) => onViewExistingProject(project, 'projectDetails')}
            onUpdateProject={(updatedProject) => {
              onUpdateProject(updatedProject);
              setSelectedProject(updatedProject); // Keep local state in sync
            }}
            setView={setView}
          />
        ) : <StudioProjects albums={albums} setView={setView} onManageProject={handleManageProject} />;
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