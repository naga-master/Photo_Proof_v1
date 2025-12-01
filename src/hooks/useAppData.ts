/**
 * useAppData Hook
 * Handles loading all app data from API when user is authenticated
 */

import { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../stores/appStore';
import { projectService } from '../../services/projectService';
import { clientService } from '../../services/clientService';
import { servicePackageService } from '../../services/servicePackageService';
import { invoiceService } from '../../services/invoiceService';
import { mapProjectToAlbum, mapClientResponse, mapServicePackageResponse, mapInvoiceResponse } from '../../lib/mappers';
import type { Album } from '../../types';

export function useAppData() {
    const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const { 
        setAlbums, 
        setClients, 
        setPackages, 
        setInvoices, 
        setLoading,
        isLoading 
    } = useAppStore();

    const loadData = useCallback(async () => {
        if (!isAuthenticated || authLoading) {
            setLoading(false);
            return;
        }

        console.log('[useAppData] Loading data from API...');
        setLoading(true);

        try {
            // Load projects
            const projectsResponse = await projectService.getProjects();
            const projects = projectsResponse.projects || [];
            const albums: Album[] = projects.map(mapProjectToAlbum);

            // PERFORMANCE: Don't load photos on startup - lazy load when user navigates to project
            const albumsWithPhotos = albums.map(album => ({ ...album, photos: [] }));

            setAlbums(albumsWithPhotos);
            console.log(`[useAppData] Loaded ${albumsWithPhotos.length} projects (photos will load on-demand)`);

            // Load clients
            try {
                const clients = await clientService.getClients();
                setClients(clients.map(mapClientResponse));
            } catch (clientError) {
                console.error('[useAppData] Error loading clients:', clientError);
                setClients([]);
            }

            // Load packages
            try {
                const packagesResponse = await servicePackageService.getServicePackages();
                const packages = packagesResponse.packages || [];
                setPackages(packages.map(mapServicePackageResponse));
            } catch (packageError) {
                console.error('[useAppData] Error loading packages:', packageError);
                setPackages([]);
            }

            // Load invoices
            try {
                const invoices = await invoiceService.getInvoices();
                setInvoices(invoices.map(mapInvoiceResponse));
            } catch (invoiceError) {
                console.error('[useAppData] Error loading invoices:', invoiceError);
                setInvoices([]);
            }

        } catch (error: any) {
            console.error('[useAppData] Error loading data:', error);
            if (error?.status === 401) {
                await logout();
            } else {
                toast.error('Failed to load data from server');
            }
            setAlbums([]);
            setClients([]);
            setPackages([]);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authLoading, logout, setAlbums, setClients, setPackages, setInvoices, setLoading]);

    // Load data when authentication changes
    useEffect(() => {
        loadData();
    }, [loadData]);

    return { loadData, isLoading };
}
