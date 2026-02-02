
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, Users, ShoppingBag, DollarSign, Loader2, MessageSquare, 
  Send, X, AlertCircle, ChevronDown, MoreHorizontal, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, OrderStatus, Message } from '../types';

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
      setChatError("Failed to sync history.");
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

    return () => { supabase.removeChannel(channel); };
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
    
    const optimisticMsg: any = {
      id: tempId, tempId, order_id: order.id, sender_id: adminUser.id,
      content, created_at: new Date().toISOString(), isSending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setIsSending(true);

    try {
      const { data, error } = await supabase.from('messages').insert({
        order_id: order.id, sender_id: adminUser.id, content
      }).select().single();
      if (error) throw error;
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...data, isSending: false } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, error: true, isSending: false } : m));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative glass w-full max-w-2xl h-[80vh] rounded-[3rem] border border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-black text-white">Support: {order.profiles?.username}</h3>
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">ID: #{order.id.split('-')[0]}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close Chat"><X size={24} /></button>
        </div>

        <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-4" onScroll={handleScroll}>
          {hasMore && !loading && (
            <button onClick={() => fetchMessages(true)} className="w-full text-[10px] font-black uppercase text-slate-500 py-2">Load More</button>
          )}
          {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender_id === adminUser.id ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl text-sm ${msg.sender_id === adminUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'} ${msg.error ? 'border-red-500 text-red-400' : ''}`}>
                {msg.content}
              </div>
              {msg.isSending && <Loader2 size={10} className="animate-spin mt-1" />}
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-800 bg-slate-900/40 flex gap-3">
          <input type="text" className="flex-grow bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm" placeholder="Reply..." value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={isSending} />
          <button type="submit" disabled={!newMessage.trim() || isSending} className="p-4 bg-blue-600 rounded-2xl text-white"><Send size={20} /></button>
        </form>
      </div>
    </div>
  );
};

// --- AdminPage ---

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'users'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, totalUsers: 0 });
  const [currentAdmin, setCurrentAdmin] = useState<UserProfile | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const { data: rev } = await supabase.from('orders').select('price_paid');
        const { count: ord } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: usr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        setStats({ revenue: rev?.reduce((a, c) => a + Number(c.price_paid), 0) || 0, orders: ord || 0, totalUsers: usr || 0 });
      } else if (activeTab === 'orders') {
        const { data } = await supabase.from('orders').select('*, profiles(*), products(*)').order('created_at', { ascending: false });
        setOrders(data || []);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => {
          if (p?.role === 'admin') setCurrentAdmin(p);
          else setError("Unauthorized");
        });
      }
    });
  }, []);

  useEffect(() => { if (currentAdmin) fetchData(); }, [activeTab, fetchData, currentAdmin]);

  const updateStatus = async (id: string, s: OrderStatus) => {
    setUpdatingStatus(id);
    const { error } = await supabase.from('orders').update({ status: s }).eq('id', id);
    if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o));
    setUpdatingStatus(null);
  };

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black">Admin <span className="text-slate-700">Panel</span></h1>
        <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          {['overview', 'orders'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === t ? 'bg-blue-600' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[3rem] p-8 border border-slate-800">
        {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} /> : (
          activeTab === 'overview' ? (
            <div className="grid grid-cols-3 gap-8">
              <div className="p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Revenue</p>
                <div className="text-4xl font-black">{stats.revenue} DH</div>
              </div>
              <div className="p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Orders</p>
                <div className="text-4xl font-black">{stats.orders}</div>
              </div>
              <div className="p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Users</p>
                <div className="text-4xl font-black">{stats.totalUsers}</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase text-slate-500">
                  <tr><th className="p-4">Item</th><th className="p-4">Customer</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-slate-800">
                      <td className="p-4 font-bold">{o.products?.name}</td>
                      <td className="p-4 text-slate-400">{o.profiles?.username}</td>
                      <td className="p-4">
                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value as any)} className="bg-slate-950 border border-slate-800 text-[9px] uppercase font-black p-2 rounded-lg outline-none">
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4"><button onClick={() => setActiveChatOrder(o)} className="p-2 bg-slate-800 rounded-lg"><MessageSquare size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {activeChatOrder && currentAdmin && (
        <AdminChatModal order={activeChatOrder} adminUser={currentAdmin} onClose={() => setActiveChatOrder(null)} />
      )}
    </div>
  );
}
