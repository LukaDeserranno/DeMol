import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface Candidate {
  id: string;
  name: string;
  age: number;
  image: string;
  bio?: string;
}

interface CandidatesCardProps {
  candidates: Candidate[];
  limit?: number;
}

export function CandidatesCard({ candidates, limit = 6 }: CandidatesCardProps) {
  const navigate = useNavigate();
  const displayCandidates = candidates.slice(0, limit);

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
        <CardTitle className="text-xl font-bold">Kandidaten 2025</CardTitle>
        <CardDescription className="text-gray-300 mt-1">
          Ontdek de kandidaten van dit seizoen
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-[2px] bg-gray-200">
          {displayCandidates.map((candidate) => (
            <div 
              key={candidate.id}
              className="relative group overflow-hidden aspect-square bg-gray-100"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end justify-center p-4">
                <div className="text-white text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="font-bold text-lg">{candidate.name}</div>
                  <div className="text-sm opacity-90">{candidate.age} jaar</div>
                </div>
              </div>
              <img 
                src={candidate.image} 
                alt={candidate.name}
                className="object-cover object-center w-full h-full group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50/70 border-t p-4 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/candidates')}
          className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 w-full"
        >
          Bekijk Alle Kandidaten
        </Button>
      </CardFooter>
    </Card>
  );
} 