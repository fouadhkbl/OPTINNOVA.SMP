
import React from 'react';
import { Gift, Zap, Crown, Star, ShoppingCart } from 'lucide-react';
import { PointShopItem, UserProfile } from '../types';

const MOCK_POINT_ITEMS: PointShopItem[] = [
  { id: 'p1', name: 'Elite Discord Role', description: 'Exclusive Moon Elite role for 30 days.', cost_points: 5000 },
  { id: 'p2', name: 'Random Steam Key', description: 'A surprise high-rated game key.', cost_points: 3500 },
  { id: 'p3', name: 'Profile Theme', description: 'Custom lunar theme for your shop profile.', cost_points: 2000 },
  { id: 'p4', name: '20% Discount Voucher', description: 'Applicable on any shop purchase.', cost_points: 10000 },
];

export default function PointShopPage({ user }: { user: UserProfile | null }) {
  const handleRedeem = (item: PointShopItem) => {
    if (!user) {
      alert("Login to redeem rewards!");
      return;
    }
    if (user.discord_points < item.cost_points) {
      alert(`You need ${item.cost_points - user.discord_points} more points!`);
      return;
    }
    const confirm = window.confirm(`Redeem ${item.name} for ${item.cost_points} points?`);
    if (confirm) {
      alert("Redemption successful! Your gift is being prepared.");
    }
  };

  return (
    <div className="space-y-12">
      <div className="relative glass rounded-[2.5rem] p-12 md:p-16 border border-indigo-500/20 overflow-hidden text-center space-y-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">
          <Crown size={14} /> Rewards Center
        </div>
        
        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">The <span className="text-indigo-400">Point Shop</span></h1>
          <p className="text-slate-400 text-lg">Use your earned Discord Points to claim exclusive rewards, perks, and discounts.</p>
        </div>

        {user && (
          <div className="inline-flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-8 py-4 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Your Balance</span>
              <span className="text-2xl font-black text-indigo-400">{user.discord_points.toLocaleString()}</span>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Star size={24} />
            </div>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_POINT_ITEMS.map(item => (
          <div key={item.id} className="glass rounded-[2rem] p-8 border border-slate-800 hover:border-indigo-500/40 transition-all group flex flex-col text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto text-indigo-400 group-hover:scale-110 transition-transform duration-500">
              <Gift size={40} />
            </div>
            <div className="space-y-2 flex-grow">
              <h3 className="text-xl font-bold">{item.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
            </div>
            <div className="pt-4 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 font-black">
                {item.cost_points.toLocaleString()} <span className="text-[10px] text-slate-500">PTS</span>
              </div>
              <button 
                onClick={() => handleRedeem(item)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                Redeem Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
