/**
 * IndexedDB Schema
 * 
 * Database structure for persistent caching.
 * Uses Dexie.js for type-safe IndexedDB operations.
 */

import Dexie, { Table } from 'dexie';

// Cache entry stored in IndexedDB
export interface CacheEntry {
  key: string;              // Primary key (e.g., "photos:123", "project:456")
  data: any;                // Cached data
  timestamp: number;        // When cached
  expiresAt: number;        // Expiration timestamp
  size: number;             // Estimated size in bytes
  accessCount: number;      // Number of accesses
  lastAccessTime: number;   // Last access timestamp
  version: number;          // Schema version
}

// Project metadata (lightweight, always cached)
export interface ProjectMetadata {
  id: string;               // Primary key
  title: string;
  coverPhotoSrc?: string;
  photoCount: number;
  status: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

// Photo metadata (lightweight, always cached)
export interface PhotoMetadata {
  id: string;               // Primary key
  projectId: string;        // Index
  thumbnailPath?: string;
  fileName: string;
  width?: number;
  height?: number;
  createdAt: string;
}

// Sync status tracking
export interface SyncStatus {
  key: string;              // Primary key (entity type + ID)
  lastSyncTime: number;
  syncVersion: number;
  pendingChanges: boolean;
}

// IndexedDB Database
export class PhotoProofDB extends Dexie {
  // Tables
  cache!: Table<CacheEntry, string>;
  projectMetadata!: Table<ProjectMetadata, string>;
  photoMetadata!: Table<PhotoMetadata, string>;
  syncStatus!: Table<SyncStatus, string>;

  constructor() {
    super('PhotoProofCache');
    
    // Schema version 1
    this.version(1).stores({
      cache: 'key, expiresAt, lastAccessTime',
      projectMetadata: 'id, updatedAt, status',
      photoMetadata: 'id, projectId, createdAt',
      syncStatus: 'key, lastSyncTime',
    });
  }
}

// Singleton instance
export const db = new PhotoProofDB();

// Initialize database
export async function initDB(): Promise<void> {
  try {
    await db.open();
    console.log('[IndexedDB] Database initialized');
  } catch (error) {
    console.error('[IndexedDB] Failed to initialize:', error);
    throw error;
  }
}

// Check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    return 'indexedDB' in window;
  } catch {
    return false;
  }
}

// Get database size estimate
export async function getDBSize(): Promise<number> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return 0;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch {
    return 0;
  }
}

// Get storage quota
export async function getStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percent: number;
}> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { usage: 0, quota: 0, percent: 0 };
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percent = quota > 0 ? (usage / quota) * 100 : 0;
    
    return { usage, quota, percent };
  } catch {
    return { usage: 0, quota: 0, percent: 0 };
  }
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await db.cache.clear();
  await db.projectMetadata.clear();
  await db.photoMetadata.clear();
  await db.syncStatus.clear();
}

export default db;
