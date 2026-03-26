import React, { useState } from 'react';
import api from '../api';
import { clearAuth } from '../auth';
import { UserProfile } from '../types';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Save, 
  LogOut, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProfileSettingsProps {
  user: UserProfile;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.put('/auth/me', { displayName });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.put('/auth/me', { password: newPassword });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-4xl font-serif italic text-neutral-900">Profile Settings</h1>
        <p className="text-neutral-500 mt-1">Manage your personal information and security</p>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300",
          message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
        )}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Personal Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <User size={20} />
            </div>
            <h2 className="text-xl font-serif italic text-neutral-900">Personal Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Email Address</label>
              <div className="flex items-center gap-3 px-4 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500">
                <Mail size={16} />
                <span className="text-sm">{user.email}</span>
              </div>
              <p className="text-[10px] text-neutral-400 italic">Email cannot be changed manually.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">System Role</label>
              <div className="flex items-center gap-3 px-4 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500">
                <Shield size={16} />
                <span className="text-sm font-bold uppercase tracking-widest">{user.role}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Key size={20} />
            </div>
            <h2 className="text-xl font-serif italic text-neutral-900">Security</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Key size={18} />
              Update Password
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="px-2 bg-white text-neutral-400">Danger Zone</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                clearAuth();
                window.location.href = '/';
              }}
              className="w-full py-3 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
