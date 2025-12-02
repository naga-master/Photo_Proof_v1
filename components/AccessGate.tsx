/**
 * AccessGate Component
 * 
 * Conditionally renders children based on feature flags and user permissions.
 * 
 * Usage:
 * <AccessGate permission="canEditClients">
 *   <EditButton />
 * </AccessGate>
 * 
 * <AccessGate feature="clients_module" permission="canCreateClients">
 *   <AddClientButton />
 * </AccessGate>
 */

import React, { ReactNode } from 'react';
import { useAccessControl } from '../contexts/AccessControlContext';

interface AccessGateProps {
    children: ReactNode;
    
    // Feature flag to check (from studio features)
    feature?: string;
    
    // Permission to check (from user permissions)
    permission?: string;
    
    // Multiple permissions (user needs ANY of these)
    anyPermission?: string[];
    
    // Multiple permissions (user needs ALL of these)
    allPermissions?: string[];
    
    // What to render if access is denied (default: null)
    fallback?: ReactNode;
    
    // If true, renders fallback instead of hiding completely
    showFallback?: boolean;
}

export const AccessGate: React.FC<AccessGateProps> = ({
    children,
    feature,
    permission,
    anyPermission,
    allPermissions,
    fallback = null,
    showFallback = false,
}) => {
    const { canAccess, isFeatureEnabled, hasPermission } = useAccessControl();

    // Check feature flag first
    if (feature && !isFeatureEnabled(feature)) {
        return showFallback ? <>{fallback}</> : null;
    }

    // Check single permission
    if (permission && !hasPermission(permission)) {
        return showFallback ? <>{fallback}</> : null;
    }

    // Check any of multiple permissions
    if (anyPermission && anyPermission.length > 0) {
        const hasAny = anyPermission.some(p => hasPermission(p));
        if (!hasAny) {
            return showFallback ? <>{fallback}</> : null;
        }
    }

    // Check all of multiple permissions
    if (allPermissions && allPermissions.length > 0) {
        const hasAll = allPermissions.every(p => hasPermission(p));
        if (!hasAll) {
            return showFallback ? <>{fallback}</> : null;
        }
    }

    // Combined feature + permission check
    if (feature && permission && !canAccess(feature, permission)) {
        return showFallback ? <>{fallback}</> : null;
    }

    return <>{children}</>;
};

// Convenience components for common use cases
export const CanView: React.FC<{ module: string; children: ReactNode; fallback?: ReactNode }> = ({ 
    module, 
    children, 
    fallback = null 
}) => {
    const permissionMap: Record<string, string> = {
        clients: 'canViewClients',
        projects: 'canViewProjects',
        invoices: 'canViewInvoices',
        analytics: 'canViewAnalytics',
    };
    
    return (
        <AccessGate permission={permissionMap[module]} fallback={fallback}>
            {children}
        </AccessGate>
    );
};

export const CanCreate: React.FC<{ module: string; children: ReactNode; fallback?: ReactNode }> = ({ 
    module, 
    children, 
    fallback = null 
}) => {
    const permissionMap: Record<string, string> = {
        clients: 'canCreateClients',
        projects: 'canCreateProjects',
        invoices: 'canCreateInvoices',
    };
    
    return (
        <AccessGate permission={permissionMap[module]} fallback={fallback}>
            {children}
        </AccessGate>
    );
};

export const CanEdit: React.FC<{ module: string; children: ReactNode; fallback?: ReactNode }> = ({ 
    module, 
    children, 
    fallback = null 
}) => {
    const permissionMap: Record<string, string> = {
        clients: 'canEditClients',
        projects: 'canEditProjects',
        invoices: 'canEditInvoices',
        photos: 'canEditPhotos',
    };
    
    return (
        <AccessGate permission={permissionMap[module]} fallback={fallback}>
            {children}
        </AccessGate>
    );
};

export const CanDelete: React.FC<{ module: string; children: ReactNode; fallback?: ReactNode }> = ({ 
    module, 
    children, 
    fallback = null 
}) => {
    const permissionMap: Record<string, string> = {
        clients: 'canDeleteClients',
        projects: 'canDeleteProjects',
        invoices: 'canDeleteInvoices',
        photos: 'canDeletePhotos',
    };
    
    return (
        <AccessGate permission={permissionMap[module]} fallback={fallback}>
            {children}
        </AccessGate>
    );
};

export const CanManage: React.FC<{ module: string; children: ReactNode; fallback?: ReactNode }> = ({ 
    module, 
    children, 
    fallback = null 
}) => {
    const permissionMap: Record<string, string> = {
        users: 'canManageUsers',
        settings: 'canManageSettings',
        branding: 'canManageBranding',
        services: 'canManageServices',
        packages: 'canManagePackages',
    };
    
    return (
        <AccessGate permission={permissionMap[module]} fallback={fallback}>
            {children}
        </AccessGate>
    );
};

export default AccessGate;
