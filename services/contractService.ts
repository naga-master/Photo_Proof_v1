/**
 * Contract Service for API interactions
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ContractTemplate {
  id: string;
  studio_id: string;
  name: string;
  category?: string;
  content: string;
  variables?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  studio_id: string;
  client_id: string;
  project_id?: string;
  template_id?: string;
  contract_number: string;
  title: string;
  content: string;
  terms?: Record<string, any>;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'cancelled';
  sent_at?: string;
  viewed_at?: string;
  signed_at?: string;
  expires_at?: string;
  pdf_url?: string;
  signed_pdf_url?: string;
  contract_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  client_name?: string;
  project_name?: string;
  template_name?: string;
}

export interface ContractStats {
  total: number;
  draft: number;
  pending: number;
  signed: number;
  expiring: number;
}

export interface SignatureData {
  signature: string;
  timestamp?: string;
  agreement: boolean;
}

export interface ContractActivity {
  id: string;
  contract_id: string;
  action: string;
  actor_id?: string;
  ip_address?: string;
  user_agent?: string;
  activity_metadata?: Record<string, any>;
  created_at: string;
}

class ContractService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Contract Templates
  async getTemplates(category?: string, activeOnly: boolean = true): Promise<ContractTemplate[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('active_only', String(activeOnly));
    
    const response = await axios.get(`${API_BASE_URL}/v2/contracts/templates?${params}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getTemplate(id: string): Promise<ContractTemplate> {
    const response = await axios.get(`${API_BASE_URL}/v2/contracts/templates/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async createTemplate(data: Partial<ContractTemplate>): Promise<ContractTemplate> {
    const response = await axios.post(`${API_BASE_URL}/v2/contracts/templates`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Contracts
  async getContracts(params?: {
    status?: string;
    client_id?: string;
    project_id?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ contracts: Contract[]; total: number; offset: number; limit: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status_filter', params.status);
    if (params?.client_id) queryParams.append('client_id', params.client_id);
    if (params?.project_id) queryParams.append('project_id', params.project_id);
    if (params?.offset !== undefined) queryParams.append('offset', String(params.offset));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    
    const response = await axios.get(`${API_BASE_URL}/v2/contracts?${queryParams}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getContract(id: string): Promise<Contract> {
    const response = await axios.get(`${API_BASE_URL}/v2/contracts/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async createContract(data: {
    client_id: string;
    project_id?: string;
    template_id?: string;
    title: string;
    content?: string;
    variables?: Record<string, any>;
    send_immediately?: boolean;
    recipient_email?: string;
    expires_days?: number;
  }): Promise<Contract> {
    const response = await axios.post(`${API_BASE_URL}/v2/contracts`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async sendContract(id: string, recipientEmail: string): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/v2/contracts/${id}/send?recipient_email=${encodeURIComponent(recipientEmail)}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  async signContract(id: string, signatureData: SignatureData): Promise<{
    status: string;
    contract_id: string;
    signed_at: string;
    signature_hash: string;
  }> {
    const response = await axios.post(
      `${API_BASE_URL}/v2/contracts/${id}/sign`,
      signatureData,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async verifySignature(id: string): Promise<{
    contract_id: string;
    signature_valid: boolean;
    verification_timestamp: string;
    signed_at?: string;
    signer_info?: Record<string, any>;
  }> {
    const response = await axios.get(`${API_BASE_URL}/v2/contracts/${id}/verify`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getContractStats(): Promise<ContractStats> {
    try {
      // Check if user is a client - if so, compute stats from contracts list
      // This avoids 403 errors since stats endpoint is studio-only
      const userRole = localStorage.getItem('user_role');
      
      if (userRole === 'client') {
        // Clients: compute simple stats from their contract list
        const contractsData = await this.getContracts({ limit: 100 });
        const contracts = contractsData.contracts;
        
        return {
          total: contracts.length,
          draft: 0, // Clients don't see drafts
          pending: contracts.filter(c => c.status === 'sent' || c.status === 'viewed').length,
          signed: contracts.filter(c => c.status === 'signed').length,
          expiring: 0, // Simplified for clients
        };
      }
      
      // Studio users: get full stats from API
      const response = await axios.get(`${API_BASE_URL}/v2/contracts/stats`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching contract stats:', error);
      // If stats fail, return zeros to prevent UI crashes
      return {
        total: 0,
        draft: 0,
        pending: 0,
        signed: 0,
        expiring: 0,
      };
    }
  }

  async getContractActivities(id: string): Promise<ContractActivity[]> {
    const response = await axios.get(`${API_BASE_URL}/v2/contracts/${id}/activities`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async deleteContract(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/v2/contracts/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // Helper to get PDF URL with authentication
  getPDFUrl(contract: Contract): string | null {
    const pdfUrl = contract.signed_pdf_url || contract.pdf_url;
    if (!pdfUrl) return null;
    
    // If it's a relative path, construct full URL
    if (pdfUrl.startsWith('/')) {
      return `${API_BASE_URL}${pdfUrl}`;
    }
    return pdfUrl;
  }

  // Check if contract can be deleted (business rules based on Indian legal requirements)
  canDeleteContract(contract: Contract): { canDelete: boolean; reason?: string } {
    // Signed contracts: CANNOT delete (legal requirement - must retain for 7 years per DPDPA)
    if (contract.status === 'signed') {
      return {
        canDelete: false,
        reason: 'Signed contracts cannot be deleted. Legal requirement: must retain for 7 years (DPDPA 2023).'
      };
    }

    // Viewed contracts: RISKY but technically allowed
    if (contract.status === 'viewed') {
      return {
        canDelete: true,
        reason: 'Warning: Client has viewed this contract. Consider cancelling instead of deleting.'
      };
    }

    // Draft: OK to delete (not sent yet)
    // Sent: OK to delete (can resend if needed)
    // Expired: OK to delete (already invalid)
    // Cancelled: OK to delete (already voided)
    return { canDelete: true };
  }
}

export const contractService = new ContractService();
