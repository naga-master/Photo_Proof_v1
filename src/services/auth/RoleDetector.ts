/**
 * Role Detector Service
 * 
 * Detects user role (client vs studio) and loads appropriate cache profile.
 * Role determines caching strategy:
 * - Client: Aggressive caching (cache everything)
 * - Studio: Selective caching (LRU with limits)
 */

import { cacheEvents, CacheEventType } from '../cache-events/CacheEventEmitter';
import { configLoader } from '../ConfigLoader';
import type { ClientCacheProfile, StudioCacheProfile } from '../../../config/cache-strategy.config';

export type UserRole = 'client' | 'studio' | 'unknown';

export interface UserProfile {
  role: UserRole;
  userId?: string;
  projectCount?: number;
  cacheProfile: ClientCacheProfile | StudioCacheProfile;
}

class RoleDetector {
  private currentProfile: UserProfile | null = null;
  private listeners: Set<(profile: UserProfile) => void> = new Set();

  /**
   * Detect user role from auth context
   */
  detectRole(authData: {
    role?: string;
    userId?: string;
    projectCount?: number;
  }): UserProfile {
    const role = this.normalizeRole(authData.role);
    const config = configLoader.getConfig();

    let cacheProfile: ClientCacheProfile | StudioCacheProfile;
    
    if (role === 'client') {
      cacheProfile = config.profiles.client;
    } else if (role === 'studio') {
      cacheProfile = config.profiles.studio;
    } else {
      // Default to studio profile for unknown (more conservative)
      cacheProfile = config.profiles.studio;
    }

    const profile: UserProfile = {
      role,
      userId: authData.userId,
      projectCount: authData.projectCount,
      cacheProfile,
    };

    this.currentProfile = profile;

    // Emit role detection event
    cacheEvents.emit({
      type: CacheEventType.ROLE_DETECTED,
      metadata: {
        role,
        userId: authData.userId,
        projectCount: authData.projectCount,
      },
    });

    // Emit profile loaded event
    cacheEvents.emit({
      type: CacheEventType.PROFILE_LOADED,
      metadata: {
        role,
        maxProjects: 'maxActiveProjects' in cacheProfile 
          ? cacheProfile.maxActiveProjects 
          : cacheProfile.maxProjects,
        maxMemoryMB: cacheProfile.maxMemoryMB,
        prefetchStrategy: cacheProfile.prefetchStrategy,
      },
    });

    // Notify listeners
    this.notifyListeners(profile);

    return profile;
  }

  /**
   * Auto-detect role from project count
   * Heuristic: <20 projects = client, >=20 = studio
   */
  autoDetectFromProjectCount(projectCount: number): UserRole {
    if (projectCount < 20) {
      return 'client';
    } else {
      return 'studio';
    }
  }

  /**
   * Get current user profile
   */
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  /**
   * Get current role
   */
  getCurrentRole(): UserRole {
    return this.currentProfile?.role || 'unknown';
  }

  /**
   * Check if current user is client
   */
  isClient(): boolean {
    return this.currentProfile?.role === 'client';
  }

  /**
   * Check if current user is studio
   */
  isStudio(): boolean {
    return this.currentProfile?.role === 'studio';
  }

  /**
   * Subscribe to profile changes
   */
  subscribe(listener: (profile: UserProfile) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private normalizeRole(role?: string): UserRole {
    if (!role) return 'unknown';
    
    const normalized = role.toLowerCase();
    if (normalized === 'client') return 'client';
    if (normalized === 'studio') return 'studio';
    
    return 'unknown';
  }

  private notifyListeners(profile: UserProfile): void {
    this.listeners.forEach(listener => {
      try {
        listener(profile);
      } catch (error) {
        console.error('[RoleDetector] Error in listener:', error);
      }
    });
  }

  /**
   * Reset profile (e.g., on logout)
   */
  reset(): void {
    this.currentProfile = null;
    
    cacheEvents.emit({
      type: CacheEventType.ROLE_DETECTED,
      metadata: { role: 'unknown', action: 'reset' },
    });
  }
}

// Singleton instance
export const roleDetector = new RoleDetector();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__roleDetector = {
    getRole: () => roleDetector.getCurrentRole(),
    getProfile: () => roleDetector.getCurrentProfile(),
    isClient: () => roleDetector.isClient(),
    isStudio: () => roleDetector.isStudio(),
  };
}

export default roleDetector;
