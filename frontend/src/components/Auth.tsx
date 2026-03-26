import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api';
import { saveAuth } from '../auth';
import { UserProfile } from '../types';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data;
      saveAuth(access_token, user);
      onLogin(user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left: Photo Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200"
          alt="StyleHub clothing store"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle light overlay for the bright/airy look matching screenshot */}
        <div className="absolute inset-0 bg-white/10" />
      </div>

      {/* ── Right: Login Form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 lg:px-20 xl:px-28 bg-white">
        <div className="w-full max-w-sm mx-auto lg:mx-0">

          {/* Brand */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-1">
              StyleHub
            </h1>
            <p className="text-xs font-semibold tracking-[0.2em] text-neutral-400 uppercase">
              Business Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.15em] text-neutral-500 uppercase mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.15em] text-neutral-500 uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="sign-in-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neutral-900 text-white text-sm font-semibold tracking-[0.12em] uppercase rounded hover:bg-neutral-700 active:bg-black transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing In…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials box */}
          <div className="mt-8 px-4 py-4 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600">
            <p className="font-semibold text-neutral-500 uppercase tracking-widest text-[10px] mb-2">
              Demo Credentials
            </p>
            <p>Email: <span className="font-medium text-neutral-800">admin@stylehub.com</span></p>
            <p className="mt-1">Password: <span className="font-medium text-neutral-800">admin123</span></p>
          </div>

        </div>
      </div>
    </div>
  );
}
