import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';
import type { UserRole } from '../types';
import { PasswordInput } from './common/PasswordInput';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Email validation helper
const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email (e.g., you@example.com)';
  return null;
};

// Get user-friendly error message
const getErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('not found') || message.includes('no user')) {
    return "We couldn't find an account with that email. Please check and try again.";
  }
  if (message.includes('password') || message.includes('invalid credentials')) {
    return 'Incorrect password. Forgot your password?';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  return error?.message || 'Unable to sign in. Please try again.';
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const { theme } = useStudioTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'studio' | 'client'>('client');
  const [emailTouched, setEmailTouched] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  // Validate email on blur
  const handleEmailBlur = useCallback(() => {
    setEmailTouched(true);
    if (email) {
      setEmailError(validateEmail(email));
    }
  }, [email]);

  // Clear email error when user starts typing
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailTouched && emailError) {
      setEmailError(validateEmail(e.target.value));
    }
    setGeneralError('');
  }, [emailTouched, emailError]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setGeneralError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setEmailTouched(true);
      return;
    }
    
    setGeneralError('');
    setIsLoading(true);

    try {
      const isStudioLogin = loginType === 'studio';
      await login({ username: email, password }, isStudioLogin);
      
      // Store email for convenience
      localStorage.setItem('rememberedEmail', email);
      
      const role: UserRole = isStudioLogin ? 'studio' : 'client';
      onLogin(role);
    } catch (err: any) {
      console.error('Login error:', err);
      setGeneralError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert('Google login coming soon!');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xl font-bold text-gray-900">{theme?.name || 'PhotoProof'}</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Hi there!
            </h1>
            <p className="text-gray-600">
              Have we met before?
            </p>
          </div>

          {/* Login Type Toggle - Subtle tabs */}
          <div className="flex gap-4 mb-6 text-sm">
            <button
              type="button"
              onClick={() => setLoginType('client')}
              className={`pb-1 border-b-2 transition-colors ${
                loginType === 'client'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setLoginType('studio')}
              className={`pb-1 border-b-2 transition-colors ${
                loginType === 'studio'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Studio
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="name@email.com"
                autoFocus
                autoComplete="email"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={`block w-full px-4 py-3 text-gray-900 placeholder-gray-400 bg-white border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                  emailError 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]'
                }`}
                required
              />
              {emailError && (
                <p id="email-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="********"
                className="px-4 py-3 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                autoComplete="current-password"
                required
              />
            </div>

            {/* General Error Message */}
            {generalError && (
              <div 
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2"
                role="alert"
                aria-live="polite"
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{generalError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-full shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            <GoogleIcon />
            Log in with Google
          </button>

          {/* Footer Links */}
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => alert('Password reset feature coming soon!')}
              className="text-sm text-gray-900 underline hover:text-gray-600 transition-colors"
            >
              Forgot my password
            </button>
            
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => alert('Sign up feature coming soon!')}
                className="font-semibold text-gray-900 underline hover:text-gray-600 transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Demo Credentials - Small footer */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500">
            <p className="font-medium mb-1">Demo: {loginType === 'studio' ? 'demo@photoproof.com' : 'emily.james@email.com'} / {loginType === 'studio' ? 'password123' : 'OldClient'}</p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div 
        className="hidden lg:block w-1/2 bg-cover bg-center bg-gray-100"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1920&q=80')" 
        }}
        aria-hidden="true"
      >
        {/* Optional overlay for better text readability if needed */}
        <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent" />
      </div>
    </div>
  );
};

export default LoginPage;