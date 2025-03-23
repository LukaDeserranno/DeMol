import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Icons } from '@/components/ui/icons';
import { NavLink } from './NavLink';
import { useState } from 'react';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
        
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Enhanced Logo */}
            <Link 
              to="/dashboard" 
              className="flex items-center group transition-all duration-300 hover:opacity-90"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#2A9D8F]/20 to-transparent rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Logo className="w-10 sm:w-12 h-auto mr-2 sm:mr-3 relative drop-shadow-md" />
              </div>
              <div>
                <span className="text-white font-bold text-lg sm:text-xl tracking-tight">De Mol</span>
                <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[#2A9D8F] to-transparent transition-all duration-300" />
              </div>
            </Link>
            
            {/* Navigation - Desktop */}
            <nav className="hidden md:flex space-x-6 lg:space-x-8 ml-4 lg:ml-6">
              <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
                Dashboard
              </NavLink>
              <NavLink to="/vote" active={location.pathname === '/vote'}>
                Stem
              </NavLink>
              <NavLink to="/groups" active={location.pathname.startsWith('/groups')}>
                Groepen
              </NavLink>
              
              {/* Admin Links (only for admin users) */}
              {isAdmin() && (
                <div className="relative">
                  <button 
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={`
                      relative px-2 py-2 transition-all duration-300 flex items-center gap-1
                      ${location.pathname.startsWith('/admin') 
                        ? 'text-[#2A9D8F] font-medium' 
                        : 'text-zinc-400 hover:text-white'
                      }
                      group
                    `}
                  >
                    <span>Admin</span>
                    <Icons.arrowRight className={`h-4 w-4 transform transition-transform ${showAdminMenu ? 'rotate-90' : ''}`} />
                    
                    {/* Active indicator */}
                    {location.pathname.startsWith('/admin') ? (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2A9D8F] to-[#2A9D8F]/30 rounded-full" />
                    ) : (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 w-0 group-hover:w-full bg-zinc-700/50 rounded-full transition-all duration-300" />
                    )}
                  </button>
                  
                  {/* Admin Dropdown */}
                  {showAdminMenu && (
                    <div className="absolute mt-1 bg-zinc-800 rounded-md shadow-lg border border-zinc-700 py-1 w-48 right-0 z-30">
                      <Link 
                        to="/admin/voting-rounds"
                        className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        onClick={() => setShowAdminMenu(false)}
                      >
                        Stemrondes Beheren
                      </Link>
                      {/* Add more admin links here */}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>
          
          {/* User menu */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>

            {user && (
              <>
                <div className="hidden md:block px-3 sm:px-4 py-2 rounded-md bg-zinc-800/50 border border-zinc-700/30">
                  <div className="text-xs text-zinc-400">Ingelogd als</div>
                  <div className="text-white font-medium text-sm truncate max-w-[150px] lg:max-w-xs">{user.displayName || user.email}</div>
                  {isAdmin() && (
                    <div className="text-[#2A9D8F] text-xs mt-1">Administrator</div>
                  )}
                </div>
                <Button 
                  onClick={handleLogout} 
                  className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#2A9D8F]/40 transition-all duration-300 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 rounded-md shadow-md hover:shadow-[#2A9D8F]/10"
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
      <div className={`md:hidden border-t border-zinc-800/50 bg-zinc-900/90 backdrop-blur-sm transition-all duration-300 ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <nav className="flex flex-col py-3 px-4 space-y-3">
          <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
            Dashboard
          </NavLink>
          <NavLink to="/vote" active={location.pathname === '/vote'}>
            Stem
          </NavLink>
          <NavLink to="/groups" active={location.pathname.startsWith('/groups')}>
            Groepen
          </NavLink>
        </nav>
        
        {/* Mobile Admin Menu */}
        {isAdmin() && (
          <div className="py-2 px-4 border-t border-zinc-800/50">
            <details className="text-zinc-400">
              <summary className="cursor-pointer py-2 flex items-center justify-between">
                <span className="font-medium">Admin Menu</span>
                <span className="text-xs">▼</span>
              </summary>
              <div className="pl-4 py-2 space-y-2">
                <Link 
                  to="/admin/voting-rounds"
                  className="block py-1 text-sm text-zinc-300 hover:text-[#2A9D8F]"
                >
                  Stemrondes Beheren
                </Link>
                {/* Add more admin links here */}
              </div>
            </details>
          </div>
        )}

        {/* Mobile User Info */}
        {user && (
          <div className="border-t border-zinc-800/50 mt-2 pt-3 pb-4 px-4">
            <div className="text-xs text-zinc-400">Ingelogd als</div>
            <div className="text-white font-medium text-sm mb-2">{user.displayName || user.email}</div>
            {isAdmin() && (
              <div className="text-[#2A9D8F] text-xs mb-3">Administrator</div>
            )}
            <Button 
              onClick={handleLogout} 
              className="w-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all duration-300 flex items-center justify-center gap-2 px-3 rounded-md"
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
              <span className="font-medium">Uitloggen</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
} 