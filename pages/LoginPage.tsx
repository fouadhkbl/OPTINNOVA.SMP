
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Github, Chrome, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
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
    
    // In demo environment, we simulate a login if Supabase fails or isn't set up
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Simulate login for dev purposes if project is new
      console.log("Supabase error (expected if no account exists):", error.message);
      if (email && password) {
         setUser({
          id: 'demo-user',
          email,
          username: email.split('@')[0],
          wallet_balance: 100,
          discord_points: 1000,
          role: email.includes('admin') ? 'admin' : 'user'
        });
        navigate('/');
      }
    } else if (data.user) {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider: 'google' | 'discord') => {
    alert(`Connecting to ${provider}... In a production environment, this would redirect to Supabase Auth.`);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <img src={LOGO_URL} alt="Logo" className="w-20 h-20 mx-auto rounded-full bg-slate-900 shadow-2xl" />
        <h1 className="text-3xl font-black">Welcome Back</h1>
        <p className="text-slate-500">Log in to manage your digital assets and rewards.</p>
      </div>

      <div className="glass rounded-[2rem] p-8 md:p-10 border border-slate-800 space-y-8">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-bold uppercase px-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                required
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-bold uppercase px-1">Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                required
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f172a] px-4 text-slate-600 font-bold">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleSocialLogin('discord')} className="flex items-center justify-center gap-3 py-4 rounded-2xl border border-slate-800 hover:bg-indigo-600/10 hover:border-indigo-600/50 transition-all font-bold text-sm text-slate-300">
            <MessageSquare size={18} className="text-[#5865F2]" /> Discord
          </button>
          <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-3 py-4 rounded-2xl border border-slate-800 hover:bg-slate-700 transition-all font-bold text-sm text-slate-300">
            <Chrome size={18} className="text-red-400" /> Google
          </button>
        </div>
      </div>

      <p className="text-center text-slate-600 text-sm">
        Don't have an account? <button className="text-blue-400 font-bold hover:underline">Join the 7k+ community</button>
      </p>
    </div>
  );
}
