import React from 'react';
import OnboardingLayout from './OnboardingLayout';

interface OnboardingCompleteProps {
  subdomain: string;
  planName?: string;
}

export default function OnboardingComplete({ subdomain, planName = 'Professional' }: OnboardingCompleteProps) {
  const studioUrl = `http://${subdomain}.photoapp.local:3001`;
  
  // For development: use localhost since /etc/hosts may not have the new subdomain
  const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === 'photoapp.local' ||
                         window.location.hostname === '127.0.0.1';
  
  const redirectUrl = isDevelopment 
    ? `http://localhost:3001?studio=${subdomain}` 
    : studioUrl;

  const handleGoToDashboard = () => {
    // Redirect to the studio dashboard
    window.location.href = redirectUrl;
  };

  return (
    <OnboardingLayout
      currentStep={5}
      title="Welcome to Photo Proof! 🎉"
      subtitle="Your photography studio is ready to go."
    >
      <div className="space-y-8">
        {/* Success Message */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Setup Complete!
          </h2>
          <p className="text-slate-600">
            Your studio is now live and ready to use.
          </p>
        </div>

        {/* Studio Info Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Your Studio URL</p>
              <a
                href={studioUrl}
                className="text-lg font-bold text-indigo-600 hover:text-indigo-700 break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {studioUrl}
              </a>
              {isDevelopment && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Note: Add <code className="bg-amber-100 px-1 rounded">127.0.0.1 {subdomain}.photoapp.local</code> to <code className="bg-amber-100 px-1 rounded">/etc/hosts</code> to use this URL, or use localhost below.
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Selected Plan</p>
              <p className="text-lg font-semibold text-slate-900">{planName}</p>
              <p className="text-sm text-slate-600">14-day free trial • No credit card required</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="border-2 border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Next Steps:</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-slate-900">Create Your First Project</p>
                <p className="text-sm text-slate-600">Upload photos and organize them into galleries</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-slate-900">Add Your Clients</p>
                <p className="text-sm text-slate-600">Manage client information and project access</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-slate-900">Customize Your Branding</p>
                <p className="text-sm text-slate-600">Fine-tune colors, fonts, and upload your logo</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-slate-900">Share Your Gallery</p>
                <p className="text-sm text-slate-600">Send gallery links to clients for review and selection</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Support Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800 text-sm">
            <span className="font-semibold">Need help getting started?</span>
            <br />
            Check out our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Quick Start Guide
            </a>
            {' '}or contact{' '}
            <a href="mailto:support@photoapp.com" className="text-blue-600 hover:text-blue-700 underline">
              support@photoapp.com
            </a>
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoToDashboard}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          Go to Dashboard →
        </button>

        <p className="text-center text-sm text-slate-500">
          {isDevelopment ? (
            <>
              Redirecting to <span className="font-mono font-medium">{redirectUrl}</span>
            </>
          ) : (
            <>
              You can always access your studio at{' '}
              <span className="font-mono font-medium">{studioUrl}</span>
            </>
          )}
        </p>
      </div>
    </OnboardingLayout>
  );
}
