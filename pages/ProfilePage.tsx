
import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Award, Clock, PlusCircle, CreditCard, Shield, Gift, User, ShoppingBag, Loader2, AlertCircle, CheckCircle2, ArrowDownCircle, ArrowUpCircle, X, ChevronRight } from 'lucide-react';
import { UserProfile, Order } from '../types';
import { supabase } from '../lib/supabase';
import { DH_TO_USD, POINTS_PER_DOLLAR, FEE_PERCENTAGE, FLAT_FEE_USD } from '../constants.tsx';

declare var paypal: any;

export default function ProfilePage({ user, setUser }: { user: UserProfile, setUser: any }) {
  const [addAmount, setAddAmount] = useState<string>('50');
  const [isDepositing, setIsDepositing] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserOrders();
    fetchWalletHistory();
  }, [user.id]);

  useEffect(() => {
    if (showFundingModal && paypalRef.current && !isDepositing) {
      // Clear previous buttons
      paypalRef.current.innerHTML = '';
      
      const amount = parseFloat(addAmount);
      if (isNaN(amount) || amount < 10) return;

      const feeUsd = (amount * DH_TO_USD * FEE_PERCENTAGE) + FLAT_FEE_USD;
      const totalUsd = (amount * DH_TO_USD) + feeUsd;

      paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay'
        },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              description: `Add ${amount} DH to Moon Night Wallet`,
              amount: {
                currency_code: 'USD',
                value: totalUsd.toFixed(2)
              }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          const order = await actions.order.capture();
          handlePaymentSuccess(amount, order.id);
        },
        onError: (err: any) => {
          console.error('PayPal Error:', err);
          setPaymentError('Payment failed. Please try again.');
        }
      }).render(paypalRef.current);
    }
  }, [addAmount, user.id, showFundingModal, isDepositing]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setOrders(data);
    }
    setLoadingOrders(false);
  };

  const fetchWalletHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('wallet_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setWalletHistory(data);
    }
    setLoadingHistory(false);
  };

  const handlePaymentSuccess = async (amountDh: number, transactionId: string) => {
    setIsDepositing(true);
    setPaymentError(null);
    try {
      const pointsEarned = Math.floor(amountDh * DH_TO_USD * POINTS_PER_DOLLAR);
      
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: user.wallet_balance + amountDh,
          discord_points: Number(user.discord_points) + pointsEarned
        })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      await supabase.from('wallet_history').insert({
        user_id: user.id,
        amount: amountDh,
        type: 'deposit',
        description: `PayPal Deposit (${transactionId}). Points earned: ${pointsEarned}`
      });

      setUser(updatedProfile);
      fetchWalletHistory();
      alert(`Success! ${amountDh} DH added to your wallet.`);
      setShowFundingModal(false);
    } catch (error: any) {
      setPaymentError("Error updating balance: " + error.message);
    } finally {
      setIsDepositing(false);
    }
  };

  const calculateTotalToPayUsd = () => {
    const val = parseFloat(addAmount);
    if (isNaN(val)) return 0;
    const feeUsd = (val * DH_TO_USD * FEE_PERCENTAGE) + FLAT_FEE_USD;
    return (val * DH_TO_USD) + feeUsd;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: User Stats Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-[2.5rem] p-8 border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] -z-10 group-hover:bg-blue-600/20 transition-all"></div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-1 shadow-2xl">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border border-white/10 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-blue-400" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight">{user.username}</h2>
                <p className="text-slate-500 text-sm font-medium">{user.email}</p>
                <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  {user.role} Member
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-1 group/item hover:border-blue-500/30 transition-all">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Balance</span>
                <div className="text-xl font-black text-white">{user.wallet_balance.toFixed(2)} <span className="text-xs text-slate-500">DH</span></div>
              </div>
              <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-1 group/item hover:border-indigo-500/30 transition-all">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Points</span>
                <div className="text-xl font-black text-indigo-400">{user.discord_points.toLocaleString()}</div>
              </div>
            </div>

            <button 
              onClick={() => setShowFundingModal(true)}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group/btn"
            >
              <PlusCircle size={16} className="group-hover/btn:rotate-90 transition-transform" /> Add Funds
            </button>
          </div>

          <div className="glass rounded-[2.5rem] p-8 border border-slate-800 space-y-4 hover:bg-slate-900/40 transition-colors group">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Award size={28} />
            </div>
            <h4 className="text-xl font-black">Loyalty Rewards</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Earn 100 points for every $1 added. Use points in the Point Shop for exclusive perks.
            </p>
          </div>
        </div>

        {/* Right: History & Orders */}
        <div className="md:col-span-2 space-y-8">
          <div className="glass rounded-[2.5rem] p-8 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6">
              <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Wallet History
                </button>
              </div>
              <div className="bg-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-800">
                {activeTab === 'orders' ? orders.length : walletHistory.length} Activities
              </div>
            </div>

            <div className="space-y-4">
              {activeTab === 'orders' ? (
                loadingOrders ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-800 space-y-4">
                    <ShoppingBag size={48} className="mx-auto text-slate-700" />
                    <p className="text-slate-500 font-medium italic">You haven't placed any orders yet.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-900/50 hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                          <Gift size={28} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-200 text-lg">{order.products?.name || 'Digital Item'}</h4>
                          <div className="flex items-center gap-3">
                             <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                             <span className="text-[10px] text-slate-600 font-mono">#{order.id.split('-')[0].toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-black text-white text-lg">{order.price_paid} DH</div>
                          <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">+{order.points_earned} PTS</div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                          <CheckCircle2 size={12} /> {order.status}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                loadingHistory ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                ) : walletHistory.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-800 space-y-4">
                    <Wallet size={48} className="mx-auto text-slate-700" />
                    <p className="text-slate-500 font-medium italic">No wallet history found.</p>
                  </div>
                ) : (
                  walletHistory.map(entry => (
                    <div key={entry.id} className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 flex items-center justify-between gap-4 group hover:bg-slate-900/50 hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${entry.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {entry.amount > 0 ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-sm">{entry.description || entry.type.toUpperCase()}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(entry.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className={`text-lg font-black ${entry.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)} DH
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal/Page */}
      {showFundingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowFundingModal(false)}></div>
          <div className="relative glass w-full max-w-xl rounded-[3rem] border border-slate-700 p-8 md:p-12 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <button 
              onClick={() => setShowFundingModal(false)}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-slate-400 transition-all"
            >
              <X size={24} />
            </button>

            <div className="space-y-2">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <Wallet className="text-blue-500" /> Top Up Wallet
              </h2>
              <p className="text-slate-500 font-medium">Select the amount you wish to add to your Moon balance.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['20', '50', '100', '200', '500', '1000'].map(val => (
                <button 
                  key={val}
                  onClick={() => setAddAmount(val)}
                  className={`py-4 rounded-2xl border text-sm font-black transition-all ${addAmount === val ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  {val} DH
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Custom Amount (DH)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="10"
                    placeholder="Min 10 DH" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 focus:outline-none focus:border-blue-500 transition-all text-white font-black text-xl"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-black">DH</div>
                </div>
              </div>

              {parseFloat(addAmount) >= 10 ? (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 uppercase tracking-widest">Balance To Add</span>
                      <span className="text-white">{parseFloat(addAmount).toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 uppercase tracking-widest">Processing Fee</span>
                      <span className="text-slate-300">{(calculateTotalToPayUsd() - (parseFloat(addAmount) * DH_TO_USD)).toFixed(2)} USD</span>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-blue-400 font-black uppercase tracking-widest">Final Total</span>
                      <span className="text-3xl font-black text-white">${calculateTotalToPayUsd().toFixed(2)} <span className="text-xs text-slate-600">USD</span></span>
                    </div>
                  </div>
                  
                  {paymentError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-bold">
                      <AlertCircle size={14} /> {paymentError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div ref={paypalRef} className="z-0"></div>
                    <p className="text-center text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <Shield size={12} /> Securely encrypted by PayPal Systems
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-500 text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                  <AlertCircle size={16}/> Minimum deposit is 10 DH
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
