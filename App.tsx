import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation, 
  Navigate 
} from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  Trophy, 
  Store, 
  Lock, 
  ShoppingCart, 
  User, 
  LogOut, 
  X, 
  Trash2, 
  Loader2,
  Menu
} from 'lucide-react';
import { supabase } from './lib/supabase.ts';
import { UserProfile, CartItem } from './types.ts';
import { LOGO_URL, APP_NAME } from './constants.tsx';

// Pages
import HomePage from './pages/HomePage.tsx';
import ShopPage from './pages/ShopPage.tsx';
import TournamentPage from './pages/TournamentPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import PointShopPage from './pages/PointShopPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SignUpPage from './pages/SignUpPage.tsx';

const Layout = ({ user, setUser, cart, setCart }: { user: UserProfile | null, setUser: any, cart: CartItem[], setCart: any }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/login');
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Shop', icon: ShoppingBag, path: '/shop' },
    { label: 'Tournaments', icon: Trophy, path: '/tournaments' },
    { label: 'Points Store', icon: Store, path: '/points' },
  ];

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price_dh * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); setIsCartOpen(false); return; }
    if (user.wallet_balance < cartTotal) {
      alert(`Insufficient balance! Please add funds to your wallet.`);
      navigate('/profile');
      setIsCartOpen(false);
      return;
    }

    if (isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      const { data, error } = await supabase.rpc('process_checkout', {
        cart_items: cart.map(item => ({ id: item.id, quantity: item.quantity }))
      });

      if (error) throw error;

      if (data?.success) {
        // Optimistic update
        setUser((prev: any) => prev ? { 
          ...prev, 
          wallet_balance: data.new_balance, 
          discord_points: (Number(prev.discord_points) || 0) + data.points_earned 
        } : null);
        setCart([]);
        setIsCartOpen(false);
        alert("Order Successful! Check your profile for delivery details.");
        navigate('/profile');
      } else {
        alert(data?.message || "Checkout failed");
      }
    } catch (err: any) {
      alert(err.message || "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <nav className="sticky top-0 z-50 glass border-b border-slate-800/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>

            <Link to="/" className="flex items-center gap-3 group">
              <img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain rounded-full bg-slate-900 border border-slate-800" />
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 hidden sm:block">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-widest ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'}`}>
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            <Link to="/admin" className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-all font-bold text-xs uppercase tracking-widest">
              <Lock size={16} /> Admin
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative p-2 text-slate-400 hover:text-blue-400 transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-[#020617] animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
                <Link to="/profile" className="hidden sm:flex flex-col items-end group">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest group-hover:text-slate-300 transition-colors">Balance</span>
                  <span className="text-sm font-black text-blue-400 group-hover:text-blue-300 transition-colors">{user.wallet_balance?.toFixed(2)} DH</span>
                </Link>
                <div className="flex items-center gap-2">
                   <Link to="/profile" className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-all">
                     {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <User size={18} className="text-slate-400" />}
                   </Link>
                   <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                     {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                   </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-0 left-0 bottom-0 w-3/4 max-w-sm bg-[#020617] border-r border-slate-800 p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <span className="text-xl font-black text-white tracking-tight">Menu</span>
               <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="flex flex-col gap-2 flex-grow">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`flex items-center gap-4 p-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${location.pathname === item.path ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-900'}`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
               <div className="my-4 border-t border-slate-800"></div>
               <Link to="/admin" className="flex items-center gap-4 p-4 rounded-xl font-bold text-sm uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all">
                  <Lock size={20} /> Admin Panel
               </Link>
            </div>
            
            {user && (
              <div className="mt-auto p-4 bg-slate-900 rounded-2xl border border-slate-800">
                 <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Current Balance</div>
                 <div className="text-2xl font-black text-white">{user.wallet_balance?.toFixed(2)} <span className="text-sm text-slate-500">DH</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed top-0 right-0 bottom-0 w-full sm:max-w-sm glass border-l border-slate-800 z-[70] p-6 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                 <ShoppingCart size={24} className="text-blue-400" />
                 <h2 className="text-xl font-black tracking-tight">Your Cart</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-all"><X size={20} /></button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40 space-y-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                    <ShoppingBag size={40} />
                  </div>
                  <p className="font-black text-xs uppercase tracking-widest">Cart is empty</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start gap-4 group">
                   <div className="w-16 h-16 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-800">
                      <img src={item.image_url || `https://picsum.photos/seed/${item.id}/200`} className="w-full h-full object-cover opacity-80" />
                   </div>
                   <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-sm text-slate-200 truncate">{item.name}</h4>
                      <p className="text-slate-500 text-xs mt-1">{item.quantity} x {item.price_dh.toFixed(2)} DH</p>
                      <p className="text-blue-400 font-black text-sm mt-1">{(item.price_dh * item.quantity).toFixed(2)} DH</p>
                   </div>
                   <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-red-400 p-2 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                    <span className="text-white font-bold">{cartTotal.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Taxes</span>
                    <span className="text-white font-bold">0.00 DH</span>
                  </div>
                  <div className="flex justify-between items-center px-1 pt-2 border-t border-slate-800">
                    <span className="text-blue-400 text-xs font-black uppercase tracking-widest">Total Due</span>
                    <span className="text-2xl font-black text-white">{cartTotal.toFixed(2)} DH</span>
                  </div>
                </div>
                
                <button 
                  disabled={isCheckingOut} 
                  onClick={handleCheckout} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? <Loader2 className="animate-spin" /> : 'Confirm Order'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage user={user} cart={cart} setCart={setCart} />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/points" element={<PointShopPage user={user} />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-800 bg-[#020617] mt-auto">
         <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
               <img src={LOGO_URL} className="w-8 h-8 rounded-full grayscale" />
               <span className="text-sm font-bold text-slate-500">© 2024 {APP_NAME}</span>
            </div>
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
               <a href="#" className="hover:text-blue-400">Terms</a>
               <a href="#" className="hover:text-blue-400">Privacy</a>
               <a href="#" className="hover:text-blue-400">Discord</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('moon-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('moon-cart', JSON.stringify(cart));
  }, [cart]);

  const updateAuthState = useCallback(async (session: any) => {
    if (session?.user) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (!error && profile) {
          setUser(profile);
        } else if (error) {
          console.error("Profile fetch error:", error);
          // Fallback if profile doesn't exist yet but user is auth'd
          if (session.user.email) {
             // In a real app we might create the profile here if triggers fail
          }
        }
      } catch (e) {
        console.error("Auth state update error:", e);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Initializing Nexus...</p>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user} setUser={setUser} cart={cart} setCart={setCart} />
    </Router>
  );
}