
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
  ArrowDownRight, 
  CheckCircle, 
  Clock, 
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Order } from '../types';

type AdminTab = 'orders' | 'products' | 'users' | 'audit' | 'tournaments';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data);
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('wallet_balance', { ascending: false });
        if (data) setUsers(data);
      } else if (activeTab === 'orders') {
        const { data } = await supabase.from('orders').select('*, profiles(username, email), products(name)').order('created_at', { ascending: false });
        if (data) setOrders(data);
      } else if (activeTab === 'audit') {
        const { data } = await supabase.from('wallet_history').select('*, profiles(username)').order('created_at', { ascending: false });
        if (data) setAuditLogs(data);
      }

      // Fetch global stats
      const { data: revData } = await supabase.from('orders').select('price_paid').eq('status', 'completed');
      const totalRev = revData?.reduce((acc, curr) => acc + curr.price_paid, 0) || 0;
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      setStats({ revenue: totalRev, orders: orderCount || 0, users: userCount || 0 });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEditPrice = async (id: string, currentPrice: number) => {
    const newPrice = prompt("Enter new price (DH):", currentPrice.toString());
    if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
      const { error } = await supabase.from('products').update({ price_dh: parseFloat(newPrice) }).eq('id', id);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  const handleUpdateBalance = async (user: UserProfile) => {
    const newBalance = prompt(`Updating balance for ${user.username}. Current: ${user.wallet_balance} DH. Enter new amount:`, user.wallet_balance.toString());
    if (newBalance !== null && !isNaN(parseFloat(newBalance))) {
      const { error } = await supabase.from('profiles').update({ wallet_balance: parseFloat(newBalance) }).eq('id', user.id);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  const handleUpdatePoints = async (user: UserProfile) => {
    const newPoints = prompt(`Updating points for ${user.username}. Current: ${user.discord_points}. Enter new amount:`, user.discord_points.toString());
    if (newPoints !== null && !isNaN(parseInt(newPoints))) {
      const { error } = await supabase.from('profiles').update({ discord_points: parseInt(newPoints) }).eq('id', user.id);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <LayoutDashboard className="text-blue-400" /> Admin Command
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage products, users, and audit logs.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'products', label: 'Products', icon: Zap },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'audit', label: 'Audit Logs', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                activeTab === tab.id 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-green-500/10 text-green-500">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Total Revenue</span>
            <div className="text-2xl font-black">{stats.revenue.toLocaleString()} <span className="text-xs text-slate-500">DH</span></div>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Active Orders</span>
            <div className="text-2xl font-black">{stats.orders}</div>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-500">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">User Accounts</span>
            <div className="text-2xl font-black">{stats.users}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-slate-800 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'orders' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/10">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Price Paid</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 font-bold text-sm">
                        <div className="flex flex-col">
                          <span>{order.profiles?.username}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{order.profiles?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">{order.products?.name}</td>
                      <td className="px-6 py-4 font-bold text-white">{order.price_paid} DH</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          order.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'products' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/10">
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm">{p.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{p.category}</td>
                      <td className="px-6 py-4 font-bold text-blue-400">{p.price_dh} DH</td>
                      <td className="px-6 py-4 text-sm font-medium">{p.stock}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEditPrice(p.id, p.price_dh)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 transition-all"><Edit size={14} /></button>
                        <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/10">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Wallet Balance</th>
                    <th className="px-6 py-4">Points</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Edit Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400"><UserIcon size={14}/></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{u.username}</span>
                            <span className="text-[10px] text-slate-500">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{u.wallet_balance} DH</td>
                      <td className="px-6 py-4 font-bold text-indigo-400">{u.discord_points}</td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">{u.role}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleUpdateBalance(u)} title="Update DH balance" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 transition-all"><CreditCard size={14} /></button>
                        <button onClick={() => handleUpdatePoints(u)} title="Update Points" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-indigo-400 transition-all"><Zap size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'audit' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/10">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-sm">{log.profiles?.username || 'System'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          log.type === 'deposit' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{log.amount} DH</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
