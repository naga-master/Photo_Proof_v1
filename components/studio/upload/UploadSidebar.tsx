import React from 'react';

const UploadSidebar: React.FC = () => {
    return (
        <aside className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800">Uploads</h3>
            <div className="mt-6 flex-1">
                <div className="text-center text-gray-400 py-10">
                    <p className="text-sm">Upload queue will appear here.</p>
                </div>
                {/* 
                Example of progress item:
                <div>
                    <div className="flex justify-between text-sm">
                        <p className="font-medium text-gray-700 truncate">DSC_0021.jpg</p>
                        <p className="text-gray-500">50%</p>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '50%'}}></div>
                    </div>
                </div> 
                */}
            </div>
            <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700">Summary</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Files to upload:</span> <span>0</span></div>
                    <div className="flex justify-between"><span>Total size:</span> <span>0 MB</span></div>
                    <div className="flex justify-between"><span>Estimated time:</span> <span>--</span></div>
                </div>
            </div>
        </aside>
    );
};

export default UploadSidebar;
