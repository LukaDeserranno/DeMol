import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-6 text-zinc-400">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo className="w-12 h-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">De Mol</h3>
            <p className="text-sm">
              Het ultieme speurspel waarbij één persoon saboteert en de anderen moeten ontdekken wie.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3">Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-[#2A9D8F] transition-colors">Dashboard</Link></li>
              <li><Link to="/predictions" className="hover:text-[#2A9D8F] transition-colors">Voorspellingen</Link></li>
              <li><Link to="/results" className="hover:text-[#2A9D8F] transition-colors">Resultaten</Link></li>
              <li><Link to="/rules" className="hover:text-[#2A9D8F] transition-colors">Spelregels</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <p className="text-sm mb-4">
              Vragen of problemen? Neem contact met ons op.
            </p>
            <Link 
              to="/contact" 
              className="bg-[#2A9D8F]/20 hover:bg-[#2A9D8F]/30 text-[#2A9D8F] text-sm py-2 px-4 rounded-md border border-[#2A9D8F]/30 transition-colors"
            >
              Contact Opnemen
            </Link>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} De Mol. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
} 