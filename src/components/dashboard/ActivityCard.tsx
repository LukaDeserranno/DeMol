import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface Group {
  id: string;
  activeRound?: string;
  hasVotes?: boolean;
}

interface ActivityCardProps {
  groups: Group[];
}

export function ActivityCard({ groups }: ActivityCardProps) {
  const hasActiveRounds = groups.some(g => g.activeRound);
  const hasVotes = groups.some(g => g.hasVotes);

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold">Recente Activiteit</CardTitle>
        <CardDescription className="mt-1">
          Blijf op de hoogte van activiteiten in je groepen
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {hasActiveRounds ? (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-lg text-green-800">Nieuwe Stemronde</h4>
                <p className="text-green-700/80">Er zijn actieve stemrondes in je groepen</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-4 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-lg text-gray-700">Geen Actieve Rondes</h4>
                <p className="text-gray-600">Er zijn momenteel geen actieve stemrondes</p>
              </div>
            </div>
          )}

          {hasVotes && (
            <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-lg text-blue-800">Resultaten Beschikbaar</h4>
                <p className="text-blue-700/80">Bekijk wie volgens de groep de mol is</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 