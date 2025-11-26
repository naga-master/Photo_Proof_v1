import React from 'react';

interface StatusBadgeProps {
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          icon: '📝',
          label: 'Draft',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
      case 'sent':
        return {
          icon: '📤',
          label: 'Sent',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'viewed':
        return {
          icon: '👁️',
          label: 'Viewed',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'signed':
        return {
          icon: '✅',
          label: 'Signed',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'expired':
        return {
          icon: '⏰',
          label: 'Expired',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      case 'cancelled':
        return {
          icon: '❌',
          label: 'Cancelled',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: '📄',
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
