export interface Vote {
  id?: string;
  userId: string;
  roundId: string;
  candidateVotes: Record<string, number>; // Map of candidateId -> points
  totalPoints: number; // Should equal 100
  createdAt: Date;
  updatedAt: Date;
}

export interface VotingRound {
  id: string;
  name: string;
  description?: string; // Description of the round (optional)
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  episodeNumber: number;
  status: 'upcoming' | 'active' | 'closed' | 'archived'; // Current status of the round
  eliminatedCandidateId?: string; // ID of the candidate eliminated in this round (if any)
  eliminationDate?: Date; // When the elimination occurred
  theme?: string; // Theme or special focus of this episode
  votingStats?: {
    totalVotes: number; // Number of users who voted in this round
    lastUpdated: Date; // When the stats were last calculated
  };
} 