
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Zap, Shield, Plus, Minus, X, CheckCircle } from 'lucide-react';
import { Product, UserProfile, CartItem } from '../types';
import { supabase } from '../lib/supabase';

export default function ShopPage({ user, cart, setCart }: { user: UserProfile | null, cart: CartItem[], setCart: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => 
    (activeCategory === 'All' || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddToCart = (product: Product, q: number = 1) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + q } : item));
    } else {
      setCart([...cart, { ...product, quantity: q }]);
    }
    if (selectedProduct) setSelectedProduct(null);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight"><span className="gradient-text">Moon Night</span> Shop</h1>
          <p className="text-slate-500 font-medium">Browse our premium digital selection.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
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

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="glass rounded-[2rem] overflow-hidden group border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col relative animate-in fade-in slide-in-from-bottom-4">
              <div 
                className="aspect-video bg-slate-800/50 relative overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={() => { setSelectedProduct(product); setQuantity(1); }}
              >
                <img 
                  src={product.image_url || `https://picsum.photos/seed/${product.id}/400/225`} 
                  alt={product.name}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-[10px] font-black tracking-widest border border-white/5 uppercase">
                  {product.type}
                </div>
              </div>
              
              <div className="p-6 space-y-4 flex-grow flex flex-col">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{product.category}</span>
                    <span className="text-slate-500 text-[10px] font-bold flex items-center gap-1 uppercase">
                      <Zap size={10} className="text-yellow-500" /> {product.stock} stock
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => setSelectedProduct(product)}>{product.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{product.description}</p>
                </div>

                <div className="pt-4 mt-auto flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-white">{product.price_dh}</span>
                    <span className="text-xs text-slate-500 ml-1 font-bold">DH</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 group/btn"
                  >
                    <Plus size={20} className="group-hover/btn:rotate-90 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] transition-opacity" onClick={() => setSelectedProduct(null)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl z-[110] p-4 md:p-8 animate-in zoom-in-95 duration-300">
            <div className="glass rounded-[3rem] border border-slate-700 overflow-hidden flex flex-col md:flex-row shadow-2xl max-h-[90vh] overflow-y-auto md:overflow-hidden">
              <div className="md:w-1/2 relative bg-slate-900 min-h-[300px]">
                <img 
                  src={selectedProduct.image_url || `https://picsum.photos/seed/${selectedProduct.id}/800/800`} 
                  className="w-full h-full object-cover" 
                  alt={selectedProduct.name} 
                />
                <div className="absolute top-6 left-6 px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                  {selectedProduct.category}
                </div>
              </div>
              
              <div className="md:w-1/2 p-8 md:p-12 space-y-8 relative flex flex-col justify-center">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-slate-400 transition-all">
                  <X size={24} />
                </button>
                
                <div className="space-y-4">
                  <h2 className="text-3xl font-black">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-blue-400">{selectedProduct.price_dh} <span className="text-sm">DH</span></span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Instant Delivery</span>
                    </div>
                    <div className="w-px h-10 bg-slate-800"></div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-slate-200 flex items-center gap-2"><Shield size={16} className="text-green-500" /> Verified</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Warranty Included</span>
                    </div>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Select Quantity</span>
                    <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 w-fit p-1 rounded-2xl">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="text-xl font-black w-8 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                        className="p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAddToCart(selectedProduct, quantity)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-3xl font-black transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3"
                  >
                    <ShoppingCart size={22} /> Add to Cart — {(selectedProduct.price_dh * quantity).toFixed(2)} DH
                  </button>
                </div>

                <div className="pt-4 flex items-center gap-4 text-xs text-slate-500 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-blue-500" /> 24/7 Support</span>
                  <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-blue-500" /> Moon Verified</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-24 space-y-4">
          <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto text-slate-700 border border-slate-800">
            <Search size={32} />
          </div>
          <p className="text-slate-500 font-medium">No products match your current filters.</p>
          <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="text-blue-400 font-bold hover:underline">Clear all filters</button>
        </div>
      )}
    </div>
  );
}
