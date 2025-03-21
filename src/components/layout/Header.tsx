import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Icons } from '@/components/ui/icons';
import { NavLink } from './NavLink';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="relative z-20">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2A9D8F]/10 via-transparent to-transparent opacity-70" />
      
      {/* Glass-like header background */}
      <div className="bg-black/80 backdrop-blur-md border-b border-zinc-800/50 relative">
        {/* Glowing bottom border */}
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/50 to-transparent" />
        
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            {/* Enhanced Logo */}
            <Link 
              to="/dashboard" 
              className="flex items-center group transition-all duration-300 hover:opacity-90"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#2A9D8F]/20 to-transparent rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Logo className="w-12 h-auto mr-3 relative drop-shadow-md" />
              </div>
              <div>
                <span className="text-white font-bold text-xl tracking-tight">De Mol</span>
                <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[#2A9D8F] to-transparent transition-all duration-300" />
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8 ml-6">
              <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
                Dashboard
              </NavLink>
              <NavLink to="/predictions" active={location.pathname === '/predictions'}>
                Voorspellingen
              </NavLink>
              <NavLink to="/results" active={location.pathname === '/results'}>
                Resultaten
              </NavLink>
            </nav>
          </div>
          
          {/* User menu */}
          <div className="flex items-center gap-5">
            {user && (
              <>
                <div className="hidden md:block px-4 py-2 rounded-md bg-zinc-800/50 border border-zinc-700/30">
                  <div className="text-xs text-zinc-400">Ingelogd als</div>
                  <div className="text-white font-medium text-sm">{user.displayName || user.email}</div>
                </div>
                <Button 
                  onClick={handleLogout} 
                  className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#2A9D8F]/40 transition-all duration-300 flex items-center gap-2 px-3 rounded-md shadow-md hover:shadow-[#2A9D8F]/10"
                  size="sm"
                >
                  <svg 
                    className="h-4 w-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                    />
                  </svg>
                  <span className="font-medium text-xs">Uitloggen</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Enhanced */}
      <div className="md:hidden border-t border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
        <div className="flex justify-between py-3 px-6 max-w-md mx-auto">
          <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
            Dashboard
          </NavLink>
          <NavLink to="/predictions" active={location.pathname === '/predictions'}>
            Voorspellingen
          </NavLink>
          <NavLink to="/results" active={location.pathname === '/results'}>
            Resultaten
          </NavLink>
        </div>
      </div>
    </header>
  );
} 