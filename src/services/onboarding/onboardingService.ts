/**
 * Onboarding API Service
 * Handles all API calls for studio onboarding flow
 */

const API_BASE = '/api/onboarding';

export interface OnboardingStartData {
  studio_name: string;
  subdomain: string;
  email: string;
  owner_name: string;
  password: string;
  phone?: string;
}

export interface OnboardingBrandingData {
  studio_id: string;
  brand_color: string;
  typography: string;
  custom_css?: string;
}

export interface SubdomainCheckResponse {
  available: boolean;
  subdomain?: string;
  full_domain?: string;
  reason?: string;
}

export interface OnboardingStepResponse {
  studio_id: string;
  subdomain?: string;
  next_step: string;
  message: string;
}

export const onboardingService = {
  /**
   * Check if subdomain is available
   */
  checkSubdomain: async (subdomain: string): Promise<SubdomainCheckResponse> => {
    const response = await fetch(`${API_BASE}/check-subdomain?subdomain=${subdomain}`);
    if (!response.ok) {
      throw new Error('Failed to check subdomain');
    }
    return response.json();
  },

  /**
   * Start onboarding - create studio and owner account
   */
  startOnboarding: async (data: OnboardingStartData): Promise<OnboardingStepResponse> => {
    const response = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create studio');
    }
    
    return response.json();
  },

  /**
   * Update studio branding
   */
  updateBranding: async (data: OnboardingBrandingData): Promise<OnboardingStepResponse> => {
    const response = await fetch(`${API_BASE}/branding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update branding');
    }
    
    return response.json();
  },

  /**
   * Configure custom domain
   */
  configureDomain: async (studio_id: string, custom_domain?: string): Promise<OnboardingStepResponse> => {
    const response = await fetch(`${API_BASE}/domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studio_id, custom_domain }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to configure domain');
    }
    
    return response.json();
  },

  /**
   * Complete onboarding
   */
  completeOnboarding: async (studio_id: string, plan_id: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studio_id, plan_id }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to complete onboarding');
    }
    
    return response.json();
  },

  /**
   * Get onboarding status
   */
  getStatus: async (studio_id: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/status/${studio_id}`);
    
    if (!response.ok) {
      throw new Error('Failed to get onboarding status');
    }
    
    return response.json();
  },
};
