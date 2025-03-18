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
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden mb-6 sm:mb-10 bg-gray-900">
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
      
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center text-white p-4 sm:p-6 md:p-8">
        <img 
          src={molLogo} 
          alt="De Mol" 
          className="h-12 sm:h-16 md:h-20 lg:h-28 mb-3 sm:mb-4 md:mb-6 drop-shadow-lg"
          onError={(e) => {
            e.currentTarget.src = "https://www.goplay.be/media/b0ajq2hs/de-mol-2024-play.png";
          }}
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 drop-shadow-md">Wie is de Mol?</h1>
        <p className="text-base sm:text-lg md:text-xl opacity-90 mb-4 sm:mb-6 md:mb-8 max-w-xs sm:max-w-md md:max-w-2xl drop-shadow-sm px-2">
          Verdeel 100 punten over de kandidaten die volgens jou de mol zijn
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto justify-center px-4 sm:px-0">
          <Button 
            onClick={() => navigate('/groups')}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 h-auto text-base sm:text-lg font-medium rounded-xl transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
          >
            Naar Mijn Groepen
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://www.goplay.be/de-mol', '_blank')}
            className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/20 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 h-auto text-base sm:text-lg rounded-xl transition-all duration-300"
          >
            GoPlay Website
          </Button>
        </div>
      </div>
    </div>
  );
} 