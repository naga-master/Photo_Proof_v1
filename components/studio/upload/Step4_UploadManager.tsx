import React, { useEffect, useMemo } from 'react';
import { useUpload } from './UploadContext';
import FileRow from './FileRow';
import { PauseIcon, PlayIcon } from '../../icons';

const Step4_UploadManager: React.FC = () => {
    const { state, startUpload, pauseUpload, resumeUpload } = useUpload();
    const { uploadQueue, isUploading } = state;
    
    useEffect(() => {
        // This effect runs once when the component mounts to kick off the upload process.
        startUpload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { completed, failed, total, overallProgress } = useMemo(() => {
        const total = uploadQueue.length;
        if (total === 0) return { completed: 0, failed: 0, total: 0, overallProgress: 0 };

        const completed = uploadQueue.filter(f => f.status === 'success').length;
        const failed = uploadQueue.filter(f => f.status === 'failed').length;
        const totalProgress = uploadQueue.reduce((sum, f) => sum + f.progress, 0);
        const overallProgress = totalProgress / total;

        return { completed, failed, total, overallProgress };
    }, [uploadQueue]);

    return (
        <div className="w-full h-full flex flex-col max-w-4xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Uploading Files...</h3>
                    <p className="text-sm text-gray-500">{completed} of {total} files completed. {failed > 0 && <span className="text-red-500">{failed} failed.</span>}</p>
                </div>
                <button
                    onClick={isUploading ? pauseUpload : resumeUpload}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
                >
                    {isUploading ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    <span>{isUploading ? 'Pause All' : 'Resume All'}</span>
                </button>
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
