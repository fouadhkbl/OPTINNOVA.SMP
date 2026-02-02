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
  Loader2 
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
      alert(`Insufficient balance!`);
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
        setUser((prev: any) => prev ? { 
          ...prev, 
          wallet_balance: data.new_balance, 
          discord_points: (Number(prev.discord_points) || 0) + data.points_earned 
        } : null);
        setCart([]);
        setIsCartOpen(false);
        alert("Success! Check your profile.");
        navigate('/profile');
      }
    } catch (err: any) {
      alert(err.message || "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      <nav className="sticky top-0 z-50 glass border-b border-slate-800/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain rounded-full" />
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              {APP_NAME}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-widest ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'}`}>
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            {/* Admin link now always visible for "everyone" access */}
            <Link to="/admin" className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-all font-bold text-xs uppercase tracking-widest">
              <Lock size={16} /> Admin
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative p-2 text-slate-400 hover:text-blue-400">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-[#020617]">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Balance</span>
                  <span className="text-sm font-black text-blue-400">{user.wallet_balance?.toFixed(2)} DH</span>
                </Link>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User size={16} />}
                </div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-400">
                  {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest">
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed top-0 right-0 bottom-0 w-full sm:max-w-sm glass border-l border-slate-800 z-[70] p-8 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">Cart</h2>
              <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <ShoppingCart size={48} className="mx-auto mb-4" />
                  <p className="font-black text-xs uppercase tracking-widest">Cart is empty</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <p className="text-blue-400 font-black text-xs">{item.price_dh} DH</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-6">
                <div className="flex justify-between items-center px-2">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                  <span className="text-2xl font-black text-white">{cartTotal.toFixed(2)} DH</span>
                </div>
                <button 
                  disabled={isCheckingOut} 
                  onClick={handleCheckout} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {isCheckingOut ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Order'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage user={user} cart={cart} setCart={setCart} />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/points" element={<PointShopPage user={user} />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
          {/* Public access to Admin - No Role Protection */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('moon-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

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
        if (!error && profile) setUser(profile);
      } catch (e) {
        console.error("Profile fetch error:", e);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });
    
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user} setUser={setUser} cart={cart} setCart={setCart} />
    </Router>
  );
}