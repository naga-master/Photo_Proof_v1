import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ConsentScreenProps {
  userType: 'studio' | 'client';
  onConsent: () => void;
}

const ConsentScreen: React.FC<ConsentScreenProps> = ({ userType, onConsent }) => {
  const [consents, setConsents] = useState({
    essential: true, // Always required
    marketing_emails: false,
    sms_notifications: false,
    analytics: false,
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleConsentChange = (type: string, value: boolean) => {
    if (type === 'essential') return; // Cannot change essential
    setConsents(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = async () => {
    if (!agreed) {
      setError('You must agree to data processing to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      console.log('[ConsentScreen] Token check:', token ? `${token.substring(0, 20)}...` : 'NONE');
      
      // Verify token exists
      if (!token) {
        console.error('[ConsentScreen] No token found in localStorage');
        setError('Authentication required. Please log in again.');
        // Reload page to trigger login
        setTimeout(() => window.location.reload(), 2000);
        return;
      }
      
      console.log('[ConsentScreen] Submitting consent with preferences:', consents);
      
      // Record each consent
      const consentTypes = Object.keys(consents) as Array<keyof typeof consents>;
      
      for (const consentType of consentTypes) {
        await axios.put(`${API_BASE_URL}/v2/data-rights/consent`, {
          consent_type: consentType,
          consent_given: consents[consentType],
          consent_version: '1.0',
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Consent recorded successfully
      onConsent();
    } catch (err: any) {
      console.error('Consent error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        // Reload page to trigger login
        setTimeout(() => window.location.reload(), 2000);
      } else if (err.response?.status === 404) {
        setError('Consent endpoint not found. Please contact support.');
      } else {
        setError(err.response?.data?.detail || 'Failed to record consent. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getConsentContent = () => {
    if (userType === 'studio') {
      return {
        title: 'Studio Account - Data Processing Consent',
        subtitle: 'To create your studio account and manage client data',
        description: `As a studio owner, you will be collecting and processing client data through our platform. 
        Under India's Digital Personal Data Protection Act (DPDPA) 2023, we need your consent to process data on your behalf.`,
      };
    } else {
      return {
        title: 'Client Access - Data Processing Consent',
        subtitle: 'To access your contracts and gallery',
        description: `Before you can view your contracts and photos, we need your consent to process your personal data 
        in accordance with India's Digital Personal Data Protection Act (DPDPA) 2023.`,
      };
    }
  };

  const content = getConsentContent();

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {content.title}
            </h2>
            <p className="text-sm text-gray-600">{content.subtitle}</p>
          </div>

          {/* Description */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">{content.description}</p>
          </div>

          {/* Consent Options */}
          <div className="space-y-4 mb-6">
            {/* Essential Services */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={consents.essential}
                  disabled
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
                />
                <div className="ml-3 flex-1">
                  <label className="font-medium text-gray-900">
                    Essential Services (Required)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {userType === 'studio' ? (
                      <>
                        We collect: Business name, your name, email, phone
                        <br />
                        We collect on your behalf: Client names, emails, phones, photos, contracts
                        <br />
                        <strong>Purpose:</strong> Account management and providing photography services to your clients
                        <br />
                        <strong>Retention:</strong> Until you delete your account (contracts retained 7 years after signing)
                      </>
                    ) : (
                      <>
                        We collect: Name, email, phone, signature data, IP address
                        <br />
                        <strong>Purpose:</strong> Contract management and digital signature verification
                        <br />
                        <strong>Retention:</strong> Until you delete account (signed contracts: 7 years per legal requirement)
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Marketing Emails */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={consents.marketing_emails}
                  onChange={(e) => handleConsentChange('marketing_emails', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <label className="font-medium text-gray-900">
                    Marketing Communications (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive product updates, tips, and promotional offers via email.
                    <br />
                    <strong>Purpose:</strong> Keep you informed about new features and offers
                    <br />
                    You can unsubscribe anytime in Settings.
                  </p>
                </div>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={consents.sms_notifications}
                  onChange={(e) => handleConsentChange('sms_notifications', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <label className="font-medium text-gray-900">
                    SMS Notifications (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive important notifications via SMS (e.g., contract updates, payment confirmations).
                    <br />
                    <strong>Purpose:</strong> Timely notifications about important events
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={consents.analytics}
                  onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <label className="font-medium text-gray-900">
                    Usage Analytics (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow us to collect anonymized usage data to improve the platform.
                    <br />
                    <strong>Purpose:</strong> Understand how features are used to make improvements
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Your Data Rights (DPDPA 2023):</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Access your data anytime</li>
              <li>• Correct inaccurate information</li>
              <li>• Export your data (JSON/CSV format)</li>
              <li>• Delete your account</li>
              <li>• Withdraw consent anytime (go to Settings &gt; Privacy)</li>
            </ul>
          </div>

          {/* Legal Documents */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-3">
              <button
                onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
                type="button"
                className="text-blue-600 hover:text-blue-800 text-sm underline font-semibold"
              >
                {showPrivacyPolicy ? '▼ Hide Privacy Policy' : '▶ View Privacy Policy'}
              </button>
              <button
                onClick={() => setShowTerms(!showTerms)}
                type="button"
                className="text-blue-600 hover:text-blue-800 text-sm underline font-semibold"
              >
                {showTerms ? '▼ Hide Terms of Service' : '▶ View Terms of Service'}
              </button>
            </div>

            {/* Privacy Policy Expandable Content */}
            {showPrivacyPolicy && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto text-sm">
                <h3 className="font-bold text-gray-900 mb-2">Privacy Policy (Summary)</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>What We Collect:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Personal info (name, email, phone)</li>
                    <li>Signature data (for e-signatures)</li>
                    <li>IP address, device info (for security)</li>
                    {userType === 'studio' && <li>Client data you upload (names, emails, photos)</li>}
                  </ul>
                  <p><strong>How We Use It:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Account management</li>
                    <li>Contract creation & signing</li>
                    <li>Communication (notifications)</li>
                    <li>Legal compliance (DPDPA 2023)</li>
                  </ul>
                  <p><strong>Your Rights:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Access your data anytime</li>
                    <li>Correct inaccurate information</li>
                    <li>Export your data (JSON/CSV)</li>
                    <li>Delete your account</li>
                    <li>Withdraw consent (Settings → Privacy)</li>
                  </ul>
                  <p><strong>Retention:</strong> Account data until deletion; signed contracts 7 years (legal requirement)</p>
                  <p className="text-xs text-gray-600 mt-2">
                    ⚠️ This is a summary. Full Privacy Policy available in Settings after login.
                  </p>
                </div>
              </div>
            )}

            {/* Terms of Service Expandable Content */}
            {showTerms && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto text-sm">
                <h3 className="font-bold text-gray-900 mb-2">Terms of Service (Summary)</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Agreement:</strong> By using Photo Proof, you agree to these terms.</p>
                  <p><strong>Eligibility:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Must be 18+ years old</li>
                    <li>Provide accurate information</li>
                    <li>Comply with Indian laws</li>
                  </ul>
                  {userType === 'studio' && (
                    <>
                      <p><strong>Studio Responsibilities:</strong></p>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>You're responsible for client data you upload</li>
                        <li>Must have client authorization</li>
                        <li>Comply with IT Act 2000 & DPDPA 2023</li>
                      </ul>
                    </>
                  )}
                  <p><strong>Digital Signatures:</strong> E-signatures are legally valid under IT Act 2000</p>
                  <p><strong>Acceptable Use:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>✅ Create/manage contracts</li>
                    <li>✅ Sign contracts electronically</li>
                    <li>❌ Upload illegal content</li>
                    <li>❌ Violate laws or regulations</li>
                  </ul>
                  <p><strong>Termination:</strong> You can delete your account anytime (Settings → Privacy)</p>
                  <p className="text-xs text-gray-600 mt-2">
                    ⚠️ This is a summary. Full Terms of Service available in Settings after login.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-3 text-sm text-gray-700">
                I have read and agree to the data processing terms described above. 
                I understand my rights under DPDPA 2023 and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service
                </button>
                .
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!agreed || loading}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                !agreed || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'I Agree - Continue'}
            </button>
          </div>

          {/* Footer Note */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            By continuing, you acknowledge that you have read our Privacy Policy and Terms of Service,
            and consent to our data processing practices as described.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentScreen;
