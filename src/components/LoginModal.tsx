import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Lock,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(identifier, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed. Please verify your credentials.');
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        id="login-modal-container"
      >
        {/* Modal Header */}
        <div className="bg-blue-900 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="absolute top-4 right-4 text-blue-200 hover:text-white p-1 rounded-lg transition-colors"
            id="close-login-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-800/80 border border-blue-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif]">Sign In to ACEBEE</h2>
              <p className="text-xs text-blue-200">Authorized Educational Portal Access</p>
            </div>
          </div>

          {/* Strict Registration Notice */}
          <div className="mt-4 p-2.5 rounded-lg bg-blue-950/50 border border-blue-800/80 text-xs text-blue-100 flex items-start gap-2 relative z-10">
            <AlertCircle className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
            <span>
              <strong>Access Policy:</strong> All staff, student, and parent accounts are created by the School Administrator with auto-generated credentials.
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Login Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. stu_alexander or admin@lb.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900 bg-white"
                  id="login-identifier-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900 bg-white"
                  id="login-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-98 disabled:opacity-50 mt-2"
              id="login-submit-btn"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-blue-300" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
