

import React from 'react';
import { useUpload } from './UploadContext';
import { UploadCloudIcon, FolderIcon } from '../../icons';
import type { FolderMap } from '../../../types';

const Step2_FolderMapping: React.FC = () => {
    const { state, setFiles, updateFolderMap } = useUpload();
    const { detectedFolders, folderMap } = state;

    const handleFolderSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) {
            return;
        }

        const folders: { [key: string]: File[] } = {};

        // Fix: Cast FileList to File[] to allow iteration.
        (Array.from(fileList) as File[]).forEach(file => {
            // The 'webkitRelativePath' property gives the path relative to the selected directory.
            const relativePath = (file as any).webkitRelativePath;
            if (relativePath) {
                const pathParts = relativePath.split('/');
                // The folder path is everything except the last part (the filename)
                const folderPath = pathParts.slice(0, -1).join('/');
                
                if (folderPath) {
                    if (!folders[folderPath]) {
                        folders[folderPath] = [];
                    }
                    folders[folderPath].push(file);
                }
            }
        });
        
        const detectedFoldersArray = Object.keys(folders).map(path => ({
            path,
            files: folders[path],
        }));

        if (detectedFoldersArray.length > 0) {
            setFiles(detectedFoldersArray);
        } else {
            // Fallback for browsers that don't support webkitdirectory but allow multiple file selection.
            // All files will be grouped into a single default album.
            // Fix: Cast FileList to File[] for correct type.
            const allFiles = Array.from(fileList) as File[];
            if (allFiles.length > 0) {
                 setFiles([{ path: "Uploaded Photos", files: allFiles }]);
            }
        }
    };

    const handleAlbumNameChange = (sourcePath: string, newName: string) => {
        const newMap = folderMap.map(m => m.sourcePath === sourcePath ? { ...m, targetAlbumName: newName } : m);
        updateFolderMap(newMap);
    };

    if (detectedFolders.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center animate-slide-up p-4">
                <label 
                    htmlFor="folder-upload"
                    className="w-full max-w-3xl flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                    <UploadCloudIcon className="w-12 h-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-800">Select Folders to Upload</h3>
                    <p className="mt-1 text-sm text-gray-500">Your folder structure will be preserved as albums.</p>
                     <input
                        id="folder-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        // These non-standard properties allow for folder selection in most modern browsers
                        // @ts-ignore 
                        webkitdirectory=""
                        // @ts-ignore 
                        directory=""
                        onChange={handleFolderSelection}
                    />
                </label>
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
