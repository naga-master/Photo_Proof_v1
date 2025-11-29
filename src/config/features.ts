/**
 * Feature Flags Configuration
 * 
 * AI-safe architecture: Feature flags allow safe rollout of new features
 * and quick rollback without code changes.
 * 
 * Usage:
 *   import { features, isFeatureEnabled } from '@/config/features';
 *   if (isFeatureEnabled('newGalleryLayout')) { ... }
 */

export interface FeatureFlags {
    // Upload features
    parallelUploads: boolean;
    resumableUploads: boolean;
    uploadCompression: boolean;
    
    // Gallery features
    newGalleryLayout: boolean;
    infiniteScroll: boolean;
    advancedFiltering: boolean;
    
    // Client features
    clientSelfRegistration: boolean;
    clientNotifications: boolean;
    
    // Payment features
    onlinePayments: boolean;
    invoiceReminders: boolean;
    
    // AI features
    autoTagging: boolean;
    facialRecognition: boolean;
    
    // Debug/Dev
    debugMode: boolean;
    mockApi: boolean;
}

const defaultFeatures: FeatureFlags = {
    // Upload features
    parallelUploads: true,
    resumableUploads: true,
    uploadCompression: true,
    
    // Gallery features
    newGalleryLayout: false,
    infiniteScroll: true,
    advancedFiltering: false,
    
    // Client features
    clientSelfRegistration: false,
    clientNotifications: true,
    
    // Payment features
    onlinePayments: false,
    invoiceReminders: true,
    
    // AI features
    autoTagging: false,
    facialRecognition: false,
    
    // Debug/Dev
    debugMode: import.meta.env.DEV,
    mockApi: false,
};

// Override features from environment
const envOverrides: Partial<FeatureFlags> = {};

// Parse environment feature flags (VITE_FEATURE_XXX)
if (typeof import.meta.env !== 'undefined') {
    Object.keys(defaultFeatures).forEach((key) => {
        const envKey = `VITE_FEATURE_${key.toUpperCase()}`;
        const envValue = (import.meta.env as Record<string, string>)[envKey];
        if (envValue !== undefined) {
            envOverrides[key as keyof FeatureFlags] = envValue === 'true';
        }
    });
}

export const features: FeatureFlags = {
    ...defaultFeatures,
    ...envOverrides,
};

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return features[feature] === true;
}

export function getEnabledFeatures(): string[] {
    return Object.entries(features)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name);
}

export function getDisabledFeatures(): string[] {
    return Object.entries(features)
        .filter(([_, enabled]) => !enabled)
        .map(([name]) => name);
}
