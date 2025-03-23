import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-8 text-zinc-400">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
          <div>
            <div className="flex items-center mb-4">
              <Logo className="w-10 h-auto mr-3" />
              <h3 className="text-white font-semibold">De Mol</h3>
            </div>
            <p className="text-sm max-w-xs">
              Het ultieme speurspel waarbij één persoon saboteert en de anderen moeten ontdekken wie.
            </p>
          </div>
          
          <div className="sm:mt-2">
            <h3 className="text-white font-semibold mb-4">Links</h3>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-[#2A9D8F] transition-colors">Dashboard</Link></li>
              <li><Link to="/vote" className="hover:text-[#2A9D8F] transition-colors">Stem</Link></li>
              <li><Link to="/groups" className="hover:text-[#2A9D8F] transition-colors">Groepen</Link></li>
              <li><Link to="/predictions" className="hover:text-[#2A9D8F] transition-colors">Voorspellingen</Link></li>
              <li><Link to="/results" className="hover:text-[#2A9D8F] transition-colors">Resultaten</Link></li>
              <li><Link to="/rules" className="hover:text-[#2A9D8F] transition-colors">Spelregels</Link></li>
            </ul>
          </div>
          
          <div className="sm:mt-2">
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <p className="text-sm mb-4 max-w-xs">
              Vragen of problemen? Neem contact met ons op.
            </p>
            <Link 
              to="/contact" 
              className="inline-block bg-[#2A9D8F]/20 hover:bg-[#2A9D8F]/30 text-[#2A9D8F] text-sm py-2 px-4 rounded-md border border-[#2A9D8F]/30 transition-colors"
            >
              Contact Opnemen
            </Link>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-xs sm:text-sm">
          <p>&copy; {new Date().getFullYear()} De Mol. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
} 