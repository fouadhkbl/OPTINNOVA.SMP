
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
  Zap
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { UserProfile } from './types';
import { LOGO_URL, APP_NAME, DISCORD_LINK, ADMIN_PASSWORD } from './constants.tsx';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import TournamentPage from './pages/TournamentPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import PointShopPage from './pages/PointShopPage';
import LoginPage from './pages/LoginPage';

const Layout = ({ user, setUser }: { user: UserProfile | null, setUser: any }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-800/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Moon Night Logo" className="w-10 h-10 object-contain rounded-full bg-slate-900" />
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors font-medium text-sm"
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Wallet</span>
                  <span className="text-sm font-bold text-blue-400">{user.wallet_balance.toFixed(2)} DH</span>
                </Link>
                <Link to="/profile" className="p-1 rounded-full border border-blue-500/30 hover:bg-blue-500/10 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                </Link>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-500/20">
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
          <div className="md:hidden absolute top-full left-0 right-0 glass border-b border-slate-800 p-4 space-y-4">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 text-slate-300 hover:text-blue-400 py-2 transition-colors"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage user={user} />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/points" element={<PointShopPage user={user} />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 px-8 border-t border-slate-800 bg-slate-950/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <img src={LOGO_URL} alt="Moon Night Logo" className="w-12 h-12 mb-4 rounded-full bg-slate-900" />
            <p className="text-slate-500 text-sm max-w-xs text-center md:text-left">
              The #1 digital store for premium accounts, keys and services. Join our community of 7k+ on Discord.
            </p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-white font-bold text-sm uppercase tracking-widest">Navigation</span>
              <Link to="/shop" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">Shop</Link>
              <Link to="/tournaments" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">Tournaments</Link>
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">Discord Community</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-white font-bold text-sm uppercase tracking-widest">Support</span>
              <button 
                onClick={() => {
                  const pass = prompt("Admin Password Required:");
                  if (pass === ADMIN_PASSWORD) {
                    navigate('/admin');
                  } else {
                    alert("Unauthorized Access");
                  }
                }}
                className="text-slate-500 hover:text-blue-400 text-sm flex items-center gap-1 transition-colors text-left"
              >
                <Info size={14} /> FAQ (Admin)
              </button>
              <Link to="/points" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">Points Rewards</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-900 text-center text-slate-600 text-xs">
          &copy; {new Date().getFullYear()} Moon Night Digital. All rights reserved. Prices in DH.
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
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
          // Mock profile if not found in real DB (for demo purposes)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'User',
            wallet_balance: 150.00,
            discord_points: 2500,
            role: session.user.email === 'admin@moonnight.com' ? 'admin' : 'user'
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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );

  return (
    <Router>
      <Layout user={user} setUser={setUser} />
    </Router>
  );
}
