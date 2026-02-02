import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trophy, ShieldCheck, Zap, Users, Star, MessageSquare, ArrowRight, MousePointer2, CreditCard } from 'lucide-react';
import { DISCORD_LINK, LOGO_URL } from '../constants.tsx';

export default function HomePage() {
  const categories = [
    { title: 'Gaming Accounts', desc: 'Premium leveled and rare accounts for top titles.', icon: Users, color: 'blue', path: '/shop' },
    { title: 'License Keys', desc: 'Genuine keys for software, OS, and game platforms.', icon: Zap, color: 'purple', path: '/shop' },
    { title: 'Custom Services', desc: 'Boosting, design, and technical digital support.', icon: ShieldCheck, color: 'indigo', path: '/shop' },
  ];

  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-32 text-center">
        {/* Animated Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[140px] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full -z-10 animate-bounce duration-[10s]"></div>
        
        <div className="max-w-4xl mx-auto space-y-10 px-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl animate-fade-in">
            <Zap size={14} className="fill-blue-400" /> Premium Digital Ecosystem
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none animate-fade-in">
            Elevate Your <br />
            <span className="gradient-text">Digital Reality</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Moon Night is the leading marketplace for high-tier gaming accounts, 
            exclusive license keys, and 24/7 digital services.
          </p>
          
          <div className="flex flex-wrap justify-center gap-5 pt-4">
            <Link to="/shop" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-3 group active:scale-95">
              Enter Marketplace <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-3 border border-slate-800 hover:border-slate-700 active:scale-95">
              <MessageSquare size={18} /> Join Community
            </a>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((cat, i) => (
            <Link 
              to={cat.path} 
              key={i} 
              className="glass p-10 rounded-[2.5rem] border border-slate-800/50 hover:border-blue-500/40 transition-all group relative overflow-hidden flex flex-col items-center text-center space-y-6"
            >
              <div className={`w-20 h-20 rounded-[2rem] bg-${cat.color}-500/10 flex items-center justify-center text-${cat.color}-400 group-hover:scale-110 transition-transform duration-500`}>
                <cat.icon size={40} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white">{cat.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{cat.desc}</p>
              </div>
              <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  Browse Catalog <MousePointer2 size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Discord Call to Action */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="glass rounded-[3.5rem] p-12 md:p-20 border border-blue-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#5865F2]/10 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-1000"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] text-[10px] font-black uppercase tracking-widest">
                <Users size={14} /> Global Hub
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                Connect with <br />
                <span className="text-[#5865F2]">7,000+ Members</span>
              </h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">
                Join our thriving Discord community for exclusive giveaways, 
                instant support, and real-time restock alerts.
              </p>
              <div className="pt-4">
                <a href={DISCORD_LINK} target="_blank" className="inline-flex items-center gap-4 bg-[#5865F2] hover:bg-[#4752c4] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-[#5865F2]/30">
                  <MessageSquare size={20} /> Join The Discord
                </a>
              </div>
            </div>
            
            <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
               <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full"></div>
               <img src={LOGO_URL} className="w-full h-full object-contain relative z-10 animate-float" alt="Moon Night Logo" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Active Users', value: '12,400+', icon: Users, color: 'blue' },
          { label: 'Sales Completed', value: '52,000+', icon: CreditCard, color: 'green' },
          { label: 'Discord Members', value: '7,000+', icon: MessageSquare, color: 'indigo' },
          { label: 'Tournaments', value: '150+', icon: Trophy, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="glass p-8 rounded-3xl border border-slate-800 text-center space-y-4 group hover:border-slate-700 transition-colors">
            <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-xl flex items-center justify-center mx-auto text-${stat.color}-400 group-hover:rotate-12 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Trust Footer */}
      <section className="text-center py-10 space-y-8 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex flex-wrap justify-center gap-12 text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">
           <span className="flex items-center gap-2"><ShieldCheck size={14}/> Verified Security</span>
           <span className="flex items-center gap-2"><Zap size={14}/> Instant Delivery</span>
           <span className="flex items-center gap-2"><Star size={14}/> Top-Tier Support</span>
        </div>
      </section>
    </div>
  );
}