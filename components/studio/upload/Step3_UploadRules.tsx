import React from 'react';
import { useUpload } from './UploadContext';
import type { UploadRules } from '../../../types';

const Step3_UploadRules: React.FC = () => {
    const { state, updateUploadRules } = useUpload();
    const { uploadRules } = state;

    const handleRuleChange = (key: keyof UploadRules, value: any) => {
        updateUploadRules({ [key]: value });
    };

    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Upload Rules & Options</h3>
            <div className="space-y-8">
                <div>
                    <h4 className="font-medium text-gray-800">Image Optimization</h4>
                    <div className="mt-2 text-sm text-gray-500">Choose the resolution for uploaded images.</div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                        {(['full', 'high', 'web'] as const).map(size => (
                            <button
                                key={size}
                                onClick={() => handleRuleChange('imageSize', size)}
                                className={`p-3 border rounded-md text-sm text-center transition-colors capitalize ${uploadRules.imageSize === size ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-gray-50'}`}
                            >
                                {size} Resolution
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="compression" className="font-medium text-gray-800">JPEG Compression</label>
                    <div className="mt-2 text-sm text-gray-500">Lower values reduce file size but decrease quality. Applied to 'High' and 'Web' sizes.</div>
                    <div className="flex items-center gap-4 mt-3">
                        <input
                            type="range"
                            id="compression"
                            min="50"
                            max="100"
                            value={uploadRules.compression}
                            onChange={(e) => handleRuleChange('compression', parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-semibold text-gray-700 w-12 text-center">{uploadRules.compression}%</span>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-800">AI Enhancements</h4>
                    <div className="mt-4 space-y-4">
                        <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input id="aiTagging" name="aiTagging" type="checkbox" checked={uploadRules.aiTagging} onChange={(e) => handleRuleChange('aiTagging', e.target.checked)} className="focus-visible:ring-2 focus-visible:ring-gray-200 outline-none h-4 w-4 text-gray-600 border-gray-300 rounded transition-colors" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="aiTagging" className="font-medium text-gray-700">Apply AI Tagging</label>
                                <p className="text-gray-500">Automatically generate keywords for each photo to improve searchability.</p>
                            </div>
                        </div>
                         <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input id="aiCulling" name="aiCulling" type="checkbox" checked={uploadRules.aiCulling} onChange={(e) => handleRuleChange('aiCulling', e.target.checked)} className="focus-visible:ring-2 focus-visible:ring-gray-200 outline-none h-4 w-4 text-gray-600 border-gray-300 rounded transition-colors" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="aiCulling" className="font-medium text-gray-700">Enable Smart Culling</label>
                                <p className="text-gray-500">Detect and flag blurry or duplicate photos before the upload begins.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step3_UploadRules;
