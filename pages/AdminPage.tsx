import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, Users, ShoppingBag, DollarSign, Loader2, MessageSquare, 
  Send, X, AlertCircle, ShieldAlert, History, UserCog, Edit3, Save, Trash2,
  LockOpen
} from 'lucide-react';
import { supabase, logAdminAction } from '../lib/supabase.ts';
import { Product, UserProfile, OrderStatus, Message, AuditLog } from '../types.ts';

// --- AdminChatModal ---
interface AdminChatModalProps {
  order: any;
  currentUserId?: string;
  onClose: () => void;
}

const AdminChatModal: React.FC<AdminChatModalProps> = ({ order, currentUserId, onClose }) => {
  const [messages, setMessages] = useState<(Message & { isSending?: boolean; error?: boolean; tempId?: string })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messageEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`admin-order-chat-${order.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${order.id}` }, (p) => {
        setMessages(prev => [...prev, p.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order.id, fetchMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    const content = newMessage.trim();
    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({ 
        order_id: order.id, 
        sender_id: currentUserId || null, // Allow guest messages in admin for demo
        content 
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error(err);
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
              <h3 className="font-black text-white">Support: {order.profiles?.username || 'Guest'}</h3>
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">ID: #{order.id.split('-')[0]}</p>
            </div>
          </div>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-4">
          {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender_id === currentUserId ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl text-sm ${msg.sender_id === currentUserId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                {msg.content}
              </div>
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

// --- AdminPage Main ---

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'users' | 'logs'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, totalUsers: 0 });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const { data: rev } = await supabase.from('orders').select('price_paid');
        const { count: ord } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: usr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        setStats({ 
          revenue: rev?.reduce((a, c) => a + Number(c.price_paid), 0) || 0, 
          orders: ord || 0, 
          totalUsers: usr || 0 
        });
      } else if (activeTab === 'orders') {
        const { data } = await supabase.from('orders').select('*, profiles(*), products(*)').order('created_at', { ascending: false });
        setOrders(data || []);
      } else if (activeTab === 'products') {
        const { data } = await supabase.from('products').select('*').order('name');
        setProducts(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('username');
        setUsers(data || []);
      } else if (activeTab === 'logs') {
        const { data } = await supabase.from('audit_logs').select('*, profiles(username)').order('created_at', { ascending: false }).limit(50);
        setLogs(data || []);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => {
          setCurrentUser(p);
        });
      }
    });
    fetchData(); // Fetch data immediately as it's now public
  }, [fetchData]);

  const updateOrderStatus = async (id: string, newStatus: OrderStatus, oldStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      await logAdminAction(
        'ORDER_STATUS', 
        id, 
        `Changed status of Order #${id.split('-')[0]} from ${oldStatus} to ${newStatus}`,
        { old: oldStatus, new: newStatus }
      );
    }
  };

  const updateProduct = async (product: Product, updates: Partial<Product>) => {
    const { error } = await supabase.from('products').update(updates).eq('id', product.id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updates } : p));
      await logAdminAction(
        'PRODUCT_UPDATE', 
        product.id, 
        `Updated product "${product.name}" details`,
        { old: product, updates }
      );
    }
  };

  const updateUserRole = async (user: UserProfile, newRole: 'user' | 'admin') => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      await logAdminAction(
        'ROLE_CHANGE', 
        user.id, 
        `Changed role of ${user.username} from ${user.role} to ${newRole}`,
        { old_role: user.role, new_role: newRole, user_name: user.username }
      );
    }
  };

  const tabs = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'products', icon: Edit3, label: 'Products' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'logs', icon: History, label: 'Audit Logs' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500"><LockOpen size={16} /></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Public Admin Access</span>
          </div>
          <h1 className="text-4xl font-black">Admin <span className="text-slate-700">Hub</span></h1>
          <p className="text-slate-500 text-sm font-medium">Control the digital empire (Unlocked Mode).</p>
        </div>
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-3xl">
          {tabs.map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[3rem] p-8 border border-slate-800 shadow-2xl">
        {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} /> : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'Revenue', value: `${stats.revenue.toFixed(2)} DH`, icon: DollarSign, color: 'text-green-400' },
                  { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-blue-400' },
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-400' },
                ].map((s, i) => (
                  <div key={i} className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-slate-800 flex items-center justify-between group hover:border-blue-500/20 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{s.label}</p>
                      <div className="text-3xl font-black mt-1">{s.value}</div>
                    </div>
                    <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 ${s.color} group-hover:scale-110 transition-transform`}>
                      <s.icon size={24} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Item</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="border-t border-slate-800/50 group hover:bg-white/5 transition-colors">
                        <td className="p-4">
                           <div className="font-bold text-white text-sm">{o.profiles?.username || 'Guest'}</div>
                           <div className="text-[9px] text-slate-500">{o.profiles?.email || 'No email'}</div>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">{o.products?.name}</td>
                        <td className="p-4">
                          <select 
                            value={o.status} 
                            onChange={e => updateOrderStatus(o.id, e.target.value as any, o.status)} 
                            className="bg-slate-950 border border-slate-800 text-[10px] uppercase font-black p-2 rounded-xl outline-none focus:border-blue-500"
                          >
                            {['pending', 'completed', 'cancelled', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setActiveChatOrder(o)} className="p-3 bg-slate-800 hover:bg-blue-600 rounded-xl transition-all shadow-lg"><MessageSquare size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {products.map(p => (
                   <div key={p.id} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-6">
                      <div className="flex justify-between items-start">
                         <h4 className="font-black text-white">{p.name}</h4>
                         <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/10 uppercase tracking-widest">{p.category}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Price (DH)</span>
                            <input 
                              type="number" 
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs font-black" 
                              defaultValue={p.price_dh} 
                              onBlur={(e) => updateProduct(p, { price_dh: parseFloat(e.target.value) })}
                            />
                         </div>
                         <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Stock</span>
                            <input 
                              type="number" 
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs font-black" 
                              defaultValue={p.stock} 
                              onBlur={(e) => updateProduct(p, { stock: parseInt(e.target.value) })}
                            />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-500">
                    <tr><th className="p-4">Username</th><th className="p-4">Balance</th><th className="p-4">Points</th><th className="p-4">Role</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-sm">{u.username || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="p-4 text-slate-400 text-sm font-black">{u.wallet_balance.toFixed(2)} DH</td>
                        <td className="p-4 text-indigo-400 text-sm font-black">{u.discord_points}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => updateUserRole(u, u.role === 'admin' ? 'user' : 'admin')}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${u.role === 'admin' ? 'bg-purple-600/10 border-purple-600/20 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                          >
                            <UserCog size={12} /> {u.role}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                {logs.length === 0 ? <p className="text-center py-12 text-slate-600 font-bold uppercase text-[10px] tracking-widest">No audit data available</p> : logs.map(log => (
                  <div key={log.id} className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl flex items-start gap-5 group">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 group-hover:text-blue-400 transition-colors">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                         <div className="text-sm font-bold text-white mb-1">{log.description}</div>
                         <div className="text-[9px] font-black uppercase text-slate-600 tracking-widest">{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Admin: {log.profiles?.username || 'System'}</div>
                         <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Action: {log.action}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {activeChatOrder && (
        <AdminChatModal 
          order={activeChatOrder} 
          currentUserId={currentUser?.id} 
          onClose={() => setActiveChatOrder(null)} 
        />
      )}
    </div>
  );
}
