import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Determine if this is a studio or client login based on email
      // Studio emails: studio@admin.com or contains "studio" or "admin"
      const emailLower = username.toLowerCase();
      const isStudioLogin = emailLower === 'studio@admin.com' || 
                           emailLower.includes('studio') || 
                           emailLower.includes('admin');
      
      await login({ username, password }, isStudioLogin);
      
      // On success, determine role and call onLogin
      const role: UserRole = isStudioLogin ? 'studio' : 'client';
      onLogin(role);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden p-4 bg-gray-900">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20"
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2')" }}
      ></div>
      
      <div className="relative z-20 w-full max-w-sm bg-gray-900/50 backdrop-blur-lg p-8 rounded-xl shadow-2xl border border-gray-700/50 animate-fade-in">
        <div className="text-center">
            <h1 className="font-serif text-4xl tracking-wider uppercase mb-2">
            NAPSTER's Photo Lab
            </h1>
            <p className="text-sm text-gray-400 tracking-wider uppercase mb-8">
            Photo Gallery Login
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300" htmlFor="username">
              Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your.email@example.com"
              className="mt-1 block w-full bg-gray-800/50 border border-gray-600 rounded-lg shadow-sm py-2.5 px-3 text-white placeholder-gray-500 focus-visible:border-studio-primary focus-visible:ring-2 focus-visible:ring-studio-primary/20 outline-none transition-all duration-fast sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-800/50 border border-gray-600 rounded-lg shadow-sm py-2.5 px-3 text-white focus-visible:border-studio-primary focus-visible:ring-2 focus-visible:ring-studio-primary/20 outline-none transition-all duration-fast sm:text-sm"
              required
            />
          </div>
          {error && <p className="text-error text-sm text-center animate-shake">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 focus-visible:ring-white outline-none transition-all duration-fast disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-xs text-gray-400 text-center">
            <p className="font-bold mb-2 uppercase tracking-wider">Demo Credentials</p>
            <p><strong className="font-medium text-gray-300">Studio:</strong> studio@admin.com / password123</p>
            <p><strong className="font-medium text-gray-300">Client:</strong> emily.james@email.com / OldClient</p>
            <p className="mt-1 text-gray-500 italic">All clients can login with their email and password: OldClient</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;