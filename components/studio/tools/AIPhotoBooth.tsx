import React, { useState } from 'react';
import { ArrowLeftIcon, UploadCloudIcon, CameraIcon, XCircleIcon } from '../../icons';

interface AIPhotoBoothProps {
    onBack: () => void;
}

const AIPhotoBooth: React.FC<AIPhotoBoothProps> = ({ onBack }) => {
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                setSourceImage(e.target?.result as string);
                setIsCameraActive(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearSource = () => {
        setSourceImage(null);
        setIsCameraActive(false);
        const input = document.getElementById('booth-photo-upload') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    };

    const showCamera = () => {
        setIsCameraActive(true);
        setSourceImage(null);
    };

    const renderSourceArea = () => {
        if (sourceImage) {
            return (
                <div className="w-full h-full bg-black rounded-lg flex items-center justify-center relative group">
                    <img src={sourceImage} alt="Uploaded preview" className="max-w-full max-h-full object-contain rounded-lg" />
                    <button onClick={clearSource} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            );
        }

        if (isCameraActive) {
            return (
                <div className="w-full h-full bg-black rounded-lg flex flex-col items-center justify-center relative group">
                    <CameraIcon className="w-16 h-16 text-gray-700" />
                    <p className="text-white mt-4">Camera Feed Placeholder</p>
                    <button onClick={clearSource} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            );
        }

        return (
            <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <label htmlFor="booth-photo-upload" className="flex flex-col items-center justify-center gap-4 p-8 w-64 h-48 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-800 hover:bg-gray-50 transition-all transform hover:scale-105 cursor-pointer shadow-sm hover:shadow-md">
                        <UploadCloudIcon className="w-10 h-10 text-gray-500" />
                        <span className="text-lg font-semibold text-gray-800 text-center">Upload Photo</span>
                        <input id="booth-photo-upload" name="booth-photo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                    </label>
                    <button
                        onClick={showCamera}
                        className="flex flex-col items-center justify-center gap-4 p-8 w-64 h-48 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-800 hover:bg-gray-50 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
                    >
                        <CameraIcon className="w-10 h-10 text-gray-500" />
                        <span className="text-lg font-semibold text-gray-800 text-center">Use Camera</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 animate-fade-in w-full h-full flex flex-col">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Photo Booth</h1>
                    <p className="mt-1 text-gray-600">Upload a photo or use your camera to generate a styled snapshot.</p>
                </div>
            </header>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[50vh] min-h-[400px]">
                    {renderSourceArea()}
                </div>
                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-gray-800">Select a Style</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {['Sci-Fi', 'Vintage', 'Fantasy', 'Cartoon', 'Neon', 'Steampunk'].map(style => (
                            <button key={style} className="p-4 bg-white border rounded-md text-sm text-center transition-colors hover:bg-gray-50 hover:border-gray-400 focus:bg-gray-800 focus:text-white focus:border-gray-800 outline-none">
                                {style}
                            </button>
                        ))}
                    </div>
                    <button className="w-full mt-auto py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:bg-gray-400" disabled={!sourceImage && !isCameraActive}>
                        Take Snapshot
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIPhotoBooth;