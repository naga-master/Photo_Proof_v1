import React, { useCallback, useState } from 'react';
import { useEditedUpload } from './EditedUploadContext';
import { UploadCloudIcon, CloseIcon, CameraIcon } from '../../icons';

const Step1_SelectFiles: React.FC = () => {
  const { state, setEditedFiles, removeEditedFile, addEditedFiles } = useEditedUpload();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      if (state.editedFiles.length === 0) {
        setEditedFiles(files);
      } else {
        addEditedFiles(files);
      }
    }
  }, [state.editedFiles.length, setEditedFiles, addEditedFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length > 0) {
        if (state.editedFiles.length === 0) {
          setEditedFiles(imageFiles);
        } else {
          addEditedFiles(imageFiles);
        }
      }
    }
    // Reset input
    e.target.value = '';
  }, [state.editedFiles.length, setEditedFiles, addEditedFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Edited Files</h2>
        <p className="text-slate-600 mb-6">
          Choose the edited photos you want to upload as new versions. We'll automatically match them to original photos.
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-slate-200'}`}>
              <UploadCloudIcon className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-slate-500'}`} />
            </div>
            
            <div>
              <p className="text-lg font-medium text-slate-700 mb-1">
                {isDragging ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-sm text-slate-500">or</p>
            </div>
            
            <label
              htmlFor="file-upload"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-md cursor-pointer transition-colors"
            >
              Browse Files
            </label>
            
            <p className="text-xs text-slate-500 mt-2">
              Supported formats: JPG, PNG, GIF, WebP • Max 100MB per file
            </p>
          </div>
        </div>

        {/* File List */}
        {state.editedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Selected Files ({state.editedFiles.length})
              </h3>
              <label
                htmlFor="file-upload"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                + Add More
              </label>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {state.editedFiles.map((file, index) => (
                <FileRow
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => removeEditedFile(file.name)}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CameraIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Next: Auto-Matching</p>
                  <p className="text-blue-700">
                    We'll automatically match these files to your original photos based on filenames. 
                    You can manually map any unmatched files in the next steps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface FileRowProps {
  file: File;
  onRemove: () => void;
  formatFileSize: (bytes: number) => string;
}

const FileRow: React.FC<FileRowProps> = ({ file, onRemove, formatFileSize }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnail(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraIcon className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
        title="Remove file"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Step1_SelectFiles;
