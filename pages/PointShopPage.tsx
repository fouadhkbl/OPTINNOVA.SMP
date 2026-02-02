
import React, { useState, useEffect } from 'react';
import { Gift, Zap, Crown, Star, ShoppingCart, Loader2 } from 'lucide-react';
import { PointShopItem, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

export default function PointShopPage({ user }: { user: UserProfile | null }) {
  const [items, setItems] = useState<PointShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('point_shop_items').select('*').order('cost_points', { ascending: true });
    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleRedeem = (item: PointShopItem) => {
    if (!user) {
      alert("Please login to redeem rewards!");
      return;
    }
    if (user.discord_points < item.cost_points) {
      alert(`Insufficient balance. You need ${item.cost_points - user.discord_points} more points!`);
      return;
    }
    const confirm = window.confirm(`Redeem "${item.name}" for ${item.cost_points} points?`);
    if (confirm) {
      alert("Redemption order received! Our team will contact you on Discord shortly.");
    }
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="relative glass rounded-[3rem] p-12 md:p-20 border border-indigo-500/10 overflow-hidden text-center space-y-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] shadow-lg">
          <Crown size={14} /> The Elite Rewards Program
        </div>
        
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">The <span className="gradient-text">Point Shop</span></h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium">Trade your loyalty for premium perks. Earn points automatically on every purchase.</p>
        </div>

        {user && (
          <div className="inline-flex items-center gap-6 bg-slate-900/60 backdrop-blur-2xl px-10 py-6 rounded-[2.5rem] border border-slate-800 shadow-2xl scale-110">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Current Points</span>
              <span className="text-3xl font-black text-indigo-400">{user.discord_points.toLocaleString()} <span className="text-xs text-slate-600">PTS</span></span>
            </div>
            <div className="h-12 w-px bg-slate-800"></div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Star size={28} className="fill-indigo-500/20" />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
           <Loader2 className="animate-spin text-indigo-500" size={48} />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Syncing Rewards Pool...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 glass rounded-3xl border border-dashed border-slate-800 space-y-4 opacity-50">
           <Gift size={48} className="mx-auto text-slate-700" />
           <p className="font-bold text-slate-600 uppercase tracking-widest text-xs">No rewards available in the shop right now.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map(item => (
            <div key={item.id} className="glass rounded-[2.5rem] p-10 border border-slate-800 hover:border-indigo-500/40 transition-all duration-500 group flex flex-col text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-2xl -z-10 group-hover:bg-indigo-600/15 transition-colors"></div>
              
              <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-indigo-500/10 shadow-xl">
                {item.image_url ? (
                  <img src={item.image_url} className="w-full h-full object-cover rounded-[2rem]" />
                ) : (
                  <Gift size={48} />
                )}
              </div>
              
              <div className="space-y-3 flex-grow">
                <h3 className="text-2xl font-black text-slate-100">{item.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.description}</p>
              </div>
              
              <div className="pt-4 space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 font-black text-lg shadow-inner">
                  {item.cost_points.toLocaleString()} <span className="text-[10px] text-slate-500 tracking-widest uppercase">Points</span>
                </div>
                <button 
                  onClick={() => handleRedeem(item)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Zap size={18} /> Redeem Perk
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="glass p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400"><Star size={24}/></div>
            <div>
               <h4 className="font-bold text-slate-200">Earn While You Shop</h4>
               <p className="text-xs text-slate-500 font-medium">Get 100 Discord Points for every $1 added to your wallet.</p>
            </div>
         </div>
         <a href="https://discord.gg/wJUsVzDuXk" target="_blank" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Support & Help</a>
      </div>
    </div>
  );
}
