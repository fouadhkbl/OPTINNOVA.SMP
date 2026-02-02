import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, Users, ShoppingBag, DollarSign, Loader2, MessageSquare, 
  Send, X, AlertCircle, RefreshCw, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, OrderStatus, Message } from '../types';

// --- Components ---

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    refunded: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${colors[status]}`}>
      {status}
    </span>
  );
};

// --- AdminChatModal ---

interface AdminChatModalProps {
  order: any;
  adminUser: UserProfile;
  onClose: () => void;
}

const AdminChatModal: React.FC<AdminChatModalProps> = ({ order, adminUser, onClose }) => {
  const [messages, setMessages] = useState<(Message & { isSending?: boolean; error?: boolean; tempId?: string })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  const fetchMessages = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    const limit = 50;
    const offset = isLoadMore ? messages.length : 0;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const fetchedMessages = (data || []).reverse();
      if (isLoadMore) {
        setMessages(prev => [...fetchedMessages, ...prev]);
      } else {
        setMessages(fetchedMessages);
      }
      
      setHasMore(data?.length === limit);
    } catch (err: any) {
      console.error("Chat sync error:", err);
      setChatError("Failed to sync message history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [order.id, messages.length]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`admin-order-chat-${order.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `order_id=eq.${order.id}` 
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, fetchMessages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    if (messageEndRef.current && isAutoScrollEnabled.current && !loading) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const content = newMessage.trim();
    const tempId = crypto.randomUUID();
    
    // Optimistic UI Update
    const optimisticMsg: any = {
      id: tempId,
      tempId: tempId,
      order_id: order.id,
      sender_id: adminUser.id,
      content,
      created_at: new Date().toISOString(),
      isSending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setIsSending(true);
    setChatError(null);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          order_id: order.id,
          sender_id: adminUser.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with actual DB record
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...data, isSending: false } : m));
    } catch (err: any) {
      console.error("Message send failure:", err);
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, error: true, isSending: false } : m));
      setChatError("Transmission failed. Check your network.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} aria-hidden="true" />
      <div 
        className="relative glass w-full max-w-2xl h-[80vh] rounded-[3rem] border border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-label="Admin Support Chat"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-black text-white">Client: {order.profiles?.username || 'Guest'}</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Order ID: #{order.id.split('-')[0]}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
            aria-label="Close Chat"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message Area */}
        <div 
          className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-4"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {hasMore && !loading && (
            <button 
              onClick={() => fetchMessages(true)}
              disabled={loadingMore}
              className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-30"
            >
              {loadingMore ? 'Syncing...' : 'Load Previous Messages'}
            </button>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
              <Loader2 className="animate-spin text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Retrieving Messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20 text-center space-y-4">
              <MessageSquare size={48} />
              <p className="font-black text-xs uppercase tracking-widest">No transaction history yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender_id === adminUser.id ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                  msg.sender_id === adminUser.id 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                } ${msg.error ? 'border-red-500 bg-red-500/10 text-red-400' : ''}`}>
                  {msg.content}
                </div>
                <div className="mt-1 px-2 flex items-center gap-2">
                  <span className="text-[8px] font-black text-slate-600 uppercase">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.isSending && <Loader2 size={8} className="animate-spin text-blue-500" />}
                  {msg.error && (
                    <div className="flex items-center gap-1 text-[8px] text-red-500 font-black uppercase">
                      <AlertCircle size={8} /> Failed to Deliver
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/40 space-y-3">
          {chatError && (
             <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
               <AlertCircle size={10} /> {chatError}
             </p>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Response content..." 
              className="flex-grow bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all text-white text-sm"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              aria-label="New Message Input"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || isSending}
              className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
              aria-label="Send Message"
            >
              {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- AdminPage ---

type AdminTab = 'overview' | 'orders' | 'products' | 'users';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, totalUsers: 0 });
  
  // UI States
  const [activeChatOrder, setActiveChatOrder] = useState<any>(null);
  const [currentAdmin, setCurrentAdmin] = useState<UserProfile | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data: rev } = await supabase.from('orders').select('price_paid');
      const { count: ord } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: usr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      setStats({ 
        revenue: rev?.reduce((a, c) => a + Number(c.price_paid), 0) || 0, 
        orders: ord || 0, 
        totalUsers: usr || 0 
      });
    } catch (err) {
      console.error("Stats fetch error", err);
    }
  }, []);

  const fetchData = useCallback(async (tab: AdminTab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'overview') await fetchStats();
      else if (tab === 'orders') {
        const { data, error: err } = await supabase
          .from('orders')
          .select('*, profiles(id, username, email), products(name)')
          .order('created_at', { ascending: false });
        if (err) throw err;
        setOrders(data || []);
      } 
      else if (tab === 'products') {
        const { data, error: err } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (err) throw err;
        setProducts(data || []);
      } 
      else if (tab === 'users') {
        const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (err) throw err;
        setUsers(data || []);
      }
    } catch (e: any) {
      setError(e.message || "Cloud sync error.");
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    const initAdmin = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (error || !profile) {
            setError("Admin profile mismatch. Re-authentication required.");
          } else if (profile.role !== 'admin') {
            setError("Unauthorized. Admin role missing.");
          } else {
            setCurrentAdmin(profile);
          }
        } else {
          setError("Session expired. Please log in again.");
        }
      } catch (err: any) {
        setError("Auth system error: " + err.message);
      }
    };
    initAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin) fetchData(activeTab);
  }, [activeTab, fetchData, currentAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const valid: OrderStatus[] = ['pending', 'completed', 'cancelled', 'refunded'];
    if (!valid.includes(newStatus)) {
      alert("Invalid Order Status Selection.");
      return;
    }

    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Local State Optimistic Update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e: any) {
      alert("Status Update Failed: " + e.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const tabs = useMemo<AdminTab[]>(() => ['overview', 'orders', 'products', 'users'], []);

  if (error && !currentAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" size={36} /> 
            Admin <span className="text-slate-700">Hub</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-tight">Operational dashboard for {currentAdmin?.username || 'Staff'}.</p>
        </div>

        <nav className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          {tabs.map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === t 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="glass rounded-[3rem] p-1 border border-slate-800 overflow-hidden">
        <div className="p-8 md:p-12 space-y-8">
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-2">
              <AlertCircle size={16} /> Error: {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
              <Loader2 className="animate-spin text-blue-500" size={48} />
              <span className="text-[10px] font-black uppercase tracking-widest">Querying Cloud Data...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800 hover:border-green-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
                      <DollarSign size={24} />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">{stats.revenue.toLocaleString()} <span className="text-sm font-bold text-slate-600">DH</span></div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Gross Revenue</p>
                  </div>

                  <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800 hover:border-blue-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                      <ShoppingBag size={24} />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">{stats.orders}</div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Closed Orders</p>
                  </div>

                  <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                      <Users size={24} />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">{stats.totalUsers}</div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Registered Users</p>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="overflow-x-auto custom-scrollbar pb-4">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                        <th className="px-6 py-4">Order Details</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Total Value</th>
                        <th className="px-6 py-4">Current Status</th>
                        <th className="px-6 py-4 text-center">Support</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-4">
                      {orders.map(order => (
                        <tr key={order.id} className="bg-slate-900/30 hover:bg-slate-900/50 transition-colors group">
                          <td className="px-6 py-6 rounded-l-[1.5rem] border-y border-l border-slate-800">
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{order.products?.name || 'Unknown Item'}</div>
                            <div className="text-[9px] text-slate-600 font-black uppercase mt-1">Order #{order.id.split('-')[0]}</div>
                          </td>
                          <td className="px-6 py-6 border-y border-slate-800">
                            <div className="text-sm font-medium text-slate-300">{order.profiles?.username || 'Guest'}</div>
                            <div className="text-[10px] text-slate-600 truncate max-w-[120px]">{order.profiles?.email}</div>
                          </td>
                          <td className="px-6 py-6 border-y border-slate-800">
                            <div className="font-black text-white">{order.price_paid} DH</div>
                            <div className="text-[9px] text-indigo-500 font-black uppercase">+{order.points_earned} Points</div>
                          </td>
                          <td className="px-6 py-6 border-y border-slate-800">
                            <div className="relative inline-block">
                              <select 
                                disabled={updatingStatus === order.id}
                                className={`appearance-none bg-slate-950 border border-slate-800 text-[9px] font-black uppercase px-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-50`}
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                aria-label="Update Order Status"
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                              </select>
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {updatingStatus === order.id ? <Loader2 size={10} className="animate-spin text-blue-500" /> : <ChevronDown size={10} className="text-slate-500" />}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 rounded-r-[1.5rem] border-y border-r border-slate-800 text-center">
                            <button 
                              onClick={() => setActiveChatOrder(order)}
                              className="p-3 bg-slate-950 hover:bg-blue-600 text-slate-500 hover:text-white rounded-xl transition-all shadow-xl"
                              aria-label={`Open Support Chat for ${order.id}`}
                            >
                              <MessageSquare size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {orders.length === 0 && (
                    <div className="text-center py-24 opacity-20">
                      <ShoppingBag size={48} className="mx-auto mb-4" />
                      <p className="font-black text-xs uppercase tracking-widest">The vault is currently empty</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map(user => (
                    <div key={user.id} className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800 flex items-center gap-4 hover:border-slate-700 transition-colors">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt={user.username} /> : <Users size={24} className="text-slate-600" />}
                      </div>
                      <div className="flex-grow">
                        <div className="font-bold text-white flex items-center gap-2">
                          {user.username}
                          {user.role === 'admin' && <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full border border-red-500/20 font-black uppercase">Staff</span>}
                        </div>
                        <div className="text-[10px] text-slate-600 mb-2 truncate max-w-[150px]">{user.email}</div>
                        <div className="flex items-center gap-3">
                           <div className="text-[9px] font-black uppercase tracking-widest text-blue-400">{user.wallet_balance.toFixed(2)} DH</div>
                           <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{user.discord_points} PTS</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'products' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(prod => (
                    <div key={prod.id} className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">{prod.category}</div>
                         <div className={`text-[10px] font-black uppercase tracking-widest ${prod.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {prod.stock} in stock
                         </div>
                      </div>
                      <h4 className="font-bold text-lg text-white truncate">{prod.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                      <div className="pt-4 flex items-center justify-between border-t border-slate-800/50">
                         <div className="text-xl font-black text-white">{prod.price_dh} <span className="text-xs text-slate-600">DH</span></div>
                         <button aria-label="Product Options" className="p-2 text-slate-600 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Overlays */}
      {activeChatOrder && currentAdmin && (
        <AdminChatModal 
          order={activeChatOrder} 
          adminUser={currentAdmin} 
          onClose={() => setActiveChatOrder(null)} 
        />
      )}
    </div>
  );
}
