import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { CANDIDATES } from '../models/Candidate';

export default function Candidates() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'De Mol Kandidaten 2025 | De Mol App';
    return () => {
      document.title = 'De Mol App';
    };
  }, []);

  // Filter candidates based on search term
  const filteredCandidates = CANDIDATES.filter(candidate => 
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (candidate.bio && candidate.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <Button 
          variant="ghost"
          onClick={() => navigate('/')}
          className="self-start rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Terug naar Dashboard
        </Button>
        <div className="relative w-full md:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Zoek kandidaten..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="relative overflow-hidden rounded-xl p-8 mb-6 bg-gradient-to-r from-red-600 to-red-800 text-white">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
            </svg>
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 relative">De Mol Kandidaten 2025</h1>
          <p className="text-white/80 text-lg max-w-2xl relative">
            Ontdek alle kandidaten van het huidige seizoen en stem op wie volgens jou de mol is.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map(candidate => (
          <Card key={candidate.id} className="overflow-hidden border-0 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 group">
            <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
              <img 
                src={candidate.image} 
                alt={candidate.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <span className="absolute top-3 right-3 z-20 text-sm bg-red-600 text-white py-1 px-3 rounded-full font-medium shadow-md">
                {candidate.age} jaar
              </span>
            </div>
            <CardHeader className="p-5">
              <CardTitle className="text-xl font-bold mb-2">
                {candidate.name}
              </CardTitle>
              <CardDescription className="line-clamp-3 text-gray-600">
                {candidate.bio}
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t border-gray-100 bg-gray-50/50 p-4">
              <Button 
                variant="outline"
                className="w-full text-red-600 hover:text-white hover:bg-red-600 border-red-200 transition-all duration-300"
                onClick={() => window.open('https://www.goplay.be/de-mol', '_blank')}
              >
                Meer info op GoPlay
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-gray-100 my-8 shadow-inner">
          <h3 className="text-xl font-medium text-gray-900 mb-2">Geen kandidaten gevonden</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Probeer een andere zoekterm of bekijk alle kandidaten.
          </p>
          <Button 
            variant="outline"
            onClick={() => setSearchTerm('')}
            className="hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300"
          >
            Toon alle kandidaten
          </Button>
        </div>
      )}

      <div className="mt-12 mb-6 text-center">
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 h-auto rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          onClick={() => navigate('/groups')}
        >
          Ga naar je groepen om te stemmen
        </Button>
      </div>
    </div>
  );
} 