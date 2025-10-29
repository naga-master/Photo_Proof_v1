import React, { useCallback, useState } from 'react';
import { useUpload } from './UploadContext';
import { UploadCloudIcon, FolderIcon } from '../../icons';
import type { FolderMap } from '../../../types';

// Mock data to simulate file drop
const mockFolders = [
    {
        path: "Getting Ready",
        files: Array.from({ length: 15 }, (_, i) => new File([""], `GR_00${i+1}.jpg`))
    },
    {
        path: "First Look",
        files: Array.from({ length: 25 }, (_, i) => new File([""], `FL_00${i+1}.jpg`))
    },
    {
        path: "Ceremony",
        files: Array.from({ length: 50 }, (_, i) => new File([""], `Ceremony_00${i+1}.jpg`))
    },
    {
        path: "Reception",
        files: Array.from({ length: 75 }, (_, i) => new File([""], `Reception_00${i+1}.jpg`))
    },
];


const Step2_FolderMapping: React.FC = () => {
    const { state, setFiles, updateFolderMap } = useUpload();
    const { detectedFolders, folderMap } = state;

    const handleFileDrop = () => {
       setFiles(mockFolders);
    };

    const handleAlbumNameChange = (sourcePath: string, newName: string) => {
        const newMap = folderMap.map(m => m.sourcePath === sourcePath ? { ...m, targetAlbumName: newName } : m);
        updateFolderMap(newMap);
    };

    if (detectedFolders.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center animate-slide-up p-4">
                <div 
                    onClick={handleFileDrop}
                    className="w-full max-w-3xl flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                    <UploadCloudIcon className="w-12 h-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-800">Click here to simulate dropping folders</h3>
                    <p className="mt-1 text-sm text-gray-500">This will load a predefined set of folders and files.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <h3 className="text-xl font-semibold mb-1 text-gray-800">Folder Mapping</h3>
            <p className="text-sm text-gray-500 mb-6">Organize your uploaded folders into gallery albums.</p>

            <div className="space-y-4">
                {detectedFolders.map(folder => {
                    const mapItem = folderMap.find(m => m.sourcePath === folder.path);
                    return (
                        <div key={folder.path} className="flex items-center gap-4 p-4 bg-gray-50 rounded-md border">
                            <div className="flex items-center gap-3 flex-1">
                                <FolderIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-700">{folder.path}</p>
                                    <p className="text-xs text-gray-500">{folder.files.length} files</p>
                                </div>
                            </div>
                            <div className="w-px bg-gray-200 h-8"></div>
                            <div className="flex-1">
                                 <label htmlFor={`album-name-${folder.path}`} className="block text-xs font-medium text-gray-600 mb-1">Gallery Album Name</label>
                                 <input
                                    type="text"
                                    id={`album-name-${folder.path}`}
                                    value={mapItem?.targetAlbumName || ''}
                                    onChange={(e) => handleAlbumNameChange(folder.path, e.target.value)}
                                    className="block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Step2_FolderMapping;
