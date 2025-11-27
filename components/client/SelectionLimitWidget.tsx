import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';

interface SelectionLimitWidgetProps {
  projectId: number;
  className?: string;
}

interface SelectionStatus {
  has_limit: boolean;
  limit: number | null;
  current_count: number;
  remaining: number | null;
  percentage_used: number;
  is_at_limit: boolean;
}

const SelectionLimitWidget: React.FC<SelectionLimitWidgetProps> = ({ projectId, className = '' }) => {
  const [status, setStatus] = useState<SelectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSelectionStatus();
  }, [projectId]);

  const loadSelectionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>(`/v2/projects/${projectId}/selection-status`);
      setStatus(response);
    } catch (err) {
      console.error('Failed to load selection status:', err);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh status when component receives focus (user comes back to page)
  useEffect(() => {
    const handleFocus = () => {
      loadSelectionStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [projectId]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  // No limit configured
  if (!status || !status.has_limit) {
    return null;
  }

  const getProgressColor = () => {
    if (status.percentage_used >= 100) return 'bg-red-600';
    if (status.percentage_used >= 80) return 'bg-yellow-500';
    return 'bg-blue-600';
  };

  const getTextColor = () => {
    if (status.percentage_used >= 100) return 'text-red-600';
    if (status.percentage_used >= 80) return 'text-yellow-600';
    return 'text-gray-900';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Photo Selections</span>
        {status.is_at_limit && (
          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">
            Limit Reached
          </span>
        )}
      </div>
      
      <div className={`text-3xl font-bold ${getTextColor()} mb-2`}>
        {status.current_count} / {status.limit}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(status.percentage_used, 100)}%` }}
        ></div>
      </div>
      
      {/* Status Text */}
      <div className="text-xs text-gray-500">
        {status.is_at_limit ? (
          <span className="text-red-600 font-medium">
            Selection limit reached. Please contact the studio to upgrade your package.
          </span>
        ) : status.remaining !== null && status.remaining <= 10 ? (
          <span className="text-yellow-600 font-medium">
            {status.remaining} {status.remaining === 1 ? 'selection' : 'selections'} remaining
          </span>
        ) : (
          <span>
            {status.remaining} {status.remaining === 1 ? 'selection' : 'selections'} remaining
          </span>
        )}
      </div>
    </div>
  );
};

export default SelectionLimitWidget;
