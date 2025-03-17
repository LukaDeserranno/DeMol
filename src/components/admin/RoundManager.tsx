import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, setDoc, updateDoc, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
import { PlusIcon, Cross2Icon, CheckIcon } from '@radix-ui/react-icons';

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
  createdAt: Date;
}

export default function RoundManager() {
  const [rounds, setRounds] = useState<VotingRound[]>([]);
  const [newRound, setNewRound] = useState({
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    weightFactor: 1,
    candidates: [
      { id: crypto.randomUUID(), name: '' }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { currentUser } = useAuth();

  useEffect(() => {
    async function checkAdminStatus() {
      if (!currentUser) return;
      
      try {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
          fetchRounds();
        } else {
          setError('You do not have permission to access this page.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error checking admin status:', err);
        setError('Failed to verify admin permissions.');
        setLoading(false);
      }
    }

    async function fetchRounds() {
      try {
        setLoading(true);
        setError('');
        
        const roundsQuery = query(
          collection(db, 'rounds'),
          orderBy('startDate', 'desc')
        );
        
        const querySnapshot = await getDocs(roundsQuery);
        const roundsData: VotingRound[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          roundsData.push({
            id: Number(doc.id),
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            candidates: data.candidates || [],
            weightFactor: data.weightFactor || 1,
            molRevealed: data.molRevealed || false,
            molId: data.molId,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        
        setRounds(roundsData);
      } catch (err: any) {
        console.error('Error fetching rounds:', err);
        setError('Failed to load voting rounds. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [currentUser]);

  function handleAddCandidate() {
    setNewRound({
      ...newRound,
      candidates: [
        ...newRound.candidates,
        { id: crypto.randomUUID(), name: '' }
      ]
    });
  }

  function handleRemoveCandidate(id: string) {
    if (newRound.candidates.length <= 1) {
      return; // Don't remove if it's the last candidate
    }
    
    setNewRound({
      ...newRound,
      candidates: newRound.candidates.filter(candidate => candidate.id !== id)
    });
  }

  function handleCandidateChange(id: string, name: string) {
    setNewRound({
      ...newRound,
      candidates: newRound.candidates.map(candidate => 
        candidate.id === id ? { ...candidate, name } : candidate
      )
    });
  }

  async function handleCreateRound(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!newRound.startDate || !newRound.endDate) {
      setError('Please set both start and end dates.');
      return;
    }
    
    const startDate = new Date(newRound.startDate);
    const endDate = new Date(newRound.endDate);
    
    if (endDate <= startDate) {
      setError('End date must be after start date.');
      return;
    }
    
    if (newRound.candidates.some(c => !c.name.trim())) {
      setError('All candidates must have a name.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Get the next round ID
      const nextRoundId = rounds.length > 0 
        ? Math.max(...rounds.map(r => r.id)) + 1 
        : 1;
      
      // Create the round document
      await setDoc(doc(db, 'rounds', nextRoundId.toString()), {
        startDate: startDate,
        endDate: endDate,
        candidates: newRound.candidates,
        weightFactor: newRound.weightFactor,
        molRevealed: false,
        createdAt: serverTimestamp(),
      });
      
      setSuccess(`Round ${nextRoundId} created successfully!`);
      
      // Reset form and refresh rounds
      setNewRound({
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        weightFactor: 1,
        candidates: [
          { id: crypto.randomUUID(), name: '' }
        ]
      });
      
      // Fetch updated rounds
      const roundsQuery = query(
        collection(db, 'rounds'),
        orderBy('startDate', 'desc')
      );
      
      const querySnapshot = await getDocs(roundsQuery);
      const roundsData: VotingRound[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        roundsData.push({
          id: Number(doc.id),
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          candidates: data.candidates || [],
          weightFactor: data.weightFactor || 1,
          molRevealed: data.molRevealed || false,
          molId: data.molId,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      setRounds(roundsData);
    } catch (err: any) {
      console.error('Error creating round:', err);
      setError('Failed to create voting round. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevealMol(roundId: number, candidateId: string) {
    if (!window.confirm('Are you sure you want to reveal the Mol? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'rounds', roundId.toString()), {
        molRevealed: true,
        molId: candidateId
      });
      
      // Update local state
      setRounds(rounds.map(round => 
        round.id === roundId 
          ? { ...round, molRevealed: true, molId: candidateId } 
          : round
      ));
      
      setSuccess(`The Mol has been revealed for Round ${roundId}!`);
    } catch (err: any) {
      console.error('Error revealing mol:', err);
      setError('Failed to reveal the Mol. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRound(roundId: number) {
    if (!window.confirm(`Are you sure you want to delete Round ${roundId}? This will also delete all votes for this round.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete the round
      await deleteDoc(doc(db, 'rounds', roundId.toString()));
      
      // Update local state
      setRounds(rounds.filter(round => round.id !== roundId));
      
      setSuccess(`Round ${roundId} has been deleted.`);
    } catch (err: any) {
      console.error('Error deleting round:', err);
      setError('Failed to delete the round. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Area</h1>
        <p className="text-red-500">{error || 'You do not have permission to access this page.'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Voting Round Manager</h1>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Voting Round</CardTitle>
            <CardDescription>Set up a new round for voting</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateRound}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={newRound.startDate}
                    onChange={(e) => setNewRound({ ...newRound, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newRound.endDate}
                    onChange={(e) => setNewRound({ ...newRound, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weightFactor">Weight Factor</Label>
                <Input
                  id="weightFactor"
                  type="number"
                  min="1"
                  step="0.1"
                  value={newRound.weightFactor}
                  onChange={(e) => setNewRound({ ...newRound, weightFactor: parseFloat(e.target.value) || 1 })}
                  required
                />
                <p className="text-xs text-gray-500">Higher values increase the importance of this round in calculating the final results.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Candidates</Label>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddCandidate}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {newRound.candidates.map((candidate, index) => (
                    <div key={candidate.id} className="flex items-center gap-2">
                      <Input
                        placeholder={`Candidate ${index + 1}`}
                        value={candidate.name}
                        onChange={(e) => handleCandidateChange(candidate.id, e.target.value)}
                        required
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRemoveCandidate(candidate.id)}
                        disabled={newRound.candidates.length <= 1}
                      >
                        <Cross2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Round'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Existing Rounds</h2>
          
          {loading ? (
            <p>Loading rounds...</p>
          ) : rounds.length === 0 ? (
            <p>No voting rounds found.</p>
          ) : (
            rounds.map((round) => (
              <Card key={round.id}>
                <CardHeader>
                  <CardTitle>Round {round.id}</CardTitle>
                  <CardDescription>
                    {round.startDate.toLocaleDateString('nl-BE')} - {round.endDate.toLocaleDateString('nl-BE')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Status: </span>
                      {new Date() < round.startDate 
                        ? 'Scheduled' 
                        : new Date() > round.endDate
                          ? 'Completed'
                          : 'Active'}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Candidates: </span>
                      {round.candidates.length}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Mol Revealed: </span>
                      {round.molRevealed ? 'Yes' : 'No'}
                    </div>
                    
                    {round.candidates.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Candidates:</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {round.candidates.map((candidate) => (
                            <div key={candidate.id} className="flex justify-between items-center">
                              <span className="text-sm">
                                {candidate.name}
                                {round.molRevealed && round.molId === candidate.id && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
                                    Mol
                                  </span>
                                )}
                              </span>
                              
                              {!round.molRevealed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevealMol(round.id, candidate.id)}
                                >
                                  <CheckIcon className="h-3 w-3 mr-1" />
                                  Set as Mol
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteRound(round.id)}
                  >
                    Delete Round
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 