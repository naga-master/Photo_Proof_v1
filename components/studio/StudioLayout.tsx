
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
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';

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
    studioPhoto: string | null;
    studioDescription: string;
    studioDisplayImage: string | null;
  };
  onUpdateBranding: {
    setLogo: (logo: string | null) => void;
    setBrandColor: (color: string) => void;
    setTypography: (font: string) => void;
    setDefaultLayoutId: (layoutId: LayoutId) => void;
    setDefaultTemplateId: (templateId: InvoiceTemplateId) => void;
    setStudioPhoto: (photo: string | null) => void;
    setStudioDescription: (description: string) => void;
    setStudioDisplayImage: (image: string | null) => void;
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
    const [previousView, setPreviousView] = useState<DashboardView | null>(null);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    
    const [isSidebarMobileOpen, setSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    
    const [uploadInitialClientId, setUploadInitialClientId] = useState<string | undefined>();
    const [uploadExistingProjectId, setUploadExistingProjectId] = useState<string | undefined>();
    const [uploadInitialStep, setUploadInitialStep] = useState<number>(0);
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
        setPreviousView(null);
        setView(newView);
    }
    
    const handleManageProject = (album: Album) => {
        setPreviousView(view); // Store current view before navigating
        setManagingProject(album);
        setView('projectDetails');
    };

    const handleBackFromProjectDetails = () => {
        // If we came from clientDetails, go back there and restore the client
        if (previousView === 'clientDetails' && managingProject) {
            const client = clients.find(c => c.id === managingProject.clientId);
            if (client) {
                setManagingClient(client);
                setManagingProject(null);
                setView('clientDetails');
                setPreviousView(null);
                return;
            }
        }
        // Otherwise, go to projects page
        setManagingProject(null);
        setPreviousView(null);
        handleSetView('projects');
    };

    const handleUpdateProject = (updatedAlbum: Album) => {
        onUpdateAlbums(albums.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
        setManagingProject(updatedAlbum);
    };

    const handleDeleteProject = async (albumId: string) => {
        try {
            // Call backend API to delete the project
            await projectService.deleteProject(albumId);
            
            // Update local state after successful deletion
            onUpdateAlbums(albums.filter(a => a.id !== albumId));
            setManagingProject(null);
            setView('projects');
            
            toast.success('Project deleted successfully');
        } catch (error: any) {
            console.error('Error deleting project:', error);
            const errorMessage = error?.message || 'Failed to delete project. Please try again.';
            toast.error(errorMessage);
        }
    };

    const handleManageClient = (client: Client) => {
        setManagingClient(client);
        setView('clientDetails');
    };
    
    const handleCreateClient = (newClientData: Omit<Client, 'id' | 'projects' | 'lastActivity' | 'username' | 'password'>) => {
        const newClient: Client = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
            ...newClientData,
            username: newClientData.email,
            password: 'password',
            projects: [],
            lastActivity: 'Just now',
            avatarUrl: `https://i.pravatar.cc/150?u=${newClientData.email}`
        };
        onUpdateClients([...clients, newClient]);
    };
    
    const handleUpdateClient = async (updatedClient: Client) => {
        console.log('[StudioLayout] handleUpdateClient called with:', {
            id: updatedClient.id,
            name: updatedClient.name,
            hasProfilePicture: !!updatedClient.profilePicture,
            profilePictureLength: updatedClient.profilePicture?.length
        });
        
        try {
            // Call API to update client
            const updated = await clientService.updateClient(String(updatedClient.id), {
                name: updatedClient.name,
                email: updatedClient.email,
                phone: updatedClient.phone,
                address: updatedClient.address,
                profile_picture: updatedClient.profilePicture,
                whatsapp_opt_in: updatedClient.whatsappOptIn,
                email_opt_in: updatedClient.emailOptIn,
            });
            
            console.log('[StudioLayout] Client updated successfully:', updated);
            
            // Update local state
            onUpdateClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
            setManagingClient(updatedClient);
            
            toast.success('Client updated successfully!');
        } catch (error: any) {
            console.error('[StudioLayout] Error updating client:', error);
            toast.error(error?.message || 'Failed to update client');
        }
    };

    const handleCreateProjectForClient = (clientId: string) => {
        setUploadInitialClientId(clientId);
        setView('upload');
    };
    
    const handleCreateInvoiceForProject = (client: Client, project: Album) => {
        setInvoiceInitialData({client, project});
        setView('invoiceEditor');
    };

    const handleGenerateInvoice = (album: Album) => {
        const client = props.clients.find(c => c.id === album.clientId);
        if (!client) {
            toast.error('Client not found for this project');
            return;
        }
        setInvoiceInitialData({client, project: album});
        setView('invoiceEditor');
    };

    const handleProjectCreated = (projectDetails: Partial<ProjectDetails>, queue: UploadFile[], coverPhotoIndex?: number, backendProjectId?: string): Album => {
        // Create new photos from the upload queue
        const newPhotos = queue
            .filter(f => f.status === 'success')
            .map((f, i) => ({
                id: `${Date.now()}_${i}`,
                src: URL.createObjectURL(f.file),
                alt: f.file.name,
                width: 800,
                height: 1200,
                comments: []
            }));
        
        // Determine cover photo - use selected index, or default to first photo
        let coverPhotoSrc = '';
        if (coverPhotoIndex !== undefined && coverPhotoIndex >= 0) {
            const successfulFiles = queue.filter(f => f.status === 'success');
            const coverFile = queue[coverPhotoIndex];
            if (coverFile && coverFile.status === 'success') {
                coverPhotoSrc = URL.createObjectURL(coverFile.file);
            }
        }
        // Fallback to first photo if no cover selected or invalid index
        if (!coverPhotoSrc && newPhotos.length > 0) {
            coverPhotoSrc = newPhotos[0].src;
        }
        
        // If backendProjectId exists, check if we're updating an existing album
        if (backendProjectId) {
            const existingAlbum = albums.find(a => a.id === backendProjectId);
            
            if (existingAlbum) {
                // UPDATE existing album with new photos
                console.log('[StudioLayout] Adding photos to existing project:', backendProjectId);
                
                const updatedAlbum: Album = {
                    ...existingAlbum,
                    photos: [...(existingAlbum.photos || []), ...newPhotos],
                    photoCount: (existingAlbum.photoCount || 0) + newPhotos.length,
                    coverPhotoSrc: coverPhotoSrc || existingAlbum.coverPhotoSrc,
                };
                
                // Update albums array
                const updatedAlbums = albums.map(a => 
                    a.id === backendProjectId ? updatedAlbum : a
                );
                onUpdateAlbums(updatedAlbums);
                
                console.log('[StudioLayout] Updated existing album:', updatedAlbum);
                return updatedAlbum;
            } else {
                // CREATE new album but use the backendProjectId as the ID
                // This happens when a NEW project is created (backendProjectId exists but album doesn't)
                console.log('[StudioLayout] Creating new album with backend ID:', backendProjectId);
                
                const newAlbum: Album = {
                    id: backendProjectId, // Use backend ID instead of generating new one
                    title: projectDetails.title || "Untitled Project",
                    clientId: projectDetails.clientId || '',
                    shootDate: projectDetails.shootDate,
                    coverPhotoSrc: coverPhotoSrc,
                    photoCount: newPhotos.length,
                    isLocked: false,
                    photos: newPhotos,
                    layout: projectDetails.layout || props.branding.defaultLayoutId,
                };

                onUpdateAlbums([...albums, newAlbum]);
                console.log('[StudioLayout] Created new album:', newAlbum);
                return newAlbum;
            }
        }
        
        // No backendProjectId - shouldn't happen, but fallback to old behavior
        console.warn('[StudioLayout] No backendProjectId provided, creating album with random ID');
        const newAlbumId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
        const newAlbum: Album = {
            id: newAlbumId,
            title: projectDetails.title || "Untitled Project",
            clientId: projectDetails.clientId || '',
            shootDate: projectDetails.shootDate,
            coverPhotoSrc: coverPhotoSrc,
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
            case 'projects': return <StudioProjects albums={props.albums} clients={props.clients} packages={props.packages} setView={handleSetView} onManageProject={handleManageProject} onGenerateInvoice={handleGenerateInvoice} />;
            case 'clients': return <ClientsPage clients={props.clients} onManageClient={handleManageClient} onCreateClient={handleCreateClient} />;
            case 'invoices': return <InvoicesListPage {...props} onNewInvoice={() => { setInvoiceInitialData(null); setView('invoiceEditor'); }} onPreviewInvoice={setViewingInvoice} />;
            // Fix: Spread branding props into InvoiceEditor to provide required props.
            case 'invoiceEditor': return <InvoiceEditor {...props} {...props.branding} initialData={invoiceInitialData} clearInitialData={() => setInvoiceInitialData(null)} onSaveInvoice={onSaveInvoice} onSetDefaultTemplate={props.onUpdateBranding.setDefaultTemplateId} onInvoiceSaved={() => setView('invoices')} />;
            case 'analytics': return <AnalyticsPage albums={props.albums} clients={props.clients} invoices={props.invoices} packages={props.packages} />;
            case 'settings': return <SettingsPage 
                settings={communicationSettings} 
                onUpdateSettings={onUpdateCommunicationSettings}
                branding={props.branding}
                onUpdateBranding={props.onUpdateBranding}
            />;
            case 'layouts': return <LayoutsPage defaultLayoutId={props.branding.defaultLayoutId} onSetDefaultLayout={props.onUpdateBranding.setDefaultLayoutId} {...props.branding} onSetLogo={props.onUpdateBranding.setLogo} onSetBrandColor={props.onUpdateBranding.setBrandColor} onSetTypography={props.onUpdateBranding.setTypography} />;
            case 'services': return <ServicesPage packages={props.packages} onUpdatePackages={props.onUpdatePackages} />;
            case 'tools': return <StudioToolsPage />;
            case 'notifications': return <NotificationsPage />;
            case 'upload': return <UploadWizard clients={props.clients} packages={props.packages} defaultLayoutId={props.branding.defaultLayoutId} initialClientId={uploadInitialClientId} existingProjectId={uploadExistingProjectId} initialStep={uploadInitialStep} onExit={() => { setView('projects'); setUploadInitialClientId(undefined); setUploadExistingProjectId(undefined); setUploadInitialStep(0); }} onProjectCreated={handleProjectCreated} onViewGallery={onNavigateToGallery} showToast={(msg: string) => toast.success(msg)} />;
            case 'projectDetails': return managingProject && <ProjectDetailsPage project={managingProject} clients={props.clients} onBack={handleBackFromProjectDetails} onUpdateProject={handleUpdateProject} onDeleteProject={handleDeleteProject} onViewGallery={onNavigateToGallery} onAddPhotos={() => { setUploadExistingProjectId(managingProject.id); setUploadInitialStep(2); setView('upload'); }} onGenerateInvoice={handleGenerateInvoice} />;
            case 'clientDetails': return managingClient && <ClientDetailsPage client={managingClient} albums={props.albums} invoices={props.invoices} packages={props.packages} onBack={() => handleSetView('clients')} onUpdateClient={handleUpdateClient} onCreateProject={handleCreateProjectForClient} onCreateInvoice={handleCreateInvoiceForProject} onPreviewInvoice={setViewingInvoice} onViewProject={handleManageProject} />;
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
                <main className="flex-1 overflow-hidden">
                    {renderView()}
                </main>
            </div>
            <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setCommandPaletteOpen} onNavigate={handleSetView} />
            <InvoicePreviewModal
                isOpen={!!viewingInvoice}
                onClose={() => setViewingInvoice(null)}
                invoice={viewingInvoice}
                logo={props.branding.studioDisplayImage || props.branding.logo}
                brandColor={props.branding.brandColor}
                client={viewingInvoice ? props.clients.find(c => c.id === viewingInvoice.clientId) : undefined}
                onShare={(type, invoice) => {
                    console.log(`Share invoice via ${type}:`, invoice);
                    toast.success(`Invoice shared via ${type === 'whatsapp' ? 'WhatsApp' : 'Email'}`);
                }}
            />
        </div>
    );
};

export default StudioLayout;