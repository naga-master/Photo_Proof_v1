import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStudioTheme } from '../src/providers/StudioThemeProvider';
import { authService } from '../services/authService';

// Email validation helper
const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email (e.g., you@example.com)';
  return null;
};

const ForgotPasswordPage: React.FC = () => {
  const { theme } = useStudioTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const handleEmailBlur = useCallback(() => {
    setEmailTouched(true);
    if (email) {
      setEmailError(validateEmail(email));
    }
  }, [email]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailTouched && emailError) {
      setEmailError(validateEmail(e.target.value));
    }
  }, [emailTouched, emailError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setEmailTouched(true);
      return;
    }
    
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // Still show success to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

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

          {!isSubmitted ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Forgot your password?
                </h1>
                <p className="text-gray-600">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[var(--color-primary)] text-white font-medium rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
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
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              {/* Success Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Check your email
              </h1>
              <p className="text-gray-600 mb-8">
                If an account exists for <span className="font-medium text-gray-900">{email}</span>, we've sent password reset instructions.
              </p>
              
              <div className="space-y-4">
                <Link 
                  to="/login" 
                  className="block w-full py-3 px-4 bg-[var(--color-primary)] text-white font-medium rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all duration-200 text-center"
                >
                  Back to login
                </Link>
                
                <button 
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="text-sm text-gray-600 hover:text-[var(--color-primary)] transition-colors"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            </div>
          )}
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

export default ForgotPasswordPage;
