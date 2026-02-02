
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Chrome, MessageSquare, ArrowRight, ShieldCheck, User, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LOGO_URL } from '../constants.tsx';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username,
            full_name: username,
          }
        }
      });
      
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      } else if (data.user) {
        if (data.session) {
          // Immediate hard-refresh on successful session creation
          window.location.href = window.location.origin + window.location.pathname;
        } else {
          alert("Success! Check your email to verify your account.");
          window.location.href = window.location.origin + window.location.pathname + '#/login';
        }
      }
    } catch (err: any) {
      setErrorMessage("Error: " + err.message);
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(`${provider} Auth Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
          <img src={LOGO_URL} alt="Logo" className="relative w-full h-full rounded-full bg-slate-900 border border-slate-800 shadow-2xl object-contain" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Join <span className="gradient-text">Moon Night</span></h1>
        <p className="text-slate-500 font-medium">Create your elite digital identity.</p>
      </div>

      <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-slate-800 space-y-8">
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm animate-in fade-in zoom-in-95">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="font-bold">Signup Problem</p>
              <p className="text-xs opacity-80">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => handleSocialLogin('discord')} 
            className="group relative flex items-center justify-center gap-4 py-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] transition-all font-black text-sm text-white shadow-xl shadow-[#5865F2]/20"
          >
            <MessageSquare size={20} className="relative" /> 
            <span className="relative">Join with Discord</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('google')} 
            className="group relative flex items-center justify-center gap-4 py-4 rounded-2xl bg-white hover:bg-slate-100 transition-all font-black text-sm text-slate-900 shadow-xl shadow-white/5"
          >
            <Chrome size={20} className="relative text-red-500" /> 
            <span className="relative">Join with Google</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="bg-[#020617] px-4 text-slate-600">Email Signup</span>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                required
                type="text" 
                placeholder="Elite Nickname" 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                required
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
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
                placeholder="Min 6 characters" 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500 font-medium">
            Already a member?{' '}
            <Link to="/login" className="text-blue-400 font-black hover:text-blue-300 transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
