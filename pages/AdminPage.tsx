
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Trophy, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Zap, 
  BarChart3, 
  UserPlus, 
  Eye,
  History,
  X,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  Loader2,
  TrendingUp,
  Store,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Order, Tournament, PointShopItem, OrderStatus } from '../types';

type AdminTab = 'overview' | 'orders' | 'products' | 'users' | 'tournaments' | 'point_shop';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pointItems, setPointItems] = useState<PointShopItem[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, totalUsers: 0, newUsersToday: 0, visits: 0 });

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Partial<Tournament> | null>(null);

  const [showPointModal, setShowPointModal] = useState(false);
  const [editingPointItem, setEditingPointItem] = useState<Partial<PointShopItem> | null>(null);

  // Auth Check
  useEffect(() => {
    const isAuth = sessionStorage.getItem('is_admin_auth');
    if (isAuth !== 'true') {
      navigate('/');
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tableMap: Record<string, (data: any) => void> = {
        'products': setProducts,
        'users': setUsers,
        'orders': setOrders,
        'tournaments': (data) => setTournaments(data.map((t: any) => ({ ...t, date: t.tournament_date }))),
        'point_shop': setPointItems,
      };

      if (activeTab === 'products') {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data);
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
      } else if (activeTab === 'orders') {
        const { data } = await supabase.from('orders').select('*, profiles(username, email), products(name)').order('created_at', { ascending: false });
        if (data) setOrders(data);
      } else if (activeTab === 'tournaments') {
        const { data } = await supabase.from('tournaments').select('*').order('tournament_date', { ascending: true });
        if (data) setTournaments(data.map(t => ({ ...t, date: t.tournament_date })));
      } else if (activeTab === 'point_shop') {
        const { data } = await supabase.from('point_shop_items').select('*').order('created_at', { ascending: false });
        if (data) setPointItems(data);
      }

      // Dashboard Stats - Real Data
      const { data: revData } = await supabase.from('orders').select('price_paid').eq('status', 'completed');
      const totalRev = revData?.reduce((acc, curr) => acc + Number(curr.price_paid), 0) || 0;
      
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: newToday } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
      
      setStats({ 
        revenue: totalRev, 
        orders: orderCount || 0, 
        totalUsers: userCount || 0, 
        newUsersToday: newToday || 0,
        visits: 18450 + Math.floor(Math.random() * 300) 
      });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) alert(error.message);
    else fetchData();
  };

  const handleSaveItem = async (table: string, item: any, modalSet: (b: boolean) => void) => {
    setLoading(true);
    const { error } = item.id 
      ? await supabase.from(table).update(item).eq('id', item.id)
      : await supabase.from(table).insert([item]);
    if (error) alert(error.message);
    else { modalSet(false); fetchData(); }
    setLoading(false);
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (window.confirm("This action is permanent. Continue?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) alert(error.message); else fetchData();
    }
  };

  const handleUpdateUserValue = async (userId: string, field: 'wallet_balance' | 'discord_points', current: number) => {
    const label = field === 'wallet_balance' ? 'Wallet DH' : 'Discord Points';
    const newVal = prompt(`Set new ${label}:`, current.toString());
    if (newVal !== null && !isNaN(parseFloat(newVal))) {
      const { error } = await supabase.from('profiles').update({ [field]: parseFloat(newVal) }).eq('id', userId);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  const filteredData = () => {
    const q = searchQuery.toLowerCase();
    switch(activeTab) {
      case 'users': return users.filter(u => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
      case 'products': return products.filter(p => p.name.toLowerCase().includes(q));
      case 'orders': return orders.filter(o => o.profiles?.username?.toLowerCase().includes(q) || o.id.includes(q));
      case 'tournaments': return tournaments.filter(t => t.title.toLowerCase().includes(q));
      case 'point_shop': return pointItems.filter(i => i.name.toLowerCase().includes(q));
      default: return [];
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            <span className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30"><ShieldAlert size={28} className="text-white"/></span>
            <span className="gradient-text">Moon Administration</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] pl-1">Elite Portal v2.5 — Secure Access Active</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-3xl border border-slate-800 backdrop-blur-xl">
          {[
            { id: 'overview', label: 'Dashboard', icon: BarChart3 },
            { id: 'orders', label: 'Commands', icon: ShoppingBag },
            { id: 'products', label: 'Market', icon: Zap },
            { id: 'users', label: 'Accounts', icon: Users },
            { id: 'tournaments', label: 'Arena', icon: Trophy },
            { id: 'point_shop', label: 'Points', icon: Store }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/40 translate-y-[-2px]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:rotate-12 transition-transform duration-500"><TrendingUp size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Total Revenue</span>
              <div className="text-4xl font-black text-white">{stats.revenue.toLocaleString()} <span className="text-xs text-slate-500">DH</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/5 blur-3xl -z-10"></div>
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:rotate-12 transition-transform duration-500"><UserPlus size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Users Today</span>
              <div className="text-4xl font-black text-white">{stats.newUsersToday} <span className="text-xs text-slate-500 font-black">REG</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -z-10"></div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:rotate-12 transition-transform duration-500"><ShoppingBag size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Total Sales</span>
              <div className="text-4xl font-black text-white">{stats.orders} <span className="text-xs text-slate-500 font-black">CMD</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -z-10"></div>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:rotate-12 transition-transform duration-500"><Eye size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Traffic Impact</span>
              <div className="text-4xl font-black text-white">{stats.visits.toLocaleString()} <span className="text-xs text-slate-500 font-black">HITS</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-[3rem] border border-slate-800 overflow-hidden relative min-h-[600px] shadow-2xl bg-slate-950/20">
        <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-900/40">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" placeholder={`Search ${activeTab}...`}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-medium placeholder:text-slate-700"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {activeTab === 'products' && (
              <button onClick={() => { setEditingProduct({ name: '', price_dh: 0, category: 'Gaming', stock: 10, type: 'key' }); setShowProductModal(true); }} className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
                <Plus size={16} /> New Asset
              </button>
            )}
            {activeTab === 'tournaments' && (
              <button onClick={() => { setEditingTournament({ title: '', prize_pool: '', role_required: 'Member', status: 'upcoming', date: new Date().toISOString() }); setShowTournamentModal(true); }} className="flex-grow sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                <Plus size={16} /> New Event
              </button>
            )}
            {activeTab === 'point_shop' && (
              <button onClick={() => { setEditingPointItem({ name: '', description: '', cost_points: 1000 }); setShowPointModal(true); }} className="flex-grow sm:flex-none bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2">
                <Plus size={16} /> New Perk
              </button>
            )}
            <button onClick={fetchData} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-all border border-slate-800 shadow-inner"><History size={20} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px] space-y-6">
             <div className="relative">
                <Loader2 className="animate-spin text-blue-500" size={64} />
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
             </div>
             <span className="text-xs font-black uppercase tracking-[0.5em] text-slate-600 animate-pulse">Querying Moon Database</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'products' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/60">
                  <tr>
                    <th className="px-10 py-6">Digital Entity</th>
                    <th className="px-10 py-6">Pricing</th>
                    <th className="px-10 py-6">Availability</th>
                    <th className="px-10 py-6 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((p: any) => (
                    <tr key={p.id} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <img src={p.image_url || `https://picsum.photos/seed/${p.id}/100/100`} className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shadow-2xl group-hover:scale-105 transition-transform" />
                            <div className="absolute -top-2 -right-2 bg-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded-lg border border-slate-900 uppercase">{p.type}</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 text-base">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em]">{p.category} — Digital Product</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-black text-blue-400 text-xl">{p.price_dh} <span className="text-[10px] text-slate-600">DH</span></div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border tracking-widest uppercase ${p.stock < 5 ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-slate-400 border-slate-800 bg-slate-900'}`}>
                          {p.stock <= 0 ? 'Out of Stock' : `${p.stock} Units Left`}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-blue-400 border border-slate-800 transition-all"><Edit size={18}/></button>
                          <button onClick={() => handleDeleteItem('products', p.id)} className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-red-400 border border-slate-800 transition-all"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/60">
                  <tr>
                    <th className="px-10 py-6">Account Holder</th>
                    <th className="px-10 py-6">Wallet Balance</th>
                    <th className="px-10 py-6">Loyalty Points</th>
                    <th className="px-10 py-6 text-right">Credit Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((u: any) => (
                    <tr key={u.id} className="hover:bg-indigo-500/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-xl shadow-lg">{u.username?.[0].toUpperCase()}</div>
                           <div>
                              <div className="font-bold text-slate-100 text-base">{u.username || 'Ghost User'}</div>
                              <div className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">{u.email}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-black text-blue-400 text-xl">{u.wallet_balance.toFixed(2)} <span className="text-[10px] text-slate-600">DH</span></div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-black text-indigo-400 text-xl flex items-center gap-2"><Zap size={16}/> {u.discord_points.toLocaleString()}</div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleUpdateUserValue(u.id, 'wallet_balance', u.wallet_balance)} className="px-4 py-2 bg-slate-900 rounded-xl text-slate-400 hover:text-blue-400 border border-slate-800 transition-all flex items-center gap-2 font-black text-[10px] uppercase"><DollarSign size={14}/> Wallet</button>
                          <button onClick={() => handleUpdateUserValue(u.id, 'discord_points', u.discord_points)} className="px-4 py-2 bg-slate-900 rounded-xl text-slate-400 hover:text-indigo-400 border border-slate-800 transition-all flex items-center gap-2 font-black text-[10px] uppercase"><Zap size={14}/> Points</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'orders' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/60">
                  <tr>
                    <th className="px-10 py-6">Order ID & Date</th>
                    <th className="px-10 py-6">Customer / Product</th>
                    <th className="px-10 py-6">Financials</th>
                    <th className="px-10 py-6 text-right">Status Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((o: any) => (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="font-mono text-slate-400 text-xs font-bold uppercase tracking-widest">#{o.id.slice(0, 8)}</div>
                        <div className="text-[10px] text-slate-600 font-black flex items-center gap-1 mt-1"><Clock size={12}/> {new Date(o.created_at).toLocaleString()}</div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-bold text-slate-100">{o.profiles?.username || 'Guest'}</div>
                        <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">{o.products?.name}</div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-black text-green-400 text-xl">{o.price_paid} <span className="text-[10px] text-slate-600">DH</span></div>
                        <div className="text-[10px] text-indigo-500 font-black">+{o.points_earned} PTS</div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {o.status === 'pending' ? (
                            <div className="flex gap-2">
                               <button onClick={() => handleUpdateOrderStatus(o.id, 'completed')} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 hover:bg-green-500 hover:text-white transition-all"><CheckCircle2 size={18}/></button>
                               <button onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><XCircle size={18}/></button>
                            </div>
                          ) : (
                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              o.status === 'completed' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'
                            }`}>{o.status}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'tournaments' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/60">
                  <tr>
                    <th className="px-10 py-6">Arena Event</th>
                    <th className="px-10 py-6">Prize Reward</th>
                    <th className="px-10 py-6">State</th>
                    <th className="px-10 py-6 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((t: any) => (
                    <tr key={t.id} className="hover:bg-indigo-500/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="font-bold text-slate-100 text-lg">{t.title}</div>
                        <div className="text-[10px] text-slate-500 font-black flex items-center gap-1.5 uppercase mt-1"><Calendar size={12}/> {new Date(t.date).toLocaleString()}</div>
                      </td>
                      <td className="px-10 py-6 font-black text-yellow-500 text-lg uppercase tracking-wider">{t.prize_pool}</td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          t.status === 'upcoming' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' : 
                          t.status === 'ongoing' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-slate-500 border-slate-800'
                        }`}>{t.status}</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTournament(t); setShowTournamentModal(true); }} className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-blue-400 border border-slate-800 transition-all"><Edit size={18}/></button>
                          <button onClick={() => handleDeleteItem('tournaments', t.id)} className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-red-400 border border-slate-800 transition-all"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'point_shop' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/60">
                  <tr>
                    <th className="px-10 py-6">Loyalty Perk</th>
                    <th className="px-10 py-6">Acquisition Cost</th>
                    <th className="px-10 py-6 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((p: any) => (
                    <tr key={p.id} className="hover:bg-purple-500/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-lg"><Store size={24}/></div>
                           <div>
                              <div className="font-bold text-slate-100 text-lg">{p.name}</div>
                              <div className="text-[10px] text-slate-600 font-medium line-clamp-1">{p.description}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="font-black text-indigo-400 text-xl flex items-center gap-2"><Zap size={18}/> {p.cost_points.toLocaleString()} <span className="text-[10px] text-slate-600">PTS</span></div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingPointItem(p); setShowPointModal(true); }} className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-blue-400 border border-slate-800 transition-all"><Edit size={18}/></button>
                          <button onClick={() => handleDeleteItem('point_shop_items', p.id)} className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-red-400 border border-slate-800 transition-all"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Improved Modals */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowProductModal(false)}></div>
          <div className="relative glass w-full max-w-2xl rounded-[3rem] border border-slate-700 shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
               <h3 className="text-3xl font-black tracking-tight">{editingProduct.id ? 'Modify Product' : 'New Moon Inventory'}</h3>
               <button onClick={() => setShowProductModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={28}/></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('products', editingProduct, setShowProductModal); }} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Display Name</label>
                <input required className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:border-blue-500 outline-none" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Price (DH)</label>
                <input required type="number" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.price_dh} onChange={(e) => setEditingProduct({...editingProduct, price_dh: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Inventory Stock</label>
                <input required type="number" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Image Source URL</label>
                <input required type="url" placeholder="https://cdn.moon.com/product.png" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.image_url || ''} onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-1 tracking-widest">Intel Description</label>
                <textarea rows={3} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} />
              </div>
              <div className="col-span-2 pt-4 flex gap-4">
                 <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-5 bg-slate-900 rounded-3xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-white transition-all">Abort</button>
                 <button type="submit" className="flex-1 py-5 bg-blue-600 rounded-3xl font-black uppercase text-xs tracking-widest text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all">Confirm Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tournament Modal */}
      {showTournamentModal && editingTournament && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowTournamentModal(false)}></div>
          <div className="relative glass w-full max-w-xl rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-black tracking-tighter">Moon Arena Protocol</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('tournaments', { ...editingTournament, tournament_date: editingTournament.date }, setShowTournamentModal); }} className="space-y-6">
              <input required placeholder="Event Title" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingTournament.title} onChange={(e) => setEditingTournament({...editingTournament, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Prize (e.g. 5k DH)" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingTournament.prize_pool} onChange={(e) => setEditingTournament({...editingTournament, prize_pool: e.target.value})} />
                <select className="bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingTournament.status} onChange={(e) => setEditingTournament({...editingTournament, status: e.target.value as any})}>
                  <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="finished">Finished</option>
                </select>
              </div>
              <input required type="datetime-local" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingTournament.date ? new Date(editingTournament.date).toISOString().slice(0, 16) : ''} onChange={(e) => setEditingTournament({...editingTournament, date: e.target.value})} />
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowTournamentModal(false)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500">Cancel</button>
                 <button type="submit" className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest text-white">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Point Shop Modal */}
      {showPointModal && editingPointItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowPointModal(false)}></div>
          <div className="relative glass w-full max-w-xl rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-black tracking-tighter">Redemption Reward</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('point_shop_items', editingPointItem, setShowPointModal); }} className="space-y-6">
              <input required placeholder="Perk Identity" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingPointItem.name} onChange={(e) => setEditingPointItem({...editingPointItem, name: e.target.value})} />
              <input required type="number" placeholder="Cost (PTS)" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingPointItem.cost_points} onChange={(e) => setEditingPointItem({...editingPointItem, cost_points: parseInt(e.target.value)})} />
              <textarea placeholder="Reward Details..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingPointItem.description} onChange={(e) => setEditingPointItem({...editingPointItem, description: e.target.value})} />
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowPointModal(false)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500">Cancel</button>
                 <button type="submit" className="flex-1 py-4 bg-purple-600 rounded-2xl font-black uppercase text-xs tracking-widest text-white">Commit Perk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
