import { useState, useEffect } from 'react';
import { Candidate } from '@/models/candidate';
import { getActiveCandidates, getAllCandidates } from '@/firebase/candidateService';
import { Icons } from '@/components/ui/icons';

export function CandidatesBanner() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        
        // Try to get active candidates first
        let activeCandidates = await getActiveCandidates();
        
        // If no active candidates, try all candidates as fallback
        if (activeCandidates.length === 0) {
          console.log('No active candidates found, getting all candidates');
          activeCandidates = await getAllCandidates();
        }
        
        console.log('Candidates loaded:', activeCandidates);
        setCandidates(activeCandidates);
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError('Kon kandidaten niet laden');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Auto-rotate to next candidate every 5 seconds
  useEffect(() => {
    if (candidates.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % candidates.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [candidates.length]);

  // Get current candidate
  const currentCandidate = candidates.length > 0 ? candidates[currentIndex] : null;

  // Handle manual navigation
  const goToNext = () => {
    if (candidates.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % candidates.length);
  };

  const goToPrevious = () => {
    if (candidates.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + candidates.length) % candidates.length);
  };

  // Show placeholder if no candidates or loading
  const showPlaceholder = loading || !currentCandidate;

  return (
    <div className="w-full bg-black/90 h-[300px] relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black"></div>
      
      {/* Content container */}
      <div className="relative h-full z-10 flex flex-col justify-center items-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin w-12 h-12 border-4 border-[#2A9D8F] border-t-transparent rounded-full mb-4"></div>
            <p className="text-zinc-400">Kandidaten laden...</p>
          </div>
        ) : error ? (
          <div className="text-center p-6">
            <p className="text-red-400 mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-[#2A9D8F] hover:underline text-sm"
            >
              Probeer opnieuw
            </button>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-zinc-400">Geen kandidaten gevonden</p>
          </div>
        ) : (
          <>
            {/* Main candidate display */}
            <div className="w-full max-w-4xl mx-auto px-4 flex items-center justify-between">
              {/* Previous button */}
              <button 
                onClick={goToPrevious}
                className="bg-zinc-800/50 hover:bg-zinc-800 text-white p-3 rounded-full transition-colors"
                aria-label="Vorige kandidaat"
              >
                <Icons.arrowLeft className="h-5 w-5" />
              </button>
              
              {/* Candidate info */}
              <div className="flex flex-col md:flex-row items-center gap-6 py-8 max-w-2xl w-full">
                {/* Image */}
                <div className="relative">
                  <div className="w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[#2A9D8F]/80 shadow-lg shadow-[#2A9D8F]/20">
                    <img 
                      src={currentCandidate?.image}
                      alt={currentCandidate?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#2A9D8F] text-white px-4 py-1 rounded-full whitespace-nowrap text-sm font-medium">
                    {currentCandidate?.name}, {currentCandidate?.age}
                  </div>
                </div>
                
                {/* Bio */}
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2 hidden md:block">
                    {currentCandidate?.name}, {currentCandidate?.age}
                  </h2>
                  <p className="text-zinc-300 line-clamp-4 md:line-clamp-none md:max-w-md">
                    {currentCandidate?.bio}
                  </p>
                  <p className="text-[#2A9D8F] mt-3 font-semibold">
                    Wie is de saboteur?
                  </p>
                </div>
              </div>
              
              {/* Next button */}
              <button 
                onClick={goToNext}
                className="bg-zinc-800/50 hover:bg-zinc-800 text-white p-3 rounded-full transition-colors"
                aria-label="Volgende kandidaat"
              >
                <Icons.arrowRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Dots indicator */}
            <div className="flex justify-center gap-1 mt-2">
              {candidates.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-[#2A9D8F] w-4' 
                      : 'bg-zinc-600 hover:bg-zinc-500'
                  }`}
                  aria-label={`Ga naar kandidaat ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 