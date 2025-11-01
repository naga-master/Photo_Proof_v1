import React, { useState } from 'react';
import type { UserRole, Client } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  clients: Client[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, clients }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const studioCreds = { user: 'studio@admin.com', pass: 'password123' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === studioCreds.user && password === studioCreds.pass) {
      onLogin('studio');
      return;
    }
    
    const client = clients.find(c => c.username === username && c.password === password);
    if (client) {
      onLogin('client');
      return;
    }

    setError('Invalid username or password.');
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden p-4 bg-slate-900">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20"
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2')" }}
      ></div>
      
      <div className="relative z-20 w-full max-w-sm bg-slate-900/50 backdrop-blur-lg p-8 rounded-xl shadow-2xl border border-slate-700/50 animate-fade-in">
        <div className="text-center">
            <h1 className="font-serif text-4xl tracking-wider uppercase mb-2">
            NAPSTER's Photo Lab
            </h1>
            <p className="text-sm text-slate-400 tracking-wider uppercase mb-8">
            Photo Gallery Login
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-slate-800/50 border border-slate-600 rounded-md shadow-sm py-2.5 px-3 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-colors sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-slate-800/50 border border-slate-600 rounded-md shadow-sm py-2.5 px-3 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-colors sm:text-sm"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center animate-shake">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-slate-900 bg-white hover:bg-slate-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white transition-colors"
            >
              Login
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-700 text-xs text-slate-400 text-center">
            <p className="font-bold mb-2 uppercase tracking-wider">Demo Credentials</p>
            <p><strong className="font-medium text-slate-300">Studio:</strong> {studioCreds.user} / {studioCreds.pass}</p>
            <p><strong className="font-medium text-slate-300">Client:</strong> {clients[0]?.username || 'client@email.com'} / {clients[0]?.password || 'clientpass'}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;