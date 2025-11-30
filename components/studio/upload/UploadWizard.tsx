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
import { DuplicateDetectionModal } from '../../../src/components/DuplicateDetectionModal';
import type { ProjectDetails, UploadFile, Album, Client, LayoutId, ServicePackage } from '../../../types';
import { canProceedFromStep1, canProceedFromStep2, validateStep1, validateStep2, getValidationErrorMessage } from '../../../lib/validators';
import { clientService } from '../../../services/clientService';
import { projectService } from '../../../services/projectService';

interface UploadWizardProps {
  clients: Client[];
  packages: ServicePackage[];
  initialClientId?: number;
  defaultLayoutId: LayoutId;
  onExit: () => void;
  onProjectCreated: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]) => Album;
  onViewGallery: (album: Album) => void;
  showToast: (message: string) => void;
  existingProjectId?: string;  // Changed from number to string
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
  const { state, nextStep, prevStep, resetUpload, setStep, dispatch, pauseUpload } = useUpload();
  
  // Debug: Log when duplicateModal state changes
  React.useEffect(() => {
    console.log('[UploadWizard] duplicateModal state changed:', state.duplicateModal);
  }, [state.duplicateModal]);
  const { step, mode } = state;
  
  // Smart back button handler
  const handleBackButton = React.useCallback(() => {
    // If on first step (mode selection), exit wizard
    if (step === 0) {
      onExit();
      return;
    }
    
    // If uploading, warn user before going back
    if (step === 4 && state.isUploading) {
      if (window.confirm('Upload in progress. Going back will pause uploads. Continue?')) {
        pauseUpload();
        prevStep();
      }
      return;
    }
    
    // Otherwise, go back one step
    prevStep();
  }, [step, state.isUploading, onExit, pauseUpload, prevStep]);
  const [direction, setDirection] = useState(0);
  const [validationError, setValidationError] = useState<string>('');

  // Set initial step if provided (e.g., when adding photos to existing project)
  React.useEffect(() => {
    if (initialStep && initialStep > 0) {
      setStep(initialStep);
    }
  }, [initialStep, setStep]);
  
  // Debug logging for backendProjectId
  React.useEffect(() => {
    console.log('[UploadWizard] State updated:', {
      step,
      mode,
      backendProjectId: state.backendProjectId,
      existingProjectId,
    });
  }, [step, mode, state.backendProjectId, existingProjectId]);

  // Debug logging for sidebar visibility
  React.useEffect(() => {
    const sidebarVisible = (mode || state.projectDetails.clientId) && step >= 2;
    console.log('[UploadWizard] Sidebar visibility check:', {
      mode,
      clientId: state.projectDetails.clientId,
      step,
      existingProjectId,
      backendProjectId: state.backendProjectId,
      sidebarVisible,
    });
  }, [mode, state.projectDetails.clientId, step, existingProjectId, state.backendProjectId]);

  const handleNext = async () => {
    // Validate before proceeding
    let isValid = true;
    let errors: Record<string, string> = {};

    if (step === 1) {
      const validation = validateStep1(state.projectDetails);
      isValid = validation.isValid;
      errors = validation.errors;

      // If validation passes and we're creating a new client, create it first
      if (isValid && state.projectDetails.clientId === 'new' && state.projectDetails.newClientDetails) {
        try {
          // Toast removed - widget shows upload progress
          const newClient = await clientService.createClient({
            name: state.projectDetails.newClientDetails.name || '',
            email: state.projectDetails.newClientDetails.email,
            phone: state.projectDetails.newClientDetails.phone,
          });
          
          // Update project details with the new client ID
          dispatch({
            type: 'SET_PROJECT_DETAILS',
            payload: { clientId: newClient.id }
          });
          
          console.log('[UploadWizard] Client created successfully');
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to create client';
          setValidationError(errorMessage);
          showToast(errorMessage);
          console.error('[UploadWizard] Client creation failed:', error);
          return;
        }
      }
    } else if (step === 2) {
      const validation = validateStep2({
        detectedFolders: state.detectedFolders,
        folderMap: state.folderMap
      });
      isValid = validation.isValid;
      errors = validation.errors;
      
      console.log('[UploadWizard] Step 2 validation:', { isValid, hasProjectId: !!state.backendProjectId });
      
      // Check for duplicate folder names on backend before proceeding
      if (isValid) {
        if (!state.backendProjectId) {
          console.log('[UploadWizard] ⚠️ No backend project ID yet, will check on Step 3');
          // If no project ID yet, we'll check when project is created on Step 3
          // For now, proceed to Step 3
        } else {
        console.log('[UploadWizard] ✅ Starting duplicate check...');
        console.log('[UploadWizard] Backend Project ID:', state.backendProjectId);
        console.log('[UploadWizard] Folders to check:', state.folderMap.map(f => f.targetAlbumName));
        
        try {
          // Check each folder name
          for (const folderMapping of state.folderMap) {
            console.log('[UploadWizard] Creating folder:', folderMapping.targetAlbumName);
            
            const result = await projectService.createFolder(
              state.backendProjectId,
              folderMapping.targetAlbumName
            );
            
            console.log('[UploadWizard] Folder creation result:', result);
            
            // If it's a duplicate, show modal and stop
            if ('error' in result && result.error === 'duplicate_detected') {
              console.log('[UploadWizard] ⚠️ DUPLICATE DETECTED:', folderMapping.targetAlbumName);
              console.log('[UploadWizard] Duplicate info:', result);
              
              // Show modal
              dispatch({
                type: 'SHOW_DUPLICATE_MODAL',
                payload: {
                  type: result.type || 'folder_name',
                  message: result.message || `Folder '${folderMapping.targetAlbumName}' already exists in this project`,
                  data: result
                }
              });
              
              console.log('[UploadWizard] Modal dispatch sent, stopping here');
              
              // Log for debugging
              console.log(`[UploadWizard] Folder '${folderMapping.targetAlbumName}' already exists`);
              
              return; // Stop here, don't proceed to next step
            }
            
            // If folder was created successfully, we need to track it
            // So we don't create it again during upload
            if ('id' in result) {
              console.log('[UploadWizard] Folder created successfully:', result.name, 'ID:', result.id);
              // Update folder map with the created ID
              const updatedFolderMap = state.folderMap.map(f => 
                f.targetAlbumName === result.name 
                  ? { ...f, targetId: result.id } 
                  : f
              );
              dispatch({ type: 'UPDATE_FOLDER_MAP', payload: updatedFolderMap });
            }
          }
          
          console.log('[UploadWizard] All folders checked, no duplicates found');
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to check folder names';
          setValidationError(errorMessage);
          showToast(errorMessage);
          console.error('[UploadWizard] Folder check failed:', error);
          return;
        }
        }
      }
    } else if (step === 3) {
      // Before starting upload, create the backend project
      console.log('[UploadWizard] Step 3 - Checking backendProjectId:', state.backendProjectId);
      if (!state.backendProjectId) {
        console.log('[UploadWizard] No backendProjectId found, creating new project...');
        try {
          // Toast removed - widget shows upload progress
          
          // Get client details - either from existing client or from newClientDetails
          let clientName = '';
          let clientEmail = '';
          let clientPhone = '';
          
          if (state.projectDetails.clientId && state.projectDetails.clientId !== 'new') {
            // Find existing client
            const client = clients.find(c => c.id === state.projectDetails.clientId);
            if (client) {
              clientName = client.name;
              clientEmail = client.email;
              clientPhone = client.phone || '';
            }
          } else if (state.projectDetails.newClientDetails) {
            // Use new client details
            clientName = state.projectDetails.newClientDetails.name || '';
            clientEmail = state.projectDetails.newClientDetails.email || '';
            clientPhone = state.projectDetails.newClientDetails.phone || '';
          }
          
          const createProjectData = {
            name: state.projectDetails.title || 'Untitled Project',
            client_id: state.projectDetails.clientId !== 'new' ? String(state.projectDetails.clientId) : undefined,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            shoot_date: state.projectDetails.shootDate,
            project_type: 'photo_shoot',
            package_id: state.projectDetails.packageId || undefined,
          };
          
          console.log('[UploadWizard] Creating project with data:', {
            ...createProjectData,
            packageIdFromState: state.projectDetails.packageId,
            packageIdType: typeof state.projectDetails.packageId,
          });
          
          const project = await projectService.createProject(createProjectData);
          
          console.log('[UploadWizard] Project created, response:', {
            id: project.id,
            package_id: project.package_id,
            title: project.title,
          });
          
          // Store the backend project ID
          dispatch({
            type: 'SET_BACKEND_PROJECT_ID',
            payload: project.id
          });
          
          console.log('[UploadWizard] Project created successfully:', project.id);
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to create project';
          setValidationError(errorMessage);
          showToast(errorMessage);
          console.error('[UploadWizard] Project creation failed:', error);
          return;
        }
      } else {
        console.log('[UploadWizard] Using existing project, backendProjectId:', state.backendProjectId);
      }
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
            <button 
              onClick={handleBackButton} 
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
              title={step === 0 ? "Close wizard" : "Go back"}
            >
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
            {step !== 5 && <button onClick={resetUpload} className="text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>}
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
      
      {/* Duplicate Detection Modal */}
      {(() => {
        const shouldShow = state.duplicateModal?.show && state.duplicateModal.data;
        console.log('[UploadWizard] Modal render check:', { 
          show: state.duplicateModal?.show, 
          hasData: !!state.duplicateModal?.data,
          shouldShow 
        });
        
        if (shouldShow) {
          return (
            <DuplicateDetectionModal
              duplicateInfo={state.duplicateModal.data}
              onClose={() => {
                console.log('[UploadWizard] Modal close clicked');
                dispatch({ type: 'HIDE_DUPLICATE_MODAL' });
              }}
              onAction={(action) => {
                console.log('[UploadWizard] Duplicate modal action:', action);
                dispatch({ type: 'HIDE_DUPLICATE_MODAL' });
              }}
            />
          );
        }
        return null;
      })()}
    </div>
  );
};

const UploadWizard: React.FC<UploadWizardProps> = (props) => (
  <UploadProvider 
    initialClientId={props.initialClientId} 
    defaultLayoutId={props.defaultLayoutId}
    existingProjectId={props.existingProjectId}
  >
    <UploadWizardContent {...props} />
  </UploadProvider>
);

export default UploadWizard;
