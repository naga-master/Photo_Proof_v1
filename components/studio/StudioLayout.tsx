import React, { useState, useEffect } from 'react';
import type { Album, Client, DashboardView, LayoutId, ServicePackage, Invoice, InvoiceTemplateId, Photo, ProjectDetails, UploadFile } from '../../types';
import StudioSidebar from './StudioSidebar';
import StudioOverview from './StudioOverview';
import StudioProjects from './StudioProjects';
import ClientsPage from './ClientsPage';
import InvoicesPage from './invoices/InvoicesPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import LayoutsPage from './LayoutsPage';
import ServicesPage from './services/ServicesPage';
import NotificationsPage from './NotificationsPage';
import ProjectDetailsPage from './ProjectDetailsPage';
import ClientDetailsPage from './ClientDetailsPage';
import UploadWizard from './upload/UploadWizard';
import StudioToolsPage from './tools/StudioToolsPage';
import CommandPalette from './CommandPalette';
import InvoicePreviewModal from './invoices/InvoicePreviewModal';

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
}

const StudioLayout: React.FC<StudioLayoutProps> = (props) => {
    const { 
        albums, clients, packages, invoices, 
        onUpdateAlbums, onUpdateClients, onUpdatePackages, onSaveInvoice, 
        onLogout, onNavigateToGallery,
        branding, onUpdateBranding
    } = props;

    const [view, setView] = useState<DashboardView>('overview');
    const [activeProject, setActiveProject] = useState<Album | null>(null);
    const [activeClient, setActiveClient] = useState<Client | null>(null);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [initialInvoiceData, setInitialInvoiceData] = useState<{ client: Client, project: Album } | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(isOpen => !isOpen);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const handleManageProject = (album: Album) => {
        setActiveProject(album);
        setView('projectDetails');
    };
    
    const handleManageClient = (client: Client) => {
        setActiveClient(client);
        setView('clientDetails');
    };

    const handleUpdateProject = (updatedAlbum: Album) => {
        onUpdateAlbums(albums.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
        setView('projects');
    };
    
    const handleDeleteProject = (albumId: number) => {
        onUpdateAlbums(albums.filter(a => a.id !== albumId));
        setView('projects');
    };
    
    const handleAddPhotos = () => {
        setView('upload');
    };

    const handleCreateClient = (clientData: Omit<Client, 'id' | 'projects' | 'lastActivity' | 'username' | 'password'>) => {
        const newClient: Client = {
            id: Math.max(0, ...clients.map(c => c.id)) + 1,
            ...clientData,
            projects: [],
            lastActivity: 'Just now',
            username: clientData.email,
            password: Math.random().toString(36).slice(-8), // random password
            avatarUrl: `https://i.pravatar.cc/150?u=${clientData.email}`
        };
        onUpdateClients([...clients, newClient]);
    };
    
    const handleUpdateClient = (updatedClient: Client) => {
        onUpdateClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
        setView('clients');
    };
    
    const handleDeleteClient = (clientId: number) => {
        onUpdateClients(clients.filter(c => c.id !== clientId));
        setView('clients');
    };

    const handleCreateInvoiceFromProject = (client: Client, project: Album) => {
        setInitialInvoiceData({ client, project });
        setView('invoices');
    };

    const clearInitialInvoiceData = () => {
        setInitialInvoiceData(null);
    };
    
     const handleProjectCreated = (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]): Album => {
        const newAlbumId = Math.max(0, ...albums.map(a => a.id)) + 1;
        const newPhotos: Photo[] = queue
            .filter((f: any) => f.status === 'success')
            .map((f: any, i: number) => ({
                id: Date.now() + i,
                src: URL.createObjectURL(f.file),
                alt: f.file.name,
                width: 800,
                height: 1200,
                comments: []
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
            layout: projectDetails.layout || branding.defaultLayoutId,
        };

        onUpdateAlbums([...albums, newAlbum]);
        return newAlbum;
    };
    
    const renderContent = () => {
        switch (view) {
            case 'overview': return <StudioOverview albums={albums} setView={setView} />;
            case 'projects': return <StudioProjects albums={albums} clients={clients} setView={setView} onManageProject={handleManageProject} />;
            case 'clients': return <ClientsPage clients={clients} onManageClient={handleManageClient} onCreateClient={handleCreateClient} />;
            case 'services': return <ServicesPage packages={packages} onUpdatePackages={onUpdatePackages} />;
            case 'layouts': return <LayoutsPage 
                defaultLayoutId={branding.defaultLayoutId}
                onSetDefaultLayout={onUpdateBranding.setDefaultLayoutId}
                logo={branding.logo}
                brandColor={branding.brandColor}
                typography={branding.typography}
                onSetLogo={onUpdateBranding.setLogo}
                onSetBrandColor={onUpdateBranding.setBrandColor}
                onSetTypography={onUpdateBranding.setTypography}
            />;
            case 'invoices': return <InvoicesPage 
                clients={clients} 
                albums={albums} 
                invoices={invoices} 
                onSaveInvoice={onSaveInvoice}
                initialData={initialInvoiceData}
                clearInitialData={clearInitialInvoiceData}
                defaultTemplateId={branding.defaultTemplateId}
                onSetDefaultTemplate={onUpdateBranding.setDefaultTemplateId}
                logo={branding.logo}
                brandColor={branding.brandColor}
            />;
            case 'analytics': return <AnalyticsPage />;
            case 'tools': return <StudioToolsPage />;
            case 'notifications': return <NotificationsPage />;
            case 'settings': return <SettingsPage />;
            case 'projectDetails': return activeProject ? <ProjectDetailsPage 
                project={activeProject} 
                clients={clients} 
                onBack={() => setView('projects')} 
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onViewGallery={onNavigateToGallery}
                onAddPhotos={handleAddPhotos}
            /> : <StudioProjects albums={albums} clients={clients} setView={setView} onManageProject={handleManageProject} />;
            case 'clientDetails': return activeClient ? <ClientDetailsPage 
                client={activeClient}
                albums={albums}
                invoices={invoices}
                onBack={() => setView('clients')}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                onCreateInvoice={handleCreateInvoiceFromProject}
                onViewProject={handleManageProject}
                onViewInvoice={setViewingInvoice}
            /> : <ClientsPage clients={clients} onManageClient={handleManageClient} onCreateClient={handleCreateClient} />;
            case 'upload': return <UploadWizard 
                clients={clients}
                packages={packages}
                defaultLayoutId={branding.defaultLayoutId}
                onExit={() => setView('projects')}
                onProjectCreated={handleProjectCreated}
                onViewGallery={onNavigateToGallery}
                showToast={showToast}
            />;
            default: return <StudioOverview albums={albums} setView={setView} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800">
            <StudioSidebar activeView={view} setView={setView} onLogout={onLogout} />
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
            <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setCommandPaletteOpen} onNavigate={setView} />
            {viewingInvoice && (
                <InvoicePreviewModal 
                    invoice={viewingInvoice}
                    onClose={() => setViewingInvoice(null)}
                    logo={branding.logo}
                    brandColor={branding.brandColor}
                />
            )}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-up z-50">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default StudioLayout;