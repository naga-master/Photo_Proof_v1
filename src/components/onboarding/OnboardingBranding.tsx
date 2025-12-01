import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { onboardingService } from '../../services/onboarding/onboardingService';
import { typography } from '../../../config/designSystem';

interface OnboardingBrandingProps {
  studioId: string;
  onComplete: () => void;
  onBack: () => void;
}

// Color presets - Brisk-inspired palette
const colorPresets = [
  { name: 'Teal', value: '#0EA5E9' },      // Primary Brisk color
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Slate', value: '#64748B' },
];

// Typography options from design system config
const typographyOptions = typography.options.map(opt => opt.name);

export default function OnboardingBranding({ studioId, onComplete, onBack }: OnboardingBrandingProps) {
  const [brandColor, setBrandColor] = useState('#0EA5E9'); // Default to Brisk teal
  const [selectedTypography, setSelectedTypography] = useState('Modern (Inter)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await onboardingService.updateBranding({
        studio_id: studioId,
        brand_color: brandColor,
        typography: selectedTypography,
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Brand Color
          </label>
          
          {/* Color Presets */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setBrandColor(preset.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-fast ${
                  brandColor === preset.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-sm"
                  style={{ backgroundColor: preset.value }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600">Or choose custom:</label>
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
              placeholder="#0EA5E9"
            />
          </div>
        </div>

        {/* Typography */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Typography
          </label>
          <div className="grid grid-cols-1 gap-3">
            {typographyOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedTypography(option)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-fast ${
                  selectedTypography === option
                    ? 'border-[#0ea5e9] bg-sky-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium text-gray-900">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-4">Preview</p>
          <div className="space-y-4">
            <div
              className="inline-block px-6 py-3 rounded-lg text-white font-semibold shadow-sm transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: brandColor }}
            >
              View Gallery
            </div>
            <p className="text-gray-600 text-sm">
              This is how your buttons and accents will look with your chosen colors.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-fast"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#0ea5e9] text-white rounded-xl font-semibold hover:bg-[#0284c7] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-fast shadow-sm hover:shadow-md"
          >
            {loading ? 'Saving...' : 'Continue to Domain Setup'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Don't worry, you can change these settings anytime from your dashboard.
        </p>
      </div>
    </OnboardingLayout>
  );
}
