import React, { useState } from 'react';
import { ArrowLeftIcon, UploadCloudIcon, XCircleIcon } from '../../icons';

interface HistoricImagerProps {
    onBack: () => void;
}

const HistoricImager: React.FC<HistoricImagerProps> = ({ onBack }) => {
    const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedPhoto(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearPhoto = () => {
        setUploadedPhoto(null);
        // Also clear the file input value
        const input = document.getElementById('photo-upload') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    }

    return (
        <div className="p-8 animate-fade-in w-full h-full flex flex-col">
            <header className="flex items-center gap-4 mb-8">
                 <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Historic Imager</h1>
                    <p className="mt-1 text-gray-600">Transform portraits into historical figures with AI.</p>
                </div>
            </header>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Upload a Photo</label>
                        {uploadedPhoto ? (
                            <div className="mt-1 relative">
                                <img src={uploadedPhoto} alt="Uploaded preview" className="w-full rounded-md shadow-sm" />
                                <button onClick={clearPhoto} className="absolute top-2 right-2 p-1 bg-white/70 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-colors">
                                    <XCircleIcon className="w-6 h-6"/>
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="photo-upload" className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400">
                                <div className="space-y-1 text-center">
                                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <p className="pl-1">Click to upload a file</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                </div>
                                <input id="photo-upload" name="photo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                            </label>
                        )}
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">Describe the transformation</label>
                        <input type="text" id="prompt" className="mt-1 block w-full bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm" placeholder="e.g., A Roman senator, a 1920s flapper..." />
                    </div>
                     <button className="w-full py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:bg-gray-400" disabled={!uploadedPhoto}>
                        Generate Image
                    </button>
                </div>
                 <div className="bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Generated image will appear here</p>
                </div>
            </div>
        </div>
    );
};

export default HistoricImager;