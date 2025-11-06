
import React, { useState, useEffect } from 'react';
// Fix: Import Transition type from framer-motion.
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';

import type { Album, Client, Photo, UserRole, CartItem, Product, ProjectDetails, UploadFile, LayoutId, ServicePackage, Invoice, InvoiceTemplateId, CommunicationSettings, Folder } from './types';
import CoverPage from './components/CoverPage';
import GalleryPage from './components/GalleryPage';
import GalleryFoldersPage from './components/GalleryFoldersPage';
import AlbumFoldersView from './components/AlbumFoldersView';
import AlbumsPage from './components/AlbumsPage';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import TopNavBar from './components/TopNavBar';
import StorePage from './components/StorePage';
import AboutPage from './components/AboutPage';
import ProductDetailPage from './components/store/ProductDetailPage';
import PhotoSelectionPage from './components/store/PhotoSelectionPage';
import CartConfigPage from './components/store/CartConfigPage';
import ShoppingCartPage from './components/store/ShoppingCartPage';
import CheckoutPage from './components/store/CheckoutPage';
import OrderConfirmationPage from './components/store/OrderConfirmationPage';

// Import API services
import { projectService } from './services/projectService';
import { clientService } from './services/clientService';
import { servicePackageService } from './services/servicePackageService';
import { invoiceService } from './services/invoiceService';
import { photoService } from './services/photoService';
import type { Project as BackendProject } from './services/projectService';
import type { Client as BackendClient } from './services/clientService';
import type { ServicePackage as BackendServicePackage } from './services/servicePackageService';
import type { Invoice as BackendInvoice } from './services/invoiceService';

type Page = 'login' | 'cover' | 'albums' | 'albumFolders' | 'galleryFolders' | 'gallery' | 'dashboard' | 'store' | 'about' | 'productDetail' | 'photoSelection' | 'cartConfig' | 'cart' | 'checkout' | 'orderConfirmation';

const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
};

// Fix: Add explicit Transition type to prevent type inference issues.
const pageTransition: Transition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
};

const FALLBACK_COVER_IMAGE = '/placeholder-image.jpg';

const normalizePaymentStatus = (status?: string | null): Album['paymentStatus'] => {
    if (!status) return undefined;
    switch (status.toLowerCase()) {
        case 'paid':
            return 'Paid';
        case 'unpaid':
            return 'Unpaid';
        case 'due':
        case 'overdue':
            return 'Due';
        default:
            return undefined;
    }
};

const normalizeInvoiceStatus = (status: string): Invoice['status'] => {
    switch (status.toLowerCase()) {
        case 'paid':
            return 'Paid';
        case 'draft':
            return 'Draft';
        case 'overdue':
            return 'Overdue';
        case 'unpaid':
        case 'sent':
        default:
            return 'Unpaid';
    }
};

const mapProjectToAlbum = (project: BackendProject): Album => ({
    id: String(project.id),
    title: project.title ?? 'Untitled Project',
    clientId: project.client_id ? String(project.client_id) : '',
    shootDate: project.shoot_date ?? project.created_at,
    coverPhotoSrc: project.cover_photo_src ?? FALLBACK_COVER_IMAGE,
    photoCount: project.photo_count ?? 0,
    isLocked: project.is_locked ?? false,
    layout: project.layout as LayoutId | undefined,
    paymentStatus: normalizePaymentStatus(project.payment_status),
    price: project.price ? Number(project.price) : undefined,
    packageId: project.package_id ?? undefined,
    status: project.status,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    photos: [],
    folders: project.has_folders ? [] : undefined,
});

const mapClientResponse = (client: BackendClient): Client => ({
    id: String(client.id),
    name: client.name,
    email: client.email,
    username: client.username ?? client.email,
    phone: client.phone ?? undefined,
    address: client.address ?? undefined,
    avatarUrl: (client as any).avatar_url ?? null,
    profilePicture: (client as any).profile_picture ?? null,
    whatsappOptIn: (client as any).whatsapp_opt_in ?? false,
    emailOptIn: (client as any).email_opt_in ?? true,
    projects: [],
    lastActivity: client.updated_at ?? client.created_at,
    status: (client as any).status ?? (client.is_active ? 'active' : 'inactive'),
});

const mapServicePackageResponse = (pkg: BackendServicePackage): ServicePackage => ({
    id: pkg.id,
    name: pkg.name,
    category: pkg.category,
    description: pkg.description,
    price: Number(pkg.price),
    isPredefined: (pkg as any).is_predefined ?? false,
    features: (pkg.features || []).map((feature) => ({
        name: feature.name,
        included: feature.included,
        details: feature.details ?? null,
    })),
    deliverables: pkg.deliverables ?? [],
});

