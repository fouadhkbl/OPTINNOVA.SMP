
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Chrome, MessageSquare, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { LOGO_URL } from '../constants.tsx';

export default function LoginPage({ setUser }: { setUser: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const runDiagnostics = async () => {
    setDiagLoading(true);
    const result = await testSupabaseConnection();
    if (result.success) {
      alert("✅ Connection is stable.");
    } else {
      setErrorMessage(`Diagnostic Alert: ${result.message}`);
    }
    setDiagLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      } else if (data.user) {
        // Hard refresh to ensure full state reset and fast session pickup
        window.location.href = window.location.origin + window.location.pathname;
      }
    } catch (err: any) {
      setErrorMessage("System Error: " + err.message);
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
      setErrorMessage(`${provider} Auth failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
          <img src={LOGO_URL} alt="Logo" className="relative w-full h-full rounded-full bg-slate-900 border border-slate-800 shadow-2xl object-contain" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Access <span className="gradient-text">Moon Night</span></h1>
        <p className="text-slate-500 font-medium">Log in to start your digital journey.</p>
      </div>

      <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-slate-800 space-y-8">
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-3 text-red-400 text-sm animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <p className="font-bold">Login Failed</p>
                <p className="text-xs opacity-80 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button 
              onClick={runDiagnostics}
              className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 self-end"
            >
              {diagLoading ? <RefreshCw size={10} className="animate-spin"/> : 'Run Diagnostics'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => handleSocialLogin('discord')} 
            className="group relative flex items-center justify-center gap-4 py-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] transition-all font-black text-sm text-white shadow-xl shadow-[#5865F2]/20 overflow-hidden"
          >
            <MessageSquare size={20} className="relative" /> 
            <span className="relative">Login with Discord</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('google')} 
            className="group relative flex items-center justify-center gap-4 py-4 rounded-2xl bg-white hover:bg-slate-100 transition-all font-black text-sm text-slate-900 shadow-xl shadow-white/5 overflow-hidden"
          >
            <Chrome size={20} className="relative text-red-500" /> 
            <span className="relative">Login with Google</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="bg-[#020617] px-4 text-slate-600">Credentials</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
                placeholder="••••••••" 
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
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500 font-medium">
            No account?{' '}
            <Link to="/signup" className="text-blue-400 font-black hover:text-blue-300 transition-colors">
              Join Us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
