
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trophy, 
  User, 
  LayoutDashboard, 
  Home as HomeIcon, 
  PlusCircle, 
  Wallet, 
  LogOut, 
  Info, 
  Store,
  Menu,
  X,
  ShieldCheck,
  Zap,
  ShoppingCart,
  Trash2,
  Lock
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { UserProfile, CartItem, Product } from './types';
import { LOGO_URL, APP_NAME, DISCORD_LINK, ADMIN_PASSWORD } from './constants.tsx';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import TournamentPage from './pages/TournamentPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import PointShopPage from './pages/PointShopPage';
import LoginPage from './pages/LoginPage';

const Layout = ({ user, setUser, cart, setCart }: { user: UserProfile | null, setUser: any, cart: CartItem[], setCart: any }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: HomeIcon, path: '/' },
    { label: 'Shop', icon: ShoppingBag, path: '/shop' },
    { label: 'Tournaments', icon: Trophy, path: '/tournaments' },
    { label: 'Points Store', icon: Store, path: '/points' },
  ];

  const cartTotal = cart.reduce((sum, item) => sum + (item.price_dh * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleAdminAccess = () => {
    const pass = prompt("Enter Admin Access Key:");
    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem('is_admin_auth', 'true');
      navigate('/admin');
    } else if (pass !== null) {
      alert("Invalid Moon Access Key");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-800/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
              <img src={LOGO_URL} alt="Moon Night Logo" className="relative w-10 h-10 object-contain rounded-full bg-slate-950 border border-slate-800" />
            </div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all font-bold text-xs uppercase tracking-widest"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 text-slate-400 hover:text-blue-400 transition-all"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-[#020617]">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Balance</span>
                  <span className="text-sm font-black text-blue-400">{user.wallet_balance.toFixed(2)} DH</span>
                </Link>
                <Link to="/profile" className="p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:scale-110 transition-transform">
                  <div className="w-8 h-8 rounded-full bg-[#020617] flex items-center justify-center">
                    <User size={16} />
                  </div>
                </Link>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20">
                Log In
              </Link>
            )}

            <button className="md:hidden text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 glass border-b border-slate-800 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-4 text-slate-300 hover:text-blue-400 py-3 transition-colors font-bold uppercase text-xs tracking-widest"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm glass border-l border-slate-800 z-[70] p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <ShoppingCart className="text-blue-400" /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-none">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-4 opacity-50">
                  <ShoppingBag size={64} className="mx-auto text-slate-800" />
                  <p className="font-bold text-slate-600 uppercase tracking-widest text-xs">Your Moon Cart is Empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 hover:border-blue-500/30 transition-all group">
                    <img src={item.image_url || `https://picsum.photos/seed/${item.id}/80/80`} className="w-16 h-16 rounded-2xl object-cover border border-slate-800" alt={item.name} />
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm text-slate-200">{item.name}</h4>
                      <p className="text-blue-400 font-black text-xs">{item.price_dh} DH <span className="text-slate-600">x {item.quantity}</span></p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-700 hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Subtotal</span>
                  <span className="text-3xl font-black text-white">{cartTotal.toFixed(2)} <span className="text-sm text-slate-600">DH</span></span>
                </div>
                <button 
                  onClick={() => {
                    if(!user) { navigate('/login'); setIsCartOpen(false); return; }
                    alert("Checkout feature coming soon! Ensure your wallet has sufficient balance.");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30"
                >
                  Confirm Purchase
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
          <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-16 px-8 border-t border-slate-800 bg-slate-950/40 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] -z-10 rounded-full"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Moon Night Logo" className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800" />
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">{APP_NAME}</span>
            </Link>
            <p className="text-slate-500 text-sm max-w-xs text-center md:text-left font-medium leading-relaxed">
              The #1 premium digital ecosystem for accounts, keys and elite gaming services. Trusted by 7k+ legends on Discord.
            </p>
          </div>

          <div className="flex justify-center gap-16">
            <div className="flex flex-col gap-4">
              <span className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-2">Universe</span>
              <Link to="/shop" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-all">Shop</Link>
              <Link to="/tournaments" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-all">Events</Link>
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-all">Discord</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-2">Systems</span>
              <button 
                onClick={handleAdminAccess}
                className="text-slate-500 hover:text-blue-400 text-sm font-bold flex items-center gap-2 transition-all text-left"
              >
                <Lock size={14} /> Admin Access
              </button>
              <Link to="/points" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-all">Point Shop</Link>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"><ShieldCheck size={20}/></div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"><Zap size={20}/></div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"><ShoppingCart size={20}/></div>
            </div>
            <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest">Powered by Moon Tech © {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser(profile);
        } else {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'Member',
            wallet_balance: 0.00,
            discord_points: 0,
            role: 'user'
          });
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
       <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <img src={LOGO_URL} className="absolute inset-0 w-12 h-12 m-auto opacity-50" />
       </div>
       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 animate-pulse">Initializing Moon Space</span>
    </div>
  );

  return (
    <Router>
      <Layout user={user} setUser={setUser} cart={cart} setCart={setCart} />
    </Router>
  );
}
