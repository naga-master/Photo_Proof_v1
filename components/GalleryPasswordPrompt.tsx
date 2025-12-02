import React, { useState } from 'react';
import { LockClosedIcon } from './icons';
import { apiClient } from '../lib/api-client';

interface GalleryPasswordPromptProps {
    projectId: string;
    projectTitle: string;
    onPasswordVerified: () => void;
    onCancel?: () => void;
}

const GalleryPasswordPrompt: React.FC<GalleryPasswordPromptProps> = ({
    projectId,
    projectTitle,
    onPasswordVerified,
    onCancel,
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        try {
            setIsVerifying(true);
            await apiClient.post(`/api/projects/${projectId}/verify-password`, {
                password: password,
            });
            onPasswordVerified();
        } catch (err: any) {
            if (err.status === 403) {
                setError('Invalid password. Please try again.');
            } else {
                setError('Unable to verify password. Please try again.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <LockClosedIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Protected Gallery</h1>
                    <p className="mt-2 text-gray-600">
                        Enter the password to view <span className="font-medium">{projectTitle}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="gallery-password" className="sr-only">
                            Password
                        </label>
                        <input
                            id="gallery-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter gallery password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isVerifying}
                        className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isVerifying ? 'Verifying...' : 'View Gallery'}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full py-3 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Go Back
                        </button>
                    )}
                </form>

                <p className="mt-6 text-center text-xs text-gray-500">
                    Contact the photographer if you don't have the password.
                </p>
            </div>
        </div>
    );
};

export default GalleryPasswordPrompt;
