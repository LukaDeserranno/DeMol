import React, { useState, useEffect } from 'react';
import { 
  getAllVotingRounds, 
  createVotingRound, 
  updateVotingRound, 
  deleteVotingRound 
} from '@/firebase/votingService';
import { VotingRound } from '@/models/vote';
import { Button } from '@/components/ui/button';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Icons } from '@/components/ui/icons';
import { getActiveCandidates } from '@/firebase/candidateService';
import { Candidate } from '@/models/candidate';

export function AdminVotingRounds() {
  return (
    <ToastProvider>
      <AdminVotingRoundsContent />
    </ToastProvider>
  );
}

function AdminVotingRoundsContent() {
  const [rounds, setRounds] = useState<VotingRound[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRound, setEditingRound] = useState<VotingRound | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'upcoming' | 'active' | 'closed' | 'archived'>('upcoming');
  const [theme, setTheme] = useState('');
  const [eliminatedCandidateId, setEliminatedCandidateId] = useState<string>('');
  const [eliminationDate, setEliminationDate] = useState<string>('');
  
  // Load all voting rounds and candidates
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allRounds, activeCandidates] = await Promise.all([
        getAllVotingRounds(),
        getActiveCandidates()
      ]);
      
      setRounds(allRounds);
      setCandidates(activeCandidates);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Kon data niet laden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  // Handle edit button
  const handleEdit = (round: VotingRound) => {
    setEditingRound(round);
    setName(round.name);
    setDescription(round.description || '');
    setEpisodeNumber(round.episodeNumber);
    setStartDate(formatDateForInput(round.startDate));
    setEndDate(formatDateForInput(round.endDate));
    setIsActive(round.isActive);
    setStatus(round.status || 'upcoming');
    setTheme(round.theme || '');
    setEliminatedCandidateId(round.eliminatedCandidateId || '');
    setEliminationDate(round.eliminationDate ? formatDateForInput(round.eliminationDate) : '');
    setShowForm(true);
  };
  
  // Handle delete button
  const handleDelete = async (roundId: string) => {
    if (!confirm('Weet je zeker dat je deze stemronde wilt verwijderen?')) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await deleteVotingRound(roundId);
      toast({
        title: 'Verwijderd',
        description: 'Stemronde is verwijderd',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting voting round:', error);
      toast({
        title: 'Error',
        description: 'Kon stemronde niet verwijderen',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const roundData: Omit<VotingRound, 'id'> = {
        name,
        description: description || undefined,
        episodeNumber,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        status,
        theme: theme || undefined,
        eliminatedCandidateId: eliminatedCandidateId || undefined,
        eliminationDate: eliminationDate ? new Date(eliminationDate) : undefined,
      };
      
      if (editingRound) {
        // Update existing round
        await updateVotingRound(editingRound.id, roundData);
        toast({
          title: 'Geüpdatet',
          description: 'Stemronde is bijgewerkt',
        });
      } else {
        // Create new round
        await createVotingRound(roundData);
        toast({
          title: 'Aangemaakt',
          description: 'Nieuwe stemronde is aangemaakt',
        });
      }
      
      // Reset form and reload rounds
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving voting round:', error);
      toast({
        title: 'Error',
        description: 'Kon stemronde niet opslaan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setEditingRound(null);
    setName('');
    setDescription('');
    setEpisodeNumber(1);
    setStartDate('');
    setEndDate('');
    setIsActive(false);
    setStatus('upcoming');
    setTheme('');
    setEliminatedCandidateId('');
    setEliminationDate('');
    setShowForm(false);
  };
  
  // Format date for input field
  const formatDateForInput = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    return new Intl.DateTimeFormat('nl-BE', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(date));
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-900/30 text-blue-400 border border-blue-800';
      case 'active':
        return 'bg-green-900/50 text-green-400 border border-green-700';
      case 'closed':
        return 'bg-orange-900/30 text-orange-400 border border-orange-800';
      case 'archived':
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };
  
  // Get eliminated candidate name
  const getEliminatedCandidateName = (candidateId: string | undefined) => {
    if (!candidateId) return 'Niemand';
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.name : 'Onbekend';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Beheer Stemrondes</h1>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#2A9D8F] hover:bg-[#218276] transition-colors duration-300"
        >
          {showForm ? 'Annuleren' : (
            <span className="flex items-center gap-2">
              <Icons.plus className="h-4 w-4" />
              Nieuwe Stemronde
            </span>
          )}
        </Button>
      </div>
      
      {showForm && (
        <div className="bg-zinc-800/80 backdrop-blur-sm rounded-lg p-6 mb-8 border border-zinc-700/50 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-zinc-700/50">
            {editingRound ? 'Stemronde Bewerken' : 'Nieuwe Stemronde'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Naam
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                  placeholder="Ronde 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Aflevering Nummer
                </label>
                <input
                  type="number"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(parseInt(e.target.value))}
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Beschrijving
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                placeholder="Optionele beschrijving van deze stemronde"
                rows={2}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Thema (optioneel)
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                  placeholder="Bijv. 'Tunnelvisie'"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  required
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                >
                  <option value="upcoming">Aankomend</option>
                  <option value="active">Actief</option>
                  <option value="closed">Gesloten</option>
                  <option value="archived">Gearchiveerd</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Startdatum en -tijd
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Einddatum en -tijd
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Afgevallen kandidaat
                </label>
                <select
                  value={eliminatedCandidateId}
                  onChange={(e) => setEliminatedCandidateId(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                >
                  <option value="">Geen/Onbekend</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Afvallersdatum (optioneel)
                </label>
                <input
                  type="datetime-local"
                  value={eliminationDate}
                  onChange={(e) => setEliminationDate(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50"
                  disabled={!eliminatedCandidateId}
                />
              </div>
            </div>
            
            <div className="flex items-center border-t border-zinc-700/50 pt-4 mt-6">
              <input
                type="checkbox"
                id="is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 bg-zinc-700 border-zinc-600 rounded mr-2 focus:ring-[#2A9D8F]"
              />
              <label htmlFor="is-active" className="text-sm font-medium text-zinc-300">
                Actieve stemronde (vervangt huidige actieve ronde)
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-700/50 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                className="border-zinc-600 hover:bg-zinc-700"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2A9D8F] hover:bg-[#218276] transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Opslaan...
                  </>
                ) : (
                  editingRound ? 'Bijwerken' : 'Aanmaken'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin w-12 h-12 border-4 border-[#2A9D8F] border-t-transparent rounded-full"></div>
        </div>
      ) : rounds.length === 0 ? (
        <div className="bg-zinc-800/50 rounded-lg p-8 text-center border border-dashed border-zinc-700">
          <Icons.vote className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400 mb-4">Geen stemrondes gevonden. Maak een nieuwe stemronde aan.</p>
          <Button 
            onClick={() => setShowForm(true)}
            variant="outline"
            className="border-zinc-700 hover:border-[#2A9D8F]/50"
          >
            <span className="flex items-center gap-2">
              <Icons.plus className="h-4 w-4" />
              Nieuwe Stemronde
            </span>
          </Button>
        </div>
      ) : (
        <div className="bg-zinc-800/80 rounded-lg overflow-hidden border border-zinc-700/50 shadow-xl">
          <table className="w-full">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Naam
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Aflevering
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Periode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Afvaller
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {rounds.map((round) => (
                <tr key={round.id} className="hover:bg-zinc-700/30 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-white font-medium">{round.name}</p>
                      {round.theme && (
                        <p className="text-xs text-zinc-400 mt-1">Thema: {round.theme}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block w-fit ${getStatusBadge(round.status || 'upcoming')}`}>
                        {{
                          upcoming: 'Aankomend',
                          active: 'Actief',
                          closed: 'Gesloten',
                          archived: 'Gearchiveerd'
                        }[round.status || 'upcoming']}
                      </span>
                      {round.isActive && (
                        <span className="text-xs text-green-400">Huidige ronde</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-300">
                    {round.episodeNumber}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-zinc-300 text-sm">
                      {formatDateForDisplay(round.startDate)}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      tot {formatDateForDisplay(round.endDate)}
                    </p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`text-sm ${round.eliminatedCandidateId ? 'text-red-400' : 'text-zinc-500'}`}>
                      {getEliminatedCandidateName(round.eliminatedCandidateId)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(round)}
                      className="mr-2 border-zinc-700 hover:border-[#2A9D8F]"
                    >
                      <span className="flex items-center gap-1">
                        <Icons.pencil className="h-3 w-3" />
                        Bewerken
                      </span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(round.id)}
                      disabled={isSubmitting}
                    >
                      <span className="flex items-center gap-1">
                        <Icons.trash className="h-3 w-3" />
                        Verwijderen
                      </span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 