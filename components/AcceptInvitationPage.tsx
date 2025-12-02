import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';

interface InvitationDetails {
    email: string;
    name: string;
    role: string;
    studio_name: string | null;
    studio_logo: string | null;
}

const AcceptInvitationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { theme } = useStudioTheme();
    
    const token = searchParams.get('token');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);
    
    useEffect(() => {
        const fetchInvitation = async () => {
            if (!token) {
                setError('Invalid invitation link. No token provided.');
                setLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`/api/auth/invitation/${token}`);
                
                if (response.ok) {
                    const data = await response.json();
                    setInvitation(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || 'Invalid or expired invitation');
                }
            } catch (err) {
                setError('Failed to load invitation details');
            } finally {
                setLoading(false);
            }
        };
        
        fetchInvitation();
    }, [token]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        
        setSubmitting(true);
        setError(null);
        
        try {
            const response = await fetch('/api/auth/accept-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });
            
            if (response.ok) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to accept invitation');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const brandColor = theme?.brand_color || '#0a58d0';  // Default to primary blue
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invitation...</p>
                </div>
            </div>
        );
    }
    
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Aboard!</h2>
                        <p className="text-gray-600 mb-4">
                            Your account has been set up successfully. You can now log in with your email and password.
                        </p>
                        <p className="text-sm text-gray-500">Redirecting to login page...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error && !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        {invitation?.studio_logo ? (
                            <img 
                                src={invitation.studio_logo} 
                                alt={invitation.studio_name || 'Studio'} 
                                className="h-16 mx-auto mb-4"
                            />
                        ) : (
                            <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold"
                                style={{ backgroundColor: brandColor }}
                            >
                                {invitation?.studio_name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900">Accept Invitation</h1>
                        <p className="text-gray-600 mt-2">
                            You've been invited to join <strong>{invitation?.studio_name || 'the studio'}</strong>
                        </p>
                    </div>
                    
                    {/* Invitation details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium">{invitation?.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-gray-500">Name:</span>
                            <span className="font-medium">{invitation?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-gray-500">Role:</span>
                            <span className="font-medium capitalize">{invitation?.role?.replace('studio_', '')}</span>
                        </div>
                    </div>
                    
                    {/* Password form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Create Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter a strong password"
                                required
                                minLength={8}
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm your password"
                                required
                                minLength={8}
                            />
                        </div>
                        
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                            style={{ backgroundColor: brandColor }}
                        >
                            {submitting ? 'Setting up account...' : 'Accept Invitation & Set Password'}
                        </button>
                    </form>
                    
                    <p className="text-xs text-gray-500 text-center mt-6">
                        By accepting this invitation, you agree to the studio's terms of service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitationPage;
