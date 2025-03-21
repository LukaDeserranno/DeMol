import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { Candidate } from '../models/candidate';

// Collection reference
const CANDIDATES_COLLECTION = 'candidates';

/**
 * Fetch all candidates
 */
export const getAllCandidates = async (): Promise<Candidate[]> => {
  try {
    console.log('Fetching all candidates...');
    const candidatesRef = collection(db, CANDIDATES_COLLECTION);
    const q = query(candidatesRef);
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} candidates`);
    
    const candidates: Candidate[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      candidates.push({
        id: doc.id,
        name: data.name || 'Onbekend',
        age: data.age || 0,
        bio: data.bio || '',
        eliminated: data.eliminated === true, // explicitly check for true
        image: data.image || '/images/default-avatar.png'
      });
    });
    
    return candidates;
  } catch (error) {
    console.error('Error fetching candidates:', error);
    throw error;
  }
};

/**
 * Fetch candidates that have not been eliminated
 */
export const getActiveCandidates = async (): Promise<Candidate[]> => {
  try {
    console.log('Fetching active candidates...');
    // First try to get all candidates, then filter clientside as fallback
    const allCandidates = await getAllCandidates();
    
    // If we found candidates, filter on client side (as fallback)
    if (allCandidates.length > 0) {
      console.log(`Filtering ${allCandidates.length} candidates clientside`);
      // Include candidates where eliminated is false or not set
      return allCandidates.filter(candidate => !candidate.eliminated);
    }
    
    // If no candidates were found at all, return empty array
    console.log('No candidates found');
    return [];
  } catch (error) {
    console.error('Error fetching active candidates:', error);
    throw error;
  }
};

/**
 * Fetch a single candidate by ID
 */
export const getCandidateById = async (candidateId: string): Promise<Candidate | null> => {
  try {
    const candidateRef = doc(db, CANDIDATES_COLLECTION, candidateId);
    const candidateSnap = await getDoc(candidateRef);
    
    if (candidateSnap.exists()) {
      const data = candidateSnap.data();
      return {
        id: candidateSnap.id,
        name: data.name || 'Onbekend',
        age: data.age || 0,
        bio: data.bio || '',
        eliminated: data.eliminated === true,
        image: data.image || '/images/default-avatar.png'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching candidate:', error);
    throw error;
  }
}; 