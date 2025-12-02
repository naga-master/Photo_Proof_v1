/**
 * Access Control Context
 * 
 * Two-layer permission system:
 * 1. Studio Features (global) - from admin app / subscription plan
 * 2. User Permissions (RBAC) - per-user permissions
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Default permissions for each role (fallback when no custom permissions)
const ROLE_DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
    studio_owner: {
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canViewProjects: true,
        canCreateClients: true,
        canEditClients: true,
        canDeleteClients: true,
        canViewClients: true,
        canCreateInvoices: true,
        canEditInvoices: true,
        canDeleteInvoices: true,
        canViewInvoices: true,
        canViewAnalytics: true,
        canUploadPhotos: true,
        canEditPhotos: true,
        canDeletePhotos: true,
        canViewContracts: true,
        canCreateContracts: true,
        canEditContracts: true,
        canDeleteContracts: true,
        canManageServices: true,
        canManagePackages: true,
        canManageSettings: true,
        canManageUsers: true,
        canManageBranding: true,
        canSendNotifications: true,
        canManageCommunication: true,
        canDownloadOriginals: true,
        canManageComments: true,
        canApplyDiscounts: true,
        canViewRevenue: true,
        canShareExternally: true,
    },
    studio_admin: {
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canViewProjects: true,
        canCreateClients: true,
        canEditClients: true,
        canDeleteClients: false,
        canViewClients: true,
        canCreateInvoices: true,
        canEditInvoices: true,
        canDeleteInvoices: false,
        canViewInvoices: true,
        canViewAnalytics: true,
        canUploadPhotos: true,
        canEditPhotos: true,
        canDeletePhotos: false,
        canViewContracts: true,
        canCreateContracts: true,
        canEditContracts: true,
        canDeleteContracts: true,
        canManageServices: true,
        canManagePackages: true,
        canManageSettings: true,
        canManageUsers: true,
        canManageBranding: true,
        canSendNotifications: true,
        canManageCommunication: false,
        canDownloadOriginals: true,
        canManageComments: true,
        canApplyDiscounts: true,
        canViewRevenue: true,
        canShareExternally: true,
    },
    studio_photographer: {
        canCreateProjects: false,
        canEditProjects: true,
        canDeleteProjects: false,
        canViewProjects: true,
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canViewClients: true,
        canCreateInvoices: false,
        canEditInvoices: false,
        canDeleteInvoices: false,
        canViewInvoices: false,
        canViewAnalytics: true,
        canUploadPhotos: true,
        canEditPhotos: true,
        canDeletePhotos: false,
        canViewContracts: false,
        canCreateContracts: false,
        canEditContracts: false,
        canDeleteContracts: false,
        canManageServices: false,
        canManagePackages: false,
        canManageSettings: false,
        canManageUsers: false,
        canManageBranding: false,
        canSendNotifications: false,
        canManageCommunication: false,
        canDownloadOriginals: true,
        canManageComments: false,
        canApplyDiscounts: false,
        canViewRevenue: false,
        canShareExternally: true,
    },
    client: {
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewProjects: true,
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
        canViewClients: false,
        canCreateInvoices: false,
        canEditInvoices: false,
        canDeleteInvoices: false,
        canViewInvoices: true,
        canViewAnalytics: false,
        canUploadPhotos: false,
        canEditPhotos: false,
        canDeletePhotos: false,
        canViewContracts: true,
        canCreateContracts: false,
        canEditContracts: false,
        canDeleteContracts: false,
        canManageServices: false,
        canManagePackages: false,
        canManageSettings: false,
        canManageUsers: false,
        canManageBranding: false,
        canSendNotifications: false,
        canManageCommunication: false,
        canDownloadOriginals: false,
        canManageComments: false,
        canApplyDiscounts: false,
        canViewRevenue: false,
        canShareExternally: false,
    },
};

// Default features (all enabled unless overridden)
const DEFAULT_FEATURES: Record<string, boolean> = {
    clients_module: true,
    projects_module: true,
    invoices_module: true,
    analytics_module: true,
    settings_module: true,
    services_module: true,
    contracts_module: true,
    notifications_module: true,
    upload_module: true,
};

interface AccessControlContextType {
    // Layer 1: Studio Features
    features: Record<string, boolean>;
    isFeatureEnabled: (feature: string) => boolean;
    
    // Layer 2: User Permissions
    permissions: Record<string, boolean>;
    hasPermission: (permission: string) => boolean;
    
    // Combined check
    canAccess: (feature: string, permission?: string) => boolean;
    
    // Loading state
    isLoading: boolean;
    
    // Refresh permissions from API
    refreshPermissions: () => Promise<void>;
}

const AccessControlContext = createContext<AccessControlContextType | null>(null);

export function useAccessControl(): AccessControlContextType {
    const context = useContext(AccessControlContext);
    if (!context) {
        throw new Error('useAccessControl must be used within an AccessControlProvider');
    }
    return context;
}

interface AccessControlProviderProps {
    children: ReactNode;
}

export function AccessControlProvider({ children }: AccessControlProviderProps) {
    const { user } = useAuth();
    const [features, setFeatures] = useState<Record<string, boolean>>(DEFAULT_FEATURES);
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Fetch studio features from API
    const fetchFeatures = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/studio/features', {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                credentials: 'include',
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.features) {
                    setFeatures({ ...DEFAULT_FEATURES, ...data.features });
                }
            }
        } catch (error) {
            console.error('[AccessControl] Failed to fetch features:', error);
        }
    }, []);

    // Get user permissions (from user object or role defaults)
    const getUserPermissions = useCallback(() => {
        if (!user) {
            console.log('[AccessControl] No user, returning empty permissions');
            return {};
        }

        console.log('[AccessControl] getUserPermissions called for:', {
            userId: user.id,
            email: user.email,
            role: user.role,
            hasPermissions: !!user.permissions,
            permissionsKeys: user.permissions ? Object.keys(user.permissions) : [],
            rawPermissions: user.permissions,
        });

        // Get role defaults as base
        const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role] || ROLE_DEFAULT_PERMISSIONS.client;

        // If user has custom permissions stored, use them directly
        // Missing permissions are treated as FALSE (admin explicitly set them)
        if (user.permissions && Object.keys(user.permissions).length > 0) {
            // Create base with all permissions as false, then overlay stored permissions
            const allFalseBase: Record<string, boolean> = {};
            Object.keys(roleDefaults).forEach(key => {
                allFalseBase[key] = false;
            });
            const result = { ...allFalseBase, ...user.permissions };
            console.log('[AccessControl] Using custom permissions (with false base):', {
                canViewClients: result.canViewClients,
                canViewProjects: result.canViewProjects,
                result,
            });
            return result;
        }

        // Only use role defaults when NO custom permissions have been set
        console.log('[AccessControl] No custom permissions, using role defaults:', {
            role: user.role,
            canViewClients: roleDefaults.canViewClients,
        });
        return roleDefaults;
    }, [user]);

    // Refresh permissions (can be called when needed)
    const refreshPermissions = useCallback(async () => {
        setIsLoading(true);
        try {
            await fetchFeatures();
            const newPermissions = getUserPermissions();
            console.log('[AccessControl] Setting permissions state:', newPermissions);
            setPermissions(newPermissions);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFeatures, getUserPermissions]);

    // Initialize on mount and when user changes
    useEffect(() => {
        if (user) {
            refreshPermissions();
        } else {
            setPermissions({});
            setFeatures(DEFAULT_FEATURES);
            setIsLoading(false);
        }
    }, [user, refreshPermissions]);

    // Check if a feature is enabled
    const isFeatureEnabled = useCallback((feature: string): boolean => {
        return features[feature] !== false;
    }, [features]);

    // Check if user has a permission
    const hasPermission = useCallback((permission: string): boolean => {
        // Studio owner always has all permissions
        if (user?.role === 'studio_owner') {
            console.log(`[AccessControl] hasPermission(${permission}): TRUE (studio_owner)`);
            return true;
        }
        const result = permissions[permission] === true;
        console.log(`[AccessControl] hasPermission(${permission}): ${result}`, { 
            permissionValue: permissions[permission],
            allPermissions: permissions 
        });
        return result;
    }, [permissions, user?.role]);

    // Combined check: feature must be enabled AND user must have permission
    const canAccess = useCallback((feature: string, permission?: string): boolean => {
        // First check if feature is enabled
        if (!isFeatureEnabled(feature)) {
            return false;
        }
        
        // If no specific permission required, just check feature
        if (!permission) {
            return true;
        }
        
        // Check user permission
        return hasPermission(permission);
    }, [isFeatureEnabled, hasPermission]);

    const value: AccessControlContextType = {
        features,
        isFeatureEnabled,
        permissions,
        hasPermission,
        canAccess,
        isLoading,
        refreshPermissions,
    };

    return (
        <AccessControlContext.Provider value={value}>
            {children}
        </AccessControlContext.Provider>
    );
}

export default AccessControlContext;
