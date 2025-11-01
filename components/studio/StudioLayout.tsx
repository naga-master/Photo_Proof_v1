
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Album, Client, Invoice, LayoutId, ServicePackage, InvoiceTemplateId, DashboardView, ProjectDetails, UploadFile, CommunicationSettings } from '../../types';
import StudioSidebar from './StudioSidebar';
import StudioOverview from './StudioOverview';
import StudioProjects from './StudioProjects';
import ClientsPage from './ClientsPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import LayoutsPage from './LayoutsPage';
import ServicesPage from './services/ServicesPage';
import StudioToolsPage from './tools/StudioToolsPage';
import NotificationsPage from './NotificationsPage';
import UploadWizard from './upload/UploadWizard';
import ProjectDetailsPage from './ProjectDetailsPage';
import ClientDetailsPage from './ClientDetailsPage';
import CommandPalette from './CommandPalette';
import InvoiceEditor from './InvoicesPage';
import InvoicesListPage from './invoices/InvoicesPage';
import InvoicePreviewModal from './invoices/InvoicePreviewModal';
import { MenuIcon } from '../icons';

interface StudioLayoutProps {
  albums: Album[];
  clients: Client[];
  packages: ServicePackage[];
  invoices: Invoice[];
  onUpdateAlbums: (albums: Album[]) => void;
  onUpdateClients: (clients: Client[]) => void;
  onUpdatePackages: (packages: ServicePackage[]) => void;
  onSaveInvoice: (invoice: Invoice) => void;
  onLogout: () => void;
  onNavigateToGallery: (album: Album) => void;
  branding: {
    logo: string | null;
    brandColor: string;
    typography: string;
    defaultLayoutId: LayoutId;
    defaultTemplateId: InvoiceTemplateId;
  };
  onUpdateBranding: {
    setLogo: (logo: string | null) => void;
    setBrandColor: (color: string) => void;
    setTypography: (font: string) => void;
    setDefaultLayoutId: (layoutId: LayoutId) => void;
    setDefaultTemplateId: (templateId: InvoiceTemplateId) => void;
  };
  communicationSettings: CommunicationSettings;
  onUpdateCommunicationSettings: (settings: CommunicationSettings) => void;
  returnToProject?: Album | null;
  onReturnToDashboard: () => void;
}

