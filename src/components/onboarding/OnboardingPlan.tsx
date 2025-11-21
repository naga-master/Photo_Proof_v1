import React, { useState, useEffect } from 'react';
import OnboardingLayout from './OnboardingLayout';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  max_projects: number;
  max_storage_gb: number;
  max_users: number;
  features: Record<string, any>;
}

interface OnboardingPlanProps {
  onComplete: (planId: string) => void;
  onBack: () => void;
}

export default function OnboardingPlan({ onComplete, onBack }: OnboardingPlanProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/studio/plans');
      if (!response.ok) {
        throw new Error('Failed to load plans');
      }
      const data = await response.json();
      setPlans(data);
      
      // Auto-select professional plan
      const professionalPlan = data.find((p: Plan) => p.name === 'professional');
      if (professionalPlan) {
        setSelectedPlan(professionalPlan.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedPlan) {
      localStorage.setItem('onboarding_plan_id', selectedPlan);
      onComplete(selectedPlan);
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={2} title="Choose Your Plan">
        <div className="text-center py-12">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-slate-600">Loading plans...</p>
        </div>
      </OnboardingLayout>
    );
  }

  if (error) {
    return (
      <OnboardingLayout currentStep={2} title="Choose Your Plan">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPlans}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={2}
      title="Choose Your Plan"
      subtitle="Start with a 14-day free trial. Switch plans anytime."
    >
      <div className="space-y-6">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-105'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Plan Badge */}
              {plan.name === 'professional' && (
                <div className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full mb-3">
                  POPULAR
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {plan.display_name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-indigo-600">
                  ${plan.price_monthly}
                </span>
                <span className="text-slate-600 ml-2">/month</span>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-sm mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3">
                <li className="flex items-start text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {plan.max_projects === 999999 ? 'Unlimited' : plan.max_projects} Projects
                  </span>
                </li>
                <li className="flex items-start text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{plan.max_storage_gb}GB Storage</span>
                </li>
                <li className="flex items-start text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {plan.max_users === 999 ? 'Unlimited' : plan.max_users} Team Members
                  </span>
                </li>
                {plan.features?.custom_domain && (
                  <li className="flex items-start text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Custom Domain</span>
                  </li>
                )}
                {plan.features?.advanced_analytics && (
                  <li className="flex items-start text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Advanced Analytics</span>
                  </li>
                )}
              </ul>

              {/* Selected Indicator */}
              {selectedPlan === plan.id && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-indigo-600 font-semibold text-sm text-center">
                    ✓ Selected
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Trial Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800 font-semibold mb-1">14-Day Free Trial</p>
          <p className="text-blue-700 text-sm">
            Try any plan free for 14 days. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedPlan}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Branding
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
