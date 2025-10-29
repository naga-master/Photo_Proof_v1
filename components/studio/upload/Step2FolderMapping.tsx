import React from 'react';
import { UploadCloudIcon } from '../../icons';

const Step2FolderMapping: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center animate-slide-up p-4">
            <div className="w-full max-w-3xl flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                <UploadCloudIcon className="w-12 h-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-800">Drag and drop folders & files here</h3>
                <p className="mt-1 text-sm text-gray-500">or</p>
                <button className="mt-4 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                    Browse Files
                </button>
                <p className="mt-4 text-xs text-gray-400">Maximum file size: 500MB. Supported formats: JPG, PNG, GIF, MP4.</p>
            </div>
            <div className="mt-6 text-sm text-gray-500">
                <p>After uploading, you'll be able to map folders to gallery albums.</p>
            </div>
        </div>
    );
};

export default Step2FolderMapping;
