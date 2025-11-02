import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadProvider, useUpload } from './UploadContext';
import Step0_SelectMode from './Step0_SelectMode';
// Fix: Corrected the import path to point to the file with an underscore.
import Step1_ProjectSetup from './Step1_ProjectSetup';
import Step2_FolderMapping from './Step2_FolderMapping';
import Step3_UploadRules from './Step3_UploadRules';
import Step4_UploadManager from './Step4_UploadManager';
import Step5_Summary from './Step5_Summary';
import UploadSidebar from './UploadSidebar';
import { ArrowLeftIcon } from '../../icons';
import OfflineBanner from './OfflineBanner';
import type { ProjectDetails, UploadFile, Album, Client, LayoutId, ServicePackage } from '../../../types';
import { canProceedFromStep1, canProceedFromStep2, validateStep1, validateStep2, getValidationErrorMessage } from '../../../lib/validators';

interface UploadWizardProps {
  clients: Client[];
  packages: ServicePackage[];
  initialClientId?: number;
  defaultLayoutId: LayoutId;
  onExit: () => void;
  onProjectCreated: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]) => Album;
  onViewGallery: (album: Album) => void;
  showToast: (message: string) => void;
  existingProjectId?: number;
  initialStep?: number;
}

const steps = ['Mode', 'Project Setup', 'Folder Mapping', 'Upload Rules', 'Upload', 'Summary'];

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

const UploadWizardContent: React.FC<UploadWizardProps> = ({ onExit, onProjectCreated, onViewGallery, showToast, clients, packages, initialStep = 0, existingProjectId }) => {
  const { state, nextStep, prevStep, resetUpload, setStep } = useUpload();
  const { step, mode } = state;
  const [direction, setDirection] = useState(0);
  const [validationError, setValidationError] = useState<string>('');

  // Set initial step if provided (e.g., when adding photos to existing project)
  React.useEffect(() => {
    if (initialStep && initialStep > 0) {
      setStep(initialStep);
    }
  }, [initialStep, setStep]);

  const handleNext = () => {
    // Validate before proceeding
    let isValid = true;
    let errors: Record<string, string> = {};

    if (step === 1) {
      const validation = validateStep1(state.projectDetails);
      isValid = validation.isValid;
      errors = validation.errors;
    } else if (step === 2) {
      const validation = validateStep2({
        detectedFolders: state.detectedFolders,
        folderMap: state.folderMap
      });
      isValid = validation.isValid;
      errors = validation.errors;
    }

    if (!isValid) {
      const errorMessage = getValidationErrorMessage(errors);
      setValidationError(errorMessage);
      showToast(errorMessage);
      console.error('[UploadWizard] Validation failed:', errors);
      return;
    }

    setValidationError('');
    setDirection(1);
    nextStep();
  };

  const handlePrev = () => {
    setValidationError('');
    setDirection(-1);
    prevStep();
  };
  
  const renderStep = () => {
    switch (step) {
      case 0: return <Step0_SelectMode />;
      case 1: return <Step1_ProjectSetup clients={clients} packages={packages} />;
      case 2: return <Step2_FolderMapping />;
      case 3: return <Step3_UploadRules />;
      case 4: return <Step4_UploadManager />;
      case 5: return <Step5_Summary 
          onExit={onExit}
          onProjectCreated={onProjectCreated}
          onViewGallery={onViewGallery}
          showToast={showToast}
      />;
      default: return <Step0_SelectMode />;
    }
  };

  const isUploadingOrDone = step >= 4;
  
  // Check if user can continue from current step
  const canContinue = () => {
    if (step >= 4) return false; // Can't continue from upload/summary steps
    if (step === 0) return !!mode; // Step 0: Must select mode
    if (step === 1) return canProceedFromStep1(state.projectDetails); // Step 1: Validate required fields
    if (step === 2) return canProceedFromStep2({ detectedFolders: state.detectedFolders, folderMap: state.folderMap }); // Step 2: Validate folders
    return true; // Step 3: No validation needed
  };

  const continueEnabled = canContinue();

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <OfflineBanner />
      <header className="flex-shrink-0 bg-white border-b border-slate-200">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                {state.projectDetails.clientId ? 'Create New Project' : mode === 'new' ? 'Create New Project' : mode === 'existing' ? 'Add to Existing Project' : 'Upload Photos'}
              </h1>
              {mode && <p className="text-sm text-slate-500">Step {step} of {steps.length -1}: {steps[step]}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={resetUpload} className="text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
            {step > 1 && !isUploadingOrDone && <button onClick={handlePrev} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Back</button>}
            {!isUploadingOrDone && (
                <button 
                  onClick={handleNext} 
                  disabled={!continueEnabled}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    continueEnabled 
                      ? 'bg-slate-800 hover:bg-slate-700' 
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                  title={!continueEnabled ? 'Please fill all required fields' : ''}
                >
                    {step === 3 ? 'Start Upload' : 'Save & Continue'}
                </button>
            )}
             {step === 5 && (
                <button onClick={onExit} className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700">
                    Finish
                </button>
            )}
          </div>
        </div>
        {(mode || state.projectDetails.clientId) && (
          <div className="w-full bg-slate-200 h-1">
            <div className="bg-slate-800 h-1 transition-all duration-300" style={{ width: `${(step / (steps.length - 1)) * 100}%` }}></div>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
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
        {(mode || state.projectDetails.clientId) && step >= 2 && <UploadSidebar />}
      </div>
    </div>
  );
};

const UploadWizard: React.FC<UploadWizardProps> = (props) => (
  <UploadProvider initialClientId={props.initialClientId} defaultLayoutId={props.defaultLayoutId}>
    <UploadWizardContent {...props} />
  </UploadProvider>
);

export default UploadWizard;
