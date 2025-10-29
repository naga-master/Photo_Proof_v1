import React from 'react';
import { useUpload } from './UploadContext';
import { PlusIcon, FolderIcon } from '../../icons';

const Step0_SelectMode: React.FC = () => {
  const { setMode } = useUpload();

  return (
    <div className="w-full max-w-2xl text-center animate-slide-up">
      <h2 className="text-3xl font-bold text-gray-800">Start a New Upload</h2>
      <p className="mt-2 text-gray-500">Create a new project or add photos to an existing one.</p>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-6">
        <button
          onClick={() => setMode('new')}
          className="flex flex-col items-center justify-center gap-4 p-8 w-full sm:w-64 h-48 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-800 hover:bg-gray-50 transition-all transform hover:scale-105"
        >
          <PlusIcon className="w-10 h-10 text-gray-600" />
          <span className="text-lg font-semibold text-gray-800">New Project</span>
        </button>
        <button
          onClick={() => setMode('existing')}
          className="flex flex-col items-center justify-center gap-4 p-8 w-full sm:w-64 h-48 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-800 hover:bg-gray-50 transition-all transform hover:scale-105"
        >
          <FolderIcon className="w-10 h-10 text-gray-600" />
          <span className="text-lg font-semibold text-gray-800">Add to Existing</span>
        </button>
      </div>
    </div>
  );
};

export default Step0_SelectMode;
