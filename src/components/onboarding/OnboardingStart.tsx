import React, { useState, useEffect } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { onboardingService } from '../../services/onboarding/onboardingService';
import { PasswordInput } from '../../../components/common/PasswordInput';

interface OnboardingStartProps {
  onComplete: (studioId: string, subdomain: string) => void;
}

export default function OnboardingStart({ onComplete }: OnboardingStartProps) {
  const [formData, setFormData] = useState({
    studio_name: '',
    subdomain: '',
    email: '',
    owner_name: '',
    password: '',
    phone: '',
  });

  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean;
    message: string;
  }>({ checking: false, available: false, message: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounced subdomain check
  useEffect(() => {
    if (formData.subdomain.length < 3) {
      setSubdomainStatus({ checking: false, available: false, message: '' });
      return;
    }

    const timer = setTimeout(() => {
      checkSubdomain(formData.subdomain);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain]);

  const checkSubdomain = async (subdomain: string) => {
    setSubdomainStatus({ checking: true, available: false, message: '' });
    try {
      const result = await onboardingService.checkSubdomain(subdomain);
      setSubdomainStatus({
        checking: false,
        available: result.available,
        message: result.available ? `Available! Your URL will be ${result.full_domain}` : result.reason || 'Not available',
      });
    } catch (err) {
      setSubdomainStatus({
        checking: false,
        available: false,
        message: 'Error checking subdomain',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await onboardingService.startOnboarding(formData);
      // Store for next steps
      localStorage.setItem('onboarding_studio_id', result.studio_id);
      localStorage.setItem('onboarding_subdomain', result.subdomain || formData.subdomain);
      
      // Call parent callback
      onComplete(result.studio_id, result.subdomain || formData.subdomain);
    } catch (err: any) {
      setError(err.message || 'Failed to create studio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={1}
      title="Create Your Photography Studio"
      subtitle="Start your 14-day free trial. No credit card required."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Studio Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Studio Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.studio_name}
            onChange={(e) => setFormData({ ...formData, studio_name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="e.g., Awesome Photography Studio"
          />
        </div>

        {/* Subdomain */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Choose Your Subdomain <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <input
              type="text"
              required
              value={formData.subdomain}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setFormData({ ...formData, subdomain: value });
              }}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="mystudio"
              minLength={3}
              maxLength={50}
            />
            <div className="px-4 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600">
              .photoapp.local
            </div>
          </div>
          {subdomainStatus.checking && (
            <p className="mt-2 text-sm text-slate-500 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking availability...
            </p>
          )}
          {!subdomainStatus.checking && subdomainStatus.message && (
            <p
              className={`mt-2 text-sm ${
                subdomainStatus.available ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {subdomainStatus.available ? '✓ ' : '✗ '}
              {subdomainStatus.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="you@yourstudio.com"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="onboarding-password"
            required
            minLength={8}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-slate-500">
            Must be at least 8 characters long
          </p>
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number <span className="text-slate-400">(Optional)</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !subdomainStatus.available || formData.subdomain.length < 3}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Studio...
            </span>
          ) : (
            'Continue to Plan Selection'
          )}
        </button>

        <p className="text-center text-sm text-slate-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </OnboardingLayout>
  );
}
