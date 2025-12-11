import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginUser } from '../utils/authUtils';
import { Lock, User as UserIcon, LogIn, AlertCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    const user = loginUser(username, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            FlashCalc Pro
          </h1>
          <p className="text-slate-400">Professional Mental Abacus System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon size={18} className="text-slate-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-lg transform transition active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            <LogIn size={20} />
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};