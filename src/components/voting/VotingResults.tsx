import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  doc, getDoc, collection, query, where, getDocs, 
  documentId, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ArrowLeftIcon, BarChartIcon } from '@radix-ui/react-icons';

interface Candidate {
  id: string;
  name: string;
}

interface VotingRound {
  id: number;
  startDate: Date;
  endDate: Date;
  candidates: Candidate[];
  weightFactor: number;
  molRevealed: boolean;
  molId?: string;
}

interface Vote {
  userId: string;
  userEmail?: string;
  userName?: string;
  roundId: number;
  votes: Record<string, number>;
  timestamp: Date;
}

interface CandidateResult {
  id: string;
  name: string;
  totalPoints: number;
  percentage: number;
  isMol: boolean;
}

export default function VotingResults() {
  const [round, setRound] = useState<VotingRound | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [candidateResults, setCandidateResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const roundId = searchParams.get('round');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError('');

        // Determine which round to display
        let roundDocRef;
        if (roundId) {
          // Specific round requested
          roundDocRef = doc(db, 'rounds', roundId);
        } else {
          // Get the most recently completed round
          const roundsQuery = query(
            collection(db, 'rounds'),
            where('endDate', '<', new Date()),
            orderBy('endDate', 'desc'),
            limit(1)
          );
          
          const roundsSnapshot = await getDocs(roundsQuery);
          if (roundsSnapshot.empty) {
            setError('No completed voting rounds found');
            setLoading(false);
            return;
          }
          
          roundDocRef = roundsSnapshot.docs[0].ref;
        }

        // Fetch the round data
        const roundDoc = await getDoc(roundDocRef);
        if (!roundDoc.exists()) {
          setError('Round not found');
          setLoading(false);
          return;
        }

        const roundData = roundDoc.data();
        const roundObj: VotingRound = {
          id: Number(roundDoc.id),
          startDate: roundData.startDate.toDate(),
          endDate: roundData.endDate.toDate(),
          candidates: roundData.candidates || [],
          weightFactor: roundData.weightFactor || 1,
          molRevealed: roundData.molRevealed || false,
          molId: roundData.molId
        };

        setRound(roundObj);

        // Fetch votes for this round
        let votesQuery;
        if (groupId) {
          // Get votes only from this group
          votesQuery = query(
            collection(db, 'votes'),
            where('roundId', '==', roundObj.id),
            where('groupId', '==', groupId)
          );
        } else {
          // Get all votes for this round for the current user
          votesQuery = query(
            collection(db, 'votes'),
            where('roundId', '==', roundObj.id),
            where('userId', '==', currentUser.uid)
          );
        }

        const votesSnapshot = await getDocs(votesQuery);
        const votesData: Vote[] = [];

        // Fetch user details for each vote if in a group context
        if (groupId) {
          const userIds = new Set<string>();
          votesSnapshot.forEach(doc => {
            const data = doc.data();
            userIds.add(data.userId);
          });

          // Get user details
          const usersSnapshot = await getDocs(query(
            collection(db, 'users'),
            where(documentId(), 'in', Array.from(userIds))
          ));

          const usersMap = new Map<string, { email?: string, displayName?: string }>();
          usersSnapshot.forEach(doc => {
            const userData = doc.data();
            usersMap.set(doc.id, {
              email: userData.email,
              displayName: userData.displayName
            });
          });

          // Add user details to votes
          votesSnapshot.forEach(doc => {
            const data = doc.data();
            const userData = usersMap.get(data.userId);
            votesData.push({
              userId: data.userId,
              userEmail: userData?.email,
              userName: userData?.displayName,
              roundId: data.roundId,
              votes: data.votes || {},
              timestamp: data.timestamp?.toDate() || new Date(),
            });
          });
        } else {
          // Just get the current user's votes
          votesSnapshot.forEach(doc => {
            const data = doc.data();
            votesData.push({
              userId: data.userId,
              roundId: data.roundId,
              votes: data.votes || {},
              timestamp: data.timestamp?.toDate() || new Date(),
            });
          });
        }

        setVotes(votesData);

        // Calculate results per candidate
        const results: CandidateResult[] = roundObj.candidates.map(candidate => {
          let totalPoints = 0;
          
          votesData.forEach(vote => {
            totalPoints += vote.votes[candidate.id] || 0;
          });
          
          return {
            id: candidate.id,
            name: candidate.name,
            totalPoints,
            percentage: votesData.length > 0 ? (totalPoints / votesData.length) : 0,
            isMol: roundObj.molRevealed && roundObj.molId === candidate.id
          };
        });
        
        // Sort by points (highest first)
        results.sort((a, b) => b.totalPoints - a.totalPoints);
        
        setCandidateResults(results);
      } catch (err: any) {
        console.error('Error fetching voting results:', err);
        setError('Failed to load voting results. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser, roundId, groupId]);

  function getProgressBarColor(percentage: number, isMol: boolean) {
    if (round?.molRevealed && isMol) {
      return 'bg-red-500'; // Mol color
    }
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  }

  if (loading) {
    return <div className="container mx-auto py-6">Loading voting results...</div>;
  }

  if (error || !round) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-red-500 mb-4">{error || 'Could not load round data'}</p>
        <Button onClick={() => navigate(groupId ? `/groups/${groupId}` : '/')}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          {groupId ? 'Back to Group' : 'Back to Dashboard'}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-lg">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate(groupId ? `/groups/${groupId}` : '/')}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        {groupId ? 'Back to Group' : 'Back to Dashboard'}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5" />
            Results for Round {round.id}
          </CardTitle>
          <CardDescription>
            {round.molRevealed ? (
              <span className="font-medium">
                The Mol has been revealed!
              </span>
            ) : (
              <span>
                Round ended on {round.endDate.toLocaleDateString('nl-BE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {votes.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No votes found for this round.
              </p>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  {groupId ? `${votes.length} members voted in this round` : 'Your votes'}
                </div>

                {candidateResults.map((result) => (
                  <div key={result.id} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center gap-1">
                        {result.name}
                        {round.molRevealed && result.isMol && (
                          <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
                            Mol
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-mono">
                        {result.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${getProgressBarColor(result.percentage, result.isMol)}`} 
                        style={{ width: `${result.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
        {groupId && votes.length > 0 && (
          <CardFooter className="flex-col items-start">
            <h3 className="font-medium mb-3">Individual Votes</h3>
            <div className="space-y-4 w-full">
              {votes.map((vote) => (
                <div key={vote.userId} className="border-t pt-3">
                  <div className="font-medium mb-2">
                    {vote.userName || vote.userEmail || 'Anonymous User'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(vote.votes).map(([candidateId, points]) => {
                      const candidate = round.candidates.find(c => c.id === candidateId);
                      return candidate ? (
                        <div key={candidateId} className="flex justify-between">
                          <span>{candidate.name}</span>
                          <span className="font-mono">{points}%</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 