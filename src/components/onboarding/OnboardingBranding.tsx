import React, { useState, useRef } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { onboardingService } from '../../services/onboarding/onboardingService';
import { typography } from '../../../config/designSystem';

interface OnboardingBrandingProps {
  studioId: string;
  onComplete: () => void;
  onBack: () => void;
}

// Image type options for About page (owner/team photo, NOT logo)
type ImageType = 'owner' | 'team' | 'workspace';
const imageTypeOptions: { id: ImageType; label: string; icon: string; desc: string }[] = [
  { id: 'owner', label: 'Owner Photo', icon: '👤', desc: 'Personal touch' },
  { id: 'team', label: 'Team Photo', icon: '👥', desc: 'Show your team' },
  { id: 'workspace', label: 'Workspace', icon: '📸', desc: 'Studio shots' },
];

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
  
  // Studio photo state (for About page)
  const [imageType, setImageType] = useState<ImageType>('owner');
  const [studioPhoto, setStudioPhoto] = useState<string | null>(null);
  const [skipPhoto, setSkipPhoto] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Logo state (for branding/invoices)
  const [logo, setLogo] = useState<string | null>(null);
  const [skipLogo, setSkipLogo] = useState(false);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setStudioPhoto(reader.result as string);
      setSkipPhoto(false);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  // Logo upload handlers
  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
      setSkipLogo(false);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setLogoDragActive(true);
    } else if (e.type === 'dragleave') {
      setLogoDragActive(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await onboardingService.updateBranding({
        studio_id: studioId,
        brand_color: brandColor,
        typography: selectedTypography,
        studio_photo: skipPhoto ? null : studioPhoto,
        logo: skipLogo ? null : logo,
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

        {/* Studio Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Studio Logo
            <span className="text-gray-400 font-normal ml-2">(Optional)</span>
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Your logo appears on invoices, emails, and client portal headers.
          </p>

          {/* Logo Upload Area */}
          <div
            onDragEnter={handleLogoDrag}
            onDragLeave={handleLogoDrag}
            onDragOver={handleLogoDrag}
            onDrop={handleLogoDrop}
            onClick={() => !skipLogo && logoInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              skipLogo
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : logoDragActive
                ? 'border-[#0ea5e9] bg-sky-50'
                : logo
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="hidden"
              disabled={skipLogo}
            />
            
            {logo && !skipLogo ? (
              <div className="flex items-center justify-center gap-4">
                <img
                  src={logo}
                  alt="Logo Preview"
                  className="h-16 object-contain"
                />
                <div className="text-left">
                  <p className="text-sm text-green-600 font-medium">Logo uploaded!</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogo(null);
                    }}
                    className="text-sm text-red-500 hover:text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <div className="text-3xl">🏢</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">
                    Drop logo here or click to upload
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG or SVG recommended, max 2MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Skip Checkbox */}
          <label className="flex items-center gap-3 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipLogo}
              onChange={(e) => setSkipLogo(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0ea5e9] focus:ring-[#0ea5e9]"
            />
            <span className="text-sm text-gray-600">I'll add this later</span>
          </label>
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

        {/* About Page Image */}
        <div className="border-t border-gray-200 pt-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            About Page Image
            <span className="text-gray-400 font-normal ml-2">(Optional)</span>
          </label>
          <p className="text-sm text-gray-500 mb-4">
            This image appears on your public About page to introduce your studio.
          </p>

          {/* Image Type Selector */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {imageTypeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setImageType(option.id)}
                disabled={skipPhoto}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-fast ${
                  imageType === option.id && !skipPhoto
                    ? 'border-[#0ea5e9] bg-sky-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${skipPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-2xl block mb-1">{option.icon}</span>
                <span className="text-sm font-medium text-gray-900 block">{option.label}</span>
                <span className="text-xs text-gray-500">{option.desc}</span>
              </button>
            ))}
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !skipPhoto && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              skipPhoto
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : dragActive
                ? 'border-[#0ea5e9] bg-sky-50'
                : studioPhoto
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={skipPhoto}
            />
            
            {studioPhoto && !skipPhoto ? (
              <div className="space-y-3">
                <img
                  src={studioPhoto}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg mx-auto shadow-sm"
                />
                <p className="text-sm text-green-600 font-medium">Image uploaded!</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudioPhoto(null);
                  }}
                  className="text-sm text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📷</div>
                <p className="text-sm font-medium text-gray-700">
                  Drop image here or click to upload
                </p>
                <p className="text-xs text-gray-500">
                  Recommended: 800x800px, JPG or PNG, max 5MB
                </p>
              </div>
            )}
          </div>

          {/* Skip Checkbox */}
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={skipPhoto}
              onChange={(e) => setSkipPhoto(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0ea5e9] focus:ring-[#0ea5e9]"
            />
            <span className="text-sm text-gray-600">I'll add this later from my dashboard</span>
          </label>
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
