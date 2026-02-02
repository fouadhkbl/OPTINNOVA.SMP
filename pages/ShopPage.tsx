
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Zap, Shield, Plus, Minus, X, CheckCircle, Filter, SlidersHorizontal, PackageCheck, PackageX, Tag, AlertTriangle, RefreshCw } from 'lucide-react';
import { Product, UserProfile, CartItem } from '../types';
import { supabase, safeQuery } from '../lib/supabase';

export default function ShopPage({ user, cart, setCart }: { user: UserProfile | null, cart: CartItem[], setCart: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStock, setFilterStock] = useState<'All' | 'In Stock' | 'Out of Stock'>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    // Using safeQuery to handle AbortErrors gracefully
    const { data, error: queryError } = await safeQuery(
      supabase.from('products').select('*').order('created_at', { ascending: false })
    );
    
    if (queryError) {
      if (queryError !== 'aborted') {
        setError(queryError);
      }
    } else if (data) {
      setProducts(data as Product[]);
    }
    
    setLoading(false);
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || p.type === filterType.toLowerCase();
    const matchesStock = filterStock === 'All' || (filterStock === 'In Stock' ? p.stock > 0 : p.stock === 0);
    const matchesMinPrice = minPrice === '' || p.price_dh >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || p.price_dh <= parseFloat(maxPrice);
    
    return matchesCategory && matchesSearch && matchesType && matchesStock && matchesMinPrice && matchesMaxPrice;
  });

  const handleAddToCart = (product: Product, q: number = 1) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + q } : item));
    } else {
      setCart([...cart, { ...product, quantity: q }]);
    }
    if (selectedProduct) setSelectedProduct(null);
  };

  const resetFilters = () => {
    setSearch('');
    setActiveCategory('All');
    setFilterType('All');
    setFilterStock('All');
    setMinPrice('');
    setMaxPrice('');
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
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="glass p-6 rounded-[2rem] border border-slate-800 animate-in slide-in-from-top-4 duration-500 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2"><Tag size={12}/> Product Type</label>
               <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-black uppercase outline-none focus:border-blue-500/50 text-slate-300" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                 <option value="All">All Modalities</option>
                 <option value="Account">Accounts</option>
                 <option value="Key">License Keys</option>
                 <option value="Service">Services</option>
               </select>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2"><PackageCheck size={12}/> Availability</label>
               <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-black uppercase outline-none focus:border-blue-500/50 text-slate-300" value={filterStock} onChange={(e) => setFilterStock(e.target.value as any)}>
                 <option value="All">Every Status</option>
                 <option value="In Stock">Currently In Stock</option>
                 <option value="Out of Stock">Sold Out Only</option>
               </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2">Price Range (DH)</label>
               <div className="flex items-center gap-4">
                  <div className="relative flex-grow">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">MIN</span>
                     <input type="number" placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-xs font-black outline-none focus:border-blue-500/50" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  </div>
                  <div className="relative flex-grow">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">MAX</span>
                     <input type="number" placeholder="9999" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-xs font-black outline-none focus:border-blue-500/50" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  </div>
                  <button onClick={resetFilters} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all border border-slate-700">
                    <X size={18} />
                  </button>
               </div>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/50 pt-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  activeCategory === cat 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-[3rem] border border-red-500/20 space-y-6">
           <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
              <AlertTriangle size={32} />
           </div>
           <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white">Sync Disturbance</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
           </div>
           <button onClick={fetchProducts} className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all">
             <RefreshCw size={14} /> Reconnect Shop
           </button>
        </div>
      ) : loading ? (
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
                <div className="absolute top-4 right-4 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-[10px] font-black tracking-widest border border-white/5 uppercase flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
                  {product.type}
                </div>
              </div>
              
              <div className="p-6 space-y-4 flex-grow flex flex-col">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{product.category}</span>
                    <span className={`text-[10px] font-black flex items-center gap-1 uppercase ${product.stock > 0 ? 'text-slate-500' : 'text-red-500'}`}>
                      {product.stock > 0 ? (
                        <>
                          <Zap size={10} className="text-yellow-500" /> {product.stock} Units Left
                        </>
                      ) : (
                        <>
                          <PackageX size={10} /> Sold Out
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => setSelectedProduct(product)}>{product.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{product.description}</p>
                </div>

                <div className="pt-4 mt-auto flex items-center justify-between border-t border-slate-800/30">
                  <div>
                    <span className="text-2xl font-black text-white">{product.price_dh}</span>
                    <span className="text-xs text-slate-500 ml-1 font-bold">DH</span>
                  </div>
                  <button 
                    disabled={product.stock === 0}
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    className={`p-3 rounded-xl transition-all shadow-lg flex items-center gap-2 ${product.stock > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 group/btn' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                  >
                    <Plus size={20} className={product.stock > 0 ? "group-hover/btn:rotate-90 transition-transform" : ""} />
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
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black">{selectedProduct.name}</h2>
                    {selectedProduct.stock === 0 && <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 rounded-full">Out of Stock</span>}
                  </div>
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
                  {selectedProduct.stock > 0 && (
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
                  )}

                  <button 
                    disabled={selectedProduct.stock === 0}
                    onClick={() => handleAddToCart(selectedProduct, quantity)}
                    className={`w-full py-5 rounded-3xl font-black transition-all shadow-xl flex items-center justify-center gap-3 ${selectedProduct.stock > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                  >
                    {selectedProduct.stock > 0 ? (
                      <>
                        <ShoppingCart size={22} /> Add to Cart — {(selectedProduct.price_dh * quantity).toFixed(2)} DH
                      </>
                    ) : (
                      'Item Not Available'
                    )}
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

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-24 space-y-4">
          <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto text-slate-700 border border-slate-800">
            <Search size={32} />
          </div>
          <p className="text-slate-500 font-medium">No products match your current filters.</p>
          <button onClick={resetFilters} className="text-blue-400 font-bold hover:underline">Clear all filters</button>
        </div>
      )}
    </div>
  );
}
