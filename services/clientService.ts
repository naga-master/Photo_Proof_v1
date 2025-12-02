/**
 * Clients Service
 * Handles client management for studios
 */

import { apiClient } from '../lib/api-client';

export interface Client {
  id: string;
  studio_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  username?: string;
  password?: string;  // Plain password (only returned during creation/reset)
  has_password?: boolean;  // Indicates if client has a password set
  avatar_url?: string | null;
  profile_picture?: string | null;
  whatsapp_opt_in?: boolean;
  email_opt_in?: boolean;
  status?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  project_count?: number;
  total_photos?: number;
}

export interface PasswordResponse {
  client_id: number;
  password?: string;
  has_password?: boolean;
  is_new?: boolean;
  message?: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  username?: string;
  password?: string;
  whatsapp_opt_in?: boolean;
  email_opt_in?: boolean;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  is_active?: boolean;
  username?: string;
  avatar_url?: string | null;
  profile_picture?: string | null;
  whatsapp_opt_in?: boolean;
  email_opt_in?: boolean;
}

class ClientService {
  /**
   * Get all clients for current studio
   */
  async getClients(studioId?: string, search?: string): Promise<Client[]> {
    const params: Record<string, string> = {};
    if (studioId) params.studio_id = studioId;
    if (search) params.search = search;
    
    return apiClient.get<Client[]>('/v2/clients/', params);
  }

  /**
   * Get single client by ID
   */
  async getClient(clientId: string): Promise<Client> {
    return apiClient.get<Client>(`/v2/clients/${clientId}`);
  }

  /**
   * Create new client
   */
  async createClient(data: CreateClientRequest, force: boolean = false): Promise<Client> {
    const url = force ? '/v2/clients/?force=true' : '/v2/clients/';
    return apiClient.post<Client>(url, data);
  }

  /**
   * Update client
   */
  async updateClient(clientId: string, data: UpdateClientRequest): Promise<Client> {
    return apiClient.patch<Client>(`/v2/clients/${clientId}`, data);
  }

  /**
   * Delete client
   */
  async deleteClient(clientId: string): Promise<void> {
    return apiClient.delete<void>(`/v2/clients/${clientId}`);
  }

  /**
   * Archive client (soft delete)
   */
  async archiveClient(clientId: string): Promise<Client> {
    return apiClient.post<Client>(`/v2/clients/${clientId}/archive`);
  }

  /**
   * Activate archived client
   */
  async activateClient(clientId: string): Promise<Client> {
    return apiClient.post<Client>(`/v2/clients/${clientId}/activate`);
  }

  /**
   * Get client's projects
   */
  async getClientProjects(clientId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/v2/clients/${clientId}/projects`);
  }

  /**
   * Set or reset client's gallery access password
   * Returns the plain password for studio to share with client
   */
  async setPassword(clientId: string, password?: string): Promise<PasswordResponse> {
    return apiClient.put<PasswordResponse>(`/v2/clients/${clientId}/password`, { password });
  }

  /**
   * Get client's password status
   * If no password exists, generates one
   */
  async getPassword(clientId: string): Promise<PasswordResponse> {
    return apiClient.get<PasswordResponse>(`/v2/clients/${clientId}/password`);
  }

  /**
   * Generate new password for client (resets existing)
   */
  async resetPassword(clientId: string): Promise<PasswordResponse> {
    return apiClient.put<PasswordResponse>(`/v2/clients/${clientId}/password`, {});
  }
}

export const clientService = new ClientService();
