/**
 * Client Query Hooks (TanStack Query)
 * 
 * Provides data fetching with automatic caching for clients.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../../services/clientService';
import { mapClientResponse } from '../../lib/mappers';
import type { Client } from '../../types';

// Query keys for cache management
export const clientKeys = {
    all: ['clients'] as const,
    lists: () => [...clientKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...clientKeys.lists(), filters] as const,
    details: () => [...clientKeys.all, 'detail'] as const,
    detail: (id: string) => [...clientKeys.details(), id] as const,
};

/**
 * Fetch all clients
 */
export function useClients() {
    return useQuery({
        queryKey: clientKeys.lists(),
        queryFn: async (): Promise<Client[]> => {
            const clients = await clientService.getClients();
            return clients.map(mapClientResponse);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Fetch a single client by ID
 */
export function useClient(clientId: string | undefined) {
    return useQuery({
        queryKey: clientKeys.detail(clientId!),
        queryFn: async (): Promise<Client> => {
            const client = await clientService.getClient(clientId!);
            return mapClientResponse(client);
        },
        enabled: !!clientId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Mutation for creating a new client
 */
export function useCreateClient() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: { name: string; email: string; phone?: string }) => 
            clientService.createClient(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
        },
    });
}

/**
 * Mutation for updating a client
 */
export function useUpdateClient() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => 
            clientService.updateClient(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
        },
    });
}

/**
 * Mutation for deleting a client
 */
export function useDeleteClient() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id: string) => clientService.deleteClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
        },
    });
}
