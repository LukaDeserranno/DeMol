import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, serverTimestamp, orderBy, limit, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from './config';
import { Vote, VotingRound } from '../models/vote';

// Collection references
const VOTES_COLLECTION = 'votes';
const ROUNDS_COLLECTION = 'votingRounds';

/**
 * Submit a vote for a user in a specific round
 */
export const submitVote = async (vote: Omit<Vote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Verify total points equals 100
    const totalPoints = Object.values(vote.candidateVotes).reduce((sum, points) => sum + points, 0);
    if (totalPoints !== 100) {
      throw new Error('Total points must equal 100');
    }

    // Check if user already has a vote for this round
    const existingVote = await getUserVoteForRound(vote.userId, vote.roundId);
    
    if (existingVote) {
      // Update existing vote
      const voteRef = doc(db, VOTES_COLLECTION, existingVote.id!);
      await updateDoc(voteRef, {
        candidateVotes: vote.candidateVotes,
        totalPoints,
        updatedAt: serverTimestamp()
      });
      return existingVote.id!;
    } else {
      // Create new vote
      const voteData = {
        ...vote,
        totalPoints,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, VOTES_COLLECTION), voteData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
};

/**
 * Get a user's vote for a specific round
 */
export const getUserVoteForRound = async (userId: string, roundId: string): Promise<Vote | null> => {
  try {
    const votesRef = collection(db, VOTES_COLLECTION);
    const q = query(
      votesRef,
      where('userId', '==', userId),
      where('roundId', '==', roundId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const voteDoc = querySnapshot.docs[0];
    const voteData = voteDoc.data();
    
    return {
      id: voteDoc.id,
      userId: voteData.userId,
      roundId: voteData.roundId,
      candidateVotes: voteData.candidateVotes || {},
      totalPoints: voteData.totalPoints || 0,
      createdAt: voteData.createdAt?.toDate() || new Date(),
      updatedAt: voteData.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting user vote:', error);
    throw error;
  }
};

/**
 * Get all votes for a user
 */
export const getUserVotes = async (userId: string): Promise<Vote[]> => {
  try {
    const votesRef = collection(db, VOTES_COLLECTION);
    const q = query(
      votesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const votes: Vote[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      votes.push({
        id: doc.id,
        userId: data.userId,
        roundId: data.roundId,
        candidateVotes: data.candidateVotes || {},
        totalPoints: data.totalPoints || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return votes;
  } catch (error) {
    console.error('Error getting user votes:', error);
    throw error;
  }
};

/**
 * Get the active voting round
 */
export const getActiveVotingRound = async (): Promise<VotingRound | null> => {
  try {
    const roundsRef = collection(db, ROUNDS_COLLECTION);
    const q = query(
      roundsRef,
      where('isActive', '==', true),
      orderBy('startDate', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const roundDoc = querySnapshot.docs[0];
    const data = roundDoc.data();
    
    return {
      id: roundDoc.id,
      name: data.name || `Ronde ${data.episodeNumber}`,
      description: data.description,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      isActive: data.isActive === true,
      episodeNumber: data.episodeNumber || 0,
      status: data.status || 'active',
      eliminatedCandidateId: data.eliminatedCandidateId,
      eliminationDate: data.eliminationDate?.toDate(),
      theme: data.theme,
      votingStats: data.votingStats
    };
  } catch (error) {
    console.error('Error getting active voting round:', error);
    throw error;
  }
};

/**
 * Get all voting rounds
 */
export const getAllVotingRounds = async (): Promise<VotingRound[]> => {
  try {
    const roundsRef = collection(db, ROUNDS_COLLECTION);
    const q = query(roundsRef, orderBy('startDate', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const rounds: VotingRound[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      rounds.push({
        id: doc.id,
        name: data.name || `Ronde ${data.episodeNumber}`,
        description: data.description,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        isActive: data.isActive === true,
        episodeNumber: data.episodeNumber || 0,
        status: data.status || 'active',
        eliminatedCandidateId: data.eliminatedCandidateId,
        eliminationDate: data.eliminationDate?.toDate(),
        theme: data.theme,
        votingStats: data.votingStats
      });
    });
    
    return rounds;
  } catch (error) {
    console.error('Error getting voting rounds:', error);
    throw error;
  }
};

/**
 * Create a new voting round
 */
export const createVotingRound = async (round: Omit<VotingRound, 'id'>): Promise<string> => {
  try {
    // If this round is active, deactivate any other active rounds first
    if (round.isActive) {
      await deactivateAllRounds();
    }

    const roundData = {
      name: round.name,
      description: round.description,
      startDate: round.startDate,
      endDate: round.endDate,
      isActive: round.isActive,
      episodeNumber: round.episodeNumber,
      status: round.status,
      eliminatedCandidateId: round.eliminatedCandidateId,
      eliminationDate: round.eliminationDate,
      theme: round.theme,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, ROUNDS_COLLECTION), roundData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating voting round:', error);
    throw error;
  }
};

/**
 * Update a voting round
 */
export const updateVotingRound = async (roundId: string, updates: Partial<VotingRound>): Promise<void> => {
  try {
    // If setting this round to active, deactivate other rounds first
    if (updates.isActive) {
      await deactivateAllRounds();
    }

    const roundRef = doc(db, ROUNDS_COLLECTION, roundId);
    
    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.episodeNumber !== undefined) updateData.episodeNumber = updates.episodeNumber;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.eliminatedCandidateId !== undefined) updateData.eliminatedCandidateId = updates.eliminatedCandidateId;
    if (updates.eliminationDate !== undefined) updateData.eliminationDate = updates.eliminationDate;
    if (updates.theme !== undefined) updateData.theme = updates.theme;
    
    await updateDoc(roundRef, updateData);
  } catch (error) {
    console.error('Error updating voting round:', error);
    throw error;
  }
};

/**
 * Delete a voting round
 * Note: This will not delete associated votes
 */
export const deleteVotingRound = async (roundId: string): Promise<void> => {
  try {
    const roundRef = doc(db, ROUNDS_COLLECTION, roundId);
    await deleteDoc(roundRef);
  } catch (error) {
    console.error('Error deleting voting round:', error);
    throw error;
  }
};

/**
 * Deactivate all voting rounds
 * Helper function when setting a new active round
 */
const deactivateAllRounds = async (): Promise<void> => {
  try {
    const roundsRef = collection(db, ROUNDS_COLLECTION);
    const q = query(roundsRef, where('isActive', '==', true));
    
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { 
        isActive: false,
        updatedAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error deactivating rounds:', error);
    throw error;
  }
};

/**
 * Get a voting round by ID
 */
export const getVotingRoundById = async (roundId: string): Promise<VotingRound | null> => {
  try {
    const roundRef = doc(db, ROUNDS_COLLECTION, roundId);
    const roundSnap = await getDoc(roundRef);
    
    if (!roundSnap.exists()) {
      return null;
    }
    
    const data = roundSnap.data();
    
    return {
      id: roundSnap.id,
      name: data.name || `Ronde ${data.episodeNumber}`,
      description: data.description,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      isActive: data.isActive === true,
      episodeNumber: data.episodeNumber || 0,
      status: data.status || 'active',
      eliminatedCandidateId: data.eliminatedCandidateId,
      eliminationDate: data.eliminationDate?.toDate(),
      theme: data.theme,
      votingStats: data.votingStats
    };
  } catch (error) {
    console.error('Error getting voting round:', error);
    throw error;
  }
}; 