
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  PackageX,
  Info,
  Settings,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Gift,
  Star,
  Type
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Order, Tournament, PointShopItem, OrderStatus } from '../types';

type AdminTab = 'overview' | 'orders' | 'products' | 'users' | 'tournaments' | 'point_shop';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isInitializing, setIsInitializing] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [editingPointItem, setEditingPointItem] = useState<PointShopItem | null>(null);
  const [pointItemForm, setPointItemForm] = useState({
    name: '',
    description: '',
    cost_points: 1000,
    image_url: ''
  });

  // Filtering states for products
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStock, setFilterStock] = useState<'All' | 'In Stock' | 'Out of Stock'>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const navigate = useNavigate();
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pointItems, setPointItems] = useState<PointShopItem[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, totalUsers: 0, newUsersToday: 0 });

  // Specialized fetchers
  const fetchOverview = useCallback(async () => {
    const { data: revData } = await supabase.from('orders').select('price_paid').eq('status', 'completed');
    const totalRevenue = revData?.reduce((acc, curr) => acc + (Number(curr.price_paid) || 0), 0) || 0;
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    setStats({
      revenue: totalRevenue,
      orders: orderCount || 0,
      totalUsers: userCount || 0,
      newUsersToday: 0
    });
  }, []);

  const fetchProductsData = useCallback(async () => {
    const { data, error: err } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (err) throw err;
    setProducts(data || []);
  }, []);

  const fetchUsersData = useCallback(async () => {
    const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (err) throw err;
    setUsers(data || []);
  }, []);

  const fetchOrdersData = useCallback(async () => {
    const { data, error: err } = await supabase.from('orders').select('*, profiles(username, email), products(name)').order('created_at', { ascending: false });
    if (err) throw err;
    setOrders(data || []);
  }, []);

  const fetchTournamentsData = useCallback(async () => {
    const { data, error: err } = await supabase.from('tournaments').select('*').order('tournament_date', { ascending: true });
    if (err) throw err;
    setTournaments((data || []).map(t => ({ ...t, date: t.tournament_date })));
  }, []);

  const fetchPointShopData = useCallback(async () => {
    const { data, error: err } = await supabase.from('point_shop_items').select('*').order('cost_points', { ascending: true });
    if (err) throw err;
    setPointItems(data || []);
  }, []);

  const fetchData = useCallback(async (tab: AdminTab) => {
    setTabLoading(true);
    setError(null);
    try {
      // Connection check only on initial load or if explicitly asked, but here we just try the fetch
      switch(tab) {
        case 'overview': await fetchOverview(); break;
        case 'products': await fetchProductsData(); break;
        case 'users': await fetchUsersData(); break;
        case 'orders': await fetchOrdersData(); break;
        case 'tournaments': await fetchTournamentsData(); break;
        case 'point_shop': await fetchPointShopData(); break;
      }
    } catch (err: any) {
      console.error(`Admin data fetch error [${tab}]:`, err);
      setError(err);
    } finally {
      setTabLoading(false);
      setIsInitializing(false);
    }
  }, [fetchOverview, fetchProductsData, fetchUsersData, fetchOrdersData, fetchTournamentsData, fetchPointShopData]);

  // Auth Check and Initial Load
  useEffect(() => {
    const isAuth = sessionStorage.getItem('is_admin_auth');
    if (isAuth !== 'true') {
      navigate('/');
      return;
    }
    fetchData(activeTab);
  }, [activeTab, fetchData, navigate]);

  const filteredProducts = () => {
    const q = searchQuery.toLowerCase();
    return products.filter(p => {
      const matchesQuery = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchesType = filterType === 'All' || p.type === filterType.toLowerCase();
      const matchesStock = filterStock === 'All' || (filterStock === 'In Stock' ? p.stock > 0 : p.stock === 0);
      const matchesMinPrice = minPrice === '' || p.price_dh >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === '' || p.price_dh <= parseFloat(maxPrice);
      return matchesQuery && matchesType && matchesStock && matchesMinPrice && matchesMaxPrice;
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('is_admin_auth');
    navigate('/');
  };

  // Point Shop Management Functions
  const openPointModal = (item?: PointShopItem) => {
    if (item) {
      setEditingPointItem(item);
      setPointItemForm({
        name: item.name,
        description: item.description,
        cost_points: item.cost_points,
        image_url: item.image_url || ''
      });
    } else {
      setEditingPointItem(null);
      setPointItemForm({
        name: '',
        description: '',
        cost_points: 1000,
        image_url: ''
      });
    }
    setIsPointModalOpen(true);
  };

  const savePointItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setTabLoading(true);
    try {
      if (editingPointItem) {
        const { error } = await supabase
          .from('point_shop_items')
          .update(pointItemForm)
          .eq('id', editingPointItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('point_shop_items')
          .insert(pointItemForm);
        if (error) throw error;
      }
      setIsPointModalOpen(false);
      fetchData('point_shop');
    } catch (err: any) {
      alert("Error saving perk: " + err.message);
    } finally {
      setTabLoading(false);
    }
  };

  const deletePointItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this reward from the Point Shop?")) return;
    setTabLoading(true);
    try {
      const { error } = await supabase
        .from('point_shop_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData('point_shop');
    } catch (err: any) {
      alert("Error deleting perk: " + err.message);
    } finally {
      setTabLoading(false);
    }
  };

  // Dedicated Error UI for Invalid API Key
  if (error && isInitializing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="glass max-w-2xl w-full rounded-[3rem] border border-red-500/20 p-10 md:p-12 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Database Sync Error</h2>
            <p className="text-slate-400 font-medium">We couldn't establish a secure connection to the Moon Night database.</p>
          </div>

          <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings size={16} className="text-blue-400" /> Possible Cause: Invalid API Key
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The Supabase API key provided in <code className="text-blue-400">lib/supabase.ts</code> is either incorrect or has expired. This prevents the admin panel from fetching or saving any data.
            </p>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 font-mono text-[10px] text-red-400 break-all">
              Error: {error.message || 'Unauthorized / Invalid JWT'}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => fetchData(activeTab)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30">
              <RefreshCw size={16} /> Retry Connection
            </button>
            <button onClick={() => navigate('/')} className="px-8 py-4 bg-slate-900 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-800 transition-all">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-500" size={64} />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse"></div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Initializing Admin Access...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" /> Moon Admin Portal
          </h1>
          <p className="text-slate-500 font-medium text-sm pl-1 uppercase tracking-widest text-[10px]">Security Tier: Elite Authorized</p>
        </div>
        <div className="flex items-center gap-3">
          {tabLoading && (
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl animate-pulse">
                <Loader2 size={14} className="animate-spin text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Updating...</span>
             </div>
          )}
          <button onClick={handleLogout} className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
            Exit Dashboard
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/50 rounded-2xl border border-slate-800 w-fit">
        {(['overview', 'orders', 'products', 'users', 'tournaments', 'point_shop'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            disabled={tabLoading}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-500 hover:text-slate-300 disabled:opacity-50'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className={`glass rounded-[2.5rem] p-8 md:p-10 border border-slate-800 min-h-[500px] shadow-2xl relative transition-opacity duration-300 ${tabLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Localized loading overlay for specific tab updates */}
        {tabLoading && !isInitializing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] rounded-[2.5rem]">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-[2rem] bg-slate-950/50 border border-slate-800 space-y-4 hover:border-blue-500/30 transition-all group">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"><DollarSign size={28}/></div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Revenue</p>
                <h3 className="text-3xl font-black text-white">{stats.revenue.toFixed(2)} <span className="text-xs text-slate-600">DH</span></h3>
              </div>
            </div>
            <div className="p-8 rounded-[2rem] bg-slate-950/50 border border-slate-800 space-y-4 hover:border-blue-500/30 transition-all group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><ShoppingBag size={28}/></div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Orders</p>
                <h3 className="text-3xl font-black text-white">{stats.orders}</h3>
              </div>
            </div>
            <div className="p-8 rounded-[2rem] bg-slate-950/50 border border-slate-800 space-y-4 hover:border-blue-500/30 transition-all group">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform"><Users size={28}/></div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">User Base</p>
                <h3 className="text-3xl font-black text-white">{stats.totalUsers}</h3>
              </div>
            </div>
            <div className="p-8 rounded-[2rem] bg-slate-950/50 border border-slate-800 space-y-4 hover:border-blue-500/30 transition-all group">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform"><Zap size={28}/></div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Moon Activity</p>
                <h3 className="text-3xl font-black text-white">{(stats.orders * 2.4).toFixed(0)} <span className="text-xs text-slate-600">Visits</span></h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text" 
                  placeholder="Search inventory..." 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                 <select className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Account">Accounts</option>
                    <option value="Key">Keys</option>
                    <option value="Service">Services</option>
                 </select>
                 <select className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none" value={filterStock} onChange={(e) => setFilterStock(e.target.value as any)}>
                    <option value="All">All Stock</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Sold Out</option>
                 </select>
                 <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/20">
                    <Plus size={16}/> Add Inventory
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Product Info</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Category</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Pricing</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Availability</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredProducts().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <p className="text-slate-500 font-medium italic">No matching inventory found.</p>
                      </td>
                    </tr>
                  ) : filteredProducts().map(p => (
                    <tr key={p.id} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <img src={p.image_url || `https://picsum.photos/seed/${p.id}/100/100`} className="w-12 h-12 rounded-xl object-cover border border-slate-800" alt={p.name} />
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{p.type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-full">{p.category}</span>
                      </td>
                      <td className="py-5 px-6 font-black text-white">{p.price_dh} DH</td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                           <span className={`text-[10px] font-black uppercase ${p.stock > 0 ? 'text-slate-400' : 'text-red-500'}`}>
                             {p.stock > 0 ? `${p.stock} Units` : 'Sold Out'}
                           </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-blue-400 border border-slate-800"><Edit size={16}/></button>
                          <button className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-red-400 border border-slate-800"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-black flex items-center gap-2"><Users size={24} className="text-indigo-400"/> Moon Community</h2>
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {users.length} Total Registered
                </div>
             </div>
             <div className="overflow-x-auto rounded-3xl border border-slate-800">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-900/50">
                   <tr>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">User Details</th>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Wallet Balance</th>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Reward Points</th>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Account Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                   {users.map(u => (
                     <tr key={u.id} className="hover:bg-indigo-500/5 transition-colors group">
                       <td className="py-5 px-6">
                         <div className="flex flex-col">
                           <span className="font-bold text-white text-sm">{u.username}</span>
                           <span className="text-[10px] text-slate-500 font-medium">{u.email}</span>
                         </div>
                       </td>
                       <td className="py-5 px-6 font-black text-sm text-blue-400">{u.wallet_balance.toFixed(2)} DH</td>
                       <td className="py-5 px-6 font-black text-sm text-indigo-400">{u.discord_points.toLocaleString()}</td>
                       <td className="py-5 px-6">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                           {u.role}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
             <h2 className="text-xl font-black flex items-center gap-2"><ShoppingBag size={24} className="text-green-400"/> Order Management</h2>
             <div className="overflow-x-auto rounded-3xl border border-slate-800">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-900/50">
                   <tr>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Order ID</th>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Customer</th>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Product</th>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount Paid</th>
                     <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Log Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                   {orders.length === 0 ? (
                     <tr><td colSpan={5} className="py-20 text-center text-slate-600 font-medium italic">No orders processed yet.</td></tr>
                   ) : orders.map(o => (
                     <tr key={o.id} className="hover:bg-white/5 transition-colors">
                       <td className="py-5 px-6 font-mono text-[10px] text-slate-500 uppercase">#{o.id.split('-')[0]}</td>
                       <td className="py-5 px-6 font-bold text-xs text-white">{o.profiles?.username}</td>
                       <td className="py-5 px-6 text-xs text-slate-400">{o.products?.name}</td>
                       <td className="py-5 px-6 font-black text-xs text-green-400">{o.price_paid} DH</td>
                       <td className="py-5 px-6">
                         <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                           {o.status}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'point_shop' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2 text-indigo-400"><Gift size={24}/> Reward Inventory</h2>
              <button 
                onClick={() => openPointModal()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all"
              >
                <Plus size={16}/> New Reward Perk
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Perk Details</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Point Cost</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Short Description</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {pointItems.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-600 font-medium italic">The rewards pool is currently empty.</td></tr>
                  ) : pointItems.map(item => (
                    <tr key={item.id} className="hover:bg-indigo-500/5 transition-colors group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                              <Gift size={20} className="text-indigo-400" />
                            )}
                          </div>
                          <span className="font-bold text-white text-sm">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Star size={14} className="fill-indigo-400" />
                          <span className="font-black text-sm">{item.cost_points.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-xs text-slate-500 max-w-xs truncate">{item.description}</td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openPointModal(item)} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-indigo-400 border border-slate-800"><Edit size={16}/></button>
                          <button onClick={() => deletePointItem(item.id)} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-red-400 border border-slate-800"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="flex flex-col items-center justify-center py-32 opacity-30 space-y-6">
            <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
              <Clock size={48} />
            </div>
            <div className="text-center space-y-2">
              <p className="font-black text-sm uppercase tracking-[0.3em]">Module Locked</p>
              <p className="text-xs font-medium italic">Management portal for {activeTab.replace('_', ' ')} is under construction.</p>
            </div>
          </div>
        )}
      </div>

      {/* Point Shop Item Modal */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPointModalOpen(false)}></div>
          <form 
            onSubmit={savePointItem}
            className="relative glass max-w-lg w-full rounded-[2.5rem] border border-slate-700 p-8 md:p-10 space-y-8 animate-in zoom-in-95 duration-300"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Gift className="text-indigo-400" /> {editingPointItem ? 'Edit Reward Perk' : 'Create New Perk'}
              </h3>
              <button type="button" onClick={() => setIsPointModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Reward Name</label>
                <div className="relative group">
                   <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                   <input 
                     required
                     type="text" 
                     placeholder="e.g., $10 Wallet Credit" 
                     className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 transition-all text-white font-medium"
                     value={pointItemForm.name}
                     onChange={(e) => setPointItemForm({...pointItemForm, name: e.target.value})}
                   />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Description</label>
                <textarea 
                  required
                  placeholder="Tell users what they get..." 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-indigo-500/50 transition-all text-white font-medium min-h-[100px]"
                  value={pointItemForm.description}
                  onChange={(e) => setPointItemForm({...pointItemForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Point Cost</label>
                    <div className="relative">
                       <input 
                         required
                         type="number" 
                         min="100"
                         className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-indigo-500/50 transition-all text-white font-black"
                         value={pointItemForm.cost_points}
                         onChange={(e) => setPointItemForm({...pointItemForm, cost_points: parseInt(e.target.value)})}
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">PTS</span>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase px-2 tracking-widest">Icon URL (Optional)</label>
                    <div className="relative">
                       <input 
                         type="url" 
                         placeholder="https://..." 
                         className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-indigo-500/50 transition-all text-white font-medium text-xs"
                         value={pointItemForm.image_url}
                         onChange={(e) => setPointItemForm({...pointItemForm, image_url: e.target.value})}
                       />
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit"
                disabled={tabLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group"
              >
                {tabLoading ? <Loader2 size={18} className="animate-spin" /> : editingPointItem ? 'Update Reward' : 'Publish Reward'}
              </button>
              <button 
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="px-8 py-4 bg-slate-900 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
