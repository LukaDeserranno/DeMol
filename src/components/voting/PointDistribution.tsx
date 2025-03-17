import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

// Model for a candidate
interface Candidate {
  id: string;
  name: string;
  age: number;
  points: number;
}

// 2025 De Mol candidates from goplay.be/de-mol
const DEFAULT_CANDIDATES: Candidate[] = [
  { id: 'sarah', name: 'Sarah', age: 36, points: 0 },
  { id: 'michele', name: 'Michèle', age: 35, points: 0 },
  { id: 'pedro', name: 'Pedro', age: 41, points: 0 },
  { id: 'nimrod', name: 'Nimrod', age: 25, points: 0 },
  { id: 'pasquino', name: 'Pasquino', age: 33, points: 0 },
  { id: 'rusiana', name: 'Rusiana', age: 39, points: 0 },
  { id: 'alexy', name: 'Alexy', age: 23, points: 0 },
  { id: 'els', name: 'Els', age: 28, points: 0 },
  { id: 'hilde', name: 'Hilde', age: 57, points: 0 },
  { id: 'jan', name: 'Jan', age: 40, points: 0 },
];

export default function PointDistribution() {
  const [candidates, setCandidates] = useState<Candidate[]>(DEFAULT_CANDIDATES);
  const [remainingPoints, setRemainingPoints] = useState(100);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupName, setGroupName] = useState('');
  const [hasActiveRound, setHasActiveRound] = useState(false);

  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGroupAndVotes() {
      if (!groupId || !currentUser) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Get the group data for display
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          setGroupName(groupData.name || 'Unnamed Group');
          
          // Check if there's an active round
          const activeRound = groupData.activeRound;
          setHasActiveRound(!!activeRound);
          
          if (!activeRound) {
            setLoading(false);
            return;
          }
        } else {
          setError('Group not found.');
          setLoading(false);
          return;
        }

        // Check if user has already distributed points
        const voteDoc = await getDoc(doc(db, 'votes', `${groupId}_${currentUser.uid}`));
        
        if (voteDoc.exists()) {
          const voteData = voteDoc.data();
          const savedCandidates = voteData.candidates || [];
          
          // Apply saved points to candidates
          const updatedCandidates = candidates.map(candidate => {
            const savedCandidate = savedCandidates.find((c: any) => c.id === candidate.id);
            return {
              ...candidate,
              points: savedCandidate ? savedCandidate.points : 0
            };
          });
          
          setCandidates(updatedCandidates);
          calculateRemainingPoints(updatedCandidates);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your previous votes. You can still distribute points.');
      } finally {
        setLoading(false);
      }
    }

    fetchGroupAndVotes();
  }, [groupId, currentUser]);

  function calculateRemainingPoints(candidatesList: Candidate[]) {
    const totalAllocated = candidatesList.reduce((total, candidate) => total + candidate.points, 0);
    setRemainingPoints(100 - totalAllocated);
  }

  function handlePointChange(candidateId: string, newPoints: number) {
    const updatedCandidates = candidates.map(candidate => {
      if (candidate.id === candidateId) {
        return { ...candidate, points: newPoints };
      }
      return candidate;
    });
    
    setCandidates(updatedCandidates);
    calculateRemainingPoints(updatedCandidates);
  }

  function handleSliderChange(candidateId: string, value: number[]) {
    handlePointChange(candidateId, value[0]);
  }

  function handleInputChange(candidateId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    
    if (Number.isNaN(numericValue)) {
      return;
    }
    
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    const currentPoints = candidate.points;
    const otherPointsTotal = candidates.reduce((total, c) => 
      c.id === candidateId ? total : total + c.points, 0);
    
    // Ensure the new total doesn't exceed 100
    const maxPossiblePoints = 100 - otherPointsTotal;
    const clampedValue = Math.min(Math.max(0, numericValue), maxPossiblePoints);
    
    handlePointChange(candidateId, clampedValue);
  }

  async function handleSubmit() {
    if (!currentUser || !groupId) return;
    
    if (remainingPoints !== 0) {
      setError(`You still have ${remainingPoints} points to distribute. Please allocate all 100 points.`);
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare data for saving
      const voteData = {
        userId: currentUser.uid,
        groupId: groupId,
        candidates: candidates.map(({ id, name, points }) => ({ id, name, points })),
        timestamp: serverTimestamp(),
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'votes', `${groupId}_${currentUser.uid}`), voteData);
      
      // Record voting activity in the group
      try {
        await updateDoc(doc(db, 'groups', groupId), {
          lastActivity: serverTimestamp(),
          hasVotes: true
        });
      } catch (err) {
        // Non-critical error, don't show to user
        console.error('Failed to update group activity:', err);
      }
      
      setSuccess('Your vote has been submitted successfully!');
      
      // Navigate back to group after a short delay
      setTimeout(() => {
        navigate(`/groups/${groupId}`);
      }, 2000);
    } catch (err) {
      console.error('Error saving votes:', err);
      setError('Failed to submit your vote. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function distributeRemainingPointsEvenly() {
    if (remainingPoints <= 0) return;
    
    const candidatesWithPoints = candidates.filter(c => c.points > 0);
    const candidatesToDistribute = candidates.filter(c => c.points === 0);
    
    if (candidatesToDistribute.length === 0) {
      // All candidates have some points, distribute evenly among all
      const pointsPerCandidate = Math.floor(remainingPoints / candidates.length);
      const extraPoints = remainingPoints - (pointsPerCandidate * candidates.length);
      
      const updatedCandidates = candidates.map((candidate, index) => ({
        ...candidate,
        points: candidate.points + pointsPerCandidate + (index < extraPoints ? 1 : 0)
      }));
      
      setCandidates(updatedCandidates);
      calculateRemainingPoints(updatedCandidates);
    } else {
      // Distribute only among candidates with no points
      const pointsPerCandidate = Math.floor(remainingPoints / candidatesToDistribute.length);
      const extraPoints = remainingPoints - (pointsPerCandidate * candidatesToDistribute.length);
      
      let updatedCandidates = [...candidates];
      let extraPointsDistributed = 0;
      
      updatedCandidates = updatedCandidates.map(candidate => {
        if (candidate.points === 0) {
          // Add extra point if needed
          const addExtraPoint = extraPointsDistributed < extraPoints;
          if (addExtraPoint) extraPointsDistributed++;
          
          return {
            ...candidate,
            points: pointsPerCandidate + (addExtraPoint ? 1 : 0)
          };
        }
        return candidate;
      });
      
      setCandidates(updatedCandidates);
      calculateRemainingPoints(updatedCandidates);
    }
  }

  function resetPoints() {
    setCandidates(candidates.map(candidate => ({ ...candidate, points: 0 })));
    setRemainingPoints(100);
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate(`/groups/${groupId}`)}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Group
      </Button>
      
      {!hasActiveRound && !loading ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>No Active Voting Round</CardTitle>
            <CardDescription>
              {groupName ? `For group: ${groupName}` : 'Unable to vote at this time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <p className="mb-4">There is no active voting round for this group.</p>
              <p className="text-sm text-muted-foreground">
                Voting rounds are created by the group administrator.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => navigate(`/groups/${groupId}`)}
            >
              Return to Group
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vote with 100 Points</CardTitle>
            <CardDescription>
              {groupName ? `Voting for group: ${groupName}` : 'Cast your vote by allocating points'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p>Distribute 100 points among the candidates based on who you think is the Mol. Give more points to those you suspect most!</p>
              
              <div className="flex items-center justify-between mt-4 mb-2">
                <div className="text-lg font-medium">
                  Remaining points: 
                  <span className={remainingPoints === 0 ? "text-green-500 ml-2" : "text-orange-500 ml-2"}>
                    {remainingPoints}
                  </span>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={distributeRemainingPointsEvenly}
                    disabled={remainingPoints <= 0}
                  >
                    Distribute Evenly
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetPoints}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="py-4 text-center">
                <div className="animate-pulse h-4 w-1/3 bg-muted rounded mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your saved points...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`candidate-${candidate.id}`} className="text-base">
                        {candidate.name} ({candidate.age})
                      </Label>
                      <div className="w-16">
                        <Input
                          id={`candidate-${candidate.id}`}
                          type="number"
                          min="0"
                          max="100"
                          value={candidate.points}
                          onChange={(e) => handleInputChange(candidate.id, e)}
                          className="text-center"
                        />
                      </div>
                    </div>
                    <Slider
                      id={`slider-${candidate.id}`}
                      value={[candidate.points]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => handleSliderChange(candidate.id, value)}
                      className="cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/groups/${groupId}`)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saving || remainingPoints !== 0}
            >
              {saving ? 'Saving...' : 'Submit Vote'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
    </div>
  );
} 