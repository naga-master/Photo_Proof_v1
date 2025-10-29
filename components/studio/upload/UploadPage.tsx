import React, { useState } from 'react';
import type { DashboardView } from '../../../types';
import { ArrowLeftIcon, CheckCircleIcon, FolderIcon, PlusIcon } from '../../icons';
import Step1ProjectSetup from './Step1ProjectSetup';
import Step2FolderMapping from './Step2FolderMapping';
import UploadSidebar from './UploadSidebar';

interface UploadPageProps {
  onNavigate: (view: DashboardView) => void;
}

type UploadMode = 'new' | 'existing' | null;

const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<UploadMode>(null);
  const [step, setStep] = useState(0);

  const steps = ['Project Setup', 'Folder Mapping', 'Upload Options', 'Upload', 'Finalize'];
  const currentStep = steps[step];

  const handleModeSelect = (selectedMode: UploadMode) => {
    setMode(selectedMode);
    setStep(0);
  };

  const resetProcess = () => {
      setMode(null);
      setStep(0);
  }

  const renderContent = () => {
    if (!mode) {
      return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Start by creating a project</h2>
            <p className="mt-2 text-gray-500">You can create a new project or add assets to an existing one.</p>
            <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => handleModeSelect('new')} className="flex flex-col items-center justify-center gap-3 w-48 h-32 bg-white border border-gray-300 rounded-lg hover:border-gray-800 hover:bg-gray-50 transition-all">
                    <PlusIcon className="w-8 h-8 text-gray-600"/>
                    <span className="font-semibold">New Project</span>
                </button>
                 <button onClick={() => handleModeSelect('existing')} className="flex flex-col items-center justify-center gap-3 w-48 h-32 bg-white border border-gray-300 rounded-lg hover:border-gray-800 hover:bg-gray-50 transition-all">
                    <FolderIcon className="w-8 h-8 text-gray-600"/>
                    <span className="font-semibold">Add to Existing</span>
                </button>
            </div>
        </div>
      );
    }

    // Wizard Steps
    switch(step) {
        case 0:
            return <Step1ProjectSetup />;
        case 1:
            return <Step2FolderMapping />;
        default:
             return <div className="text-center text-gray-500">Step {step + 1} coming soon.</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-fade-in">
        <header className="flex-shrink-0 bg-white border-b border-gray-200">
            <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('projects')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <ArrowLeftIcon className="w-5 h-5"/>
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold">
                            {mode === 'new' ? 'Create New Project' : 'Add to Existing Project'}
                        </h1>
                        <p className="text-sm text-gray-500">Step {step + 1} of {steps.length}: {currentStep}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={resetProcess} className="text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                    {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Back</button>}
                    <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700">
                       {step === steps.length - 1 ? 'Finish Upload' : 'Save & Continue'}
                    </button>
                </div>
            </div>
             {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-1">
                <div className="bg-gray-800 h-1" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
                {renderContent()}
            </main>
            {mode && <UploadSidebar />}
        </div>
    </div>
  );
};

export default UploadPage;
