/**
 * Package Types Service
 * Handles package type operations for dynamic package system
 */

import { apiClient } from '../lib/api-client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDependency {
  field: string;
  value: any;
}

export interface FieldSchema {
  name: string;
  type: 'text' | 'number' | 'toggle' | 'select' | 'multi-select' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: FieldOption[];
  dependency?: FieldDependency;
}

export interface FormSection {
  title: string;
  fields: FieldSchema[];
}

export interface PackageTypeAttributeSchema {
  sections: FormSection[];
}

export interface PackageType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  is_predefined: boolean;
  is_active: boolean;
  attribute_schema: PackageTypeAttributeSchema;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PackageTypeSimple {
  id: string;
  name: string;
  display_name: string;
  icon?: string;
  is_predefined: boolean;
}

export interface PackageTypeListResponse {
  package_types: PackageType[];
  total: number;
}

export interface CreatePackageTypeRequest {
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  attribute_schema: PackageTypeAttributeSchema;
}

export interface UpdatePackageTypeRequest {
  name?: string;
  display_name?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
  attribute_schema?: PackageTypeAttributeSchema;
}

// ============================================================================
// PACKAGE TYPE SERVICE
// ============================================================================

class PackageTypeService {
  private cacheKey = 'packageTypes';
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private cache: { data: PackageType[]; timestamp: number } | null = null;

  /**
   * Get all package types with optional filters
   */
  async getPackageTypes(includeInactive = false, onlyPredefined = false): Promise<PackageTypeListResponse> {
    // Check cache first
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheExpiry && !includeInactive) {
      return { package_types: this.cache.data, total: this.cache.data.length };
    }

    const params: Record<string, string> = {};
    if (includeInactive) params.include_inactive = 'true';
    if (onlyPredefined) params.only_predefined = 'true';

    const response = await apiClient.get<PackageTypeListResponse>('/v2/package-types/', params);
    
    // Update cache
    if (!includeInactive) {
      this.cache = { data: response.package_types, timestamp: Date.now() };
    }
    
    return response;
  }

  /**
   * Get simplified list of package types (for dropdowns)
   */
  async getSimpleList(): Promise<PackageTypeSimple[]> {
    return apiClient.get<PackageTypeSimple[]>('/v2/package-types/simple');
  }

  /**
   * Get single package type by ID
   */
  async getPackageType(typeId: string): Promise<PackageType> {
    return apiClient.get<PackageType>(`/v2/package-types/${typeId}`);
  }

  /**
   * Get just the attribute schema for a package type
   */
  async getPackageTypeSchema(typeId: string): Promise<PackageTypeAttributeSchema> {
    return apiClient.get<PackageTypeAttributeSchema>(`/v2/package-types/${typeId}/schema`);
  }

  /**
   * Create new custom package type
   */
  async createPackageType(data: CreatePackageTypeRequest): Promise<PackageType> {
    const response = await apiClient.post<PackageType>('/v2/package-types/', data);
    this.clearCache();
    return response;
  }

  /**
   * Update custom package type
   */
  async updatePackageType(typeId: string, data: UpdatePackageTypeRequest): Promise<PackageType> {
    const response = await apiClient.patch<PackageType>(`/v2/package-types/${typeId}`, data);
    this.clearCache();
    return response;
  }

  /**
   * Delete (deactivate) custom package type
   */
  async deletePackageType(typeId: string): Promise<void> {
    await apiClient.delete<void>(`/v2/package-types/${typeId}`);
    this.clearCache();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Get predefined types only (for display)
   */
  async getPredefinedTypes(): Promise<PackageType[]> {
    const response = await this.getPackageTypes(false, true);
    return response.package_types;
  }

  /**
   * Find package type by name
   */
  async findByName(name: string): Promise<PackageType | null> {
    const response = await this.getPackageTypes();
    return response.package_types.find(pt => pt.name === name.toLowerCase()) || null;
  }
}

export const packageTypeService = new PackageTypeService();
