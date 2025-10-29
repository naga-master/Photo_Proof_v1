import React from 'react';
import { UploadProvider, useUpload } from './UploadContext';
import Step0_SelectMode from './Step0_SelectMode';
import Step1_ProjectSetup from './Step1_ProjectSetup';
import Step2_FolderMapping from './Step2_FolderMapping';
import Step3_UploadRules from './Step3_UploadRules';
import Step4_UploadManager from './Step4_UploadManager';
import Step5_Summary from './Step5_Summary';
import UploadSidebar from './UploadSidebar';
import { ArrowLeftIcon } from '../../icons';
import OfflineBanner from './OfflineBanner';

interface UploadWizardProps {
  onExit: () => void;
}

const steps = ['Mode', 'Project Setup', 'Folder Mapping', 'Upload Rules', 'Upload', 'Summary'];

const UploadWizardContent: React.FC<UploadWizardProps> = ({ onExit }) => {
  const { state, nextStep, prevStep, resetUpload } = useUpload();
  const { step, mode } = state;
  const currentStep = steps[step];

  const renderStep = () => {
    switch (step) {
      case 0: return <Step0_SelectMode />;
      case 1: return <Step1_ProjectSetup />;
      case 2: return <Step2_FolderMapping />;
      case 3: return <Step3_UploadRules />;
      case 4: return <Step4_UploadManager />;
      case 5: return <Step5_Summary />;
      default: return <Step0_SelectMode />;
    }
  };

  const isUploadingOrDone = step >= 4;
  const canContinue = step < 4;

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-fade-in">
      <OfflineBanner />
      <header className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {mode === 'new' ? 'Create New Project' : mode === 'existing' ? 'Add to Existing Project' : 'Upload Photos'}
              </h1>
              {mode && <p className="text-sm text-gray-500">Step {step} of {steps.length -1}: {currentStep}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={resetUpload} className="text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
            {step > 1 && !isUploadingOrDone && <button onClick={prevStep} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Back</button>}
            {canContinue && mode && (
                <button onClick={nextStep} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">
                    {step === 3 ? 'Start Upload' : 'Save & Continue'}
                </button>
            )}
             {step === 5 && (
                <button onClick={onExit} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">
                    Finish
                </button>
            )}
          </div>
        </div>
        {mode && (
          <div className="w-full bg-gray-200 h-1">
            <div className="bg-gray-800 h-1 transition-all duration-300" style={{ width: `${(step / (steps.length - 1)) * 100}%` }}></div>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          {renderStep()}
        </main>
        {mode && step >= 2 && <UploadSidebar />}
      </div>
    </div>
  );
};

const UploadWizard: React.FC<UploadWizardProps> = ({ onExit }) => (
  <UploadProvider>
    <UploadWizardContent onExit={onExit} />
  </UploadProvider>
);

export default UploadWizard;
