import React, { useState, useEffect } from 'react';
import { packageTypeService, PackageTypeSimple } from '../../../services/packageTypeService';

interface PackageTypeSelectorProps {
  value: string | null;
  onChange: (typeId: string | null) => void;
  disabled?: boolean;
  error?: string;
}

const iconMap: Record<string, string> = {
  heart: '💒',
  briefcase: '💼',
  calendar: '📅',
  baby: '👶',
  'shopping-bag': '🛍️',
  user: '👤',
  star: '⭐',
  cake: '🎂',
};

const PackageTypeSelector: React.FC<PackageTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const [packageTypes, setPackageTypes] = useState<PackageTypeSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadPackageTypes();
  }, []);

  const loadPackageTypes = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const types = await packageTypeService.getSimpleList();
      setPackageTypes(types);
    } catch (err) {
      console.error('Failed to load package types:', err);
      setLoadError('Failed to load package types');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `mt-1 block w-full bg-white text-gray-900 border ${
    error ? 'border-red-500' : 'border-gray-300'
  } rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed`;

  if (loading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Package Type
        </label>
        <div className="mt-1 py-2 text-sm text-gray-500">Loading package types...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Package Type
        </label>
        <div className="mt-1 py-2 text-sm text-red-500">{loadError}</div>
        <button
          onClick={loadPackageTypes}
          className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label htmlFor="package_type" className="block text-sm font-medium text-gray-700">
        Package Type
      </label>
      <select
        id="package_type"
        name="package_type"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className={inputClasses}
      >
        <option value="">Select a package type</option>
        
        {/* Predefined types */}
        {packageTypes.filter(pt => pt.is_predefined).length > 0 && (
          <optgroup label="Predefined Types">
            {packageTypes
              .filter(pt => pt.is_predefined)
              .map((type) => (
                <option key={type.id} value={type.id}>
                  {iconMap[type.icon || ''] || '📦'} {type.display_name}
                </option>
              ))}
          </optgroup>
        )}
        
        {/* Custom types */}
        {packageTypes.filter(pt => !pt.is_predefined).length > 0 && (
          <optgroup label="Custom Types">
            {packageTypes
              .filter(pt => !pt.is_predefined)
              .map((type) => (
                <option key={type.id} value={type.id}>
                  {iconMap[type.icon || ''] || '⭐'} {type.display_name}
                </option>
              ))}
          </optgroup>
        )}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Select a package type to load its form fields
      </p>
    </div>
  );
};

export default PackageTypeSelector;
