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
    const response = await axios.get(`${API_BASE_URL}/v2/contracts/stats`, {
      headers: this.getHeaders(),
    });
    return response.data;
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
}

export const contractService = new ContractService();
