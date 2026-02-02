
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Chrome, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LOGO_URL } from '../constants.tsx';

export default function LoginPage({ setUser }: { setUser: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
    } else if (data.user) {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'https://hktlxghjronjommqkwum.supabase.co/auth/v1/callback',
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
          <img src={LOGO_URL} alt="Logo" className="relative w-full h-full rounded-full bg-slate-900 border border-slate-800 shadow-2xl object-contain" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Access <span className="gradient-text">Moon Night</span></h1>
        <p className="text-slate-500 font-medium">Log in with your preferred method to start shopping.</p>
      </div>

      <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-slate-800 space-y-8">
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => handleSocialLogin('discord')} 
            className="group relative flex items-center justify-center gap-4 py-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] transition-all font-black text-sm text-white shadow-xl shadow-[#5865F2]/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <MessageSquare size={20} className="relative" /> 
            <span className="relative">Continue with Discord</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('google')} 
            className="group relative flex items-center justify-center gap-4 py-4 rounded-2xl bg-white hover:bg-slate-100 transition-all font-black text-sm text-slate-900 shadow-xl shadow-white/5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Chrome size={20} className="relative text-red-500" /> 
            <span className="relative">Continue with Google</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="bg-[#020617] px-4 text-slate-600">Secure Direct Login</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                required
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all text-white font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Password</label>
            <div className="relative group">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                required
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all text-white font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 group"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      <div className="text-center space-y-2">
        <p className="text-slate-600 text-sm font-medium">
          New to the shop? Simply use social login to join.
        </p>
        <p className="text-xs text-slate-700 uppercase font-black tracking-widest">
          Trusted by 7,000+ members
        </p>
      </div>
    </div>
  );
}
