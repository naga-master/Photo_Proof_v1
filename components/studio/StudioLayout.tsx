import React, { useState, useEffect } from 'react';
import type { Album, DashboardView, Client, ProjectDetails, UploadFile, LayoutId } from '../../types';
import StudioSidebar from './StudioSidebar';
import StudioOverview from './StudioOverview';
import StudioProjects from './StudioProjects';
import ClientsPage from './ClientsPage';
import InvoicesPage from './InvoicesPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import UploadWizard from './upload/UploadWizard';
import CommandPalette from './CommandPalette';
import ProjectDetailsPage from './ProjectDetailsPage';
import ClientDetailsPage from './ClientDetailsPage';
import LayoutsPage from './LayoutsPage';
import NotificationsPage from './NotificationsPage';
import StudioToolsPage from './tools/StudioToolsPage';

interface StudioLayoutProps {
  initialState?: any;
  albums: Album[];
  clients: Client[];
  defaultLayoutId: LayoutId;
  onSetDefaultLayout: (layoutId: LayoutId) => void;
  onLogout: () => void;
  onCreateClient: (client: Omit<Client, 'id' | 'projects' | 'lastActivity' | 'username' | 'password'>) => void;
  onProjectCreated: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]) => Album;
  onViewGallery: (album: Album, returnToView: any) => void;
  onUpdateProject: (album: Album) => void;
  onDeleteProject: (albumId: number) => void;
  logo: string | null;
  brandColor: string;
  typography: string;
  onSetLogo: (logo: string | null) => void;
  onSetBrandColor: (color: string) => void;
  onSetTypography: (font: string) => void;
}

const StudioLayout: React.FC<StudioLayoutProps> = (props) => {
  const { 
    initialState,
    albums,
    clients, 
    defaultLayoutId,
    onSetDefaultLayout,
    onLogout, 
    onCreateClient,
    onProjectCreated, 
    onViewGallery,
    onUpdateProject,
    onDeleteProject,
    logo,
    brandColor,
    typography,
    onSetLogo,
    onSetBrandColor,
    onSetTypography,
  } = props;
  
  const [view, setView] = useState<DashboardView>(initialState?.view || 'overview');
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(initialState?.selectedAlbum || null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialState?.selectedClient || null);
  const [initialClientIdForUpload, setInitialClientIdForUpload] = useState<number | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    if (toastMessage) {
        const timer = setTimeout(() => setToastMessage(''), 3000);
        return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleNavigate = (targetView: DashboardView) => {
    setSelectedAlbum(null);
    setSelectedClient(null);
    setInitialClientIdForUpload(undefined);
    setView(targetView);
  }

  const handleManageProject = (album: Album) => {
    setSelectedAlbum(album);
    setView('project-details');
  };
  
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setView('client-details');
  };
  
  const handleNewProjectForClient = (clientId: number) => {
      setInitialClientIdForUpload(clientId);
      setView('upload');
  }

  const handleViewGalleryClick = (album: Album) => {
    const returnToView = { view, selectedAlbum, selectedClient };
    onViewGallery(album, returnToView);
  }

  const renderView = () => {
    switch (view) {
      case 'overview': return <StudioOverview albums={albums} setView={handleNavigate} />;
      case 'projects': return <StudioProjects albums={albums} clients={clients} setView={handleNavigate} onManageProject={handleManageProject} />;
      case 'project-details': return selectedAlbum && <ProjectDetailsPage project={selectedAlbum} clients={clients} onBack={() => handleNavigate('projects')} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} onViewGallery={handleViewGalleryClick} onAddPhotos={() => setView('upload')} />;
      case 'clients': return <ClientsPage clients={clients} onManageClient={handleViewClient} onCreateClient={onCreateClient} />;
      case 'client-details': return selectedClient && <ClientDetailsPage client={selectedClient} albums={albums} onBack={() => handleNavigate('clients')} onManageProject={handleManageProject} onNewProjectForClient={handleNewProjectForClient} />;
      case 'layouts': return <LayoutsPage 
        defaultLayoutId={defaultLayoutId} 
        onSetDefaultLayout={onSetDefaultLayout}
        logo={logo}
        brandColor={brandColor}
        typography={typography}
        onSetLogo={onSetLogo}
        onSetBrandColor={onSetBrandColor}
        onSetTypography={onSetTypography}
      />;
      case 'invoices': return <InvoicesPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'tools': return <StudioToolsPage />;
      case 'notifications': return <NotificationsPage />;
      case 'settings': return <SettingsPage />;
      case 'upload': return <UploadWizard clients={clients} initialClientId={initialClientIdForUpload} defaultLayoutId={defaultLayoutId} onExit={() => handleNavigate('projects')} onProjectCreated={onProjectCreated} onViewGallery={(album) => handleViewGalleryClick(album)} showToast={setToastMessage} />;
      default: return <StudioOverview albums={albums} setView={handleNavigate}/>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <StudioSidebar activeView={view} setView={handleNavigate} onLogout={onLogout}/>
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
      <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setCommandPaletteOpen} onNavigate={handleNavigate} />
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
            {toastMessage}
        </div>
      )}
    </div>
  );
};

export default StudioLayout;