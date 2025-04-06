import React, { useState, useEffect } from 'react';
import { Candidate } from '@/models/candidate';
import { Vote, VotingRound } from '@/models/vote';
import { VotingSlider } from './VotingSlider';
import { getAllCandidates } from '@/firebase/candidateService';
import { getActiveVotingRound, getUserVoteForRound, submitVote } from '@/firebase/votingService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface VotingFormProps {
  userId: string;
}

export function VotingForm({ userId }: VotingFormProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentRound, setCurrentRound] = useState<VotingRound | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [remainingPoints, setRemainingPoints] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingVote, setHasExistingVote] = useState(false);
  const { toast } = useToast();

  // Load candidates, active round, and existing votes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all candidates
        const allCandidates = await getAllCandidates();
        setCandidates(allCandidates);
        
        // Get active voting round
        const round = await getActiveVotingRound();
        setCurrentRound(round);
        
        if (round && userId) {
          // Initialize votes with 0 points for each candidate
          const initialVotes: Record<string, number> = {};
          allCandidates.forEach(candidate => {
            initialVotes[candidate.id] = 0;
          });
          
          // Check if user already voted in this round
          const existingVote = await getUserVoteForRound(userId, round.id);
          
          if (existingVote) {
            // Use existing votes
            setVotes(existingVote.candidateVotes);
            setHasExistingVote(true);
            
            // Calculate remaining points (should be 0 if already distributed all points)
            const usedPoints = Object.values(existingVote.candidateVotes).reduce((sum, points) => sum + points, 0);
            setRemainingPoints(100 - usedPoints);
          } else {
            // Use initial votes
            setVotes(initialVotes);
            setHasExistingVote(false);
            setRemainingPoints(100);
          }
        } else {
          // No active round, use initial votes
          const initialVotes: Record<string, number> = {};
          allCandidates.forEach(candidate => {
            initialVotes[candidate.id] = 0;
          });
          setVotes(initialVotes);
          setHasExistingVote(false);
          setRemainingPoints(100);
        }
      } catch (err) {
        console.error('Error loading voting data:', err);
        setError('Er is een fout opgetreden bij het laden van de stemgegevens.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      loadData();
    }
  }, [userId]);

  // Handle vote change
  const handleVoteChange = (candidateId: string, points: number) => {
    // Get current points for this candidate
    const currentPoints = votes[candidateId] || 0;
    
    // Calculate point difference
    const pointDifference = points - currentPoints;
    
    // Check if we have enough remaining points
    if (remainingPoints - pointDifference < 0) {
      // Not enough points remaining, adjust the value
      const maxAllowedPoints = currentPoints + remainingPoints;
      points = maxAllowedPoints;
    }
    
    // Update votes and remaining points
    setVotes(prev => ({
      ...prev,
      [candidateId]: points
    }));
    
    // Recalculate remaining points
    const newRemainingPoints = remainingPoints - (points - currentPoints);
    setRemainingPoints(newRemainingPoints);
  };

  // Reset all votes to 0
  const handleReset = () => {
    const resetVotes: Record<string, number> = {};
    candidates.forEach(candidate => {
      resetVotes[candidate.id] = 0;
    });
    setVotes(resetVotes);
    setRemainingPoints(100);
  };

  // Distribute remaining points evenly among all candidates
  const handleDistributeEvenly = () => {
    if (candidates.length === 0) return;
    
    // Only distribute points to non-eliminated candidates
    const activeCandidates = candidates.filter(candidate => !candidate.eliminated);
    if (activeCandidates.length === 0) return;
    
    const pointsPerCandidate = Math.floor(100 / activeCandidates.length);
    const remainder = 100 % activeCandidates.length;
    
    const evenVotes: Record<string, number> = {};
    candidates.forEach(candidate => {
      if (candidate.eliminated) {
        // Keep eliminated candidates at 0
        evenVotes[candidate.id] = 0;
      } else {
        // Find the index of this candidate in the active candidates array
        const activeIndex = activeCandidates.findIndex(ac => ac.id === candidate.id);
        // Add an extra point to the first 'remainder' candidates to handle any leftover points
        evenVotes[candidate.id] = pointsPerCandidate + (activeIndex < remainder ? 1 : 0);
      }
    });
    
    setVotes(evenVotes);
    setRemainingPoints(0);
  };

  // Submit votes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !currentRound) {
      toast({
        title: "Fout",
        description: "Je moet ingelogd zijn en er moet een actieve stemronde zijn.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if all points are distributed
    const totalPoints = Object.values(votes).reduce((sum, points) => sum + points, 0);
    if (totalPoints !== 100) {
      toast({
        title: "Fout",
        description: `Je moet 100 punten verdelen. Je hebt nu ${totalPoints} punten verdeeld.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Submit vote
      await submitVote({
        userId,
        roundId: currentRound.id,
        candidateVotes: votes,
        totalPoints: 100
      });
      
      toast({
        title: "Stemmen opgeslagen",
        description: "Je stem is succesvol opgeslagen.",
      });
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError('Er is een fout opgetreden bij het opslaan van je stem.');
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van je stem.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6 min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-[#2A9D8F] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <h3 className="text-red-500 font-medium mb-2">Error</h3>
        <p className="text-zinc-300">{error}</p>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Probeer opnieuw
        </Button>
      </div>
    );
  }
  
  if (!currentRound) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
        <h3 className="text-xl font-medium text-white mb-2">Geen actieve stemronde</h3>
        <p className="text-zinc-400">
          Er is momenteel geen actieve stemronde. Kom later terug om je stem uit te brengen.
        </p>
      </div>
    );
  }
  
  if (candidates.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
        <h3 className="text-xl font-medium text-white mb-2">Geen kandidaten</h3>
        <p className="text-zinc-400">
          Er zijn geen kandidaten om op te stemmen.
        </p>
      </div>
    );
  }
  
  // Calculate deadline string
  const deadlineDate = new Date(currentRound.endDate);
  const formattedDeadline = new Intl.DateTimeFormat('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: 'numeric'
  }).format(deadlineDate);
  
  return (
    <div className="bg-zinc-900 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          {currentRound.name}
        </h2>
        <p className="text-zinc-400 mb-4">
          Verdeel 100 punten over de kandidaten. Wie krijgt jouw verdenking?
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-800/80 rounded-lg p-4 mb-6 gap-3 sm:gap-0">
          <div>
            <p className="text-zinc-300">Resterende punten:</p>
            <p className={`text-2xl font-bold ${remainingPoints === 0 ? 'text-green-500' : 'text-[#2A9D8F]'}`}>
              {remainingPoints}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-zinc-300">Deadline:</p>
            <p className="text-zinc-400 text-sm">{formattedDeadline}</p>
          </div>
        </div>
        
        {hasExistingVote && (
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4 mb-4">
            <h3 className="text-amber-400 font-medium mb-1">Je hebt al gestemd</h3>
            <p className="text-zinc-300 text-sm">
              Je kunt je stem voor deze ronde niet meer wijzigen. Hieronder zie je hoe je je 100 punten hebt verdeeld.
            </p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {candidates.map(candidate => (
            <div key={candidate.id} className={`relative ${candidate.eliminated ? 'opacity-90' : ''}`}>
              {candidate.eliminated && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-red-900/30 z-10 rounded-lg"></div>
                  <div className="absolute top-0 left-0 w-full h-full z-20 flex items-center justify-center">
                    <div className="bg-gradient-to-r from-purple-600 to-red-600 text-white px-4 py-2 rounded-lg shadow-lg transform -rotate-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Geëlimineerd</span>
                    </div>
                  </div>
                </>
              )}
              <VotingSlider
                candidate={candidate}
                points={votes[candidate.id] || 0}
                onChange={handleVoteChange}
                disabled={isSubmitting || hasExistingVote || candidate.eliminated}
                maxPoints={100}
                availablePoints={remainingPoints}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting || remainingPoints === 100 || hasExistingVote}
              className="flex-1 sm:flex-none"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDistributeEvenly}
              disabled={isSubmitting || remainingPoints === 0 || hasExistingVote}
              className="flex-1 sm:flex-none"
            >
              Verdeel gelijk
            </Button>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || remainingPoints !== 0 || hasExistingVote}
            className={`${
              remainingPoints !== 0 || hasExistingVote 
                ? 'bg-zinc-700' 
                : 'bg-[#2A9D8F] hover:bg-[#218276]'
            } w-full sm:w-auto mt-2 sm:mt-0`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Opslaan...
              </>
            ) : hasExistingVote ? (
              "Al gestemd"
            ) : (
              "Stem opslaan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 