import { apiClient } from '../lib/api-client';

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  header_style: string;
  grid_pattern: string;
  color_theme: string;
  reference_url?: string | null;
}

export interface LayoutPresetsResponse {
  presets: LayoutPreset[];
}

class LayoutService {
  async getPresets(): Promise<LayoutPreset[]> {
    const response = await apiClient.get<LayoutPresetsResponse>('/api/v1/layouts/presets');
    return response.presets;
  }
}

export const layoutService = new LayoutService();
