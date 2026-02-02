
import React, { useState } from 'react';
// Added Zap to lucide-react imports
import { LayoutDashboard, Users, ShoppingBag, Trophy, Search, Settings, Edit, Trash2, Plus, Zap } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'tournaments'>('orders');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <LayoutDashboard className="text-blue-400" /> Admin Command
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage your digital empire from here.</p>
        </div>
        
        <div className="flex gap-2">
          {['orders', 'products', 'tournaments'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                activeTab === tab 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/30">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
            <Plus size={16} /> Add New {activeTab.slice(0, -1)}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/10">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">{activeTab === 'orders' ? 'Customer' : 'Title'}</th>
                <th className="px-6 py-4">{activeTab === 'orders' ? 'Product' : 'Category/Role'}</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">#{1000 + i}</td>
                  <td className="px-6 py-4 font-bold text-sm">
                    {activeTab === 'orders' ? 'User_' + i : 'Item_' + i}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">{activeTab === 'orders' ? 'Premium Key' : 'Digital'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Pending</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">2023-11-28</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"><Edit size={14} /></button>
                    <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Revenue</span>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><Zap size={16} /></div>
          </div>
          <div className="text-3xl font-black">240,500 <span className="text-sm text-slate-500 font-bold">DH</span></div>
          <div className="text-[10px] text-green-500 font-bold">+12% from last month</div>
        </div>
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Orders</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><ShoppingBag size={16} /></div>
          </div>
          <div className="text-3xl font-black">42</div>
          <div className="text-[10px] text-blue-500 font-bold">15 pending approval</div>
        </div>
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Support Tickets</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Settings size={16} /></div>
          </div>
          <div className="text-3xl font-black">8</div>
          <div className="text-[10px] text-purple-500 font-bold">All resolved within 2h</div>
        </div>
      </div>
    </div>
  );
}
