/**
 * TanStack Query Provider
 * 
 * Wraps the application with QueryClientProvider for data fetching.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with sensible defaults
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Don't refetch on window focus in development
            refetchOnWindowFocus: import.meta.env.PROD,
            // Retry failed requests 3 times
            retry: 3,
            // Consider data stale after 30 seconds by default
            staleTime: 30 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
        },
        mutations: {
            retry: 1,
        },
    },
});

interface Props {
    children: React.ReactNode;
}

export function QueryProvider({ children }: Props) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

// Export the client for manual invalidation if needed
export { queryClient };
