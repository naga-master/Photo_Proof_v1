

import React from 'react';
import { useUpload } from './UploadContext';
import { UploadCloudIcon, FolderIcon } from '../../icons';
import type { FolderMap } from '../../../types';

const Step2_FolderMapping: React.FC = () => {
    const { state, setFiles, updateFolderMap } = useUpload();
    const { detectedFolders, folderMap } = state;
    const [isDragging, setIsDragging] = React.useState(false);

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
        
        const newDetectedFolders = Object.keys(folders).map(path => ({
            path,
            files: folders[path],
        }));

        if (newDetectedFolders.length > 0) {
            // Merge with existing folders instead of replacing
            const existingPaths = new Set(detectedFolders.map(f => f.path));
            const foldersToAdd = newDetectedFolders.filter(f => !existingPaths.has(f.path));
            
            if (foldersToAdd.length > 0) {
                const allFolders = [...detectedFolders, ...foldersToAdd];
                setFiles(allFolders);
                console.log(`[Step2] Added ${foldersToAdd.length} new folders. Total: ${allFolders.length}`);
            } else {
                console.log('[Step2] No new folders to add (all already selected)');
            }
        } else {
            // Fallback for browsers that don't support webkitdirectory but allow multiple file selection.
            // All files will be grouped into a single default album.
            // Fix: Cast FileList to File[] for correct type.
            const allFiles = Array.from(fileList) as File[];
            if (allFiles.length > 0) {
                // Only add if "Uploaded Photos" doesn't already exist
                const hasDefaultFolder = detectedFolders.some(f => f.path === "Uploaded Photos");
                if (!hasDefaultFolder) {
                    setFiles([...detectedFolders, { path: "Uploaded Photos", files: allFiles }]);
                }
            }
        }
        
        // Reset input so same folder can be selected again if needed
        event.target.value = '';
    };

    const handleAlbumNameChange = (sourcePath: string, newName: string) => {
        const newMap = folderMap.map(m => m.sourcePath === sourcePath ? { ...m, targetAlbumName: newName } : m);
        updateFolderMap(newMap);
    };

    // Handle drag and drop for multiple folders
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        console.log('[Step2] 📥 Drop event received');
        console.log('[Step2] DataTransfer types:', e.dataTransfer.types);
        
        // Try BOTH APIs - items API (for webkitGetAsEntry) and files API (for webkitRelativePath)
        const items = Array.from(e.dataTransfer.items);
        const files = Array.from(e.dataTransfer.files);
        
        console.log('[Step2] Items count:', items.length, 'Files count:', files.length);
        console.log('[Step2] Analyzing what was dropped...');

        const folders: { [key: string]: File[] } = {};

        // Method 1: Try using items API with webkitGetAsEntry (works for first folder)
        let processedViaItems = 0;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry && entry.isDirectory) {
                    console.log(`[Step2] 📁 Processing folder via items API: ${entry.name}`);
                    await processDirectory(entry as any, entry.name, folders);
                    processedViaItems++;
                }
            }
        }
        
        console.log('[Step2] Processed via items API:', processedViaItems);

        // Method 2: Use files API with webkitRelativePath (fallback for additional folders)
        // Group files by their parent folder
        if (files.length > 0) {
            console.log('[Step2] Checking files API for additional folders...');
            console.log('[Step2] Files array:', files);
            
            files.forEach((file: any, index) => {
                const relativePath = file.webkitRelativePath || '';
                console.log(`[Step2] File ${index + 1}:`, {
                    name: file.name,
                    webkitRelativePath: file.webkitRelativePath,
                    relativePath: relativePath,
                    type: file.type,
                    size: file.size
                });
                
                if (relativePath) {
                    const pathParts = relativePath.split('/');
                    if (pathParts.length > 1) {
                        const folderName = pathParts[0]; // First part is the folder name
                        console.log(`[Step2] Extracted folder name: ${folderName} from path: ${relativePath}`);
                        
                        if (!folders[folderName]) {
                            folders[folderName] = [];
                            console.log(`[Step2] Created new folder entry: ${folderName}`);
                        }
                        folders[folderName].push(file);
                    }
                } else {
                    console.log(`[Step2] ⚠️ File ${index + 1} has no webkitRelativePath, checking other properties...`);
                    // Try to extract from file.path or other properties
                    const path = (file as any).path || '';
                    console.log(`[Step2] file.path:`, path);
                }
            });
        }

        console.log('[Step2] 📊 All detected folders:', Object.keys(folders));

        const newDetectedFolders = Object.keys(folders).map(path => ({
            path,
            files: folders[path],
        }));

        console.log('[Step2] 📊 Final folders count:', newDetectedFolders.length, newDetectedFolders.map(f => `${f.path} (${f.files.length} files)`));

        if (newDetectedFolders.length > 0) {
            // Merge with existing folders
            const existingPaths = new Set(detectedFolders.map(f => f.path));
            const foldersToAdd = newDetectedFolders.filter(f => !existingPaths.has(f.path));

            if (foldersToAdd.length > 0) {
                const allFolders = [...detectedFolders, ...foldersToAdd];
                setFiles(allFolders);
                console.log(`[Step2] ✅ Added ${foldersToAdd.length} folders via drag-drop. Total: ${allFolders.length}`);
            } else {
                console.log('[Step2] No new folders to add (all already selected)');
            }
        }
    };

    // Recursively process directory entries
    const processDirectory = async (directoryEntry: any, basePath: string, folders: { [key: string]: File[] }) => {
        const directoryReader = directoryEntry.createReader();
        
        const readEntries = (): Promise<any[]> => {
            return new Promise((resolve, reject) => {
                directoryReader.readEntries(
                    (entries: any[]) => resolve(entries),
                    (error: any) => reject(error)
                );
            });
        };

        let entries = await readEntries();
        
        for (const entry of entries) {
            if (entry.isFile) {
                const file: File = await new Promise((resolve, reject) => {
                    entry.file(
                        (file: File) => resolve(file),
                        (error: any) => reject(error)
                    );
                });
                
                // Add file to its folder
                if (!folders[basePath]) {
                    folders[basePath] = [];
                }
                folders[basePath].push(file);
            } else if (entry.isDirectory) {
                // Process subdirectory
                const subPath = `${basePath}/${entry.name}`;
                await processDirectory(entry, subPath, folders);
            }
        }
    };

    if (detectedFolders.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center animate-slide-up p-4">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full max-w-3xl transition-all ${
                        isDragging 
                            ? 'border-4 border-blue-500 bg-blue-50' 
                            : 'border-2 border-dashed border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                    }`}
                >
                    <label 
                        htmlFor="folder-upload"
                        className="flex flex-col items-center justify-center p-8 rounded-lg text-center cursor-pointer"
                    >
                        <UploadCloudIcon className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                        <h3 className="mt-4 text-lg font-semibold text-gray-800">
                            {isDragging ? 'Drop Folders Here' : 'Select or Drag Folders to Upload'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {isDragging ? (
                                'Release to add folders'
                            ) : (
                                <>
                                    <strong>Drag and drop multiple folders here</strong><br />
                                    or click to browse and select folders
                                </>
                            )}
                        </p>
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
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Folder Mapping</h3>
                    <p className="text-sm text-gray-500">Organize your uploaded folders into gallery albums.</p>
                </div>
                <label 
                    htmlFor="add-more-folders"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                    + Add More Folders
                    <input
                        id="add-more-folders"
                        type="file"
                        className="sr-only"
                        multiple
                        // @ts-ignore 
                        webkitdirectory=""
                        // @ts-ignore 
                        directory=""
                        onChange={handleFolderSelection}
                    />
                </label>
            </div>

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
                                    className="block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-gray-200 outline-none transition-colors sm:text-sm"
                                    placeholder="Enter album name"
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
