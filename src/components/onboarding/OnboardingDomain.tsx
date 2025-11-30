import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { onboardingService } from '../../services/onboarding/onboardingService';

interface OnboardingDomainProps {
  studioId: string;
  subdomain: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function OnboardingDomain({ studioId, subdomain, onComplete, onBack }: OnboardingDomainProps) {
  const [customDomain, setCustomDomain] = useState('');
  const [skipCustomDomain, setSkipCustomDomain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await onboardingService.configureDomain(
        studioId,
        skipCustomDomain ? undefined : customDomain
      );
      
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to configure domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={4}
      title="Configure Your Domain"
      subtitle="Your studio is accessible via subdomain. You can add a custom domain later."
    >
      <div className="space-y-6">
        {/* Current Subdomain */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-900 mb-1">Your Studio URL is Ready!</p>
              <p className="text-green-800 font-mono text-lg">
                http://{subdomain}.photoapp.local:3001
              </p>
              <p className="text-green-700 text-sm mt-2">
                You can access your studio immediately using this URL.
              </p>
            </div>
          </div>
        </div>

        {/* Custom Domain Option */}
        <div className="border-2 border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Add Custom Domain</h3>
              <p className="text-sm text-slate-600">Use your own domain like photos.yourstudio.com</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!skipCustomDomain}
                onChange={(e) => setSkipCustomDomain(!e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {!skipCustomDomain && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Domain
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full px-2 py-2 input-focus"
                  placeholder="photos.yourstudio.com"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-semibold mb-2">📝 Setup Instructions:</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Add a CNAME record pointing to: {subdomain}.photoapp.local</li>
                  <li>Wait for DNS propagation (usually 5-30 minutes)</li>
                  <li>We'll verify your domain automatically</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">💡 Pro tip:</span> You can add or change your custom domain
            anytime from your dashboard settings. Most users start with the subdomain and add a custom
            domain later.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (!skipCustomDomain && !customDomain)}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
