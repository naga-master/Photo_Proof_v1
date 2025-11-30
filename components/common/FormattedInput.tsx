import React, { useState, useCallback } from 'react';

type FormatType = 'phone' | 'card' | 'expiry' | 'cvc';

interface FormattedInputProps {
  id: string;
  type: FormatType;
  value: string;
  onChange: (value: string, rawValue: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const formatCard = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : '';
};

const formatExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
};

const formatCvc = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4);
};

const formatters: Record<FormatType, (value: string) => string> = {
  phone: formatPhone,
  card: formatCard,
  expiry: formatExpiry,
  cvc: formatCvc,
};

const placeholders: Record<FormatType, string> = {
  phone: '(555) 123-4567',
  card: '1234 5678 9012 3456',
  expiry: 'MM / YY',
  cvc: '123',
};

const inputModes: Record<FormatType, 'numeric' | 'tel' | 'text'> = {
  phone: 'tel',
  card: 'numeric',
  expiry: 'numeric',
  cvc: 'numeric',
};

export const FormattedInput: React.FC<FormattedInputProps> = ({
  id,
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  className = '',
  required = false,
  disabled = false,
}) => {
  const format = formatters[type];
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = format(e.target.value);
    onChange(formattedValue, rawValue);
  }, [format, onChange]);

  return (
    <input
      id={id}
      type="text"
      inputMode={inputModes[type]}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder || placeholders[type]}
      className={className}
      required={required}
      disabled={disabled}
      autoComplete={type === 'card' ? 'cc-number' : type === 'expiry' ? 'cc-exp' : type === 'cvc' ? 'cc-csc' : 'tel'}
    />
  );
};

export default FormattedInput;
