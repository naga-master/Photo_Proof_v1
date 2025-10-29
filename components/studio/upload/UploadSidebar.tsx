import React, { useMemo } from 'react';
import { useUpload } from './UploadContext';
import { CheckCircleIcon, XCircleIcon } from '../../icons';

const UploadSidebar: React.FC = () => {
    const { state } = useUpload();
    const { uploadQueue } = state;

    const summary = useMemo(() => {
        const total = uploadQueue.length;
        if (total === 0) return { total: 0, uploading: 0, queued: 0, success: 0, failed: 0 };

        return {
            total,
            uploading: uploadQueue.filter(f => f.status === 'uploading').length,
            queued: uploadQueue.filter(f => f.status === 'queued').length,
            success: uploadQueue.filter(f => f.status === 'success').length,
            failed: uploadQueue.filter(f => f.status === 'failed').length,
        };
    }, [uploadQueue]);

    const failedFiles = useMemo(() => uploadQueue.filter(f => f.status === 'failed'), [uploadQueue]);

    const totalSize = useMemo(() => {
        const bytes = uploadQueue.reduce((acc, f) => acc + f.file.size, 0);
        return (bytes / 1024 / 1024).toFixed(2);
    }, [uploadQueue]);

    return (
        <aside className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800">Uploads</h3>
            <div className="mt-6 flex-1">
                {uploadQueue.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        <p className="text-sm">Upload queue will appear here after starting the upload.</p>
                    </div>
                ) : (
                    <>
                        {failedFiles.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-red-700">Failed Items</h4>
                                <div className="mt-2 text-xs text-red-600 space-y-1 max-h-24 overflow-y-auto bg-red-50 p-2 rounded-md">
                                    {failedFiles.map(f => (
                                        <div key={f.id} className="flex items-center gap-1.5">
                                            <XCircleIcon className="w-3 h-3 flex-shrink-0" />
                                            <p className="truncate">{f.file.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <h4 className="text-sm font-semibold text-gray-700">Live Queue</h4>
                        <div className="mt-2 text-xs text-gray-500 space-y-1 max-h-64 overflow-y-auto">
                           {uploadQueue.filter(f => f.status === 'uploading' || f.status === 'queued').slice(0, 10).map(f => (
                               <p key={f.id} className="truncate">
                                   <span className="font-mono">{f.status === 'uploading' ? '↑' : '···'}</span> {f.file.name}
                                </p>
                           ))}
                        </div>
                    </>
                )}
            </div>
            <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700">Summary</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Files to upload:</span> <span>{summary.total}</span></div>
                    <div className="flex justify-between"><span>Total size:</span> <span>{totalSize} MB</span></div>
                    <div className="flex justify-between text-green-600"><span>Completed:</span> <span>{summary.success}</span></div>
                    <div className="flex justify-between text-red-600"><span>Failed:</span> <span>{summary.failed}</span></div>
                </div>
            </div>
        </aside>
    );
};

export default UploadSidebar;
