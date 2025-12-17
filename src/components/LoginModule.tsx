import * as React from 'react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, User, LogIn, ChevronRight, MapPin } from 'lucide-react';

interface LoginModuleProps {
  onLogin: (user: { username: string; role: 'ADMIN' | 'CASHIER' }) => void;
}

const LoginModule: React.FC<LoginModuleProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const user = data[0];
        onLogin({ username: user.username, role: user.role as 'ADMIN' | 'CASHIER' });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-100 flex items-center justify-center p-4 font-roboto relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">
        {/* Top Section (Red with Gold Curve) */}
        <div className="relative bg-red-800 pt-12 pb-16 px-8 text-center">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600"></div>

          {/* Logo Container */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl mb-4 ring-4 ring-yellow-500/50">
              <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-md font-serif">
              Nenita Farm
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="h-0.5 w-8 bg-gradient-to-r from-transparent to-yellow-400"></span>
              <p className="text-yellow-400 font-bold text-xl font-cursive italic tracking-wide">
                Lechon Haus
              </p>
              <span className="h-0.5 w-8 bg-gradient-to-l from-transparent to-yellow-400"></span>
            </div>
          </div>

          {/* Gold Curve Separator */}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 bg-white"
            style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }}
          ></div>
          <div
            className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 opacity-80"
            style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }}
          ></div>
        </div>

        {/* Form Section */}
        <div className="px-10 pb-10 pt-6">
          <div className="text-center mb-8">
            <p className="text-stone-500 text-sm font-medium uppercase tracking-widest">
              System Access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-4 rounded-r-lg text-sm font-bold animate-in fade-in flex items-center gap-3 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-red-700">
                  <User className="h-5 w-5 text-stone-400 group-focus-within:text-red-700 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all shadow-inner"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-red-700">
                  <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-red-700 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all shadow-inner"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-red-900/30 text-sm font-bold text-white bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative tracking-wide">SIGN IN</span>
                  <ChevronRight
                    size={18}
                    className="relative group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Section (Address/Footer) */}
        <div className="bg-red-800 p-4 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600"></div>
          <div className="flex items-center justify-center gap-2 text-red-100/80 text-[10px] uppercase tracking-wider font-medium">
            <MapPin size={12} />
            <span>Natn.l Highway, Brgy. Reyes, Banga, South Cotabato</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModule;