const StudioLayout: React.FC<StudioLayoutProps> = (props) => {
    const { clients, onUpdateClients, albums, onUpdateAlbums, onSaveInvoice, onNavigateToGallery, packages, communicationSettings, onUpdateCommunicationSettings } = props;

    const [view, setView] = useState<DashboardView>('overview');
    const [managingProject, setManagingProject] = useState<Album | null>(null);
    const [managingClient, setManagingClient] = useState<Client | null>(null);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    
    const [isSidebarMobileOpen, setSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    
    const [uploadInitialClientId, setUploadInitialClientId] = useState<number | undefined>();
    const [invoiceInitialData, setInvoiceInitialData] = useState<{client: Client, project: Album} | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(o => !o);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    // Handle returning to project details after gallery view
    useEffect(() => {
        if (props.returnToProject) {
            setManagingProject(props.returnToProject);
            setView('projectDetails');
            props.onReturnToDashboard(); // Clear the return flag
        }
    }, [props.returnToProject]);

    const handleSetView = (newView: DashboardView) => {
        setManagingClient(null);
        setManagingProject(null);
        setView(newView);
    }
    
    const handleManageProject = (album: Album) => {
        setManagingProject(album);
        setView('projectDetails');
    };

    const handleUpdateProject = (updatedAlbum: Album) => {
        onUpdateAlbums(albums.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
        setManagingProject(updatedAlbum);
    };

    const handleDeleteProject = (albumId: number) => {
        if(window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            onUpdateAlbums(albums.filter(a => a.id !== albumId));
            setManagingProject(null);
            setView('projects');
        }
    };

    const handleManageClient = (client: Client) => {
        setManagingClient(client);
        setView('clientDetails');
    };
    
    const handleCreateClient = (newClientData: Omit<Client, 'id' | 'projects' | 'lastActivity' | 'username' | 'password'>) => {
        const newClient: Client = {
            id: Math.max(...clients.map(c => c.id)) + 1,
            ...newClientData,
            username: newClientData.email,
            password: 'password',
            projects: [],
            lastActivity: 'Just now',
            avatarUrl: `https://i.pravatar.cc/150?u=${newClientData.email}`
        };
        onUpdateClients([...clients, newClient]);
    };
    
    const handleUpdateClient = (updatedClient: Client) => {
        onUpdateClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
        setManagingClient(updatedClient);
    };

    const handleCreateProjectForClient = (clientId: number) => {
        setUploadInitialClientId(clientId);
        setView('upload');
    };
    
    const handleCreateInvoiceForProject = (client: Client, project: Album) => {
        setInvoiceInitialData({client, project});
        setView('invoiceEditor');
    };

    const handleProjectCreated = (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]): Album => {
        const newAlbumId = Math.max(...albums.map(a => a.id), 0) + 1;
        const newPhotos = queue
            .filter(f => f.status === 'success')
            .map((f, i) => ({
                id: Date.now() + i, src: URL.createObjectURL(f.file), alt: f.file.name, width: 800, height: 1200, comments: []
            }));
        
        const newAlbum: Album = {
            id: newAlbumId,
            title: projectDetails.title || "Untitled Project",
            clientId: parseInt(projectDetails.clientId || '1'),
            shootDate: projectDetails.shootDate,
            coverPhotoSrc: newPhotos[0]?.src || '',
            photoCount: newPhotos.length,
            isLocked: false,
            photos: newPhotos,
            layout: projectDetails.layout || props.branding.defaultLayoutId,
        };

        onUpdateAlbums([...albums, newAlbum]);
        return newAlbum;
    };


    const renderView = () => {
        switch (view) {
            case 'overview': return <StudioOverview albums={props.albums} setView={handleSetView} />;
            case 'projects': return <StudioProjects albums={props.albums} clients={props.clients} setView={handleSetView} onManageProject={handleManageProject} />;
            case 'clients': return <ClientsPage clients={props.clients} onManageClient={handleManageClient} onCreateClient={handleCreateClient} />;
            case 'invoices': return <InvoicesListPage {...props} onNewInvoice={() => { setInvoiceInitialData(null); setView('invoiceEditor'); }} onPreviewInvoice={setViewingInvoice} />;
            // Fix: Spread branding props into InvoiceEditor to provide required props.
            case 'invoiceEditor': return <InvoiceEditor {...props} {...props.branding} initialData={invoiceInitialData} clearInitialData={() => setInvoiceInitialData(null)} onSaveInvoice={onSaveInvoice} onSetDefaultTemplate={props.onUpdateBranding.setDefaultTemplateId} />;
            case 'analytics': return <AnalyticsPage />;
            case 'settings': return <SettingsPage settings={communicationSettings} onUpdateSettings={onUpdateCommunicationSettings} />;
            case 'layouts': return <LayoutsPage defaultLayoutId={props.branding.defaultLayoutId} onSetDefaultLayout={props.onUpdateBranding.setDefaultLayoutId} {...props.branding} onSetLogo={props.onUpdateBranding.setLogo} onSetBrandColor={props.onUpdateBranding.setBrandColor} onSetTypography={props.onUpdateBranding.setTypography} />;
            case 'services': return <ServicesPage packages={props.packages} onUpdatePackages={props.onUpdatePackages} />;
            case 'tools': return <StudioToolsPage />;
            case 'notifications': return <NotificationsPage />;
            case 'upload': return <UploadWizard clients={props.clients} packages={props.packages} defaultLayoutId={props.branding.defaultLayoutId} initialClientId={uploadInitialClientId} onExit={() => { setView('projects'); setUploadInitialClientId(undefined); }} onProjectCreated={handleProjectCreated} onViewGallery={onNavigateToGallery} showToast={(msg: string) => toast.success(msg)} />;
            case 'projectDetails': return managingProject && <ProjectDetailsPage project={managingProject} clients={props.clients} onBack={() => handleSetView('projects')} onUpdateProject={handleUpdateProject} onDeleteProject={handleDeleteProject} onViewGallery={onNavigateToGallery} onAddPhotos={() => setView('upload')} />;
            case 'clientDetails': return managingClient && <ClientDetailsPage client={managingClient} albums={props.albums} invoices={props.invoices} packages={props.packages} onBack={() => handleSetView('clients')} onUpdateClient={handleUpdateClient} onCreateProject={handleCreateProjectForClient} onCreateInvoice={handleCreateInvoiceForProject} onPreviewInvoice={setViewingInvoice} />;
            default: return <StudioOverview albums={props.albums} setView={handleSetView} />;
        }
    };

    return (
        <div className="h-full flex bg-slate-100 font-sans">
            <StudioSidebar
                view={view}
                setView={handleSetView}
                onLogout={props.onLogout}
                isMobileOpen={isSidebarMobileOpen}
                setMobileOpen={setSidebarMobileOpen}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                 <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 z-20 flex justify-between items-center">
                    <button onClick={() => setSidebarMobileOpen(true)} className="text-slate-600 p-1">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold tracking-wider uppercase text-slate-800">NAPSTER's Photo Lab</h1>
                    <div className="w-7"></div>
                </header>
                <main className="flex-1">
                    {renderView()}
                </main>
            </div>
            <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setCommandPaletteOpen} onNavigate={handleSetView} />
            <InvoicePreviewModal
                isOpen={!!viewingInvoice}
                onClose={() => setViewingInvoice(null)}
                invoice={viewingInvoice}
                logo={props.branding.logo}
                brandColor={props.branding.brandColor}
            />
        </div>
    );
};

export default StudioLayout;