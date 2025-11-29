/**
 * Global App Store (Zustand)
 * Centralized state management for albums, clients, packages, invoices, and navigation
 */

import { create } from 'zustand';
import type { Album, Client, ServicePackage, Invoice, Photo, Folder, UserRole } from '../../types';

type Page = 'login' | 'cover' | 'albums' | 'albumFolders' | 'galleryFolders' | 'gallery' | 'dashboard' | 'store' | 'about' | 'productDetail' | 'photoSelection' | 'cartConfig' | 'cart' | 'checkout' | 'orderConfirmation' | 'contracts' | 'contractView' | 'privacyPolicy' | 'termsOfService' | 'privacySettings';

interface GalleryContent {
    photos: Photo[];
    title: string;
}

interface AppState {
    // Data
    albums: Album[];
    clients: Client[];
    packages: ServicePackage[];
    invoices: Invoice[];
    
    // Current context
    currentAlbum: Album | null;
    currentFolder: Folder | null;
    galleryContent: GalleryContent | null;
    
    // Selections
    favorites: string[];
    selections: string[];
    
    // Navigation
    page: Page;
    previousPage: Page | null;
    navigationStack: Page[];
    studioReturnToProject: Album | null;
    projectHasFolders: boolean;
    
    // User
    userRole: UserRole;
    
    // Loading
    isLoading: boolean;
}

interface AppActions {
    // Data setters
    setAlbums: (albums: Album[]) => void;
    setClients: (clients: Client[]) => void;
    setPackages: (packages: ServicePackage[]) => void;
    setInvoices: (invoices: Invoice[]) => void;
    
    // Current context
    setCurrentAlbum: (album: Album | null) => void;
    setCurrentFolder: (folder: Folder | null) => void;
    setGalleryContent: (content: GalleryContent | null) => void;
    
    // Selections
    toggleFavorite: (photoId: string) => void;
    toggleSelection: (photoId: string) => void;
    setFavorites: (favorites: string[]) => void;
    setSelections: (selections: string[]) => void;
    
    // Navigation
    navigate: (page: Page) => void;
    goBack: () => void;
    setUserRole: (role: UserRole) => void;
    setStudioReturnToProject: (album: Album | null) => void;
    setProjectHasFolders: (hasFolders: boolean) => void;
    
    // Loading
    setLoading: (loading: boolean) => void;
    
    // Reset
    reset: () => void;
}

const initialState: AppState = {
    albums: [],
    clients: [],
    packages: [],
    invoices: [],
    currentAlbum: null,
    currentFolder: null,
    galleryContent: null,
    favorites: [],
    selections: [],
    page: 'login',
    previousPage: null,
    navigationStack: [],
    studioReturnToProject: null,
    projectHasFolders: true,
    userRole: null,
    isLoading: true,
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
    ...initialState,
    
    // Data setters
    setAlbums: (albums) => set({ albums }),
    setClients: (clients) => set({ clients }),
    setPackages: (packages) => set({ packages }),
    setInvoices: (invoices) => set({ invoices }),
    
    // Current context
    setCurrentAlbum: (album) => set({ currentAlbum: album }),
    setCurrentFolder: (folder) => set({ currentFolder: folder }),
    setGalleryContent: (content) => set({ galleryContent: content }),
    
    // Selections
    toggleFavorite: (photoId) => set((state) => ({
        favorites: state.favorites.includes(photoId)
            ? state.favorites.filter(id => id !== photoId)
            : [...state.favorites, photoId]
    })),
    
    toggleSelection: (photoId) => set((state) => ({
        selections: state.selections.includes(photoId)
            ? state.selections.filter(id => id !== photoId)
            : [...state.selections, photoId]
    })),
    
    setFavorites: (favorites) => set({ favorites }),
    setSelections: (selections) => set({ selections }),
    
    // Navigation
    navigate: (page) => {
        const { page: currentPage, navigationStack, userRole } = get();
        
        // Build new stack
        const newStack = [...navigationStack, page];
        
        set({
            page,
            previousPage: currentPage,
            navigationStack: newStack,
        });
    },
    
    goBack: () => {
        const { navigationStack, page, userRole, studioReturnToProject, currentAlbum, currentFolder, projectHasFolders } = get();
        
        // Handle back from cover page
        if (page === 'cover') {
            const isStudio = userRole && (userRole === 'studio' || userRole.startsWith('studio_'));
            if (isStudio && studioReturnToProject) {
                set({
                    currentAlbum: null,
                    studioReturnToProject: null,
                    projectHasFolders: true,
                    page: 'dashboard',
                    previousPage: null,
                });
            } else {
                set({
                    currentAlbum: null,
                    projectHasFolders: true,
                    page: 'albums',
                });
            }
            return;
        }
        
        // Handle back from albumFolders page
        if (page === 'albumFolders') {
            set({ page: 'cover' });
            return;
        }
        
        // Handle back from gallery page
        if (page === 'gallery' && currentAlbum) {
            set({ galleryContent: null });
            
            if (currentFolder || projectHasFolders) {
                set({
                    currentFolder: null,
                    page: 'albumFolders',
                });
            } else {
                set({ page: 'cover' });
            }
            return;
        }
        
        // Default: use navigation stack
        if (navigationStack.length > 1) {
            const newStack = [...navigationStack];
            newStack.pop();
            const previousPage = newStack[newStack.length - 1];
            
            set({
                navigationStack: newStack,
                page: previousPage,
            });
        }
    },
    
    setUserRole: (role) => set({ userRole: role }),
    setStudioReturnToProject: (album) => set({ studioReturnToProject: album }),
    setProjectHasFolders: (hasFolders) => set({ projectHasFolders: hasFolders }),
    
    // Loading
    setLoading: (loading) => set({ isLoading: loading }),
    
    // Reset
    reset: () => set(initialState),
}));

// Selectors for common derived state
export const useIsStudioUser = () => useAppStore((state) => 
    state.userRole && (state.userRole === 'studio' || state.userRole.startsWith('studio_'))
);

export const useCurrentAlbum = () => useAppStore((state) => state.currentAlbum);
export const useAlbums = () => useAppStore((state) => state.albums);
export const useClients = () => useAppStore((state) => state.clients);
export const usePackages = () => useAppStore((state) => state.packages);
export const useInvoices = () => useAppStore((state) => state.invoices);
