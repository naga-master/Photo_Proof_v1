import React, { useEffect, useMemo, useState } from 'react';
import { useUpload } from './UploadContext';
import FileRow from './FileRow';
import { PauseIcon, PlayIcon } from '../../icons';
import { uploadQueueManager } from '../../../services/uploadQueueManager';

const Step4_UploadManager: React.FC = () => {
    const { state, startUpload, pauseUpload, resumeUpload, nextStep } = useUpload();
    const { uploadQueue, isUploading } = state;
    const [queueStatus, setQueueStatus] = useState(uploadQueueManager.getStatus());
    
    useEffect(() => {
        // This effect runs once when the component mounts to kick off the upload process.
        startUpload();
        
        // Update queue status periodically
        const interval = setInterval(() => {
            setQueueStatus(uploadQueueManager.getStatus());
        }, 500);
        
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { completed, failed, total, overallProgress, allCompleted } = useMemo(() => {
        const total = uploadQueue.length;
        if (total === 0) return { completed: 0, failed: 0, total: 0, overallProgress: 0, allCompleted: false };

        const completed = uploadQueue.filter(f => f.status === 'success').length;
        const failed = uploadQueue.filter(f => f.status === 'failed').length;
        const totalProgress = uploadQueue.reduce((sum, f) => sum + f.progress, 0);
        const overallProgress = totalProgress / total;
        const allCompleted = (completed + failed) === total;

        return { completed, failed, total, overallProgress, allCompleted };
    }, [uploadQueue]);

    // Auto-advance to summary when all files are done
    useEffect(() => {
        if (allCompleted && total > 0 && failed === 0) {
            // All files uploaded successfully - auto advance after 2 seconds
            const timer = setTimeout(() => {
                console.log('[Step4_UploadManager] All files completed successfully, advancing to summary');
                nextStep();
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [allCompleted, total, failed, nextStep]);

    const handleContinue = () => {
        console.log('[Step4_UploadManager] Manual continue to summary');
        nextStep();
    };

    return (
        <div className="w-full h-full flex flex-col max-w-4xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                        {allCompleted ? '✅ Upload Complete!' : 'Uploading Files...'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {completed} of {total} files completed. 
                        {failed > 0 && <span className="text-red-500"> {failed} failed.</span>}
                        {allCompleted && failed === 0 && <span className="text-green-600"> All files uploaded successfully!</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!allCompleted && (
                        <button
                            onClick={isUploading ? pauseUpload : resumeUpload}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
                        >
                            {isUploading ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                            <span>{isUploading ? 'Pause All' : 'Resume All'}</span>
                        </button>
                    )}
                    {allCompleted && (
                        <button
                            onClick={handleContinue}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-md transition-all"
                        >
                            <span>Continue to Summary</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Queue Status Display */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">Queue Status:</span>
                    <div className="flex gap-4">
                        <span className="text-blue-600">
                            <span className="font-semibold">{queueStatus.uploading}</span> Uploading
                        </span>
                        <span className="text-gray-600">
                            <span className="font-semibold">{queueStatus.pending}</span> Pending
                        </span>
                        <span className="text-green-600">
                            <span className="font-semibold">{queueStatus.completed}</span> Done
                        </span>
                        {queueStatus.failed > 0 && (
                            <span className="text-red-600">
                                <span className="font-semibold">{queueStatus.failed}</span> Failed
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${overallProgress}%` }}></div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <div className="space-y-3">
                    {uploadQueue.map(file => (
                        <FileRow key={file.id} file={file} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Step4_UploadManager;
