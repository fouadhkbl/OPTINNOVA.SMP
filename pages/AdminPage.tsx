
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Trophy, 
  Search, 
  Settings, 
  Edit, 
  Trash2, 
  Plus, 
  Zap, 
  ArrowUpRight, 
  BarChart3, 
  UserPlus, 
  Eye,
  History,
  X,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Order, Tournament } from '../types';

type AdminTab = 'overview' | 'orders' | 'products' | 'users' | 'tournaments' | 'audit';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, totalUsers: 0, newUsersToday: 0, visits: 1240 });

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Tab Specific Data
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
        if (data) setTournaments(data);
      } else if (activeTab === 'audit') {
        const { data } = await supabase.from('wallet_history').select('*, profiles(username)').order('created_at', { ascending: false });
        if (data) setAuditLogs(data);
      }

      // Overview Stats (always fetch some basics for overview)
      const { data: revData } = await supabase.from('orders').select('price_paid').eq('status', 'completed');
      const totalRev = revData?.reduce((acc, curr) => acc + curr.price_paid, 0) || 0;
      
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // Real "Users Today" count
      const { count: newToday } = await supabase.from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      
      setStats({ 
        revenue: totalRev, 
        orders: orderCount || 0, 
        totalUsers: userCount || 0, 
        newUsersToday: newToday || 0,
        visits: 1240 + Math.floor(Math.random() * 50) // Simulating visits since we don't have a tracker yet
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setLoading(true);
    const { error } = editingProduct.id 
      ? await supabase.from('products').update(editingProduct).eq('id', editingProduct.id)
      : await supabase.from('products').insert([editingProduct]);

    if (error) alert(error.message);
    else {
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  const handleUpdateUserValue = async (userId: string, field: 'wallet_balance' | 'discord_points', current: number) => {
    const label = field === 'wallet_balance' ? 'Wallet Balance (DH)' : 'Discord Points';
    const newVal = prompt(`Enter new ${label} for user:`, current.toString());
    if (newVal !== null && !isNaN(parseFloat(newVal))) {
      const { error } = await supabase.from('profiles').update({ [field]: parseFloat(newVal) }).eq('id', userId);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" size={32} /> Command <span className="text-slate-500">Center</span>
          </h1>
          <p className="text-slate-500 font-medium">Full administration control over Moon Night.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'overview', label: 'Stats', icon: BarChart3 },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'products', label: 'Inventory', icon: Zap },
            { id: 'users', label: 'Accounts', icon: Users },
            { id: 'tournaments', label: 'Arena', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass p-8 rounded-[2rem] border border-slate-800 space-y-4 relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <BarChart3 size={24} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block">Total Revenue</span>
              <div className="text-3xl font-black text-white mt-1">{stats.revenue.toLocaleString()} <span className="text-xs text-slate-500">DH</span></div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2rem] border border-slate-800 space-y-4 relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-600/5 blur-3xl -z-10 group-hover:bg-green-600/10 transition-colors"></div>
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <UserPlus size={24} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block">New Today</span>
              <div className="text-3xl font-black text-white mt-1">{stats.newUsersToday} <span className="text-xs text-slate-500">USERS</span></div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2rem] border border-slate-800 space-y-4 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-3xl -z-10 group-hover:bg-indigo-600/10 transition-colors"></div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ShoppingBag size={24} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block">Total Orders</span>
              <div className="text-3xl font-black text-white mt-1">{stats.orders} <span className="text-xs text-slate-500">DEALS</span></div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2rem] border border-slate-800 space-y-4 relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 blur-3xl -z-10 group-hover:bg-purple-600/10 transition-colors"></div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Eye size={24} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block">Page Visits</span>
              <div className="text-3xl font-black text-white mt-1">{stats.visits.toLocaleString()} <span className="text-xs text-slate-500">VIEWS</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-[2.5rem] border border-slate-800 overflow-hidden min-h-[500px] relative">
        {/* Sub-Header Actions */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {activeTab === 'products' && (
              <button 
                onClick={() => { setEditingProduct({ name: '', price_dh: 0, category: 'Gaming', stock: 10, type: 'key' }); setShowProductModal(true); }}
                className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Product
              </button>
            )}
            <button onClick={fetchData} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
              <History size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className="text-xs text-slate-600 font-black uppercase tracking-[0.2em]">Synchronizing Data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'products' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="px-6 py-5">Product Info</th>
                    <th className="px-6 py-5">Category</th>
                    <th className="px-6 py-5">Pricing</th>
                    <th className="px-6 py-5">Stock</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image_url || `https://picsum.photos/seed/${p.id}/50/50`} className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
                          <div>
                            <div className="font-bold text-slate-200">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-black uppercase">{p.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">{p.category}</td>
                      <td className="px-6 py-4 font-black text-blue-400">{p.price_dh} DH</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${p.stock < 5 ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-400 border-slate-700'}`}>
                          {p.stock} Units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-all"><Edit size={14}/></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-all"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="px-6 py-5">User</th>
                    <th className="px-6 py-5">Wallet</th>
                    <th className="px-6 py-5">Discord Points</th>
                    <th className="px-6 py-5">Role</th>
                    <th className="px-6 py-5 text-right">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-black text-blue-500 text-xs">
                            {u.username?.[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200">{u.username}</div>
                            <div className="text-[10px] text-slate-600">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-white">{u.wallet_balance} DH</td>
                      <td className="px-6 py-4 font-black text-indigo-400">{u.discord_points.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' : 'text-slate-500 border-slate-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleUpdateUserValue(u.id, 'wallet_balance', u.wallet_balance)} title="Edit Wallet" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-all"><DollarSign size={14}/></button>
                          <button onClick={() => handleUpdateUserValue(u.id, 'discord_points', u.discord_points)} title="Edit Points" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-all"><Zap size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'tournaments' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="px-6 py-5">Tournament</th>
                    <th className="px-6 py-5">Requirement</th>
                    <th className="px-6 py-5">Prize Pool</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {tournaments.map(t => (
                    <tr key={t.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-200">{t.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10} /> {new Date(t.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{t.role_required}</td>
                      <td className="px-6 py-4 font-black text-yellow-500">{t.prize_pool}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                          t.status === 'upcoming' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 
                          t.status === 'ongoing' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-slate-500 border-slate-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                         <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400"><Edit size={14}/></button>
                         <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'orders' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="px-6 py-5">Order ID</th>
                    <th className="px-6 py-5">Customer</th>
                    <th className="px-6 py-5">Product</th>
                    <th className="px-6 py-5">Revenue</th>
                    <th className="px-6 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-[10px] font-mono text-slate-600">#{o.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 font-bold text-slate-300">{o.profiles?.username || 'Guest'}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{o.products?.name}</td>
                      <td className="px-6 py-4 font-black text-green-400">{o.price_paid} DH</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Product Management Modal */}
      {showProductModal && editingProduct && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]" onClick={() => setShowProductModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[210] p-4 animate-in zoom-in-95 duration-200">
            <div className="glass rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-2xl font-black">{editingProduct.id ? 'Modify Product' : 'Add New Item'}</h3>
                <button onClick={() => setShowProductModal(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Product Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Price (DH)</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                      value={editingProduct.price_dh}
                      onChange={(e) => setEditingProduct({...editingProduct, price_dh: parseFloat(e.target.value)})}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Initial Stock</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Category</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    >
                      <option>Gaming</option>
                      <option>Streaming</option>
                      <option>Software</option>
                      <option>Music</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Type</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                      value={editingProduct.type}
                      onChange={(e) => setEditingProduct({...editingProduct, type: e.target.value as any})}
                    >
                      <option value="key">License Key</option>
                      <option value="account">Shared Account</option>
                      <option value="service">Digital Service</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1 flex items-center gap-2"><ImageIcon size={12}/> Product Photo Link</label>
                    <input 
                      type="url" 
                      placeholder="https://example.com/image.png"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                      value={editingProduct.image_url || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Description</label>
                    <textarea 
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                  >
                    {editingProduct.id ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
