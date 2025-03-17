import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PlusIcon, PersonIcon, ArrowRightIcon, MagnifyingGlassIcon, ReloadIcon } from '@radix-ui/react-icons';

interface Group {
  id: string;
  name: string;
  members: string[];
  createdAt: any;
  hasVotes?: boolean;
  activeRound?: string;
}

interface GroupsCardProps {
  groups: Group[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export function GroupsCard({ groups, loading, error, onRefresh }: GroupsCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Mijn Groepen</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh} 
            disabled={loading}
            className="text-white hover:bg-white/20 transition-all duration-300"
          >
            <ReloadIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        </div>
        <CardDescription className="text-gray-100 opacity-90 mt-2">
          Beheer je groepen en stem op wie de mol is
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-2/3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={onRefresh}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300"
            >
              <ReloadIcon className="h-4 w-4 mr-2" />
              Probeer opnieuw
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <PlusIcon className="h-10 w-10 text-red-400" />
            </div>
            <p className="text-gray-500 mb-6 text-lg">Je hebt nog geen groepen</p>
            <Button 
              onClick={() => navigate('/groups/create')} 
              className="bg-red-600 hover:bg-red-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-6 py-6 h-auto text-lg font-medium rounded-xl"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Maak Een Groep
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-300"
              >
                <div>
                  <h3 className="font-medium text-lg mb-1">{group.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <PersonIcon className="h-3.5 w-3.5 mr-1" />
                    <span>{group.members.length} leden</span>
                    {group.activeRound && (
                      <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                        Actieve Ronde
                      </Badge>
                    )}
                    {group.hasVotes && (
                      <Badge variant="outline" className="ml-2">
                        Resultaten Beschikbaar
                      </Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300 rounded-lg"
                >
                  <span className="mr-1">Details</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50/70 border-t p-4">
        <Button 
          onClick={() => navigate('/groups')}
          variant="outline"
          className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300"
        >
          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
          Bekijk Alle Groepen
        </Button>
      </CardFooter>
    </Card>
  );
} 