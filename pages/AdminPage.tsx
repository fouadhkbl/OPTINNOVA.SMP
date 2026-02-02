
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
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Order, Tournament, PointShopItem } from '../types';

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

      // Dashboard Stats
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
        visits: 15420 + Math.floor(Math.random() * 500) 
      });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Generic Save Logic
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
    if (window.confirm("Confirm deletion?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) alert(error.message); else fetchData();
    }
  };

  const handleUpdateUserValue = async (userId: string, field: 'wallet_balance' | 'discord_points', current: number) => {
    const label = field === 'wallet_balance' ? 'Wallet DH' : 'Discord Points';
    const newVal = prompt(`Update ${label} for user:`, current.toString());
    if (newVal !== null && !isNaN(parseFloat(newVal))) {
      await supabase.from('profiles').update({ [field]: parseFloat(newVal) }).eq('id', userId);
      fetchData();
    }
  };

  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            <span className="p-2 bg-blue-600 rounded-2xl"><ShieldAlert size={28} className="text-white"/></span>
            <span className="gradient-text">Moon Command</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Administrative Systems Restricted Access</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-[2rem] border border-slate-800 backdrop-blur-md">
          {[
            { id: 'overview', label: 'Dashboard', icon: BarChart3 },
            { id: 'orders', label: 'Commands', icon: ShoppingBag },
            { id: 'products', label: 'Inventory', icon: Zap },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'tournaments', label: 'Events', icon: Trophy },
            { id: 'point_shop', label: 'Points', icon: Store }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
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
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Total Revenue</span>
              <div className="text-4xl font-black text-white">{stats.revenue.toLocaleString()} <span className="text-xs text-slate-500">DH</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"><UserPlus size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Registered Today</span>
              <div className="text-4xl font-black text-white">{stats.newUsersToday} <span className="text-xs text-slate-500">DEBUTS</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform"><ShoppingBag size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Total Commands</span>
              <div className="text-4xl font-black text-white">{stats.orders} <span className="text-xs text-slate-500">SALES</span></div>
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 group">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform"><Eye size={28} /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Site Visits</span>
              <div className="text-4xl font-black text-white">{stats.visits.toLocaleString()} <span className="text-xs text-slate-500">HITS</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-[3rem] border border-slate-800 overflow-hidden relative min-h-[500px] shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-900/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" placeholder={`Search Moon ${activeTab.replace('_', ' ')}...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {activeTab === 'products' && (
              <button onClick={() => { setEditingProduct({ name: '', price_dh: 0, category: 'Gaming', stock: 10, type: 'key' }); setShowProductModal(true); }} className="flex-grow sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
                <Plus size={16} /> New Inventory
              </button>
            )}
            {activeTab === 'tournaments' && (
              <button onClick={() => { setEditingTournament({ title: '', prize_pool: '', role_required: 'Member', status: 'upcoming', date: new Date().toISOString() }); setShowTournamentModal(true); }} className="flex-grow sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                <Plus size={16} /> New Event
              </button>
            )}
            {activeTab === 'point_shop' && (
              <button onClick={() => { setEditingPointItem({ name: '', description: '', cost_points: 1000 }); setShowPointModal(true); }} className="flex-grow sm:flex-none bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2">
                <Plus size={16} /> New Reward
              </button>
            )}
            <button onClick={fetchData} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-all border border-slate-800"><History size={20} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
             <Loader2 className="animate-spin text-blue-500" size={48} />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Accessing Moon Data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'products' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/40">
                  <tr>
                    <th className="px-8 py-6">Identity</th>
                    <th className="px-8 py-6">Pricing</th>
                    <th className="px-8 py-6">Quantity</th>
                    <th className="px-8 py-6 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.image_url || `https://picsum.photos/seed/${p.id}/50/50`} className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                          <div>
                            <div className="font-bold text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{p.category} — {p.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-white">{p.price_dh} DH</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${p.stock < 5 ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-500 border-slate-800'}`}>{p.stock} Units</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-3">
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
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/40">
                  <tr>
                    <th className="px-8 py-6">User Profile</th>
                    <th className="px-8 py-6">Wallet (DH)</th>
                    <th className="px-8 py-6">Discord Points</th>
                    <th className="px-8 py-6 text-right">Credit Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white">{u.username?.[0].toUpperCase()}</div>
                           <div>
                              <div className="font-bold text-slate-100">{u.username}</div>
                              <div className="text-[10px] text-slate-600">{u.email}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-blue-400 text-lg">{u.wallet_balance.toFixed(2)}</td>
                      <td className="px-8 py-5 font-black text-indigo-400 text-lg">{u.discord_points.toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleUpdateUserValue(u.id, 'wallet_balance', u.wallet_balance)} title="Edit Wallet" className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-blue-400 border border-slate-800 transition-all flex items-center gap-2 font-black text-[10px]"><DollarSign size={14}/> DH</button>
                          <button onClick={() => handleUpdateUserValue(u.id, 'discord_points', u.discord_points)} title="Edit Points" className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-indigo-400 border border-slate-800 transition-all flex items-center gap-2 font-black text-[10px]"><Zap size={14}/> PTS</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'tournaments' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/40">
                  <tr>
                    <th className="px-8 py-6">Event Details</th>
                    <th className="px-8 py-6">Prize Pool</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {tournaments.map(t => (
                    <tr key={t.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-200">{t.title}</div>
                        <div className="text-[10px] text-slate-600 flex items-center gap-1 font-black uppercase tracking-widest"><Calendar size={12}/> {new Date(t.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-5 font-black text-yellow-500 uppercase">{t.prize_pool}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${t.status === 'upcoming' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 'text-slate-500 border-slate-800'}`}>{t.status}</span>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end gap-3">
                         <button onClick={() => { setEditingTournament(t); setShowTournamentModal(true); }} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-blue-400 border border-slate-800 transition-all"><Edit size={16}/></button>
                         <button onClick={() => handleDeleteItem('tournaments', t.id)} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-red-400 border border-slate-800 transition-all"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'point_shop' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/40">
                  <tr>
                    <th className="px-8 py-6">Reward Name</th>
                    <th className="px-8 py-6">Points Cost</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {pointItems.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-200">{p.name}</td>
                      <td className="px-8 py-5 font-black text-indigo-400">{p.cost_points.toLocaleString()} PTS</td>
                      <td className="px-8 py-5 text-right flex justify-end gap-3">
                        <button onClick={() => { setEditingPointItem(p); setShowPointModal(true); }} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-blue-400 border border-slate-800 transition-all"><Edit size={16}/></button>
                        <button onClick={() => handleDeleteItem('point_shop_items', p.id)} className="p-2.5 bg-slate-900 rounded-xl text-slate-500 hover:text-red-400 border border-slate-800 transition-all"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'orders' && (
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/40">
                  <tr>
                    <th className="px-8 py-6">Order ID</th>
                    <th className="px-8 py-6">Client</th>
                    <th className="px-8 py-6">Revenue</th>
                    <th className="px-8 py-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-8 py-5 text-[10px] font-mono text-slate-600">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-8 py-5 font-bold text-slate-300">{o.profiles?.username || 'Member'}</td>
                      <td className="px-8 py-5 font-black text-green-400">{o.price_paid} DH</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-green-500/10 text-green-500 border border-green-500/20">{o.status}</span>
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
        <>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200]" onClick={() => setShowProductModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[210] p-6 animate-in zoom-in-95 duration-200">
            <div className="glass rounded-[3rem] border border-slate-700 overflow-hidden shadow-2xl p-8 space-y-8">
              <h3 className="text-3xl font-black">{editingProduct.id ? 'Modify Entity' : 'New Moon Inventory'}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('products', editingProduct, setShowProductModal); }} className="space-y-6">
                <input required placeholder="Identity Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:border-blue-500 transition-all outline-none" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" placeholder="Price (DH)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.price_dh} onChange={(e) => setEditingProduct({...editingProduct, price_dh: parseFloat(e.target.value)})} />
                  <input required type="number" placeholder="Stock" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                </div>
                <input required type="url" placeholder="Photo Link (CDN URL)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingProduct.image_url || ''} onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})} />
                <textarea placeholder="Product Intel..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" rows={3} value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}></textarea>
                <div className="flex gap-4">
                   <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500">Cancel</button>
                   <button type="submit" className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-blue-600/30">Commit Changes</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Tournament Modal */}
      {showTournamentModal && editingTournament && (
        <>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200]" onClick={() => setShowTournamentModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[210] p-6 animate-in zoom-in-95 duration-200">
            <div className="glass rounded-[3rem] border border-slate-700 p-8 space-y-8">
              <h3 className="text-3xl font-black">Moon Arena Event</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('tournaments', { ...editingTournament, tournament_date: editingTournament.date }, setShowTournamentModal); }} className="space-y-6">
                <input required placeholder="Tournament Title" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingTournament.title} onChange={(e) => setEditingTournament({...editingTournament, title: e.target.value})} />
                <input required placeholder="Prize Pool (e.g. 5000 DH)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingTournament.prize_pool} onChange={(e) => setEditingTournament({...editingTournament, prize_pool: e.target.value})} />
                <input required placeholder="Date/Time String" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingTournament.date} onChange={(e) => setEditingTournament({...editingTournament, date: e.target.value})} />
                <div className="flex gap-4">
                   <button type="button" onClick={() => setShowTournamentModal(false)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500">Cancel</button>
                   <button type="submit" className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white">Save Event</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Point Shop Modal */}
      {showPointModal && editingPointItem && (
        <>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200]" onClick={() => setShowPointModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[210] p-6 animate-in zoom-in-95 duration-200">
            <div className="glass rounded-[3rem] border border-slate-700 p-8 space-y-8">
              <h3 className="text-3xl font-black">Reward System</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveItem('point_shop_items', editingPointItem, setShowPointModal); }} className="space-y-6">
                <input required placeholder="Reward Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingPointItem.name} onChange={(e) => setEditingPointItem({...editingPointItem, name: e.target.value})} />
                <input required type="number" placeholder="Cost in Points" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingPointItem.cost_points} onChange={(e) => setEditingPointItem({...editingPointItem, cost_points: parseInt(e.target.value)})} />
                <input placeholder="Image URL (Optional)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold" value={editingPointItem.image_url || ''} onChange={(e) => setEditingPointItem({...editingPointItem, image_url: e.target.value})} />
                <div className="flex gap-4">
                   <button type="button" onClick={() => setShowPointModal(false)} className="flex-1 py-4 bg-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500">Cancel</button>
                   <button type="submit" className="flex-1 py-4 bg-purple-600 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white">Save Reward</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
