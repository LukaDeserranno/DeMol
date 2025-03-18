import { useState, useEffect } from 'react';
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
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const { signUp, currentUser } = useAuth();
  const navigate = useNavigate();

  // Check for redirect URL in localStorage
  useEffect(() => {
    const savedRedirectUrl = localStorage.getItem('authRedirectUrl');
    if (savedRedirectUrl) {
      setRedirectUrl(savedRedirectUrl);
    }

    // If user is already logged in, handle redirect
    if (currentUser && redirectUrl) {
      handleRedirectAfterAuth();
    }
  }, [currentUser]);

  const handleRedirectAfterAuth = () => {
    if (redirectUrl) {
      localStorage.removeItem('authRedirectUrl');
      navigate(redirectUrl);
    } else {
      navigate('/');
    }
  };

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
        handleRedirectAfterAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-red-500/20 filter blur-3xl"></div>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/20 filter blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <img 
            src="/images/logo/de-mol-logo.png" 
            alt="De Mol" 
            className="h-16 mx-auto mb-6 drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.src = "https://www.goplay.be/media/b0ajq2hs/de-mol-2024-play.png";
            }}
          />
        </div>
        
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden p-6">
          <CardHeader className="p-6 space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Maak een account</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Registreer je De Mol account
              {redirectUrl && redirectUrl.includes('/invite/') && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  Maak een account aan om lid te worden van de groep
                </p>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-6">
            {error && (
              <div className="p-3 mb-5 text-sm text-red-800 bg-red-100 rounded-xl border border-red-200 flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                  Weergavenaam
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Jouw naam"
                  className="h-11 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="h-11 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Wachtwoord
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Kies een wachtwoord"
                  className="h-11 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Bevestig wachtwoord
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Herhaal je wachtwoord"
                  className="h-11 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Account aanmaken...
                    </span>
                  ) : 'Account aanmaken'}
                </Button>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="pb-8 pt-0 flex justify-center">
            <div className="text-sm text-gray-600">
              Heb je al een account?{' '}
              <Link to="/login" className="font-medium text-red-600 hover:text-red-800 transition-colors">
                Inloggen
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 