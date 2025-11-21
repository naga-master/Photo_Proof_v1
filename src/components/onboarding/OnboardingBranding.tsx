import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { onboardingService } from '../../services/onboarding/onboardingService';

interface OnboardingBrandingProps {
  studioId: string;
  onComplete: () => void;
  onBack: () => void;
}

const colorPresets = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Slate', value: '#64748B' },
];

const typographyOptions = [
  'System Default (Inter & Cormorant)',
  'Modern (Poppins)',
  'Classic (Playfair Display)',
  'Elegant (Lora)',
  'Minimal (Work Sans)',
];

export default function OnboardingBranding({ studioId, onComplete, onBack }: OnboardingBrandingProps) {
  const [brandColor, setBrandColor] = useState('#6366F1');
  const [typography, setTypography] = useState('System Default (Inter & Cormorant)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await onboardingService.updateBranding({
        studio_id: studioId,
        brand_color: brandColor,
        typography: typography,
      });
      
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update branding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      title="Customize Your Branding"
      subtitle="Make your studio stand out with custom colors and fonts."
    >
      <div className="space-y-8">
        {/* Brand Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Brand Color
          </label>
          
          {/* Color Presets */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setBrandColor(preset.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  brandColor === preset.value
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: preset.value }}
                />
                <span className="text-sm font-medium text-slate-700">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-600">Or choose custom:</label>
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
            />
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
              placeholder="#6366F1"
            />
          </div>
        </div>

        {/* Typography */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Typography
          </label>
          <div className="grid grid-cols-1 gap-3">
            {typographyOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTypography(option)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  typography === option
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-medium text-slate-900">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border-2 border-slate-200 rounded-lg p-6">
          <p className="text-sm font-medium text-slate-700 mb-4">Preview</p>
          <div className="space-y-4">
            <div
              className="inline-block px-6 py-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: brandColor }}
            >
              View Gallery
            </div>
            <p className="text-slate-600">
              This is how your buttons and accents will look with your chosen colors.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Continue to Domain Setup'}
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          Don't worry, you can change these settings anytime from your dashboard.
        </p>
      </div>
    </OnboardingLayout>
  );
}
