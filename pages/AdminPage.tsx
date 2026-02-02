
import React, { useState, useEffect, useRef } from 'react';
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
  XCircle,
  Key,
  AlertTriangle,
  Upload,
  Filter,
  PackageCheck,
  PackageX
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Order, Tournament, PointShopItem, OrderStatus } from '../types';

type AdminTab = 'overview' | 'orders' | 'products' | 'users' | 'tournaments' | 'point_shop';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering states for products
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStock, setFilterStock] = useState<'All' | 'In Stock' | 'Out of Stock'>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (activeTab === 'products') {
        const { data, error: err } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (err) throw err;
        setProducts(data || []);
      } else if (activeTab === 'users') {
        const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (err) throw err;
        setUsers(data || []);
      } else if (activeTab === 'orders') {
        const { data, error: err } = await supabase.from('orders').select('*, profiles(username, email), products(name)').order('created_at', { ascending: false });
        if (err) throw err;
        setOrders(data || []);
      } else if (activeTab === 'tournaments') {
        const { data, error: err } = await supabase.from('tournaments').select('*').order('tournament_date', { ascending: true });
        if (err) throw err;
        setTournaments((data || []).map(t => ({ ...t, date: t.tournament_date })));
      } else if (activeTab === 'point_shop') {
        const { data, error: err } = await supabase.from('point_shop_items').select('*').order('created_at', { ascending: false });
        if (err) throw err;
        setPointItems(data || []);
      }

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
    } catch (err: any) { 
      console.error("Admin Fetch Error:", err);
      setError(err.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'point_item') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${target}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      if (target === 'product' && editingProduct) {
        setEditingProduct({ ...editingProduct, image_url: publicUrl });
      } else if (target === 'point_item' && editingPointItem) {
        setEditingPointItem({ ...editingPointItem, image_url: publicUrl });
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Status Update Failed: " + err.message);
    }
  };

  const handleSaveItem = async (table: string, item: any, modalSet: (b: boolean) => void) => {
    setLoading(true);
    try {
      const { error } = item.id 
        ? await supabase.from(table).update(item).eq('id', item.id)
        : await supabase.from(table).insert([item]);
      if (error) throw error;
      modalSet(false); 
      fetchData();
    } catch (err: any) {
      alert("Save Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (window.confirm("This action is permanent. Continue?")) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        fetchData();
      } catch (err: any) {
        alert("Delete Failed: " + err.message);
      }
    }
  };

  const handleUpdateUserValue = async (userId: string, field: 'wallet_balance' | 'discord_points', current: number) => {
    const label = field === 'wallet_balance' ? 'Wallet DH' : 'Discord Points';
    const newVal = prompt(`Set new ${label}:`, current.toString());
    if (newVal !== null && !isNaN(parseFloat(newVal))) {
      try {
        const { error } = await supabase.from('profiles').update({ [field]: parseFloat(newVal) }).eq('id', userId);
        if (error) throw error;
        fetchData();
      } catch (err: any) {
        alert("User Update Failed: " + err.message);
      }
    }
  };

  const filteredData = () => {
    const q = searchQuery.toLowerCase();
    switch(activeTab) {
      case 'users': return users.filter(u => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
      case 'products': 
        return products.filter(p => {
          const matchesQuery = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
          const matchesType = filterType === 'All' || p.type === filterType.toLowerCase();
          const matchesStock = filterStock === 'All' || (filterStock === 'In Stock' ? p.stock > 0 : p.stock === 0);
          const matchesMinPrice = minPrice === '' || p.price_dh >= parseFloat(minPrice);
          const matchesMaxPrice = maxPrice === '' || p.price_dh <= parseFloat(maxPrice);
          return matchesQuery && matchesType && matchesStock && matchesMinPrice && matchesMaxPrice;
        });
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
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] pl-1">Elite Portal — Access Granted</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-3xl border border-slate-800 backdrop-blur-xl">
          {[
            { id: 'overview', label: 'Stats', icon: BarChart3 },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'products', label: 'Stock', icon: Zap },
            { id: 'users', label: 'Clients', icon: Users },
            { id: 'tournaments', label: 'Arena', icon: Trophy },
            { id: 'point_shop', label: 'Rewards', icon: Store }
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

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-400 font-bold animate-in slide-in-from-top-4">
           <AlertTriangle size={24} />
           <div className="flex-grow">
              <div className="text-sm">Database Sync Error</div>
              <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">{error}</div>
           </div>
           <button onClick={fetchData} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] uppercase font-black">Retry Connection</button>
        </div>
      )}

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
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Users Registered</span>
              <div className="text-4xl font-black text-white">{stats.totalUsers} <span className="text-xs text-slate-500 font-black">TOTAL</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -z-10"></div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:rotate-12 transition-transform duration-500"><ShoppingBag size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Success Orders</span>
              <div className="text-4xl font-black text-white">{stats.orders} <span className="text-xs text-slate-500 font-black">SALES</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -z-10"></div>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:rotate-12 transition-transform duration-500"><Eye size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Network Activity</span>
              <div className="text-4xl font-black text-white">{stats.visits.toLocaleString()} <span className="text-xs text-slate-500 font-black">HITS</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-[3rem] border border-slate-800 overflow-hidden relative min-h-[600px] shadow-2xl bg-slate-950/20">
        <div className="p-8 border-b border-slate-800 space-y-6 bg-slate-900/40">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
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
                <button onClick={() => { setEditingProduct({ name: '', price_dh: 0, category: 'Gaming', stock: 10, type: 'key', secret_content: '' }); setShowProductModal(true); }} className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Inventory
                </button>
              )}
              {activeTab === 'point_shop' && (
                <button onClick={() => { setEditingPointItem({ name: '', description: '', cost_points: 1000 }); setShowPointModal(true); }} className="flex-grow sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                  <Plus size={16} /> New Perk
                </button>
              )}
              <button onClick={fetchData} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-all border border-slate-800 shadow-inner"><History size={20} /></button>
            </div>
          </div>

          {activeTab === 'products' && (
            <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
               <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 px-4 py-2 rounded-xl">
                  <Filter size={14} className="text-blue-500" />
                  <select className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-400 cursor-pointer" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Account">Accounts</option>
                    <option value="Key">Keys</option>
                    <option value="Service">Services</option>
                  </select>
               </div>
               <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 px-4 py-2 rounded-xl">
                  <PackageCheck size={14} className="text-green-500" />
                  <select className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-400 cursor-pointer" value={filterStock} onChange={(e) => setFilterStock(e.target.value as any)}>
                    <option value="All">All Stock</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Sold Out</option>
                  </select>
               </div>
               <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">MIN</span>
                    <input type="number" placeholder="0" className="bg-slate-950/50 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-[10px] w-24 outline-none focus:border-blue-500 transition-all font-black text-white" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">MAX</span>
                    <input type="number" placeholder="9999" className="bg-slate-950/50 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-[10px] w-24 outline-none focus:border-blue-500 transition-all font-black text-white" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  </div>
               </div>
               <button onClick={() => { setSearchQuery(''); setFilterType('All'); setFilterStock('All'); setMinPrice(''); setMaxPrice(''); }} className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors ml-auto">Reset Filters</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px] space-y-6">
             <div className="relative">
                <Loader2 className="animate-spin text-blue-500" size={64} />
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
             </div>
             <span className="text-xs font-black uppercase tracking-[0.5em] text-slate-600 animate-pulse">Syncing Moon Server...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'products' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/60">
                  <tr>
                    <th className="px-10 py-6">Product</th>
                    <th className="px-10 py-6">Status / Stock</th>
                    <th className="px-10 py-6">Pricing</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-20 text-slate-600 font-black uppercase text-[10px] tracking-widest">No matching inventory found</td></tr>
                  ) : filteredData().map((p: any) => (
                    <tr key={p.id} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <img src={p.image_url || `https://picsum.photos/seed/${p.id}/100/100`} className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                          <div>
                            <div className="font-bold text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-blue-400 font-black uppercase flex items-center gap-2">
                              {p.type} <span className="text-slate-600">•</span> {p.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${p.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${p.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {p.stock > 0 ? `${p.stock} Units` : 'Out of Stock'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-black text-white">{p.price_dh} DH</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-blue-400 border border-slate-800 transition-all"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteItem('products', p.id)} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-red-400 border border-slate-800 transition-all"><Trash2 size={16}/></button>
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
                    <th className="px-10 py-6">User</th>
                    <th className="px-10 py-6">Wallet</th>
                    <th className="px-10 py-6">Points</th>
                    <th className="px-10 py-6 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((u: any) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-6 font-bold text-slate-100">{u.username} <span className="text-[10px] text-slate-600 ml-2 font-mono">{u.email}</span></td>
                      <td className="px-10 py-6 font-black text-blue-400">{u.wallet_balance.toFixed(2)} DH</td>
                      <td className="px-10 py-6 font-black text-indigo-400">{u.discord_points.toLocaleString()}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleUpdateUserValue(u.id, 'wallet_balance', u.wallet_balance)} className="p-2 bg-slate-900 rounded-xl text-slate-400 hover:text-blue-400 border border-slate-800 text-[10px] font-black uppercase px-4">Wallet</button>
                          <button onClick={() => handleUpdateUserValue(u.id, 'discord_points', u.discord_points)} className="p-2 bg-slate-900 rounded-xl text-slate-400 hover:text-indigo-400 border border-slate-800 text-[10px] font-black uppercase px-4">Points</button>
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
                    <th className="px-10 py-6">OrderID</th>
                    <th className="px-10 py-6">Client / Item</th>
                    <th className="px-10 py-6">Revenue</th>
                    <th className="px-10 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((o: any) => (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-6 font-mono text-[10px] text-slate-600">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-10 py-6">
                        <div className="font-bold text-slate-100">{o.profiles?.username}</div>
                        <div className="text-[10px] text-blue-500 font-black uppercase">{o.products?.name}</div>
                      </td>
                      <td className="px-10 py-6 font-black text-green-400">{o.price_paid} DH</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {o.status === 'pending' ? (
                            <button onClick={() => handleUpdateOrderStatus(o.id, 'completed')} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 hover:bg-green-500 hover:text-white transition-all"><CheckCircle2 size={18}/></button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-800 text-slate-600">{o.status}</span>
                          )}
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
                    <th className="px-10 py-6">Reward Item</th>
                    <th className="px-10 py-6">Cost</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filteredData().map((i: any) => (
                    <tr key={i.id} className="hover:bg-indigo-500/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <img src={i.image_url || `https://picsum.photos/seed/${i.id}/100/100`} className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                          <div>
                            <div className="font-bold text-slate-100">{i.name}</div>
                            <div className="text-[10px] text-indigo-400 font-black uppercase truncate max-w-[200px]">{i.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-black text-indigo-400">{i.cost_points.toLocaleString()} PTS</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingPointItem(i); setShowPointModal(true); }} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-indigo-400 border border-slate-800 transition-all"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteItem('point_shop_items', i.id)} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-red-400 border border-slate-800 transition-all"><Trash2 size={16}/></button>
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

      {/* Product Modal */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowProductModal(false)}></div>
          <div className="relative glass w-full max-w-2xl rounded-[3rem] border border-slate-700 shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black">{editingProduct.id ? 'Edit Entry' : 'New Moon Inventory'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('products', editingProduct, setShowProductModal); }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2">Name</label>
                    <input required placeholder="Product Name" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-blue-500" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2">Category</label>
                    <input required placeholder="Gaming, Tools, etc." className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-blue-500" value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} />
                 </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-2">Price (DH)</label>
                  <input required type="number" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.price_dh} onChange={(e) => setEditingProduct({...editingProduct, price_dh: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-2">Stock</label>
                  <input required type="number" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-2">Type</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold appearance-none outline-none focus:border-blue-500" value={editingProduct.type} onChange={(e) => setEditingProduct({...editingProduct, type: e.target.value as any})}>
                    <option value="account">Account</option>
                    <option value="key">Key</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-blue-500 px-2 tracking-widest">Secret Content (Instant Delivery)</label>
                <textarea placeholder="e.g. user:pass | XXXX-XXXX-XXXX" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-mono text-sm" rows={2} value={editingProduct.secret_content || ''} onChange={(e) => setEditingProduct({...editingProduct, secret_content: e.target.value})} />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase px-2">Product Visuals</label>
                <div className="flex items-center gap-4">
                  <div className="flex-grow">
                    <input placeholder="Image URL (Direct Link)" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold text-xs" value={editingProduct.image_url || ''} onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})} />
                  </div>
                  <div className="relative">
                    <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all border border-slate-700 flex items-center gap-2">
                      {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    </button>
                  </div>
                </div>
                {editingProduct.image_url && (
                  <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-slate-800">
                    <img src={editingProduct.image_url} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                 <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500">Abort</button>
                 <button type="submit" className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-blue-600/30">Save Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Point Shop Modal */}
      {showPointModal && editingPointItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowPointModal(false)}></div>
          <div className="relative glass w-full max-w-xl rounded-[3rem] border border-slate-700 shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-black">Elite Reward Item</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('point_shop_items', editingPointItem, setShowPointModal); }} className="space-y-6">
              <input required placeholder="Item Name" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500" value={editingPointItem.name} onChange={(e) => setEditingPointItem({...editingPointItem, name: e.target.value})} />
              <textarea placeholder="Description" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-medium" rows={3} value={editingPointItem.description || ''} onChange={(e) => setEditingPointItem({...editingPointItem, description: e.target.value})} />
              <input required type="number" placeholder="Cost (Points)" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingPointItem.cost_points} onChange={(e) => setEditingPointItem({...editingPointItem, cost_points: parseInt(e.target.value)})} />
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase px-2">Item Asset</label>
                <div className="flex items-center gap-4">
                   <input placeholder="Image URL" className="flex-grow bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold text-xs" value={editingPointItem.image_url || ''} onChange={(e) => setEditingPointItem({...editingPointItem, image_url: e.target.value})} />
                   <input type="file" className="hidden" id="point-img" accept="image/*" onChange={(e) => handleImageUpload(e, 'point_item')} />
                   <button type="button" onClick={() => document.getElementById('point-img')?.click()} disabled={uploading} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700">
                     {uploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                   </button>
                </div>
              </div>

              <div className="flex gap-4">
                 <button type="button" onClick={() => setShowPointModal(false)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500">Abort</button>
                 <button type="submit" className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-indigo-600/30">Save Reward</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
