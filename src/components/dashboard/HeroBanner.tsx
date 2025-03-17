import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface Candidate {
  id: string;
  name: string;
  age: number;
  image: string;
}

interface HeroBannerProps {
  featuredCandidate: Candidate;
  molLogo?: string;
}

export function HeroBanner({ featuredCandidate, molLogo = '/images/logo/de-mol-logo.png' }: HeroBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-72 md:h-96 lg:h-[450px] rounded-2xl overflow-hidden mb-10 bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
        style={{ 
          backgroundImage: `url(${featuredCandidate.image})`,
          opacity: 0.7
        }}
      ></div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-red-500 filter blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500 filter blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center text-white p-8">
        <img 
          src={molLogo} 
          alt="De Mol" 
          className="h-16 md:h-28 mb-6 drop-shadow-lg"
          onError={(e) => {
            e.currentTarget.src = "https://www.goplay.be/media/b0ajq2hs/de-mol-2024-play.png";
          }}
        />
        <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md">Wie is de Mol?</h1>
        <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl drop-shadow-sm">
          Verdeel 100 punten over de kandidaten die volgens jou de mol zijn
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            onClick={() => navigate('/groups')}
            className="bg-red-600 hover:bg-red-700 text-white border-0 px-6 py-6 h-auto text-lg font-medium rounded-xl transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
          >
            Naar Mijn Groepen
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://www.goplay.be/de-mol', '_blank')}
            className="bg-transparent border-white text-white hover:bg-white/20 px-6 py-6 h-auto text-lg rounded-xl transition-all duration-300"
          >
            GoPlay Website
          </Button>
        </div>
      </div>
    </div>
  );
} 