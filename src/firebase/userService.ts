import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import { User } from '@/models/user';

// Collection reference
const USERS_COLLECTION = 'users';

/**
 * Get a user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const userData = userSnap.data();
    return {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      emailVerified: userData.emailVerified,
      role: userData.role || 'user',
    };
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Create or update a user
 */
export const createOrUpdateUser = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const userSnap = await getDoc(userRef);
    
    const userData = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      role: user.role || 'user',
      updatedAt: new Date(),
    };
    
    if (!userSnap.exists()) {
      // Create new user
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date(),
      });
    } else {
      // Update existing user
      await updateDoc(userRef, userData);
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

/**
 * Set a user's role
 */
export const setUserRole = async (userId: string, role: 'admin' | 'user'): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { role });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}; 