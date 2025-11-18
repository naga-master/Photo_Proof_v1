import React from 'react';

type ColorVariant = 'slate' | 'blue' | 'purple' | 'green' | 'amber' | 'rose' | 'indigo';

interface ImagePlaceholderProps {
  title?: string;
  subtitle?: string;
  aspectRatio?: string;
  showShimmer?: boolean;
  className?: string;
  colorVariant?: ColorVariant;
}

const COLOR_VARIANTS: Record<ColorVariant, { from: string; to: string; shimmer: string; icon: string }> = {
  slate: { from: 'from-slate-100', to: 'to-slate-200', shimmer: 'rgba(255,255,255,0.4)', icon: 'text-slate-400' },
  blue: { from: 'from-blue-50', to: 'to-blue-100', shimmer: 'rgba(147,197,253,0.5)', icon: 'text-blue-400' },
  purple: { from: 'from-purple-50', to: 'to-purple-100', shimmer: 'rgba(192,132,252,0.5)', icon: 'text-purple-400' },
  green: { from: 'from-green-50', to: 'to-green-100', shimmer: 'rgba(134,239,172,0.5)', icon: 'text-green-400' },
  amber: { from: 'from-amber-50', to: 'to-amber-100', shimmer: 'rgba(251,191,36,0.5)', icon: 'text-amber-400' },
  rose: { from: 'from-rose-50', to: 'to-rose-100', shimmer: 'rgba(251,113,133,0.5)', icon: 'text-rose-400' },
  indigo: { from: 'from-indigo-50', to: 'to-indigo-100', shimmer: 'rgba(129,140,248,0.5)', icon: 'text-indigo-400' }
};

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  title,
  subtitle,
  aspectRatio = "16/9",
  showShimmer = true,
  className = "",
  colorVariant = 'slate'
}) => {
  const colors = COLOR_VARIANTS[colorVariant];
  
  // If className includes 'absolute', remove 'relative' positioning and don't use aspectRatio
  const hasAbsolutePositioning = className.includes('absolute');
  const positionClass = hasAbsolutePositioning ? '' : 'relative';
  const aspectRatioStyle = hasAbsolutePositioning ? undefined : { aspectRatio };
  
  return (
    <div 
      className={`${positionClass} bg-gradient-to-br ${colors.from} ${colors.to} overflow-hidden ${className}`}
      style={aspectRatioStyle}
    >
      {/* Shimmer animation */}
      {showShimmer && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 shimmer-wave"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.shimmer}, transparent)`,
              animation: 'shimmer 2s infinite'
            }}
          />
        </div>
      )}
      
      {/* Camera icon (larger, more visible) */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${colors.icon}`}>
        <svg 
          className="w-16 h-16 mb-2 opacity-40" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
          />
        </svg>
        
        {title && (
          <p className="text-xs font-medium text-slate-500 px-4 text-center">{title}</p>
        )}
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .shimmer-wave {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};
