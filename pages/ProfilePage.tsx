
import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, Award, Clock, PlusCircle, CreditCard, Shield, Gift, User, 
  ShoppingBag, Loader2, AlertCircle, CheckCircle2, ArrowDownCircle, 
  ArrowUpCircle, X, ChevronRight, MessageSquare, Send, Key, Copy, Check, 
  RefreshCcw, Info
} from 'lucide-react';
import { UserProfile, Order, Message } from '../types';
import { supabase } from '../lib/supabase';
import { DH_TO_USD, POINTS_PER_DOLLAR, FEE_PERCENTAGE, FLAT_FEE_USD } from '../constants.tsx';

declare var paypal: any;

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    refunded: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

const ChatModal = ({ order, user, onClose }: { order: Order, user: UserProfile, onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`order-chat-${order.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${order.id}` }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [order.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });
    
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      order_id: order.id,
      sender_id: user.id,
      content
    });

    if (error) {
      alert("Failed to send: " + error.message);
      setNewMessage(content);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative glass w-full max-w-2xl h-[80vh] rounded-[3rem] border border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-black text-white">Support Chat</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Order ID: #{order.id.split('-')[0]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 scrollbar-none">
          <div className="flex justify-center mb-6">
            <div className="glass p-4 rounded-2xl border border-slate-800 text-center max-w-sm">
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Welcome to Moon Night support. Our team will respond to your inquiry about this order as soon as possible.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <MessageSquare size={48} className="mx-auto mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">No messages yet.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${
                  msg.sender_id === user.id 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[8px] font-black text-slate-600 uppercase mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="p-6 border-t border-slate-800 bg-slate-900/40 flex gap-3">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-grow bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all text-white text-sm"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/20 transition-all">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default function ProfilePage({ user, setUser }: { user: UserProfile, setUser: any }) {
  const [addAmount, setAddAmount] = useState<string>('50');
  const [isDepositing, setIsDepositing] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [revealOrder, setRevealOrder] = useState<string | null>(null);
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
      paypalRef.current.innerHTML = '';
      const amount = parseFloat(addAmount);
      if (isNaN(amount) || amount < 10) return;
      const totalUsd = (amount * DH_TO_USD) + (amount * DH_TO_USD * FEE_PERCENTAGE) + FLAT_FEE_USD;

      paypal.Buttons({
        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
        createOrder: (data: any, actions: any) => actions.order.create({
          purchase_units: [{ description: `Moon Wallet: ${amount} DH`, amount: { currency_code: 'USD', value: totalUsd.toFixed(2) } }]
        }),
        onApprove: async (data: any, actions: any) => {
          const order = await actions.order.capture();
          handlePaymentSuccess(amount, order.id);
        },
        onError: (err: any) => setPaymentError('PayPal Error. Try again.')
      }).render(paypalRef.current);
    }
  }, [addAmount, showFundingModal, isDepositing]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
    setLoadingOrders(false);
  };

  const fetchWalletHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('wallet_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setWalletHistory(data);
    setLoadingHistory(false);
  };

  const handlePaymentSuccess = async (amountDh: number, transactionId: string) => {
    setIsDepositing(true);
    try {
      const points = Math.floor(amountDh * DH_TO_USD * POINTS_PER_DOLLAR);
      const { data: updated, error } = await supabase.from('profiles').update({ 
        wallet_balance: user.wallet_balance + amountDh,
        discord_points: Number(user.discord_points) + points
      }).eq('id', user.id).select().single();
      if (error) throw error;
      await supabase.from('wallet_history').insert({ user_id: user.id, amount: amountDh, type: 'deposit', description: `PayPal: ${transactionId}` });
      setUser(updated);
      fetchWalletHistory();
      setShowFundingModal(false);
    } catch (e: any) { setPaymentError(e.message); }
    finally { setIsDepositing(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-[2.5rem] p-8 border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] -z-10"></div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-blue-400" />}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black">{user.username}</h2>
                <p className="text-slate-500 text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Balance</span>
                <div className="text-lg font-black">{user.wallet_balance.toFixed(2)} DH</div>
              </div>
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Points</span>
                <div className="text-lg font-black text-indigo-400">{user.discord_points}</div>
              </div>
            </div>
            <button onClick={() => setShowFundingModal(true)} className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
              <PlusCircle size={16} /> Add Funds
            </button>
          </div>

          <div className="glass rounded-3xl p-6 border border-slate-800 space-y-4">
             <div className="flex items-center gap-3">
                <Info size={18} className="text-blue-400" />
                <h4 className="text-xs font-black uppercase tracking-widest">Support Policy</h4>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed">
               All digital products are non-refundable once the key or account details have been revealed. For any issues, use the order chat.
             </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="glass rounded-[2.5rem] p-8 border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
                <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Orders</button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Wallet History</button>
              </div>
              <button onClick={() => activeTab === 'orders' ? fetchUserOrders() : fetchWalletHistory()} className="p-2 text-slate-600 hover:text-blue-400 transition-colors">
                <RefreshCcw size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'orders' ? (
                loadingOrders ? <Loader2 className="animate-spin text-blue-500 mx-auto py-12" /> : orders.length === 0 ? (
                  <div className="text-center py-20 opacity-30">
                    <ShoppingBag size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No orders yet.</p>
                  </div>
                ) : orders.map(order => (
                  <div key={order.id} className="p-6 rounded-[2rem] bg-slate-900/40 border border-slate-800 flex flex-col gap-6 group hover:border-blue-500/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
                          <ShoppingBag size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-white text-lg">{order.products?.name || 'Digital Item'}</h4>
                            <StatusBadge status={order.status} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">#{order.id.split('-')[0]} • {new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-black text-white">{order.price_paid} DH</div>
                          <div className="text-[8px] text-indigo-400 font-black">+{order.points_earned} PTS</div>
                        </div>
                        <button 
                          onClick={() => setActiveChatOrder(order)}
                          className="p-3 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-lg"
                          title="Chat with Seller"
                        >
                          <MessageSquare size={20} />
                        </button>
                      </div>
                    </div>

                    {order.status === 'completed' && (
                      <div className="space-y-3 pt-4 border-t border-slate-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Shield size={12} className="text-green-500" />
                             <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Secured Content</span>
                          </div>
                          <button 
                            onClick={() => setRevealOrder(revealOrder === order.id ? null : order.id)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
                          >
                            <Key size={12} /> {revealOrder === order.id ? 'Hide Content' : 'Reveal Item'}
                          </button>
                        </div>
                        {revealOrder === order.id && (
                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between animate-in slide-in-from-top-2">
                            <code className="text-blue-400 font-mono text-sm break-all">{order.delivery_data}</code>
                            <button onClick={() => copyToClipboard(order.delivery_data)} className="p-2 text-slate-600 hover:text-white transition-colors">
                              <Copy size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                loadingHistory ? <Loader2 className="animate-spin text-blue-500 mx-auto py-12" /> : walletHistory.length === 0 ? (
                  <div className="text-center py-20 opacity-30">
                    <Wallet size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No history found.</p>
                  </div>
                ) : walletHistory.map(entry => (
                  <div key={entry.id} className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {entry.amount > 0 ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-200">{entry.description || entry.type}</div>
                        <div className="text-[8px] text-slate-600 font-black uppercase">{new Date(entry.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={`font-black ${entry.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{entry.amount > 0 ? '+' : ''}{entry.amount} DH</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showFundingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowFundingModal(false)}></div>
          <div className="relative glass w-full max-w-xl rounded-[3rem] border border-slate-700 p-8 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <button onClick={() => setShowFundingModal(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-white"><X size={24} /></button>
            <div>
               <h2 className="text-3xl font-black mb-2">Recharge Wallet</h2>
               <p className="text-slate-500 text-sm">Select an amount to add to your Moon Night balance.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['50', '100', '200', '500', '1000'].map(v => <button key={v} onClick={() => setAddAmount(v)} className={`py-4 rounded-2xl border font-black transition-all ${addAmount === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>{v} DH</button>)}
            </div>
            <div className="relative">
               <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 font-black text-xl text-white outline-none focus:border-blue-500/50" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
               <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-600">DH</span>
            </div>
            <div ref={paypalRef} className="min-h-[150px]"></div>
          </div>
        </div>
      )}

      {activeChatOrder && (
        <ChatModal 
          order={activeChatOrder} 
          user={user} 
          onClose={() => setActiveChatOrder(null)} 
        />
      )}
    </div>
  );
}
