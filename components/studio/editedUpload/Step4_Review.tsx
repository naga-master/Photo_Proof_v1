import React, { useState } from 'react';
import { useEditedUpload } from './EditedUploadContext';
import { CameraIcon, EyeIcon, CloseIcon, StarIcon } from '../../icons';
import VersionLabelModal from './VersionLabelModal';

const Step4_Review: React.FC = () => {
  const { state, setVersionLabel, removeManualMapping, prepareUploadQueue } = useEditedUpload();
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

  React.useEffect(() => {
    // Prepare upload queue when review step loads
    prepareUploadQueue();
  }, [prepareUploadQueue]);

  const handleAddLabel = (filename: string) => {
    setSelectedFilename(filename);
    setShowLabelModal(true);
  };

  const handleSaveLabel = (label: string) => {
    if (selectedFilename) {
      setVersionLabel(selectedFilename, label);
    }
    setShowLabelModal(false);
    setSelectedFilename(null);
  };

  // Combine all mappings for review
  const allMappings = [
    ...state.matchedPairs.map(p => ({
      filename: p.editedFile.name,
      file: p.editedFile,
      photoId: p.photoId,
      originalFilename: p.originalFilename,
      source: 'auto' as const,
      confidence: p.confidence,
    })),
    ...Array.from(state.manualMappings.entries()).map(([filename, photoId]) => ({
      filename,
      file: state.editedFiles.find(f => f.name === filename)!,
      photoId,
      originalFilename: '', // Will be populated from original photos if needed
      source: 'manual' as const,
      confidence: 100,
    })),
  ];

  const totalCount = allMappings.length;
  const labeledCount = Array.from(state.versionLabels.keys()).length;

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Review & Label</h2>
        <p className="text-slate-600 mb-6">
          Review all mappings and optionally add version labels
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Total Files</p>
            <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">With Labels</p>
            <p className="text-2xl font-bold text-blue-600">{labeledCount}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Ready to Upload</p>
            <p className="text-2xl font-bold text-green-600">{totalCount}</p>
          </div>
        </div>

        {/* Mappings List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Files to Upload</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {allMappings.map((mapping, index) => (
              <MappingRow
                key={`${mapping.filename}-${index}`}
                mapping={mapping}
                label={state.versionLabels.get(mapping.filename)}
                onAddLabel={() => handleAddLabel(mapping.filename)}
                onRemove={() => removeManualMapping(mapping.filename)}
              />
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <StarIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Version Labels (Optional)</p>
              <p className="text-blue-700">
                Add labels like "Final", "Color Corrected", or "Client Approved" to help identify versions.
                Labels are optional but recommended for organization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showLabelModal && (
        <VersionLabelModal
          currentLabel={selectedFilename ? state.versionLabels.get(selectedFilename) : undefined}
          onSave={handleSaveLabel}
          onCancel={() => {
            setShowLabelModal(false);
            setSelectedFilename(null);
          }}
        />
      )}
    </div>
  );
};

interface MappingRowProps {
  mapping: {
    filename: string;
    file: File;
    originalFilename: string;
    source: 'auto' | 'manual';
    confidence: number;
  };
  label?: string;
  onAddLabel: () => void;
  onRemove: () => void;
}

const MappingRow: React.FC<MappingRowProps> = ({ mapping, label, onAddLabel, onRemove }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnail(e.target?.result as string);
    };
    reader.readAsDataURL(mapping.file);
  }, [mapping.file]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={mapping.filename} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraIcon className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{mapping.filename}</p>
        <p className="text-xs text-slate-500">
          {mapping.source === 'auto' ? `Auto-matched (${mapping.confidence}%)` : 'Manually mapped'}
        </p>
        {label && (
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            <StarIcon className="w-3 h-3" />
            {label}
          </span>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={onAddLabel}
        className="flex-shrink-0 p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title={label ? 'Edit label' : 'Add label'}
      >
        <EyeIcon className="w-4 h-4" />
      </button>

      {mapping.source === 'manual' && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Remove mapping"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Step4_Review;
