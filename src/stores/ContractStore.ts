/**
 * Contract Store
 * 
 * Global state management for contracts.
 * Handles contract CRUD operations and caching.
 */

import { create } from 'zustand';
import { contractService, Contract, ContractStats } from '../../services/contractService';
import { cacheEvents, CacheEventType } from '../services/cache-events/CacheEventEmitter';
import { memoryCacheManager } from '../services/cache/MemoryCacheManager';
import { indexedDBManager } from '../services/cache/IndexedDBManager';
import { configLoader } from '../services/ConfigLoader';

interface ContractsResponse {
  contracts: Contract[];
  total: number;
  offset: number;
  limit: number;
}

interface ContractState {
  // Data
  contracts: Contract[];
  stats: ContractStats | null;
  loading: boolean;
  loadingStats: boolean;
  error: string | null;
  lastFetch: number | null;
  currentFilter: string | undefined;

  // Actions
  fetchContracts: (filter?: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  refreshContracts: (filter?: string) => Promise<void>;
  invalidateCache: () => void;
  clearAll: () => void;

  // Getters
  getContractById: (contractId: string) => Contract | undefined;
}

export const useContractStore = create<ContractState>((set, get) => ({
  // Initial state
  contracts: [],
  stats: null,
  loading: false,
  loadingStats: false,
  error: null,
  lastFetch: null,
  currentFilter: undefined,

  // Fetch contracts with caching
  fetchContracts: async (filter?: string) => {
    const state = get();
    const cacheKey = `contracts:${filter || 'all'}`;

    // Guard 1: Already loading - skip (prevents race condition from React Strict Mode)
    if (state.loading) {
      return;
    }

    // Guard 2: Data already exists in store for this filter
    if (state.contracts.length > 0 && state.currentFilter === filter && state.lastFetch) {
      return;
    }

    // Set loading IMMEDIATELY to prevent concurrent calls
    set({ loading: true, error: null });

    // Check memory cache first (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      const cached = memoryCacheManager.get<ContractsResponse>(cacheKey);
      if (cached) {
        cacheEvents.emit({
          type: CacheEventType.CACHE_HIT,
          metadata: { source: 'memory', key: cacheKey },
        });

        set({
          contracts: cached.contracts,
          lastFetch: Date.now(),
          currentFilter: filter,
          loading: false,
          error: null,
        });
        return;
      }
    }

    // Check IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      const cached = await indexedDBManager.get<ContractsResponse>(cacheKey);
      if (cached) {
        cacheEvents.emit({
          type: CacheEventType.CACHE_HIT,
          metadata: { source: 'indexedDB', key: cacheKey },
        });

        set({
          contracts: cached.contracts,
          lastFetch: Date.now(),
          currentFilter: filter,
          loading: false,
          error: null,
        });

        // Also populate memory cache
        if (configLoader.isFeatureEnabled('memoryCache')) {
          memoryCacheManager.set(cacheKey, cached);
        }
        return;
      }
    }

    // Cache miss - fetch from API
    cacheEvents.emit({
      type: CacheEventType.CACHE_MISS,
      metadata: { key: cacheKey },
    });

    cacheEvents.emit({
      type: CacheEventType.API_CALL_START,
      metadata: { endpoint: 'getContracts', filter },
    });

    try {
      const startTime = Date.now();
      const response = await contractService.getContracts({
        status: filter,
        limit: 50,
      });
      const duration = Date.now() - startTime;

      cacheEvents.emit({
        type: CacheEventType.API_CALL_SUCCESS,
        metadata: {
          endpoint: 'getContracts',
          count: response.contracts.length,
          filter,
        },
        duration,
      });

      set({
        contracts: response.contracts,
        lastFetch: Date.now(),
        currentFilter: filter,
        loading: false,
      });

      // Store in memory cache (if feature enabled)
      if (configLoader.isFeatureEnabled('memoryCache')) {
        memoryCacheManager.set(cacheKey, response);
      }

      // Store in IndexedDB cache (if feature enabled)
      if (configLoader.isFeatureEnabled('indexedDBCache')) {
        await indexedDBManager.set(cacheKey, response);
      }

      cacheEvents.emit({
        type: CacheEventType.CACHE_SET,
        metadata: { source: 'memory+indexedDB', key: cacheKey },
      });
    } catch (error: any) {
      cacheEvents.emit({
        type: CacheEventType.API_CALL_ERROR,
        metadata: { endpoint: 'getContracts', error: error.message },
      });

      set({
        loading: false,
        error: error.response?.data?.detail || error.message || 'Failed to load contracts',
      });

      throw error;
    }
  },

  // Fetch stats with caching
  fetchStats: async () => {
    const state = get();
    const cacheKey = 'contracts:stats';

    // Guard 1: Already loading stats - skip (prevents race condition)
    if (state.loadingStats) {
      return;
    }

    // Guard 2: Stats already exists in store
    if (state.stats !== null) {
      return;
    }

    // Set loading IMMEDIATELY to prevent concurrent calls
    set({ loadingStats: true });

    // Check memory cache first (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      const cached = memoryCacheManager.get<ContractStats>(cacheKey);
      if (cached) {
        cacheEvents.emit({
          type: CacheEventType.CACHE_HIT,
          metadata: { source: 'memory', key: cacheKey },
        });

        set({ stats: cached, loadingStats: false });
        return;
      }
    }

    // Check IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      const cached = await indexedDBManager.get<ContractStats>(cacheKey);
      if (cached) {
        cacheEvents.emit({
          type: CacheEventType.CACHE_HIT,
          metadata: { source: 'indexedDB', key: cacheKey },
        });

        set({ stats: cached, loadingStats: false });

        // Also populate memory cache
        if (configLoader.isFeatureEnabled('memoryCache')) {
          memoryCacheManager.set(cacheKey, cached);
        }
        return;
      }
    }