const mapInvoiceResponse = (invoice: BackendInvoice): Invoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    clientId: invoice.client_id ? String(invoice.client_id) : undefined,
    projectId: invoice.project_id ? String(invoice.project_id) : undefined,
    clientName: invoice.client_name,
    clientAddress: invoice.client_address,
    items: (invoice.items || []).map((item, index) => ({
        id: item.id ?? `${invoice.id}-item-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
    })),
    notes: invoice.notes ?? undefined,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    status: normalizeInvoiceStatus(invoice.status),
    template: (invoice.template as InvoiceTemplateId) ?? 'modern',
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
});

const App: React.FC = () => {
    // Get authentication state from AuthContext
    const { user, isAuthenticated, isLoading: authLoading, logout: authLogout } = useAuth();
    
    // State
    const [page, setPage] = useState<Page>('login');
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [galleryContent, setGalleryContent] = useState<{photos: Photo[], title: string} | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [selections, setSelections] = useState<string[]>([]);
    const [allAlbums, setAllAlbums] = useState<Album[]>([]);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
    const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
    const [previousPage, setPreviousPage] = useState<Page | null>(null);
    const [studioReturnToProject, setStudioReturnToProject] = useState<Album | null>(null);
    const [navigationStack, setNavigationStack] = useState<Page[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [projectHasFolders, setProjectHasFolders] = useState<boolean>(true); // Track if current project has folders
    
    // Helper function to check if user is a studio user (any studio role)
    const isStudioUser = () => {
        return userRole && (userRole === 'studio' || userRole.startsWith('studio_'));
    };

    // Sync authentication state with AuthContext
    useEffect(() => {
        console.log('[App] Auth state changed:', { isAuthenticated, authLoading, user: user?.email });
        
        if (authLoading) {
            console.log('[App] Auth still loading...');
            return;
        }
        
        if (isAuthenticated && user) {
            console.log('[App] ✅ User authenticated:', user.email, 'Role:', user.role);
            setUserRole(user.role as UserRole);
            
            // Navigate to appropriate page based on role (only if on login page)
            if (page === 'login') {
                if (user.role === 'client') {
                    console.log('[App] Navigating client to albums');
                    setPage('albums');
                    setNavigationStack(['albums']);
                } else {
                    console.log('[App] Navigating studio user to dashboard');
                    setPage('dashboard');
                    setNavigationStack([]);
                }
            }
        } else {
            console.log('[App] ❌ User not authenticated, showing login');
            if (page !== 'login') {
                setPage('login');
                setUserRole(null);
            }
        }
    }, [isAuthenticated, authLoading, user]);

    // Store state
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [photosForProduct, setPhotosForProduct] = useState<Photo[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Studio Branding State
    const [defaultLayoutId, setDefaultLayoutId] = useState<LayoutId>('layout1');
    const [logo, setLogo] = useState<string | null>('/logo-placeholder.svg');
    const [brandColor, setBrandColor] = useState('#1e293b'); // slate-800
    const [typography, setTypography] = useState('System Default (Inter & Cormorant)');
    const [defaultTemplateId, setDefaultTemplateId] = useState<InvoiceTemplateId>('modern');
    const [studioPhoto, setStudioPhoto] = useState<string | null>(null);
    const [studioDescription, setStudioDescription] = useState<string>('');
    const [studioDisplayImage, setStudioDisplayImage] = useState<string | null>(null);
    
    // Communication Settings
    const [communicationSettings, setCommunicationSettings] = useState<CommunicationSettings>({
      email: { fromAddress: '', fromName: '', apiKey: '' },
      whatsapp: { phoneNumberId: '', businessAccountId: '', accessToken: '' }
    });

    // Load initial data from API when user is authenticated
    useEffect(() => {
        const loadInitialData = async () => {
            // Only load data if user is authenticated
            if (!isAuthenticated || authLoading) {
                console.log('[App] Not authenticated or auth loading, skipping data load');
                setIsLoadingData(false);
                return;
            }

            console.log('[App] User authenticated, loading initial data from API...');
            setIsLoadingData(true);
            try {
                // Load projects from API
                const projectsResponse = await projectService.getProjects();
                const projects = projectsResponse.projects || [];
                const albums: Album[] = projects.map(mapProjectToAlbum);
                setAllAlbums(albums);
                console.log(`[App] Loaded ${albums.length} projects/albums from API`);

                // Load clients from API
                try {
                    const clients = await clientService.getClients();
                    const mappedClients: Client[] = clients.map(mapClientResponse);
                    setAllClients(mappedClients);
                    console.log(`[App] Loaded ${mappedClients.length} clients from API`);
                } catch (clientError) {
                    console.error('[App] Error loading clients:', clientError);
                    setAllClients([]);
                }

                // Load service packages from API
                try {
                    const packagesResponse = await servicePackageService.getServicePackages();
                    const packages = packagesResponse.packages || [];
                    const mappedPackages = packages.map(mapServicePackageResponse);
                    setAllPackages(mappedPackages);
                    console.log(`[App] Loaded ${mappedPackages.length} service packages from API`);
                } catch (packageError) {
                    console.error('[App] Error loading packages:', packageError);
                    setAllPackages([]);
                }

                // Load invoices from API
                try {
                    const invoices = await invoiceService.getInvoices();
                    const mappedInvoices = invoices.map(mapInvoiceResponse);
                    setAllInvoices(mappedInvoices);
                    console.log(`[App] Loaded ${mappedInvoices.length} invoices from API`);
                } catch (invoiceError) {
                    console.error('[App] Error loading invoices:', invoiceError);
                    setAllInvoices([]);
                }
            } catch (error: any) {
                console.error('[App] Error loading initial data:', error);
                // Handle 401 errors gracefully - user will need to login
                if (error?.status === 401) {
                    console.log('[App] Authentication failed during data load');
                    await authLogout();
                } else {
                    toast.error('Failed to load data from server');
                }
                // Set empty arrays so app doesn't crash
                setAllAlbums([]);
                setAllClients([]);
                setAllPackages([]);
                setAllInvoices([]);
            } finally {
                setIsLoadingData(false);
            }
        };

        loadInitialData();
    }, [isAuthenticated, authLoading]); // Load when authentication state changes

    // Function to load all data from API
    const loadDataFromAPI = async () => {
        setIsLoadingData(true);
        try {
            console.log('[App] Loading data from API...');
            
            // Load projects from API
            const projectsResponse = await projectService.getProjects();
            const projects = projectsResponse.projects || [];
            const albums: Album[] = projects.map(mapProjectToAlbum);
            setAllAlbums(albums);
            console.log(`[App] Loaded ${albums.length} projects/albums from API`);

            // Load clients from API
            try {
                const clients = await clientService.getClients();
                const mappedClients: Client[] = clients.map(mapClientResponse);
                setAllClients(mappedClients);
                console.log(`[App] Loaded ${mappedClients.length} clients from API`);
            } catch (clientError) {
                console.error('[App] Error loading clients:', clientError);
                setAllClients([]);
            }

            // Load service packages from API
            try {
                const packagesResponse = await servicePackageService.getServicePackages();
                const packages = packagesResponse.packages || [];
                const mappedPackages = packages.map(mapServicePackageResponse);
                setAllPackages(mappedPackages);
                console.log(`[App] Loaded ${mappedPackages.length} service packages from API`);
            } catch (packageError) {
                console.error('[App] Error loading packages:', packageError);
                setAllPackages([]);
            }

            // Load invoices from API
            try {
                const invoices = await invoiceService.getInvoices();
                const mappedInvoices = invoices.map(mapInvoiceResponse);
                setAllInvoices(mappedInvoices);
                console.log(`[App] Loaded ${mappedInvoices.length} invoices from API`);
            } catch (invoiceError) {
                console.error('[App] Error loading invoices:', invoiceError);
                setAllInvoices([]);
            }
        } catch (error: any) {
            console.error('[App] Error loading data:', error);
            if (error?.status === 401) {
                console.log('[App] Authentication failed');
                toast.error('Please login again');
            } else {
                toast.error('Failed to load data from server');
            }
            setAllAlbums([]);
            setAllClients([]);
            setAllPackages([]);
            setAllInvoices([]);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Handlers
    const handleLogin = async (role: UserRole) => {
        setUserRole(role);
        
        // Load data from API after successful login
        await loadDataFromAPI();
        
        if (role === 'client') {
            setPage('albums');
            setNavigationStack(['albums']); // Set entry point for client
        } else {
            setPage('dashboard');
            setNavigationStack([]); // Studio doesn't use navigation stack
        }
    };

    const handleLogout = async () => {
        console.log('[App] Logout requested');
        await authLogout();  // Use AuthContext logout
        setPage('login');
        setUserRole(null);
        setCurrentAlbum(null);
        setGalleryContent(null);
        setFavorites([]);
        setSelections([]);
        setPreviousPage(null);
        setStudioReturnToProject(null);
        setNavigationStack([]);
    };

    const handleOpenGallery = (album?: Album) => {
        const targetAlbum = album || allAlbums[0];
        if (!targetAlbum) return;

        setCurrentAlbum(targetAlbum);
        if (targetAlbum.folders && targetAlbum.folders.length > 0) {
            setNavigationStack([...navigationStack, 'galleryFolders']);
            setPage('galleryFolders');
        } else {
            setGalleryContent({ photos: targetAlbum.photos || [], title: targetAlbum.title });
            setNavigationStack([...navigationStack, 'gallery']);
            setPage('gallery');
        }
    };
    
    const handleOpenGalleryFromCover = async () => {
        if (!currentAlbum) return;
        
        console.log('[App] Opening gallery from cover, fetching folders...');
        
        try {
            // Fetch folders from API to check if project has any
            const foldersResponse = await projectService.getProjectFolders(currentAlbum.id);
            const folders = foldersResponse.folders || [];
            
            console.log('[App] Fetched folders:', {
                folderCount: folders.length,
                folders: folders.map((f: any) => f.name)
            });
            
            // Update currentAlbum with the fetched folders
            const updatedAlbum = {
                ...currentAlbum,
                folders: folders.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    photos: [], // Will be loaded when folder is selected
                    coverPhotoSrc: f.coverPhotoSrc,
                    photoCount: f.photoCount || 0
                }))
            };
            setCurrentAlbum(updatedAlbum);
            
            // Check if project has folders - if yes, show folder grid first
            if (folders.length > 0) {
                console.log('[App] Project has folders, navigating to albumFolders view');
                setNavigationStack([...navigationStack, 'albumFolders']);
                setPage('albumFolders');
            } else {
                // No folders - go directly to gallery with all photos
                console.log('[App] No folders found, going directly to gallery');
                await handleViewAllPhotos();
            }
        } catch (error) {
            console.error('[App] Error fetching folders:', error);
            // On error, fallback to showing all photos
            await handleViewAllPhotos();
        }
    };

    const handleSelectAlbum = (album: Album) => {
        if (album.isLocked && !isStudioUser()) {
            toast.warn('This gallery is locked. Please contact the studio for access.');
            return;
        }
        setCurrentAlbum(album);
        
        // For studio users from dashboard, add to navigation stack
        if (isStudioUser() && previousPage === 'dashboard') {
            setNavigationStack([...navigationStack, 'cover']);
            setPage('cover');
        } else {
            // For clients and regular navigation, show cover page first
            if (album.folders && album.folders.length > 0) {
                setNavigationStack([...navigationStack, 'cover']);
                setPage('cover');
            } else {
                setNavigationStack([...navigationStack, 'cover']);
                setPage('cover');
            }
        }
    };
    
    const handleSelectFolderOld = (folder: Folder) => {
        setGalleryContent({ photos: folder.photos, title: folder.name });
        setNavigationStack([...navigationStack, 'gallery']);
        setPage('gallery');
    };

    const handleBackToAlbums = () => setPage('albums');
    const handleBackToFolders = () => {
        setPage('galleryFolders');
        setGalleryContent(null);
    };
    
    const handleBack = () => {
        console.log('[App] handleBack called:', { page, previousPage, isStudioUser: isStudioUser(), studioReturnToProject: studioReturnToProject?.id });
        
        // Handle back from cover page (new gallery hierarchy)
        // Cover → Dashboard (for studio users)
        if (page === 'cover') {
            if (isStudioUser() && (previousPage === 'dashboard' || studioReturnToProject)) {
                console.log('[App] Going back from cover to dashboard (studio user)');
                setCurrentAlbum(null);
                setStudioReturnToProject(null);
                setProjectHasFolders(true); // Reset flag
                setPage('dashboard');
                setPreviousPage(null);
            } else {
                console.log('[App] Going back from cover to albums (client)');
                setCurrentAlbum(null);
                setProjectHasFolders(true); // Reset flag
                setPage('albums');
            }
            return;
        }
        
        // Handle back from albumFolders page (new gallery hierarchy)
        // AlbumFolders → Cover
        if (page === 'albumFolders') {
            console.log('[App] Going back from albumFolders to cover');
            setPage('cover');
            return;
        }
        
        // Handle back from gallery page
        // Gallery → Cover (skip albumFolders since we never went there)
        if (page === 'gallery' && currentAlbum) {
            console.log('[App] Going back from gallery to cover');
            setCurrentFolder(null);
            setGalleryContent(null);
            setPage('cover');
            return;
        }
        
        // For studio users viewing from dashboard
        if (isStudioUser() && previousPage === 'dashboard') {
            // Go back one level in the stack
            const newStack = [...navigationStack];
            newStack.pop();
            const prevPage = newStack[newStack.length - 1];
            
            // If we're backing out from the cover page (entry point), go to dashboard
            if (page === 'cover' && navigationStack.length === 2) {
                setPage('dashboard');
                setPreviousPage(null);
                setNavigationStack([]);
                setCurrentAlbum(null);
                setGalleryContent(null);
                return;
            }
            
            // Skip cover page when navigating back - go to the page before cover
            if (prevPage === 'cover') {
                // Pop cover from stack and get the page before it
                newStack.pop();
                const pageBeforeCover = newStack[newStack.length - 1];
                
                // If no page before cover (we're at entry point), go to dashboard
                if (!pageBeforeCover || pageBeforeCover === 'albums') {
                    setPage('dashboard');
                    setPreviousPage(null);
                    setNavigationStack([]);
                    setCurrentAlbum(null);
                    setGalleryContent(null);
                    return;
                }
            }
            
            // Otherwise, navigate back in the stack
            setNavigationStack(newStack);
            setPage(prevPage === 'cover' ? newStack[newStack.length - 1] : prevPage);
            
            if (prevPage === 'galleryFolders' || prevPage === 'cover') {
                setGalleryContent(null);
            }
            return;
        }
        
        // For client users - go back one level in navigation stack, skipping cover page
        if (navigationStack.length > 1) {
            const newStack = [...navigationStack];
            newStack.pop(); // Remove current page
            let previousPage = newStack[newStack.length - 1];
            
            // Skip cover page - go to the page before it
            if (previousPage === 'cover') {
                newStack.pop(); // Remove cover
                previousPage = newStack[newStack.length - 1];
            }
            
            setNavigationStack(newStack);
            setPage(previousPage);
            
            // Clear gallery content when going back from gallery to folders
            if (previousPage === 'galleryFolders') {
                setGalleryContent(null);
            }
            // Clear album when going back to albums list
            if (previousPage === 'albums') {
                setCurrentAlbum(null);
                setGalleryContent(null);
            }
        }
    };
    
    const handleBackFromGallery = () => {
        // If viewing photos from gallery, go back to album folders view
        if (page === 'gallery' && currentAlbum) {
            setCurrentFolder(null); // Clear folder filter
            setGalleryContent(null); // Clear gallery content
            setPage('albumFolders');
            return;
        }
        
        // If on album folders view, go back to studio dashboard or client albums
        if (page === 'albumFolders') {
            if (isStudioUser() && previousPage === 'dashboard') {
                setCurrentAlbum(null);
                setStudioReturnToProject(null);
                setPage('dashboard');
                setPreviousPage(null);
            } else {
                setCurrentAlbum(null);
                setPage('albums');
            }
            return;
        }
        
        // Legacy behavior for other cases
        if (isStudioUser() && previousPage === 'dashboard') {
            setPage('dashboard');
            setPreviousPage(null);
        } else if (currentAlbum?.folders) {
            handleBackToFolders();
        } else {
            handleBackToAlbums();
        }
    };
    
    const handleReturnToDashboard = () => {
        setStudioReturnToProject(null);
        setPage('dashboard');
    };

    const handleNavigate = (targetPage: 'albums' | 'store' | 'about' | 'cart') => {
        setPreviousPage(page);
        if (userRole === 'client') {
            setNavigationStack([...navigationStack, targetPage]);
        }
        setPage(targetPage);
    };
    
    const handleNavigateToGallery = async (album: Album) => {
        setPreviousPage(page);
        setCurrentAlbum(album);
        setCurrentFolder(null); // Clear any previous folder selection
        setProjectHasFolders(true); // Reset flag for new project (assume has folders until proven otherwise)
        
        // Store the project for studio return navigation
        if (isStudioUser()) {
            setStudioReturnToProject(album);
        }
        
        // Navigate to cover page first (show project cover with "View Gallery" button)
        setPage('cover');
    };

    const handleSelectFolder = async (folder: Folder) => {
        // User selected a specific folder, navigate to photos with folder filter
        setCurrentFolder(folder);
        setProjectHasFolders(true); // Mark that this project has folders
        
        // Fetch photos for this specific folder
        try {
            console.log('[App] Fetching photos for folder:', folder.id);
            const response = await photoService.getProjectPhotos(
                currentAlbum!.id,
                folder.id // Pass folder ID as categoryId parameter
            );
            console.log('[App] Fetched folder photos:', response);
            
            // Map backend photos to frontend Photo type
            const photos = response.photos.map((photo: any) => ({
                id: String(photo.id),
                src: `http://localhost:8000${photo.src}`,
                alt: photo.original_filename || photo.alt,
                width: photo.width || 800,
                height: photo.height || 1200,
                comments: []
            }));
            
            setGalleryContent({ photos, title: `${currentAlbum!.title} - ${folder.name}` });
            setPage('gallery');
        } catch (error) {
            console.error('[App] Failed to fetch folder photos:', error);
            toast.error('Failed to load photos from folder');
        }
    };

    const handleViewAllPhotos = async () => {
        // User wants to see all photos (bypass folder filtering)
        setCurrentFolder(null);
        setProjectHasFolders(false); // Mark that this project has no folders (or user chose to view all)
        
        // Fetch all photos for the project
        try {
            console.log('[App] Fetching all photos for project:', currentAlbum!.id);
            const response = await photoService.getProjectPhotos(currentAlbum!.id);
            console.log('[App] Fetched photos:', response);
            
            // Map backend photos to frontend Photo type
            const photos = response.photos.map((photo: any) => ({
                id: String(photo.id),
                src: `http://localhost:8000${photo.src}`,
                alt: photo.original_filename || photo.alt,
                width: photo.width || 800,
                height: photo.height || 1200,
                comments: []
            }));
            
            setGalleryContent({ photos, title: currentAlbum!.title });
            
            // Update album cover photo if we have photos
            if (photos.length > 0 && (!currentAlbum!.coverPhotoSrc || currentAlbum!.coverPhotoSrc.startsWith('blob:'))) {
                const updatedAlbum = {
                    ...currentAlbum!,
                    coverPhotoSrc: photos[0].src
                };
                setCurrentAlbum(updatedAlbum);
                
                // Also update in albums array
                const updatedAlbums = allAlbums.map(a => 
                    a.id === currentAlbum!.id ? updatedAlbum : a
                );
                setAllAlbums(updatedAlbums);
            }
            
            setPage('gallery');
        } catch (error) {
            console.error('[App] Failed to fetch photos:', error);
            toast.error('Failed to load photos from server');
        }
    };

    const toggleFavorite = (photoId: string) => {
        setFavorites(prev =>
            prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
        );
    };

    const toggleSelection = (photoId: string) => {
        setSelections(prev =>
            prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
        );
    };

    const addComment = (photoId: string, commentText: string, parentId?: number) => {
        if (!currentAlbum) return;
        
        const newAlbums = allAlbums.map(album => {
            if (album.id !== currentAlbum.id) return album;

            const photosSource = album.photos || album.folders?.flatMap(f => f.photos);
            if (!photosSource) return album;

            const newPhotos = photosSource.map(photo => {
                if (photo.id !== photoId) return photo;

                const newComment: {id: number, author: 'Client' | 'Studio', text: string, timestamp: string, replyToId?: number, replies?: any[]} = {
                    id: Date.now(),
                    author: isStudioUser() ? 'Studio' : 'Client',
                    text: commentText,
                    timestamp: 'Just now',
                    replyToId: parentId // Store which message this is replying to
                };
                
                if (parentId) {
                    // Find the top-level parent comment
                    const findTopLevelParent = (comments: any[], targetId: number): number | null => {
                        for (const comment of comments) {
                            if (comment.id === targetId) {
                                // This is a top-level comment
                                return comment.id;
                            }
                            if (comment.replies) {
                                for (const reply of comment.replies) {
                                    if (reply.id === targetId) {
                                        // Found in replies, return the parent comment id
                                        return comment.id;
                                    }
                                }
                            }
                        }
                        return null;
                    };
                    
                    const topLevelParentId = findTopLevelParent(photo.comments, parentId) || parentId;
                    
                    // Add reply to the top-level parent only
                    const addReply = (comments: any[]): any[] => {
                       return comments.map(c => {
                           if (c.id === topLevelParentId) {
                               return { ...c, replies: [...(c.replies || []), newComment] };
                           }
                           return c;
                       });
                    }
                    return { ...photo, comments: addReply(photo.comments) };
                }

                return { ...photo, comments: [...photo.comments, newComment] };
            });

            if (album.folders) {
                 const newFolders = album.folders.map(folder => ({
                    ...folder,
                    photos: folder.photos.map(p => newPhotos.find(np => np.id === p.id) || p)
                 }));
                 return { ...album, folders: newFolders };
            }

            return { ...album, photos: newPhotos };
        });
        
        setAllAlbums(newAlbums);
        const updatedAlbum = newAlbums.find(a => a.id === currentAlbum.id);
        if (updatedAlbum) {
            setCurrentAlbum(updatedAlbum);
            
            // Update galleryContent with the new photos
            if (galleryContent) {
                const updatedPhotos = updatedAlbum.photos || updatedAlbum.folders?.flatMap(f => f.photos) || [];
                const currentPhotos = galleryContent.photos.map(photo => 
                    updatedPhotos.find(p => p.id === photo.id) || photo
                );
                setGalleryContent({ ...galleryContent, photos: currentPhotos });
            }
        }
    };
    
    // Project Management
    const handleProjectCreated = (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]): Album => {
        const newAlbumId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
        const newPhotos: Photo[] = queue
            .filter(f => f.status === 'success')
            .map((f, i) => ({
                id: `${Date.now()}_${i}`,
                src: URL.createObjectURL(f.file),
                alt: f.file.name,
                width: 800,
                height: 1200,
                comments: []
            }));
        
        const newAlbum: Album = {
            id: newAlbumId,
            title: projectDetails.title || "Untitled Project",
            clientId: projectDetails.clientId || '',
            shootDate: projectDetails.shootDate,
            coverPhotoSrc: newPhotos[0]?.src || '',
            photoCount: newPhotos.length,
            isLocked: false,
            photos: newPhotos,
            layout: projectDetails.layout || defaultLayoutId,
        };

        setAllAlbums(prev => [...prev, newAlbum]);
        return newAlbum;
    };

    const handleSaveInvoice = (invoice: Invoice) => {
        setAllInvoices(prevInvoices => {
            const index = prevInvoices.findIndex(inv => inv.id === invoice.id);
            if (index > -1) {
                const newInvoices = [...prevInvoices];
                newInvoices[index] = invoice;
                return newInvoices;
            }
            return [...prevInvoices, invoice];
        });
        toast.success(`Invoice ${invoice.invoiceNumber} saved successfully!`);
    };

    // Store Handlers
    const handleSelectProduct = (product: Product) => {
        setCurrentProduct(product);
        setPhotosForProduct([]);
        if (userRole === 'client') {
            setNavigationStack([...navigationStack, 'productDetail']);
        }
        setPage('productDetail');
    };

    const handleSelectPhotoForProduct = () => {
        if (userRole === 'client') {
            setNavigationStack([...navigationStack, 'photoSelection']);
        }
        setPage('photoSelection');
    };
    
    const handlePhotosSelected = (photos: Photo[]) => {
        setPhotosForProduct(photos);
        if (userRole === 'client') {
            setNavigationStack([...navigationStack, 'cartConfig']);
        }
        if (photos.length === 1 && currentProduct) {
             setPage('cartConfig');
        } else {
            setPage('cartConfig');
        }
    };

    const handleConfigureProduct = () => {
        if (userRole === 'client') {
            setNavigationStack([...navigationStack, 'cartConfig']);
        }
        setPage('cartConfig');
    };

    const handleAddToCart = (items: Omit<CartItem, 'id'>[]) => {
        const newItems: CartItem[] = items.map(item => ({...item, id: `cart_${Date.now()}_${Math.random()}`}));
        setCart(prev => [...prev, ...newItems]);
        setPage('cart');
        toast.success(`${items.length} item(s) added to your cart!`);
    };
    
    const handleUpdateCartItem = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveCartItem(itemId);
            return;
        }
        setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    };

    const handleRemoveCartItem = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const handleCheckout = () => setPage('checkout');
    const handleConfirmOrder = () => {
        setCart([]);
        setPage('orderConfirmation');
    };
    
    const renderPage = () => {
        const key = page + (currentAlbum?.id || '') + (currentProduct?.id || '') + (galleryContent?.title || '');
        let component;
        switch (page) {
            case 'login':
                component = <LoginPage onLogin={handleLogin} />;
                break;
            case 'cover':
                if (!currentAlbum) {
                    component = <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                } else {
                    component = <CoverPage onOpenGallery={handleOpenGalleryFromCover} album={currentAlbum} />;
                }
                break;
            case 'albums':
                component = <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                break;
            case 'albumFolders':
                if (!currentAlbum) {
                    component = <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                } else {
                    component = <AlbumFoldersView
                        album={currentAlbum}
                        onBack={handleBack}
                        onSelectFolder={handleSelectFolder}
                        onViewAllPhotos={handleViewAllPhotos}
                    />;
                }
                break;
            case 'galleryFolders':
                if (!currentAlbum) {
                    component = <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                } else {
                    component = <GalleryFoldersPage 
                        album={currentAlbum} 
                        onSelectFolder={handleSelectFolderOld} 
                        onBackToAlbums={handleBackToAlbums} 
                    />;
                }
                break;
            case 'gallery':
                if (!currentAlbum || !galleryContent) {
                    component = <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                } else {
                    component = <GalleryPage
                        album={currentAlbum}
                        photos={galleryContent.photos}
                        title={galleryContent.title}
                        onBack={handleBackFromGallery}
                        favorites={favorites}
                        selections={selections}
                        toggleFavorite={toggleFavorite}
                        toggleSelection={toggleSelection}
                        onAddComment={addComment}
                        onNavigateToStore={() => setPage('store')}
                        isStudioPreview={isStudioUser()}
                        userRole={userRole}
                    />;
                }
                break;
            case 'dashboard':
                 component = <DashboardPage
                    albums={allAlbums}
                    clients={allClients}
                    packages={allPackages}
                    invoices={allInvoices}
                    onUpdateAlbums={setAllAlbums}
                    onUpdateClients={setAllClients}
                    onUpdatePackages={setAllPackages}
                    onSaveInvoice={handleSaveInvoice}
                    onLogout={handleLogout}
                    onNavigateToGallery={handleNavigateToGallery}
                    branding={{
                        logo,
                        brandColor,
                        typography,
                        defaultLayoutId,
                        defaultTemplateId,
                        studioPhoto,
                        studioDescription,
                        studioDisplayImage,
                    }}
                    onUpdateBranding={{
                        setLogo,
                        setBrandColor,
                        setTypography,
                        setDefaultLayoutId,
                        setDefaultTemplateId,
                        setStudioPhoto,
                        setStudioDescription,
                        setStudioDisplayImage,
                    }}
                    communicationSettings={communicationSettings}
                    onUpdateCommunicationSettings={setCommunicationSettings}
                    returnToProject={studioReturnToProject}
                    onReturnToDashboard={handleReturnToDashboard}
                 />;
                 break;
            case 'store':
                component = <StorePage onSelectProduct={handleSelectProduct} />;
                break;
            case 'about':
                component = <AboutPage 
                    studioPhoto={studioPhoto}
                    studioDescription={studioDescription}
                />;
                break;
            case 'productDetail':
                 if (!currentProduct) {
                    component = <StorePage onSelectProduct={handleSelectProduct} />;
                 } else {
                    component = <ProductDetailPage
                        product={currentProduct}
                        selectedPhoto={photosForProduct.length > 0 ? photosForProduct[0] : null}
                        onBack={() => setPage('store')}
                        onSelectPhoto={handleSelectPhotoForProduct}
                        onConfigure={handleConfigureProduct}
                    />;
                 }
                break;
            case 'photoSelection':
                if (!currentProduct) {
                     component = <StorePage onSelectProduct={handleSelectProduct} />;
                } else {
                     component = <PhotoSelectionPage 
                        albums={allAlbums} 
                        onPhotosSelect={handlePhotosSelected}
                        onBack={() => setPage('productDetail')}
                        productName={currentProduct.name}
                    />;
                }
                break;
            case 'cartConfig':
                if (!currentProduct || photosForProduct.length === 0) {
                     component = <StorePage onSelectProduct={handleSelectProduct} />;
                } else {
                    component = <CartConfigPage 
                        product={currentProduct}
                        photos={photosForProduct}
                        onAddToCart={handleAddToCart}
                        onBack={() => setPage('productDetail')}
                    />;
                }
                break;
            case 'cart':
                component = <ShoppingCartPage 
                    cartItems={cart}
                    onUpdateItem={handleUpdateCartItem}
                    onRemoveItem={handleRemoveCartItem}
                    onCheckout={handleCheckout}
                />;
                break;
            case 'checkout':
                component = <CheckoutPage onConfirm={handleConfirmOrder} onBack={() => setPage('cart')} />;
                break;
            case 'orderConfirmation':
                component = <OrderConfirmationPage onContinue={() => setPage('store')} />;
                break;
            default:
                component = <LoginPage onLogin={handleLogin} />;
        }
        return (
            <motion.div
                key={key}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="h-full"
            >
                {component}
            </motion.div>
        )
    };

    const shouldShowBackButton = () => {
        console.log('[App] shouldShowBackButton check:', {
            userRole,
            previousPage,
            page,
            studioReturnToProject: studioReturnToProject?.id,
            navigationStackLength: navigationStack.length,
            navigationStack
        });
        
        // For studio users - show back button when:
        // 1. Came from dashboard (previousPage === 'dashboard'), OR
        // 2. Has a studioReturnToProject set (viewing project from studio)
        if (isStudioUser()) {
            if (previousPage === 'dashboard' || studioReturnToProject) {
                console.log('[App] ✅ Show back button: Studio user from dashboard or viewing project');
                return true;
            }
        }
        
        // For client users - show back button when NOT on entry page (albums)
        // Only show if stack has more than 1 item AND current page is not 'albums'
        if (userRole === 'client' && navigationStack.length > 1 && page !== 'albums') {
            console.log('[App] ✅ Show back button: Client with nav stack');
            return true;
        }
        
        console.log('[App] ❌ Back button hidden');
        return false;
    };

    return (
        <div className="h-full">
            {page !== 'login' && page !== 'dashboard' && (
                <TopNavBar 
                    onNavigate={handleNavigate} 
                    cartCount={cart.length} 
                    userRole={userRole} 
                    onLogout={handleLogout}
                    showBackButton={shouldShowBackButton()}
                    onBack={handleBack}
                />
            )}
            <AnimatePresence mode="wait">
                {renderPage()}
            </AnimatePresence>
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                aria-label="Notifications"
            />
        </div>
    );
};

export default App;