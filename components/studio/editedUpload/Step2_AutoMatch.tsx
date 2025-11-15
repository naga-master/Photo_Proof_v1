import React, { useEffect, useState, useRef } from 'react';
import { useEditedUpload } from './EditedUploadContext';
import { versionService } from '../../../services/versionService';
import { matchFilenames, getConfidenceBadgeColor, getConfidenceBadgeText } from './MatchingAlgorithm';
import { CheckCircleIcon, XCircleIcon, CameraIcon, StarIcon } from '../../icons';

interface Step2_AutoMatchProps {
  showToast: (message: string) => void;
  nextStep: () => void;
}

const Step2_AutoMatch: React.FC<Step2_AutoMatchProps> = ({ showToast, nextStep }) => {
  const { state, setMatchedPairs, setUnmatchedFiles } = useEditedUpload();
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoAdvancedRef = useRef(false);
  const hasMatchedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        console.log('[Step2_AutoMatch] Cleaning up timer on unmount');
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const performMatching = async () => {
      console.log('[Step2_AutoMatch] useEffect triggered', {
        editedFilesCount: state.editedFiles.length,
        matchedPairsCount: state.matchedPairs.length,
        isMatching,
        hasMatched: hasMatchedRef.current,
        hasAutoAdvanced: hasAutoAdvancedRef.current
      });

      if (state.editedFiles.length === 0) return;
      if (hasMatchedRef.current) return; // Already matched this session
      if (isMatching) return; // Prevent duplicate calls

      hasMatchedRef.current = true;
      setIsMatching(true);
      setError(null);

      try {
        // Get original photos from project
        const response = await versionService.getOriginalPhotos(state.projectId);

        // Match filenames locally using File objects
        const matchResults = matchFilenames(state.editedFiles, response.photos);

        // Convert to MatchedPair format
        const matched = matchResults.matched.map(m => ({
          editedFile: state.editedFiles.find(f => f.name === m.editedFilename)!,
          photoId: m.photoId,
          originalFilename: m.originalFilename,
          confidence: m.confidence,
          matchReason: m.matchReason,
        }));

        // Get unmatched files
        const unmatchedFilenames = matchResults.unmatched.map(u => u.editedFilename);
        const unmatched = state.editedFiles.filter(f => unmatchedFilenames.includes(f.name));

        setMatchedPairs(matched);
        setUnmatchedFiles(unmatched);

        console.log('[Step2_AutoMatch] Matching complete', {
          matched: matched.length,
          unmatched: unmatched.length,
          hasAutoAdvanced: hasAutoAdvancedRef.current
        });

        // Auto-advance if there are unmatched files (after 3 seconds) - ONLY ONCE
        if (unmatched.length > 0 && !hasAutoAdvancedRef.current) {
          hasAutoAdvancedRef.current = true;
          console.log('[Step2_AutoMatch] Setting up auto-advance timer');
          
          // Store timer reference for cleanup
          const toastTimer = setTimeout(() => {
            console.log('[Step2_AutoMatch] Showing toast');
            showToast(`${matched.length} matched, ${unmatched.length} need manual mapping`);
            
            timerRef.current = setTimeout(() => {
              console.log('[Step2_AutoMatch] Auto-advancing to manual mapping');
              nextStep();
              timerRef.current = null;
            }, 3000) as unknown as number;
          }, 500);
          
          // Don't store the toast timer, only the nextStep timer matters
        }
      } catch (err: any) {
        console.error('[Step2_AutoMatch] Matching failed:', err);
        setError(err.message || 'Failed to match files');
        hasMatchedRef.current = false; // Allow retry on error
      } finally {
        setIsMatching(false);
      }
    };

    performMatching();
  }, [state.editedFiles.length, state.projectId]);

  if (isMatching) {
    return (
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-800 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Matching Files...</h3>
          <p className="text-slate-600">
            Analyzing filenames and matching to original photos
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-start gap-4">
            <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Matching Failed</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsMatching(false);
                  // Trigger re-match by resetting state
                  setMatchedPairs([]);
                  setUnmatchedFiles([]);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const matchedCount = state.matchedPairs.length;
  const unmatchedCount = state.unmatchedFiles.length;
  const totalCount = matchedCount + unmatchedCount;
  const matchRate = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Auto-Matched Files</h2>
            <p className="text-slate-600">
              We automatically matched files based on their filenames
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <StarIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">{matchRate}% Matched</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Total Files</p>
            <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Matched</p>
            <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 mb-1">Need Mapping</p>
            <p className="text-2xl font-bold text-amber-600">{unmatchedCount}</p>
          </div>
        </div>

        {/* Matched Pairs */}
        {matchedCount > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              Matched Files ({matchedCount})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {state.matchedPairs.map((pair, index) => (
                <MatchedPairRow key={`${pair.editedFile.name}-${index}`} pair={pair} />
              ))}
            </div>
          </div>
        )}

        {/* Unmatched Files */}
        {unmatchedCount > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 text-amber-600" />
              Needs Manual Mapping ({unmatchedCount})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {state.unmatchedFiles.map((file, index) => (
                <UnmatchedFileRow key={`${file.name}-${index}`} file={file} />
              ))}
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Next step:</span> You'll manually map these files to their original photos.
              </p>
            </div>
          </div>
        )}

        {/* All matched message */}
        {matchedCount > 0 && unmatchedCount === 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">All files matched successfully!</p>
                <p className="text-green-700">
                  You can proceed to review and add version labels.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MatchedPairRowProps {
  pair: {
    editedFile: File;
    originalFilename: string;
    confidence: number;
    matchReason: string;
  };
}

const MatchedPairRow: React.FC<MatchedPairRowProps> = ({ pair }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnail(e.target?.result as string);
    };
    reader.readAsDataURL(pair.editedFile);
  }, [pair.editedFile]);

  const badgeColor = getConfidenceBadgeColor(pair.confidence);
  const badgeText = getConfidenceBadgeText(pair.confidence);

  return (
    <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={pair.editedFile.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraIcon className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{pair.editedFile.name}</p>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="inline-block w-4 text-center">→</span>
          <span className="truncate">{pair.originalFilename}</span>
        </p>
      </div>

      {/* Confidence Badge */}
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
          {badgeText}
        </span>
      </div>

      {/* Match Reason (tooltip) */}
      <div className="flex-shrink-0" title={pair.matchReason}>
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
      </div>
    </div>
  );
};

interface UnmatchedFileRowProps {
  file: File;
}

const UnmatchedFileRow: React.FC<UnmatchedFileRowProps> = ({ file }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnail(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-white rounded overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraIcon className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        <p className="text-xs text-amber-700">No automatic match found</p>
      </div>

      {/* Warning Icon */}
      <XCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
    </div>
  );
};

export default Step2_AutoMatch;
