
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingBag, Trophy, Search, Edit, Trash2, Plus, Zap, BarChart3, 
  UserPlus, Eye, History, X, ImageIcon, Calendar, DollarSign, Loader2, TrendingUp, Store, 
  ShieldAlert, Clock, CheckCircle2, XCircle, Key, AlertTriangle, Upload, Filter, PackageCheck, 
  PackageX, Info, Settings, ArrowRight, RefreshCw, ExternalLink, Gift, Star, Type, MessageSquare, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Order, Tournament, PointShopItem, OrderStatus, Message } from '../types';

type AdminTab = 'overview' | 'orders' | 'products' | 'users' | 'tournaments' | 'point_shop';

const AdminChatModal = ({ order, user, onClose }: { order: any, user: UserProfile, onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`admin-chat-${order.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${order.id}` }, 
      (payload) => setMessages((prev) => [...prev, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [order.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('messages').select('*').eq('order_id', order.id).order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const content = newMessage;
    setNewMessage('');
    const { error } = await supabase.from('messages').insert({ order_id: order.id, sender_id: user.id, content });
    if (error) alert(error.message);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative glass w-full max-w-2xl h-[70vh] rounded-[3rem] border border-slate-700 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-600 rounded-xl text-white"><MessageSquare size={20} /></div>
            <div>
              <h3 className="font-black text-white">Support: {order.profiles?.username}</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase">Order #{order.id.split('-')[0]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={24} /></button>
        </div>
        <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 scrollbar-none bg-slate-950/20">
          {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto mt-20" /> : messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${msg.sender_id === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="p-6 border-t border-slate-800 flex gap-2">
          <input type="text" className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-sm" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type admin response..." />
          <button type="submit" className="p-4 bg-blue-600 text-white rounded-xl"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isInitializing, setIsInitializing] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatOrder, setActiveChatOrder] = useState<any>(null);
  
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [editingPointItem, setEditingPointItem] = useState<PointShopItem | null>(null);
  const [pointItemForm, setPointItemForm] = useState({ name: '', description: '', cost_points: 1000, image_url: '' });

  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, totalUsers: 0 });

  const fetchData = useCallback(async (tab: AdminTab) => {
    setTabLoading(true);
    try {
      if (tab === 'overview') {
        const { data: rev } = await supabase.from('orders').select('price_paid');
        const { count: ord } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: usr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        setStats({ revenue: rev?.reduce((a, c) => a + Number(c.price_paid), 0) || 0, orders: ord || 0, totalUsers: usr || 0 });
      } else if (tab === 'orders') {
        const { data } = await supabase.from('orders').select('*, profiles(id, username, email), products(name)').order('created_at', { ascending: false });
        setOrders(data || []);
      } else if (tab === 'products') {
        const { data } = await supabase.from('products').select('*');
        setProducts(data || []);
      } else if (tab === 'users') {
        const { data } = await supabase.from('profiles').select('*');
        setUsers(data || []);
      }
    } catch (e) { setError(e); }
    finally { setTabLoading(false); setIsInitializing(false); }
  }, []);

  useEffect(() => { fetchData(activeTab); }, [activeTab, fetchData]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) alert(error.message);
    else fetchData('orders');
  };

  if (isInitializing) return <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={64} /></div>;

  const currentAdmin = users.find(u => u.role === 'admin') || { id: 'admin', username: 'Admin' } as UserProfile;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black flex items-center gap-3"><LayoutDashboard className="text-blue-500" /> Moon Admin</h1>
        <div className="flex gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
          {(['overview', 'orders', 'products', 'users'] as AdminTab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
              <DollarSign className="text-green-500 mb-4" />
              <div className="text-2xl font-black">{stats.revenue.toFixed(2)} DH</div>
              <p className="text-[10px] text-slate-500 font-black uppercase">Revenue</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
              <ShoppingBag className="text-blue-500 mb-4" />
              <div className="text-2xl font-black">{stats.orders}</div>
              <p className="text-[10px] text-slate-500 font-black uppercase">Orders</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
              <Users className="text-indigo-500 mb-4" />
              <div className="text-2xl font-black">{stats.totalUsers}</div>
              <p className="text-[10px] text-slate-500 font-black uppercase">Users</p>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="overflow-x-auto rounded-3xl border border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-900">
                <tr>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">ID</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">User</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">Product</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">Status</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-blue-500/5 transition-colors">
                    <td className="p-5 text-[10px] font-mono">#{o.id.split('-')[0]}</td>
                    <td className="p-5 font-bold text-sm">
                       <div>{o.profiles?.username}</div>
                       <div className="text-[10px] text-slate-500 font-normal">{o.profiles?.email}</div>
                    </td>
                    <td className="p-5 text-sm text-slate-400">{o.products?.name}</td>
                    <td className="p-5">
                       <select 
                         className="bg-slate-950 border border-slate-800 rounded-lg text-[10px] px-2 py-1 font-black uppercase text-slate-300"
                         value={o.status}
                         onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                       >
                         <option value="pending">Pending</option>
                         <option value="completed">Completed</option>
                         <option value="cancelled">Cancelled</option>
                         <option value="refunded">Refunded</option>
                       </select>
                    </td>
                    <td className="p-5 flex items-center gap-2">
                      <button 
                        onClick={() => setActiveChatOrder(o)}
                        className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-lg"
                        title="Chat with Customer"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto rounded-3xl border border-slate-800">
             <table className="w-full text-left">
              <thead className="bg-slate-900">
                <tr>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">User</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">Balance</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">Points</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-500">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-blue-500/5 transition-colors">
                    <td className="p-5">
                       <div className="font-bold text-sm text-white">{u.username}</div>
                       <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-5 text-sm font-black text-blue-400">{u.wallet_balance} DH</td>
                    <td className="p-5 text-sm font-black text-indigo-400">{u.discord_points}</td>
                    <td className="p-5">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                         {u.role}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeChatOrder && (
        <AdminChatModal 
          order={activeChatOrder} 
          user={currentAdmin} 
          onClose={() => setActiveChatOrder(null)} 
        />
      )}
    </div>
  );
}
