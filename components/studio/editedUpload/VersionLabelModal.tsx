import React, { useState } from 'react';
import { CloseIcon } from '../../icons';

interface VersionLabelModalProps {
  currentLabel?: string;
  onSave: (label: string) => void;
  onCancel: () => void;
}

const commonLabels = [
  'Final',
  'Color Corrected',
  'Retouched',
  'Client Approved',
  'Web Optimized',
  'Print Ready',
  'Edited',
  'Enhanced',
];

const VersionLabelModal: React.FC<VersionLabelModalProps> = ({ 
  currentLabel = '', 
  onSave, 
  onCancel 
}) => {
  const [label, setLabel] = useState(currentLabel);
  const [customInput, setCustomInput] = useState(
    currentLabel && !commonLabels.includes(currentLabel) ? currentLabel : ''
  );

  const handleSave = () => {
    const finalLabel = customInput.trim() || label;
    if (finalLabel) {
      onSave(finalLabel);
    }
  };

  const handleQuickSelect = (quickLabel: string) => {
    setLabel(quickLabel);
    setCustomInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Add Version Label</h3>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-slate-600 mb-4">
            Choose a common label or enter a custom one
          </p>

          {/* Common Labels */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {commonLabels.map(commonLabel => (
                <button
                  key={commonLabel}
                  onClick={() => handleQuickSelect(commonLabel)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    label === commonLabel && !customInput
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {commonLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Custom Label
            </label>
            <input
              type="text"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                if (e.target.value) {
                  setLabel('');
                }
              }}
              placeholder="Enter custom label..."
              className="w-full px-2 py-2 text-sm input-focus-filled"
              maxLength={50}
            />
            <p className="text-xs text-slate-500 mt-1">
              {customInput.length}/50 characters
            </p>
          </div>

          {/* Preview */}
          {(label || customInput) && (
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Preview:</p>
              <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                {customInput || label}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!label && !customInput.trim()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              label || customInput.trim()
                ? 'bg-primary hover:bg-primary-hover'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            Save Label
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionLabelModal;
