
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trophy, ShieldCheck, Zap, Users, Star } from 'lucide-react';
import { DISCORD_LINK } from '../constants.tsx';

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-24 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-3xl mx-auto space-y-8 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Zap size={14} className="animate-pulse" /> The Ultimate Digital Marketplace
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Unlock Your <span className="gradient-text">Digital Potential</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Premium gaming accounts, license keys, and exclusive services with instant delivery and 24/7 support.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/shop" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group">
              Explore Shop <ShoppingBag size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2">
              Join Discord <Users size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Active Users', value: '12k+', icon: Users },
          { label: 'Discord Members', value: '7k+', icon: ShieldCheck },
          { label: 'Successful Orders', value: '50k+', icon: Zap },
          { label: 'Tournaments Host', value: '150+', icon: Trophy },
        ].map((stat, idx) => (
          <div key={idx} className="glass p-6 rounded-2xl text-center space-y-2 hover:border-blue-500/30 transition-all group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform">
              <stat.icon size={24} />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Why Choose Moon Night?</h2>
          <p className="text-slate-400 max-w-xl mx-auto">We provide the best digital experience with a focus on security and value.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass p-8 rounded-3xl space-y-4 hover:bg-slate-900/40 transition-colors">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold">Secure Transactions</h3>
            <p className="text-slate-500 leading-relaxed">Your data and payments are protected with industry-standard encryption and secure Supabase integration.</p>
          </div>
          <div className="glass p-8 rounded-3xl space-y-4 hover:bg-slate-900/40 transition-colors">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
              <Star size={32} />
            </div>
            <h3 className="text-xl font-bold">Reward System</h3>
            <p className="text-slate-500 leading-relaxed">Earn 100 Discord Points for every $1 spent. Redeem points for exclusive items in our Points Shop.</p>
          </div>
          <div className="glass p-8 rounded-3xl space-y-4 hover:bg-slate-900/40 transition-colors">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold">Instant Delivery</h3>
            <p className="text-slate-500 leading-relaxed">No waiting. Receive your account details or license keys instantly via email and dashboard after payment.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
