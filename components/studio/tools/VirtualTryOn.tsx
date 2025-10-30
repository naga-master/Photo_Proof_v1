import React, { useState } from 'react';
import { ArrowLeftIcon, UploadCloudIcon } from '../../icons';

interface VirtualTryOnProps {
    onBack: () => void;
}

const FileUpload: React.FC<{ onFileSelect: (file: string) => void, title: string, id: string }> = ({ onFileSelect, title, id }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                onFileSelect(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold">{title}</h3>
            <label htmlFor={id} className="flex justify-center p-6 border-2 border-gray-300 border-dashed rounded-md text-center cursor-pointer hover:border-gray-400">
                <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
                    <UploadCloudIcon className="h-10 w-10" />
                    <span className="text-sm">Click to upload</span>
                </div>
                <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
            </label>
        </div>
    );
};


const ImagePreview: React.FC<{ src: string, title: string }> = ({ src, title }) => (
    <div className="space-y-4">
        <h3 className="font-semibold">{title}</h3>
        <div className="p-2 border border-gray-300 rounded-md bg-white">
            <img src={src} alt={`${title} preview`} className="w-full rounded" />
        </div>
    </div>
);


const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ onBack }) => {
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [garmentImage, setGarmentImage] = useState<string | null>(null);

    return (
        <div className="p-8 animate-fade-in w-full h-full flex flex-col">
            <header className="flex items-center gap-4 mb-8">
                 <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Virtual Try-On</h1>
                    <p className="mt-1 text-gray-600">See how clothing items look on models or clients.</p>
                </div>
            </header>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
                {modelImage ? <ImagePreview src={modelImage} title="Model" /> : <FileUpload onFileSelect={setModelImage} title="Upload Model" id="model-upload" />}
                {garmentImage ? <ImagePreview src={garmentImage} title="Garment" /> : <FileUpload onFileSelect={setGarmentImage} title="Upload Garment" id="garment-upload" />}
                
                <div className="space-y-4">
                     <h3 className="font-semibold">Result</h3>
                    <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
                        <p className="text-gray-500 text-sm">Result will appear here</p>
                    </div>
                </div>
            </div>
            <div className="mt-8">
                 <button className="w-full max-w-xs mx-auto py-3 bg-gray-800 text-white font-semibold rounded-md hover:bg-gray-700 disabled:bg-gray-400" disabled={!modelImage || !garmentImage}>
                    Generate Try-On
                </button>
            </div>
        </div>
    );
};

export default VirtualTryOn;