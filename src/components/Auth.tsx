import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 bg-neutral-900 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2070"
          alt="Clothing Store"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-serif italic mb-4"
          >
            StyleHub
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-300 max-w-md"
          >
            Precision management for modern clothing businesses. Inventory, sales, and analytics in one place.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-neutral-50">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-sans font-bold tracking-tight text-neutral-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-neutral-500">
              Sign in to access your business dashboard
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 rounded-lg bg-white text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-900"></div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neutral-50 text-neutral-400">Restricted Access</span>
              </div>
            </div>

            <p className="text-center text-xs text-neutral-400">
              Only authorized staff and administrators can access this system.
              Contact your manager if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
