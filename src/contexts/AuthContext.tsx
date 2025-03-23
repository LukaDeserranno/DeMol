import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { app, auth } from '../firebase/config';
import { User, AuthState } from '../models/user';
import { createOrUpdateUser, getUserById } from '../firebase/userService';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check for redirect result on page load
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Redirect auth successful");
        }
      } catch (error) {
        console.error("Redirect auth error:", error);
      }
    };

    handleRedirectResult();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Check if user exists in Firestore
          let userRecord = await getUserById(firebaseUser.uid);
          
          if (!userRecord) {
            // Create initial user in Firestore
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              role: 'user', // Default role for new users
            };
            
            await createOrUpdateUser(newUser);
            userRecord = newUser;
          } else {
            // Update user data if Firebase Auth has newer info
            const updatedUser: User = {
              ...userRecord,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userRecord.displayName,
              photoURL: firebaseUser.photoURL || userRecord.photoURL,
              emailVerified: firebaseUser.emailVerified,
            };
            
            if (
              updatedUser.email !== userRecord.email ||
              updatedUser.displayName !== userRecord.displayName ||
              updatedUser.photoURL !== userRecord.photoURL ||
              updatedUser.emailVerified !== userRecord.emailVerified
            ) {
              await createOrUpdateUser(updatedUser);
            }
          }
          
          setState({ user: userRecord, loading: false, error: null });
        } catch (error) {
          console.error('Error syncing user data:', error);
          const basicUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: 'user', // Fallback to user role
          };
          setState({ user: basicUser, loading: false, error: null });
        }
      } else {
        setState({ user: null, loading: false, error: null });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile if displayName is provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        
        // Create user in Firestore
        const newUser: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName,
          photoURL: userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
          role: 'user', // Default role for new users
        };
        
        await createOrUpdateUser(newUser);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const provider = new GoogleAuthProvider();
      
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');

      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account',
        // Include the hosting domain to improve compatibility with Vercel
        hosting_domain: window.location.hostname
      });

      // Detect mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Log information for debugging
      console.log('Auth attempt:', {
        domain: window.location.hostname,
        isMobile,
        provider: 'Google',
        mode: isMobile ? 'redirect' : 'popup'
      });
      
      if (isMobile) {
        // Use redirect method for mobile
        console.log("Using redirect auth for mobile");
        await signInWithRedirect(auth, provider);
      } else {
        // Use popup for desktop
        console.log("Using popup auth for desktop");
        try {
          await signInWithPopup(auth, provider);
        } catch (popupError) {
          console.error("Popup error:", popupError);
          // If popup fails (e.g., popup blocked), fall back to redirect
          console.log("Falling back to redirect auth after popup failure");
          await signInWithRedirect(auth, provider);
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      // Include more details in the error message
      const errorDetails = error instanceof Error ? 
        `${error.message} (${(error as any).code || 'unknown'})` : 
        'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Authentication failed: ${errorDetails}`
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  };
  
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  const value = {
    ...state,
    signIn,
    signUp,
    logout,
    signInWithGoogle,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 