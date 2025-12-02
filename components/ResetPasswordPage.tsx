import React, { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';
import { authService } from '../services/authService';
import { PasswordInput } from './common/PasswordInput';

// Password strength checker
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

const ResetPasswordPage: React.FC = () => {
  const { theme } = useStudioTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);
  
  const token = searchParams.get('token');
  const passwordStrength = getPasswordStrength(password);
  
  useEffect(() => {
    if (!token) {
      setIsTokenInvalid(true);
    }
  }, [token]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  }, []);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err?.message?.toLowerCase().includes('expired') || err?.message?.toLowerCase().includes('invalid')) {
        setIsTokenInvalid(true);
      } else {
        setError(err?.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid/expired token state
  if (isTokenInvalid) {
    return (
      <div className="min-h-screen flex">
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 bg-white">
          <div className="w-full max-w-md mx-auto text-center">
            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <Link to="/login" className="flex items-center gap-2">
                <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xl font-bold text-gray-900">{theme?.name || 'PhotoProof'}</span>
              </Link>
            </div>
            
            {/* Error Icon */}
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Link expired or invalid
            </h1>
            <p className="text-gray-600 mb-8">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
            
            <Link 
              to="/forgot-password" 
              className="block w-full py-3 px-4 bg-[var(--color-primary)] text-white font-medium rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all duration-200 text-center"
            >
              Request new link
            </Link>
          </div>
        </div>

        {/* Right Side - Hero Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/30" />
          <img 
            src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=1200"
            alt="Photography studio"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 bg-white">
          <div className="w-full max-w-md mx-auto text-center">
            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <Link to="/login" className="flex items-center gap-2">
                <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xl font-bold text-gray-900">{theme?.name || 'PhotoProof'}</span>
              </Link>
            </div>
            
            {/* Success Icon */}
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Password reset successful!
            </h1>
            <p className="text-gray-600 mb-8">
              Your password has been updated. You can now log in with your new password.
            </p>
            
            <Link 
              to="/login" 
              className="block w-full py-3 px-4 bg-[var(--color-primary)] text-white font-medium rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all duration-200 text-center"
            >
              Go to login
            </Link>
          </div>
        </div>

        {/* Right Side - Hero Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/30" />
          <img 
            src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=1200"
            alt="Photography studio"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <Link to="/login" className="flex items-center gap-2">
              <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xl font-bold text-gray-900">{theme?.name || 'PhotoProof'}</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Create new password
            </h1>
            <p className="text-gray-600">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
                New Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className="px-4 py-3 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                autoComplete="new-password"
                minLength={6}
                required
              />
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.score <= 1 ? 'text-red-600' :
                    passwordStrength.score <= 2 ? 'text-orange-600' :
                    passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    Password strength: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm new password"
                className="px-4 py-3 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                autoComplete="new-password"
                minLength={6}
                required
              />
              
              {/* Match indicator */}
              {confirmPassword && (
                <p className={`mt-1.5 text-sm flex items-center gap-1 ${
                  password === confirmPassword ? 'text-green-600' : 'text-red-600'
                }`}>
                  {password === confirmPassword ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Passwords do not match
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full py-3 px-4 bg-[var(--color-primary)] text-white font-medium rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm text-gray-600 hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/30" />
        <img 
          src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=1200"
          alt="Photography studio"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
