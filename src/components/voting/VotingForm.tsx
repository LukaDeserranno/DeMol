import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

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
}

export default function VotingForm() {
  const [round, setRound] = useState<VotingRound | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [remainingPoints, setRemainingPoints] = useState(100);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCurrentRound() {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError('');

        // Find the current active round
        const roundsQuery = query(
          collection(db, 'rounds'),
          where('endDate', '>', new Date())
        );
        
        const querySnapshot = await getDocs(roundsQuery);
        
        if (querySnapshot.empty) {
          setError('No active voting round found');
          setLoading(false);
          return;
        }

        // Get the earliest active round (there should only be one)
        let currentRound: VotingRound | null = null;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.startDate && data.endDate) {
            const candidates = data.candidates || [];
            const roundData: VotingRound = {
              id: Number(doc.id),
              startDate: data.startDate.toDate(),
              endDate: data.endDate.toDate(),
              candidates: candidates,
              weightFactor: data.weightFactor || 1,
              molRevealed: data.molRevealed || false,
            };
            
            if (!currentRound || roundData.startDate < currentRound.startDate) {
              currentRound = roundData;
            }
          }
        });

        if (!currentRound) {
          setError('No active voting round found');
          setLoading(false);
          return;
        }

        setRound(currentRound);
        
        // Initialize votes object with 0 for each candidate
        const initialVotes: Record<string, number> = {};
        currentRound.candidates.forEach(candidate => {
          initialVotes[candidate.id] = 0;
        });
        
        // Check if user has already voted in this round
        const voteDoc = await getDoc(doc(db, 'votes', `${currentUser.uid}_${currentRound.id}`));
        
        if (voteDoc.exists()) {
          const voteData = voteDoc.data();
          setVotes(voteData.votes || initialVotes);
          
          // Calculate remaining points
          const usedPoints = Object.values(voteData.votes || {}).reduce((sum: number, points: number) => sum + points, 0);
          setRemainingPoints(100 - usedPoints);
        } else {
          setVotes(initialVotes);
        }
      } catch (err: any) {
        console.error('Error fetching current round:', err);
        setError('Failed to load voting round. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentRound();
  }, [currentUser]);

  function handleVoteChange(candidateId: string, value: string) {
    const points = Math.max(0, Math.min(100, parseInt(value) || 0));
    
    // Calculate total points excluding this candidate
    const otherCandidatesPoints = Object.entries(votes)
      .filter(([id]) => id !== candidateId)
      .reduce((sum, [, points]) => sum + points, 0);
    
    // Ensure total doesn't exceed 100
    const maxAllowedForThisCandidate = 100 - otherCandidatesPoints;
    const finalPoints = Math.min(points, maxAllowedForThisCandidate);
    
    const newVotes = { ...votes, [candidateId]: finalPoints };
    setVotes(newVotes);
    
    // Recalculate remaining points
    const totalPoints = Object.values(newVotes).reduce((sum, points) => sum + points, 0);
    setRemainingPoints(100 - totalPoints);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!round || !currentUser) {
      return;
    }

    // Validate votes total to 100
    const totalPoints = Object.values(votes).reduce((sum, points) => sum + points, 0);
    if (totalPoints !== 100) {
      setError(`You must distribute exactly 100 points. Currently: ${totalPoints} points.`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Save votes to Firestore
      await setDoc(doc(db, 'votes', `${currentUser.uid}_${round.id}`), {
        userId: currentUser.uid,
        roundId: round.id,
        votes: votes,
        groupId: groupId || null, // Store which group the vote was made from, if any
        timestamp: serverTimestamp(),
      });
      
      setSuccess('Your votes have been saved successfully!');
      
      // Navigate back to group or dashboard
      setTimeout(() => {
        if (groupId) {
          navigate(`/groups/${groupId}`);
        } else {
          navigate('/');
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error saving votes:', err);
      setError('Failed to save your votes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="container mx-auto py-6">Loading voting round...</div>;
  }

  if (error && !round) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-red-500 mb-4">{error}</p>
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
          <CardTitle>Voting for Round {round?.id}</CardTitle>
          <CardDescription>
            Distribute 100 points among the candidates. 
            Round ends on {round?.endDate.toLocaleDateString('nl-BE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted p-2 rounded">
                <span className="font-medium">Points Remaining:</span>
                <span className={`${remainingPoints < 0 ? 'text-red-500' : remainingPoints === 0 ? 'text-green-500' : ''} font-bold`}>
                  {remainingPoints}
                </span>
              </div>
              
              {round?.candidates.map((candidate) => (
                <div key={candidate.id} className="flex flex-col space-y-1.5">
                  <Label htmlFor={`vote-${candidate.id}`}>{candidate.name}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`vote-${candidate.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={votes[candidate.id] || 0}
                      onChange={(e) => handleVoteChange(candidate.id, e.target.value)}
                      disabled={submitting}
                      className="w-20"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={votes[candidate.id] || 0}
                      onChange={(e) => handleVoteChange(candidate.id, e.target.value)}
                      disabled={submitting}
                      className="flex-1"
                    />
                    <span className="w-10 text-right">{votes[candidate.id] || 0}%</span>
                  </div>
                </div>
              ))}
              
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-500">{success}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting || remainingPoints !== 0}
            >
              {submitting ? 'Saving...' : 'Submit Votes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 