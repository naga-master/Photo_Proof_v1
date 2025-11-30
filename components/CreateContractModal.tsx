import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contractService';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateContractModal({ isOpen, onClose, onSuccess }: CreateContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    content: '',
    send_immediately: false,
    recipient_email: '',
    expires_days: 30,
  });

  // Field-level validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'client_id':
        return !value ? 'Please select a client' : '';
      case 'title':
        return !value?.trim() ? 'Contract title is required' : '';
      case 'content':
        return !value?.trim() ? 'Contract content is required' : '';
      case 'recipient_email':
        if (formData.send_immediately && !value?.trim()) return 'Email is required';
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const getInputClasses = (fieldName: string) => {
    const hasError = touched[fieldName] && fieldErrors[fieldName];
    return `w-full px-4 py-2 border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`;
  };

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/v2/clients/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly, not wrapped in object
        setClients(Array.isArray(data) ? data : data.clients || []);
        console.log('[CreateContractModal] Loaded clients:', Array.isArray(data) ? data.length : 'invalid format');
      } else {
        console.error('Failed to load clients:', response.status);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.client_id) {
        setError('Please select a client');
        setLoading(false);
        return;
      }
      
      if (!formData.title.trim()) {
        setError('Please enter a contract title');
        setLoading(false);
        return;
      }
      
      if (!formData.content.trim()) {
        setError('Please enter contract content');
        setLoading(false);
        return;
      }

      // Create contract
      await contractService.createContract({
        client_id: formData.client_id,
        title: formData.title,
        content: formData.content,
        send_immediately: formData.send_immediately,
        recipient_email: formData.send_immediately ? formData.recipient_email : undefined,
        expires_days: formData.expires_days,
      });

      // Success
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        client_id: '',
        title: '',
        content: '',
        send_immediately: false,
        recipient_email: '',
        expires_days: 30,
      });
    } catch (err: any) {
      console.error('Failed to create contract:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
    
    // Auto-fill recipient email if send immediately is checked
    if (formData.send_immediately) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(prev => ({ ...prev, recipient_email: client.email }));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New Contract</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client *
            </label>
            {loadingClients ? (
              <div className="text-gray-500 text-sm">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="text-gray-500 text-sm">
                No clients found. Please create a client first.
              </div>
            ) : (
              <select
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                onBlur={() => handleBlur('client_id')}
                className={getInputClasses('client_id')}
                required
              >
                <option value="">-- Select a client --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            )}
            {touched.client_id && fieldErrors.client_id && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.client_id}</p>
            )}
          </div>

          {/* Contract Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              onBlur={() => handleBlur('title')}
              placeholder="e.g., Wedding Photography Contract - John & Jane"
              className={getInputClasses('title')}
              required
            />
            {touched.title && fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* Contract Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              onBlur={() => handleBlur('content')}
              placeholder="Enter the contract terms and conditions here..."
              rows={10}
              className={`${getInputClasses('content')} font-mono text-sm`}
              required
            />
            {touched.content && fieldErrors.content ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                You can format this text as needed. The client will sign this contract digitally.
              </p>
            )}
          </div>

          {/* Expiration Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires In (days)
            </label>
            <input
              type="number"
              value={formData.expires_days}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_days: parseInt(e.target.value) || 30 }))}
              min={1}
              max={365}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contract will expire in {formData.expires_days} days if not signed
            </p>
          </div>

          {/* Send Immediately */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="send_immediately"
              checked={formData.send_immediately}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData(prev => ({ 
                  ...prev, 
                  send_immediately: checked,
                  recipient_email: checked && prev.client_id 
                    ? clients.find(c => c.id === prev.client_id)?.email || '' 
                    : ''
                }));
              }}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="send_immediately" className="ml-2 block text-sm text-gray-700">
              <span className="font-medium">Send immediately to client</span>
              <p className="text-xs text-gray-500 mt-1">
                If checked, the contract will be sent to the client's email right away
              </p>
            </label>
          </div>

          {/* Recipient Email (shown if send immediately is checked) */}
          {formData.send_immediately && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email *
              </label>
              <input
                type="email"
                value={formData.recipient_email}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
                onBlur={() => handleBlur('recipient_email')}
                placeholder="client@example.com"
                className={getInputClasses('recipient_email')}
                required={formData.send_immediately}
              />
              {touched.recipient_email && fieldErrors.recipient_email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.recipient_email}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || clients.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : formData.send_immediately ? 'Create & Send' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
