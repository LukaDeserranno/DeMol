import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PlusIcon, PersonIcon } from '@radix-ui/react-icons';

interface Group {
  id: string;
  hasVotes?: boolean;
}

interface QuickLinksProps {
  groups: Group[];
}

export function QuickLinks({ groups }: QuickLinksProps) {
  const navigate = useNavigate();
  const hasVotes = groups.some(g => g.hasVotes);

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="p-5 border-b border-gray-100 bg-gray-50/80">
        <CardTitle className="text-lg font-bold text-gray-800">Snelkoppelingen</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start rounded-none h-16 px-5 transition-all duration-300 hover:bg-red-50 hover:text-red-700 hover:pl-6"
            onClick={() => navigate('/groups/create')}
          >
            <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <PlusIcon className="h-5 w-5 text-red-600" />
            </div>
            <span className="font-medium">Nieuwe Groep Aanmaken</span>
          </Button>

          <Button 
            variant="ghost" 
            className="w-full justify-start rounded-none h-16 px-5 transition-all duration-300 hover:bg-red-50 hover:text-red-700 hover:pl-6"
            onClick={() => navigate('/groups')}
          >
            <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <PersonIcon className="h-5 w-5 text-red-600" />
            </div>
            <span className="font-medium">Mijn Groepen</span>
          </Button>

          <Button 
            variant="ghost" 
            className="w-full justify-start rounded-none h-16 px-5 transition-all duration-300 hover:bg-red-50 hover:text-red-700 hover:pl-6"
            onClick={() => navigate('/candidates')}
          >
            <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="font-medium">Bekijk Kandidaten</span>
          </Button>

          {hasVotes && (
            <Button 
              variant="ghost" 
              className="w-full justify-start rounded-none h-16 px-5 transition-all duration-300 hover:bg-red-50 hover:text-red-700 hover:pl-6"
              onClick={() => {
                const groupWithVotes = groups.find(g => g.hasVotes);
                if (groupWithVotes) {
                  navigate(`/results?group=${groupWithVotes.id}`);
                }
              }}
            >
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <span className="font-medium">Bekijk Resultaten</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 