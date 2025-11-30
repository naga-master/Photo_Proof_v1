import React, { useCallback } from 'react';
import type { FieldSchema } from '../../../services/packageTypeService';

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

interface FormFieldRendererProps {
  field: FieldSchema;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
  disabled?: boolean;
}

const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const inputClasses = `mt-1 block w-full text-gray-900 ${
    error ? 'border-b-red-500' : ''
  } input-focus sm:text-sm px-1 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed`;

  const labelClasses = `block text-sm font-medium text-gray-700 ${field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`;

  const handleChange = (newValue: any) => {
    onChange(field.name, newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            className={inputClasses}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            name={field.name}
            inputMode="tel"
            value={value || ''}
            onChange={(e) => handleChange(formatPhone(e.target.value))}
            placeholder={field.placeholder || '(555) 123-4567'}
            required={field.required}
            disabled={disabled}
            className={inputClasses}
            autoComplete="tel"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            disabled={disabled}
            className={inputClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            rows={4}
            className={`${inputClasses} font-mono text-xs`}
          />
        );

      case 'toggle':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name={field.name}
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value || null)}
            required={field.required}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multi-select':
        return (
          <div className="space-y-2 mt-1">
            {field.options?.map((option) => {
              const selectedValues = Array.isArray(value) ? value : [];
              const isChecked = selectedValues.includes(option.value);

              return (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((v) => v !== option.value);
                      handleChange(newValues);
                    }}
                    disabled={disabled}
                    className="rounded border-gray-300 text-gray-800 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-200 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return (
          <div className="text-sm text-red-500">
            Unknown field type: {field.type}
          </div>
        );
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={field.name} className={labelClasses}>
        {field.label}
      </label>
      {renderField()}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {field.placeholder && field.type !== 'text' && field.type !== 'number' && field.type !== 'textarea' && (
        <p className="mt-1 text-xs text-gray-500">{field.placeholder}</p>
      )}
    </div>
  );
};

export default FormFieldRenderer;
