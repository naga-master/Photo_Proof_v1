import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number;
  matchType: 'filename' | 'date' | 'combined';
}

/**
 * Confidence Badge Component
 * Displays visual indicator of match quality with tooltip explanation
 */
const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, matchType }) => {
  const percentage = Math.round(confidence * 100);
  
  // Determine badge style and icon based on confidence and match type
  const getBadgeStyle = (): { bgColor: string; textColor: string; icon: string; label: string } => {
    if (percentage >= 95 && matchType === 'combined') {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: '⭐',
        label: 'Best Match'
      };
    } else if (percentage >= 85 && matchType === 'filename') {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: '🟢',
        label: 'Filename Match'
      };
    } else if (percentage >= 70 && matchType === 'date') {
      return {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        icon: '🟡',
        label: 'Date Match'
      };
    } else if (percentage >= 50) {
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: '🔵',
        label: 'Possible Match'
      };
    } else {
      return {
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-600',
        icon: '⚪',
        label: 'Low Confidence'
      };
    }
  };
  
  // Generate tooltip text based on match type
  const getTooltipText = (): string => {
    const percentStr = `${percentage}% match`;
    
    switch (matchType) {
      case 'combined':
        return `${percentStr}: Similar filename + Same day`;
      case 'filename':
        return `${percentStr}: Filename similarity`;
      case 'date':
        return `${percentStr}: Captured at similar time`;
      default:
        return percentStr;
    }
  };
  
  const style = getBadgeStyle();
  const tooltip = getTooltipText();
  
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${style.bgColor} ${style.textColor} shadow-sm`}
      title={tooltip}
      role="tooltip"
      aria-label={tooltip}
    >
      <span aria-hidden="true">{style.icon}</span>
      <span>{percentage}%</span>
    </div>
  );
};

export default ConfidenceBadge;
