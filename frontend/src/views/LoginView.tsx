import React, { useState } from 'react';
import {
  Shield, Eye, EyeOff, LogIn, UserPlus, AlertCircle,
  CheckCircle2, ArrowRight, ShieldAlert, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, register, isAuthenticated, user, role, logout } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form fields
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password,
          full_name: regFullName.trim()
        });
      } else {
        await login(identifier.trim(), password, selectedRole);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setSelectedRole('admin');
    setIsRegisterMode(false);
    setIdentifier('admin@floodlens.local');
    setPassword('Admin@12345');
    setError(null);
  };

  const handleFillDemoCitizen = () => {
    setSelectedRole('citizen');
    setIsRegisterMode(false);
    setIdentifier('citizen@floodlens.local');
    setPassword('Citizen@12345');
    setError(null);
  };

  if (isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-soft text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Signed In Successfully</h2>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.full_name}</strong> (@{user?.username})
          </p>
          <span className={`inline-block px-2 py-0.5 mt-2 rounded text-[10px] font-bold uppercase tracking-wider ${
            role === 'admin' ? 'bg-indigo-100 text-indigo-900' : 'bg-teal-100 text-teal-900'
          }`}>
            Role: {role}
          </span>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onSuccess}
            className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => logout()}
            className="w-full py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold text-xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-2">
          <Shield className="w-5 h-5 text-teal-700" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">FloodLens AI Portal</h1>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Understand your surroundings. Prepare with better information.
        </p>
      </div>

      {/* Selectable Role Switcher (Admin vs Citizen) */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center">
          Select Your Intended Access Role
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('citizen');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'citizen'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Common Man (Citizen)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setIsRegisterMode(false); // Admin self-registration prohibited
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'admin'
                ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-700" />
            <span>Disaster Admin</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center">
          Note: Roles are strictly verified server-side. Public registration is restricted to Citizen accounts.
        </p>
      </div>

      {/* Demo Credentials Quick-Fill Pills */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          One-Click Evaluation Credentials:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleFillDemoAdmin}
            className="py-1.5 px-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-semibold text-indigo-900 text-left transition-colors flex items-center justify-between"
          >
            <span>Fill Admin Demo</span>
            <span className="text-[9px] text-indigo-600 font-mono">admin</span>
          </button>
          <button
            type="button"
            onClick={handleFillDemoCitizen}
            className="py-1.5 px-2 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg text-[11px] font-semibold text-teal-900 text-left transition-colors flex items-center justify-between"
          >
            <span>Fill Citizen Demo</span>
            <span className="text-[9px] text-teal-600 font-mono">citizen</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {isRegisterMode ? (
          <>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Username *</label>
              <input
                type="text"
                required
                placeholder="e.g. ramesh_k"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="ramesh@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="font-bold text-slate-700 block mb-1">Username or Email *</label>
            <input
              type="text"
              required
              placeholder="e.g. citizen@floodlens.local"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="font-bold text-slate-700 block mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs pr-9 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all ${
            selectedRole === 'admin'
              ? 'bg-indigo-700 hover:bg-indigo-800'
              : 'bg-teal-700 hover:bg-teal-800'
          }`}
        >
          {loading ? (
            <span>Verifying Credentials...</span>
          ) : isRegisterMode ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Citizen Account</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In as {selectedRole === 'admin' ? 'Administrator' : 'Citizen'}</span>
            </>
          )}
        </button>
      </form>

      {/* Toggle between Login and Register for Citizen */}
      {selectedRole === 'citizen' && (
        <div className="text-center pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
            }}
            className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-2"
          >
            {isRegisterMode
              ? 'Already have a citizen account? Sign In here'
              : 'New resident? Register for a Citizen account'}
          </button>
        </div>
      )}
    </div>
  );
};
