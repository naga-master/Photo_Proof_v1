import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  title: string;
  subtitle?: string;
}

const steps = [
  { id: 1, label: 'Get Started' },
  { id: 2, label: 'Choose Plan' },
  { id: 3, label: 'Branding' },
  { id: 4, label: 'Domain' },
  { id: 5, label: 'Complete' },
];

export default function OnboardingLayout({ children, currentStep, title, subtitle }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-8 py-6">
          {/* Steps */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all ${
                      step.id < currentStep
                        ? 'border-green-600 bg-green-600 text-white'
                        : step.id === currentStep
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      step.id <= currentStep ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-all ${
                      step.id < currentStep ? 'bg-green-600' : 'bg-slate-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            {subtitle && <p className="text-slate-600">{subtitle}</p>}
          </div>
          {children}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-8 text-center text-sm text-slate-500">
          Need help? Contact{' '}
          <a href="mailto:support@photoapp.com" className="text-indigo-600 hover:text-indigo-700">
            support@photoapp.com
          </a>
        </div>
      </div>
    </div>
  );
}
