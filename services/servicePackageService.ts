/**
 * Service Packages Service
 * Handles photography service packages/pricing tiers
 */

import { apiClient } from '../lib/api-client';

export interface ServicePackageFeature {
  name: string;
  included: boolean;
  details?: string | null;
}

export interface ServicePackage {
  id: string;
  studio_id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  package_type_id?: string | null;
  features: ServicePackageFeature[];
  deliverables?: string[];
  restrictions?: Record<string, any> | null;
  lifecycle_config?: Record<string, any> | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServicePackageRequest {
  name: string;
  category: string;
  description: string;
  price: number;
  package_type_id?: string | null;
  features: ServicePackageFeature[];
  deliverables?: string[];
  restrictions?: Record<string, any> | null;
  lifecycle_config?: Record<string, any> | null;
}

export interface UpdateServicePackageRequest {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  package_type_id?: string | null;
  features?: ServicePackageFeature[];
  deliverables?: string[];
  restrictions?: Record<string, any> | null;
  lifecycle_config?: Record<string, any> | null;
}

export interface ServicePackageListResponse {
  packages: ServicePackage[];
  total: number;
}

class ServicePackageService {
  /**
   * Get all service packages for current studio
   */
  async getServicePackages(studioId?: string, category?: string): Promise<ServicePackageListResponse> {
    const params: Record<string, string> = {};
    if (studioId) params.studio_id = studioId;
    if (category) params.category = category;
    
    return apiClient.get<ServicePackageListResponse>('/v2/packages', params);
  }

  /**
   * Get single service package by ID
   */
  async getServicePackage(packageId: string): Promise<ServicePackage> {
    return apiClient.get<ServicePackage>(`/v2/packages/${packageId}`);
  }

  /**
   * Create new service package
   */
  async createServicePackage(data: CreateServicePackageRequest): Promise<ServicePackage> {
    return apiClient.post<ServicePackage>('/v2/packages', data);
  }

  /**
   * Update service package
   */
  async updateServicePackage(packageId: string, data: UpdateServicePackageRequest): Promise<ServicePackage> {
    return apiClient.patch<ServicePackage>(`/v2/packages/${packageId}`, data);
  }

  /**
   * Delete service package
   */
  async deleteServicePackage(packageId: string): Promise<void> {
    return apiClient.delete<void>(`/v2/packages/${packageId}`);
  }
}

export const servicePackageService = new ServicePackageService();