    // Cache miss - fetch from API
    cacheEvents.emit({
      type: CacheEventType.CACHE_MISS,
      metadata: { key: cacheKey },
    });

    try {
      const startTime = Date.now();
      const statsData = await contractService.getContractStats();
      const duration = Date.now() - startTime;

      cacheEvents.emit({
        type: CacheEventType.API_CALL_SUCCESS,
        metadata: { endpoint: 'getContractStats' },
        duration,
      });

      set({ stats: statsData, loadingStats: false });

      // Store in memory cache (if feature enabled)
      if (configLoader.isFeatureEnabled('memoryCache')) {
        memoryCacheManager.set(cacheKey, statsData);
      }

      // Store in IndexedDB cache (if feature enabled)
      if (configLoader.isFeatureEnabled('indexedDBCache')) {
        await indexedDBManager.set(cacheKey, statsData);
      }
    } catch (error: any) {
      console.error('Error fetching contract stats:', error);
      set({ loadingStats: false });
      // Stats are non-critical, don't throw
    }
  },

  // Force refresh from API (bypasses cache)
  refreshContracts: async (filter?: string) => {
    const state = get();
    const filterToUse = filter !== undefined ? filter : state.currentFilter;
    
    // Reset state to force fresh fetch (clear data so guards don't block)
    set({
      contracts: [],
      stats: null,
      loading: false,
      loadingStats: false,
      lastFetch: null,
    });
    
    // Invalidate cache
    get().invalidateCache();
    
    // Then fetch fresh data
    await get().fetchContracts(filterToUse);
    await get().fetchStats();
  },

  // Invalidate all contract caches
  invalidateCache: () => {
    const state = get();
    
    // Clear memory cache entries
    if (configLoader.isFeatureEnabled('memoryCache')) {
      memoryCacheManager.delete(`contracts:${state.currentFilter || 'all'}`);
      memoryCacheManager.delete('contracts:stats');
      // Also clear common filter variations
      ['all', 'draft', 'sent', 'viewed', 'signed', 'expired', 'cancelled'].forEach(f => {
        memoryCacheManager.delete(`contracts:${f}`);
      });
    }

    // Clear IndexedDB cache entries
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      indexedDBManager.delete(`contracts:${state.currentFilter || 'all'}`);
      indexedDBManager.delete('contracts:stats');
      ['all', 'draft', 'sent', 'viewed', 'signed', 'expired', 'cancelled'].forEach(f => {
        indexedDBManager.delete(`contracts:${f}`);
      });
    }

    cacheEvents.emit({
      type: CacheEventType.CACHE_EVICT,
      metadata: { scope: 'contracts', reason: 'invalidation' },
    });
  },

  // Clear all state
  clearAll: () => {
    get().invalidateCache();
    
    set({
      contracts: [],
      stats: null,
      loading: false,
      loadingStats: false,
      error: null,
      lastFetch: null,
      currentFilter: undefined,
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_CLEAR,
      metadata: { scope: 'contracts' },
    });
  },

  // Get contract by ID from store
  getContractById: (contractId: string) => {
    return get().contracts.find(c => c.id === contractId);
  },
}));

export default useContractStore;
