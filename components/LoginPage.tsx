import React, { useState } from 'react';
import type { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const studioCreds = { user: 'studio@admin.com', pass: 'password123' };
  const clientCreds = { user: 'client@email.com', pass: 'clientpass' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === studioCreds.user && password === studioCreds.pass) {
      onLogin('studio');
    } else if (username === clientCreds.user && password === clientCreds.pass) {
      onLogin('client');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden p-4">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2')" }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      
      <div className="relative z-20 w-full max-w-md bg-black/30 backdrop-blur-sm p-8 rounded-lg shadow-2xl animate-fade-in">
        <h1 className="text-center font-serif text-4xl tracking-widest uppercase mb-2">
          THE SCOBEYS
        </h1>
        <p className="text-center text-sm text-gray-300 tracking-wider uppercase mb-8">
          Photo Gallery Login
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-white/10 border border-gray-500 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-white focus:border-white sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-white/10 border border-gray-500 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-white focus:border-white sm:text-sm"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors"
            >
              Login
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-600 text-xs text-gray-300 text-center">
            <p className="font-bold mb-2 uppercase tracking-wider">Demo Credentials</p>
            <p><strong className="font-medium">Studio Login:</strong> {studioCreds.user} / {studioCreds.pass}</p>
            <p><strong className="font-medium">Client Login:</strong> {clientCreds.user} / {clientCreds.pass}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
