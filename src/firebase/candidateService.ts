import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { Candidate } from '@/models/candidate';

// Collection reference
const CANDIDATES_COLLECTION = 'candidates';
const candidatesCollection = collection(db, CANDIDATES_COLLECTION);

/**
 * Get all candidates
 */
export const getAllCandidates = async (): Promise<Candidate[]> => {
  try {
    // Simplify to just get all documents
    const querySnapshot = await getDocs(candidatesCollection);
    const candidates: Candidate[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Candidate data:", data); // Log candidate data to see what fields exist
      candidates.push({
        id: doc.id,
        name: data.name || 'Unknown',
        age: data.age,
        bio: data.bio || '',
        eliminated: data.eliminated || false,
        image: data.image || '',
        occupation: data.occupation || ''
      });
    });
    
    console.log("Total candidates found:", candidates.length);
    return candidates;
  } catch (error) {
    console.error('Error getting candidates:', error);
    return [];
  }
};

/**
 * Get active (non-eliminated) candidates
 */
export const getActiveCandidates = async (): Promise<Candidate[]> => {
  try {
    // Simplify query but still use the eliminated filter
    const q = query(
      candidatesCollection,
      where('eliminated', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const candidates: Candidate[] = [];
    
    console.log("Active candidates query results count:", querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      candidates.push({
        id: doc.id,
        name: data.name || 'Unknown',
        age: data.age,
        bio: data.bio || '',
        eliminated: false,
        image: data.image || '',
        occupation: data.occupation || ''
      });
    });
    
    return candidates;
  } catch (error) {
    console.error('Error getting active candidates:', error);
    return [];
  }
};

/**
 * Get a candidate by ID
 */
export const getCandidateById = async (candidateId: string): Promise<Candidate | null> => {
  try {
    const candidateRef = doc(candidatesCollection, candidateId);
    const candidateSnap = await getDoc(candidateRef);
    
    if (!candidateSnap.exists()) {
      return null;
    }
    
    const data = candidateSnap.data();
    
    return {
      id: candidateSnap.id,
      name: data.name,
      age: data.age,
      bio: data.bio,
      eliminated: data.eliminated || false,
      image: data.image,
      occupation: data.occupation
    };
  } catch (error) {
    console.error('Error getting candidate:', error);
    return null;
  }
}; 