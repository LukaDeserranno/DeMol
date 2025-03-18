import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { ExitIcon, HamburgerMenuIcon, HomeIcon, PersonIcon, StackIcon } from '@radix-ui/react-icons';

export function Header() {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon className="h-4 w-4" /> },
    { path: '/candidates', label: 'Kandidaten', icon: <PersonIcon className="h-4 w-4" /> },
    { path: '/groups', label: 'Groepen', icon: <StackIcon className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/"
            className="flex items-center space-x-2"
          >
            <img src="/images/logo.png" alt="De Mol" className="h-8" onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://www.goplay.be/static/img/demol/logo.png';
            }} />
            <span className="font-bold text-xl hidden sm:inline-block text-red-600">De Mol</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            {currentUser && (
              <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50"
                >
                  <ExitIcon className="mr-1.5 h-4 w-4" />
                  Uitloggen
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <HamburgerMenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="space-y-1 pb-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 text-base font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            {currentUser && (
              <div className="pt-2 border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <ExitIcon className="mr-3 h-4 w-4" />
                  Uitloggen
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
} 