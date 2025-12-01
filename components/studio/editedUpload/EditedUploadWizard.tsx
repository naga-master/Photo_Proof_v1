import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditedUploadProvider, useEditedUpload } from './EditedUploadContext';
import { ArrowLeftIcon } from '../../icons';
import Step1_SelectFiles from './Step1_SelectFiles';
import Step2_AutoMatch from './Step2_AutoMatch';
import Step3_ManualMap from './Step3_ManualMap';
import Step4_Review from './Step4_Review';
import Step5_Upload from './Step5_Upload';
import Step6_Complete from './Step6_Complete';

const steps = ['Select Files', 'Auto Match', 'Manual Map', 'Review', 'Upload', 'Complete'];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

interface EditedUploadWizardProps {
  projectId: string;
  projectTitle: string;
  onExit: () => void;
  onViewGallery: () => void;
  showToast: (message: string) => void;
}

const EditedUploadWizardContent: React.FC<EditedUploadWizardProps> = ({ 
  onExit,
  onViewGallery,
  showToast 
}) => {
  const { state, nextStep, prevStep, reset } = useEditedUpload();
  const { step } = state;
  const [direction, setDirection] = useState(0);

  // Log step changes
  useEffect(() => {
    console.log('[EditedUploadWizard] Step changed to:', step, {
      stepName: steps[step],
      uploadQueueLength: state.uploadQueue.length,
      isUploading: state.isUploading
    });
  }, [step, state.uploadQueue.length, state.isUploading]);

  // Auto-skip manual mapping step if all files are matched
  React.useEffect(() => {
    if (step === 2 && state.unmatchedFiles.length === 0 && state.matchedPairs.length > 0) {
      // All files matched - skip to review
      console.log('[EditedUploadWizard] Auto-skipping manual mapping - all files matched');
      const timer = setTimeout(() => {
        setDirection(1);
        nextStep();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, state.unmatchedFiles.length, state.matchedPairs.length, nextStep]);

  const handleNext = async () => {
    console.log('[EditedUploadWizard] handleNext called', { 
      step, 
      editedFiles: state.editedFiles.length,
      matchedPairs: state.matchedPairs.length,
      unmatchedFiles: state.unmatchedFiles.length,
      manualMappings: state.manualMappings.size,
      skippedFiles: state.skippedFiles.size
    });

    // Validation for each step
    if (step === 0 && state.editedFiles.length === 0) {
      showToast('Please select at least one file');
      return;
    }

    if (step === 1 && state.unmatchedFiles.length > 0) {
      console.log('[EditedUploadWizard] Proceeding to manual mapping with unmatched files');
    }

    if (step === 2) {
      const allMappedOrSkipped = state.unmatchedFiles.every(f => 
        state.manualMappings.has(f.name) || state.skippedFiles.has(f.name)
      );
      if (!allMappedOrSkipped && state.unmatchedFiles.length > 0) {
        showToast('Please map or skip all unmatched files before continuing');
        return;
      }
    }
    
    setDirection(1);
    nextStep();
  };

  const handlePrev = () => {
    setDirection(-1);
    prevStep();
  };

  const handleCancel = () => {
    if (step < 4) {
      const confirmed = window.confirm('Are you sure you want to cancel? All progress will be lost.');
      if (confirmed) {
        reset();
        onExit();
      }
    } else {
      onExit();
    }
  };

  const renderStep = () => {
    console.log('[EditedUploadWizard] Rendering step', { 
      step, 
      unmatchedCount: state.unmatchedFiles.length,
      manualMappingsCount: state.manualMappings.size,
      skippedCount: state.skippedFiles.size
    });
    
    switch (step) {
      case 0:
        return <Step1_SelectFiles />;
      case 1:
        return <Step2_AutoMatch showToast={showToast} nextStep={() => { 
          console.log('[EditedUploadWizard] Step2 auto-advance called');
          setDirection(1); 
          nextStep(); 
        }} />;
      case 2:
        return <Step3_ManualMap />;
      case 3:
        return <Step4_Review />;
      case 4:
        return <Step5_Upload />;
      case 5:
        return <Step6_Complete onClose={onExit} onViewGallery={onViewGallery} />;
      default:
        return null;
    }
  };

  const canContinue = () => {
    if (step === 0) return state.editedFiles.length > 0;
    if (step === 1) return true; // Can proceed with or without matches
    if (step === 2) {
      // Manual mapping: can continue if all unmatched files are mapped or skipped
      return state.unmatchedFiles.length === 0 || 
             state.unmatchedFiles.every(f => 
               state.manualMappings.has(f.name) || state.skippedFiles.has(f.name)
             );
    }
    if (step === 3) return state.matchedPairs.length > 0 || state.manualMappings.size > 0;
    if (step === 4) {
      // Step 5 (Upload): can continue when all uploads complete
      const totalCount = state.uploadQueue.length;
      const successCount = state.uploadQueue.filter(f => f.status === 'success').length;
      const failedCount = state.uploadQueue.filter(f => f.status === 'failed').length;
      return totalCount > 0 && (successCount + failedCount === totalCount);
    }
    if (step === 5) return false; // Final step
    return false;
  };

  const isUploadingOrComplete = step >= 5; // Only hide buttons on step 6 (final step)

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <header className="flex-shrink-0 bg-white border-b border-slate-200">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={step === 0 ? onExit : handlePrev} 
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title={step === 0 ? "Exit" : "Go back"}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Upload Edited Photos</h1>
              <p className="text-sm text-slate-500">
                Step {step + 1} of {steps.length}: {steps[step]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isUploadingOrComplete && (
              <button 
                onClick={handleCancel} 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
            )}
            {step > 0 && !isUploadingOrComplete && (
              <button 
                onClick={handlePrev} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            )}
            {!isUploadingOrComplete && (
              <button 
                onClick={handleNext} 
                disabled={!canContinue()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  canContinue() 
                    ? 'bg-primary hover:bg-primary-hover' 
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
                title={!canContinue() ? 'Please complete the current step' : ''}
              >
                {step === 3 ? 'Start Upload' : 'Next'}
              </button>
            )}
            {step === 5 && (
              <button 
                onClick={onExit} 
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
        <div className="w-full bg-slate-200 h-1">
          <div 
            className="bg-primary h-1 transition-all duration-300" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto p-8 bg-slate-50">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="w-full min-h-full flex justify-center items-start py-8"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const EditedUploadWizard: React.FC<EditedUploadWizardProps> = (props) => (
  <EditedUploadProvider projectId={props.projectId} projectTitle={props.projectTitle}>
    <EditedUploadWizardContent {...props} />
  </EditedUploadProvider>
);

export default EditedUploadWizard;
