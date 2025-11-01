
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
import { ArrowLeftIcon } from '../../icons';
import type { ProjectDetails, UploadFile, Album, Client, LayoutId, ServicePackage } from '../../../types';

interface UploadWizardProps {
  clients: Client[];
  packages: ServicePackage[];
  initialClientId?: number;
  defaultLayoutId: LayoutId;
  onExit: () => void;
  onProjectCreated: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]) => Album;
  onViewGallery: (album: Album) => void;
  showToast: (message: string) => void;
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

const UploadWizardContent: React.FC<UploadWizardProps> = ({ onExit, onProjectCreated, onViewGallery, showToast, clients, packages }) => {
  const { state, nextStep, prevStep, resetUpload } = useUpload();
  const { step, mode } = state;
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    nextStep();
  };

  const handlePrev = () => {
    setDirection(-1);
    prevStep();
  };
  
  const handleExit = () => {
      resetUpload();
      onExit();
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
  const canContinue = step < 4 && (step > 0 || (step === 0 && mode));

  return (
    <div className="relative flex flex-col h-full bg-slate-100 rounded-xl shadow-2xl overflow-hidden">
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-10">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {(step > 0 && !isUploadingOrDone) && (
                <button onClick={handlePrev} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
            )}
            <h1 className="text-lg font-semibold text-slate-800">
              Upload Photos
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {step < 5 && (
                <button onClick={handleExit} className="text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
            )}
            {canContinue && (
                <button onClick={handleNext} className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700">
                    {step === 3 ? 'Start Upload' : 'Continue'}
                </button>
            )}
             {step === 5 && (
                <button onClick={onExit} className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700">
                    Finish
                </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden items-center justify-center relative">
        <AnimatePresence initial={false} custom={direction}>
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
                className="absolute w-full h-full flex items-center justify-center"
            >
                {renderStep()}
            </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const UploadWizard: React.FC<UploadWizardProps> = (props) => (
  <UploadProvider initialClientId={props.initialClientId} defaultLayoutId={props.defaultLayoutId}>
    <UploadWizardContent {...props} />
  </UploadProvider>
);

export default UploadWizard;
