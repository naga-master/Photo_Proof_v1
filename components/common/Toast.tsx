import React, { useEffect, useState } from 'react';
import { CheckIcon, CloseIcon } from '../icons';

export interface ToastProps {
  message: string;
  duration?: number;
  onUndo?: () => void;
  onDismiss?: () => void;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  duration = 5000, 
  onUndo, 
  onDismiss,
  type = 'success'
}) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);
  
  if (!visible) return null;
  
  const handleUndo = () => {
    onUndo?.();
    setVisible(false);
    onDismiss?.();
  };
  
  const handleClose = () => {
    setVisible(false);
    onDismiss?.();
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-xl animate-fade-in flex items-center gap-4 max-w-md z-50">
      {type === 'success' && <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />}
      <p className="text-sm flex-1">{message}</p>
      {onUndo && (
        <button
          onClick={handleUndo}
          className="px-3 py-1 text-sm font-medium bg-amber-500 hover:bg-amber-600 rounded transition-colors"
        >
          Undo
        </button>
      )}
      <button
        onClick={handleClose}
        className="text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
