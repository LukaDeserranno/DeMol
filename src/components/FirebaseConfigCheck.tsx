import { useState } from 'react';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

export default function FirebaseConfigCheck() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');

  const checkAuthConfig = async () => {
    setStatus('loading');
    setMessage('Checking Firebase Auth configuration...');
    setDetails('');
    
    try {
      const auth = getAuth();
      setDetails(prev => prev + `✅ Firebase Auth initialized\n`);
      
      // Check if Email/Password provider is enabled
      // Try to get sign-in methods for a dummy email
      try {
        setDetails(prev => prev + `Checking if Email/Password is enabled...\n`);
        const methods = await fetchSignInMethodsForEmail(auth, 'test@example.com');
        setDetails(prev => prev + `Available providers response received\n`);
        
        // Note: this doesn't guarantee Email/Password is enabled,
        // but if it throws an error, there might be a configuration issue
        setDetails(prev => prev + `✅ Firebase Auth API is accessible\n`);
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed') {
          setDetails(prev => prev + `❌ Email/Password authentication is not enabled\n`);
          setDetails(prev => prev + `Please enable Email/Password authentication in the Firebase console:\n`);
          setDetails(prev => prev + `1. Go to https://console.firebase.google.com/project/demol-99d6c/authentication/providers\n`);
          setDetails(prev => prev + `2. Click on "Email/Password" provider\n`);
          setDetails(prev => prev + `3. Toggle "Enable" to ON\n`);
          setDetails(prev => prev + `4. Click "Save"\n`);
          throw err;
        } else {
          setDetails(prev => prev + `⚠️ Unexpected error checking providers: ${err.message}\n`);
        }
      }
      
      setStatus('success');
      setMessage('Firebase Auth configuration check completed');
    } catch (error: any) {
      console.error('Firebase Auth check error:', error);
      setStatus('error');
      setMessage(`Firebase Auth configuration check failed: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Firebase Auth Configuration Check</CardTitle>
        <CardDescription>
          Check if Firebase Auth is properly configured
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`p-4 mb-4 rounded-lg ${
          status === 'idle' ? 'bg-gray-100 text-gray-800' :
          status === 'loading' ? 'bg-blue-100 text-blue-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {message || 'Click the button to check Firebase Auth configuration'}
        </div>
        
        {details && (
          <div className="p-4 mt-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
            <pre className="text-xs whitespace-pre-wrap">{details}</pre>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Common issues:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Email/Password authentication not enabled in Firebase</li>
            <li>Firebase project not properly set up</li>
            <li>Invalid API key or project configuration</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkAuthConfig} 
          disabled={status === 'loading'}
          className="w-full"
        >
          {status === 'loading' ? 'Checking...' : 'Check Auth Configuration'}
        </Button>
      </CardFooter>
    </Card>
  );
} 