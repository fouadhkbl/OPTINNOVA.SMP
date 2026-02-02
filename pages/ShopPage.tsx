
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Tag, Info } from 'lucide-react';
import { Product, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Netflix Premium 4K', description: '1 Month Shared Account, No Ads', price_dh: 45, category: 'Streaming', stock: 12, type: 'account' },
  { id: '2', name: 'Valorant Points Key (1200)', description: 'Region Free Global Key', price_dh: 120, category: 'Gaming', stock: 50, type: 'key' },
  { id: '3', name: 'Spotify Individual 1YR', description: 'Private Account Upgrade', price_dh: 150, category: 'Music', stock: 8, type: 'account' },
  { id: '4', name: 'Discord Nitro (1 Year)', description: 'Gift Link - All regions', price_dh: 400, category: 'Social', stock: 5, type: 'key' },
  { id: '5', name: 'Windows 11 Pro Key', description: 'OEM Lifetime Activation', price_dh: 80, category: 'Software', stock: 100, type: 'key' },
  { id: '6', name: 'PSN $50 Gift Card', description: 'US Region Only', price_dh: 550, category: 'Gaming', stock: 20, type: 'key' },
];

export default function ShopPage({ user }: { user: UserProfile | null }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))];

  const filteredProducts = products.filter(p => 
    (activeCategory === 'All' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleBuy = (product: Product) => {
    if (!user) {
      alert("Please log in to purchase.");
      return;
    }
    if (user.wallet_balance < product.price_dh) {
      alert("Insufficient funds in your DH wallet.");
      return;
    }
    
    const confirm = window.confirm(`Purchase ${product.name} for ${product.price_dh} DH?`);
    if (confirm) {
      // In a real app, logic would proceed to backend via Supabase Functions
      alert(`Success! You bought ${product.name}. Check your email/profile for details.`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Moon Night Shop</h1>
          <p className="text-slate-500">Find the best deals on digital accounts and keys.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeCategory === cat 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="glass rounded-3xl overflow-hidden group border border-slate-800 hover:border-blue-500/30 transition-all flex flex-col">
            <div className="aspect-video bg-slate-800/50 relative overflow-hidden flex items-center justify-center">
              <img 
                src={`https://picsum.photos/seed/${product.id}/400/225`} 
                alt={product.name}
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-xs font-bold border border-white/5">
                {product.type.toUpperCase()}
              </div>
            </div>
            
            <div className="p-6 space-y-4 flex-grow flex flex-col">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{product.category}</span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Tag size={12} /> {product.stock} in stock
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{product.name}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">{product.description}</p>
              </div>

              <div className="pt-4 mt-auto flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-white">{product.price_dh}</span>
                  <span className="text-xs text-slate-500 ml-1 font-bold">DH</span>
                </div>
                <button 
                  onClick={() => handleBuy(product)}
                  className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 group/btn"
                >
                  <ShoppingCart size={16} className="group-hover/btn:scale-110" /> Buy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-24 space-y-4">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
            <Search size={32} />
          </div>
          <p className="text-slate-500 font-medium">No products found matching your search.</p>
        </div>
      )}
    </div>
  );
}
