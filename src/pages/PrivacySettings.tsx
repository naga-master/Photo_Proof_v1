import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ConsentPreferences {
  essential: boolean;
  marketing_emails: boolean;
  sms_notifications: boolean;
  analytics: boolean;
}

interface DataSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: string;
  contracts_count: number;
  active_consents: string[];
  data_exports_count: number;
  deletion_requests_count: number;
}

interface PrivacySettings {
  consent_preferences: ConsentPreferences;
  data_summary: DataSummary;
  has_pending_deletion_request: boolean;
  can_delete_account: boolean;
  active_contracts_count: number;
}

const PrivacySettings: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  
  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/v2/data-rights/privacy-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load privacy settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async (consentType: keyof ConsentPreferences) => {
    if (consentType === 'essential' || !settings) return; // Cannot toggle essential
    
    setSaving(true);
    setMessage(null);

    try {
      const newValue = !settings.consent_preferences[consentType];
      const token = localStorage.getItem('auth_token');
      
      await axios.put(`${API_BASE_URL}/v2/data-rights/consent`, {
        consent_type: consentType,
        consent_given: newValue,
        consent_version: '1.0',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSettings({
        ...settings,
        consent_preferences: {
          ...settings.consent_preferences,
          [consentType]: newValue,
        },
      });

      setMessage({ type: 'success', text: 'Consent preference updated' });
    } catch (error: any) {
      console.error('Error updating consent:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update consent' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_BASE_URL}/v2/data-rights/export`, {
        export_format: exportFormat,
        include_contracts: true,
        include_signatures: true,
        include_activity_logs: true,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const exportId = response.data.id;
      
      // Download the file
      const downloadUrl = `/v2/data-rights/export/${exportId}/download`;
      window.open(downloadUrl, '_blank');

      setMessage({ type: 'success', text: 'Data export started! Download will begin shortly.' });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to export data' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword || !deleteConfirmation) {
      setMessage({ type: 'error', text: 'Please enter password and confirm deletion' });
      return;
    }

    setDeleteLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_BASE_URL}/v2/data-rights/delete-account`, {
        password: deletePassword,
        confirmation: deleteConfirmation,
        reason: deleteReason,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.can_delete && response.data.status === 'completed') {
        setMessage({ type: 'success', text: 'Account deleted successfully. You will be logged out shortly.' });
        
        // Log out after 3 seconds
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: response.data.rejection_reason || 'Cannot delete account due to active contracts',
        });
        setShowDeleteModal(false);
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete account' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Failed to load privacy settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy & Data Settings</h1>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Data Summary */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Data Summary</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Account Created</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(settings.data_summary.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Contracts</p>
            <p className="text-lg font-semibold text-gray-900">
              {settings.data_summary.contracts_count}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Data Exports</p>
            <p className="text-lg font-semibold text-gray-900">
              {settings.data_summary.data_exports_count}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Consents</p>
            <p className="text-lg font-semibold text-gray-900">
              {settings.data_summary.active_consents.length}
            </p>
          </div>
        </div>
      </section>

      {/* Consent Preferences */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Consent Preferences</h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage what data processing you consent to. Changes take effect immediately.
        </p>

        <div className="space-y-4">
          {/* Essential */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Essential Services</h3>
              <p className="text-sm text-gray-600">
                Required for account and contract management (cannot be disabled)
              </p>
            </div>
            <div className="ml-4">
              <input
                type="checkbox"
                checked={settings.consent_preferences.essential}
                disabled
                className="h-5 w-5 text-blue-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Marketing Emails</h3>
              <p className="text-sm text-gray-600">
                Receive product updates, tips, and promotional offers
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={() => handleConsentToggle('marketing_emails')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.consent_preferences.marketing_emails ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.consent_preferences.marketing_emails ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
              <p className="text-sm text-gray-600">
                Receive important notifications via SMS
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={() => handleConsentToggle('sms_notifications')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.consent_preferences.sms_notifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.consent_preferences.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Usage Analytics</h3>
              <p className="text-sm text-gray-600">
                Help us improve by sharing anonymized usage data
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={() => handleConsentToggle('analytics')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.consent_preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.consent_preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Export */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Your Data</h2>
        <p className="text-sm text-gray-600 mb-6">
          Download all your data in machine-readable format (JSON or CSV). 
          This includes your profile, contracts, signatures, and activity logs.
        </p>

        <div className="flex items-center gap-4">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="json">JSON Format</option>
            <option value="csv">CSV Format</option>
          </select>

          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
              exportLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {exportLoading ? 'Preparing Export...' : '📥 Export My Data'}
          </button>
        </div>
      </section>

      {/* Delete Account */}
      <section className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Delete Account</h2>
        <p className="text-sm text-gray-600 mb-6">
          Permanently delete your account and all associated data.
          {settings.active_contracts_count > 0 && (
            <strong className="block mt-2 text-red-600">
              ⚠️ You have {settings.active_contracts_count} active contract(s) signed within the last 7 years.
              These must be retained per Indian law and will prevent account deletion.
            </strong>
          )}
        </p>

        {settings.has_pending_deletion_request && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              You have a pending deletion request. Please contact support if you need assistance.
            </p>
          </div>
        )}

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={!settings.can_delete_account || settings.has_pending_deletion_request}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !settings.can_delete_account || settings.has_pending_deletion_request
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {settings.can_delete_account ? '🗑️ Delete My Account' : '🔒 Cannot Delete (Active Contracts)'}
        </button>
      </section>

      {/* Legal Links */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        {' '} • {' '}
        <a href="/terms-of-service" target="_blank" className="text-blue-600 hover:underline">
          Terms of Service
        </a>
        {' '} • {' '}
        <a href="mailto:privacy@photoproof.com" className="text-blue-600 hover:underline">
          Contact DPO
        </a>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-red-600 mb-4">⚠️ Delete Account</h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                This action is <strong>PERMANENT</strong> and cannot be undone.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700 font-semibold mb-2">What will be deleted:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Your account and profile</li>
                  <li>• All personal data</li>
                  <li>• Access to contracts and galleries</li>
                </ul>
              </div>

              {settings.active_contracts_count === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-700 font-semibold mb-2">What will be retained (legal requirement):</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Signed contracts (anonymized, 7 years)</li>
                    <li>• Payment records (tax compliance)</li>
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm your password:
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for deletion (optional):
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Help us improve..."
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    I understand this action is permanent and cannot be reversed
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword || !deleteConfirmation}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  deleteLoading || !deletePassword || !deleteConfirmation
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {deleteLoading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettings;
