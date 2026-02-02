
import React, { useState } from 'react';
// Added User and ShoppingBag to lucide-react imports
import { Wallet, Award, Clock, PlusCircle, CreditCard, Shield, Gift, User, ShoppingBag } from 'lucide-react';
import { UserProfile, Order } from '../types';
import { DH_TO_USD, POINTS_PER_DOLLAR, FEE_PERCENTAGE, FLAT_FEE_USD } from '../constants.tsx';

const MOCK_ORDERS: Order[] = [
  { id: 'o1', user_id: '1', product_id: '1', status: 'completed', price_paid: 45, points_earned: 450, created_at: '2023-11-20', product: { id: '1', name: 'Netflix Premium 4K', description: '', price_dh: 45, category: 'Streaming', stock: 12, type: 'account' } },
  { id: 'o2', user_id: '1', product_id: '2', status: 'pending', price_paid: 120, points_earned: 1200, created_at: '2023-11-25', product: { id: '2', name: 'Valorant Points Key', description: '', price_dh: 120, category: 'Gaming', stock: 50, type: 'key' } },
];

export default function ProfilePage({ user, setUser }: { user: UserProfile, setUser: any }) {
  const [addAmount, setAddAmount] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const calculateFees = (amountDh: number) => {
    const amountUsd = amountDh * DH_TO_USD;
    const fee = (amountUsd * FEE_PERCENTAGE) + FLAT_FEE_USD;
    return fee / DH_TO_USD; // Convert back to DH
  };

  const handleAddFunds = () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const feeDh = calculateFees(amount);
    const totalDh = amount + feeDh;
    
    const confirm = window.confirm(`Add ${amount} DH to wallet?\nA fee of ${feeDh.toFixed(2)} DH will be applied.\nTotal charge: ${totalDh.toFixed(2)} DH.`);
    
    if (confirm) {
      setUser({
        ...user,
        wallet_balance: user.wallet_balance + amount,
        discord_points: user.discord_points + (amount * DH_TO_USD * POINTS_PER_DOLLAR)
      });
      setAddAmount('');
      setIsAdding(false);
      alert("Funds added successfully via Wallet Balance!");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: User Stats Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-8 border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border border-white/10">
                  <User size={48} className="text-blue-400" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-slate-500 text-sm">{user.email}</p>
                <div className="inline-flex px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  {user.role} Account
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Balance</span>
                <div className="text-xl font-bold text-white">{user.wallet_balance.toFixed(2)} <span className="text-xs text-slate-500">DH</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Points</span>
                <div className="text-xl font-bold text-indigo-400">{user.discord_points}</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-8 border border-slate-800 space-y-6">
            <h3 className="font-bold flex items-center gap-2"><PlusCircle size={18} className="text-blue-400" /> Add Funds</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase px-1">Amount (DH)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="Enter amount" 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 text-sm"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">DH</div>
                </div>
              </div>
              
              {addAmount && parseFloat(addAmount) > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Base Amount</span>
                    <span className="text-slate-300 font-bold">{parseFloat(addAmount).toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Fees (2% + $0.3)</span>
                    <span className="text-red-400 font-bold">+{calculateFees(parseFloat(addAmount)).toFixed(2)} DH</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                    <span className="text-white">Total Charge</span>
                    <span className="text-blue-400">{(parseFloat(addAmount) + calculateFees(parseFloat(addAmount))).toFixed(2)} DH</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleAddFunds} className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                  Deposit Now
                </button>
                <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all text-xs font-bold text-slate-400">
                  <CreditCard size={14} /> Card
                </button>
                <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all text-xs font-bold text-slate-400">
                  <Gift size={14} /> PayPal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: History & Orders */}
        <div className="md:col-span-2 space-y-8">
          <div className="glass rounded-3xl p-8 border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Clock className="text-blue-400" /> Order History
              </h3>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{MOCK_ORDERS.length} Transactions</span>
            </div>

            <div className="space-y-4">
              {MOCK_ORDERS.map(order => (
                <div key={order.id} className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{order.product?.name}</h4>
                      <p className="text-slate-500 text-xs flex items-center gap-2">
                        {order.created_at} • ID: {order.id.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-white">{order.price_paid} DH</div>
                      <div className="text-[10px] text-indigo-400 font-bold">+{order.points_earned} PTS</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      order.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points Benefits Section */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <Award size={20} />
              </div>
              <h4 className="font-bold">Point System</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Earn 100 points for every $1 spent. Points can be exchanged in the Points Shop for limited edition digital goods.
              </p>
            </div>
            <div className="glass p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <Shield size={20} />
              </div>
              <h4 className="font-bold">Member Tiers</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your activity determines your role on Discord. Reach Gold tier for 0% transaction fees and exclusive keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
