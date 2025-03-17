import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { getAuth } from 'firebase/auth';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      
      console.log('Starting registration process...');
      console.log('Firebase auth instance:', auth);
      console.log('Firebase db instance:', db);
      
      // First check if Firebase Auth is properly initialized
      try {
        const currentAuth = getAuth();
        console.log('Current auth config:', {
          apiKey: currentAuth.app.options.apiKey,
          authDomain: currentAuth.app.options.authDomain,
          projectId: currentAuth.app.options.projectId
        });
      } catch (authCheckErr) {
        console.error('Auth check error:', authCheckErr);
      }
      
      // First check if Firestore is accessible before attempting signup
      try {
        console.log('Testing Firestore connection...');
        const testDoc = doc(db, '_test_connection', 'test');
        await setDoc(testDoc, { timestamp: new Date() }, { merge: true });
        console.log('Firestore connection test successful');
      } catch (firestoreTestErr: any) {
        console.error('Firestore connection test failed:', firestoreTestErr);
        setError(`Cannot connect to Firestore. Please check your Firebase configuration and make sure Firestore is enabled in your project.`);
        setLoading(false);
        return;
      }
      
      console.log('Attempting to create user with email:', email);
      const userCredential = await signUp(email, password);
      console.log('User created successfully:', userCredential.user.uid);
      
      // Create user document in Firestore
      try {
        console.log('Attempting to create Firestore document for user');
        console.log('Using Firestore instance:', db);
        
        // More detailed logging
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        console.log('Document reference created:', userDocRef.path);
        
        const userData = {
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          groups: [],
          createdAt: new Date().toISOString()
        };
        console.log('Preparing to write user data:', userData);
        
        await setDoc(userDocRef, userData);
        console.log('Firestore document created successfully');
        navigate('/');
      } catch (firestoreErr: any) {
        console.error('Firestore error details:', {
          code: firestoreErr.code,
          message: firestoreErr.message,
          name: firestoreErr.name,
          stack: firestoreErr.stack,
          fullError: firestoreErr
        });
        setError(`Error saving user data: ${firestoreErr.code || firestoreErr.name || 'Unknown error'} - ${firestoreErr.message}`);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Auth error details:', {
        code: err.code,
        message: err.message,
        fullError: err
      });
      
      // Provide more user-friendly error messages based on Firebase error codes
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check your email and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password accounts are not enabled. Please contact support.');
      } else if (err.code === 'auth/internal-error') {
        setError('An internal error occurred. Please try again later.');
      } else {
        setError(`Failed to create an account: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create your De Mol account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 