import { useState } from 'react';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

export default function FirebaseDiagnostics() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');

  const runDiagnostics = async () => {
    setStatus('loading');
    setMessage('Running Firebase diagnostics...');
    setDetails('');
    
    // Check Firebase config
    try {
      setDetails(prev => prev + "---- FIREBASE CONFIGURATION CHECK ----\n");
      const currentAuth = getAuth();
      const config = {
        apiKey: currentAuth.app.options.apiKey,
        authDomain: currentAuth.app.options.authDomain,
        projectId: currentAuth.app.options.projectId,
        storageBucket: currentAuth.app.options.storageBucket,
      };
      
      setDetails(prev => prev + `✅ Firebase initialized with config:\n${JSON.stringify(config, null, 2)}\n\n`);
    } catch (configErr: any) {
      setDetails(prev => prev + `❌ Error getting Firebase config: ${configErr.message}\n\n`);
    }
    
    // Check Firebase Auth
    try {
      setDetails(prev => prev + "---- FIREBASE AUTH CHECK ----\n");
      
      if (auth) {
        setDetails(prev => prev + "✅ Firebase Auth instance exists\n");
      } else {
        setDetails(prev => prev + "❌ Firebase Auth instance is undefined\n");
      }
      
      // Check if Email/Password provider is enabled
      try {
        setDetails(prev => prev + "Checking if Email/Password auth is accessible...\n");
        await fetchSignInMethodsForEmail(auth, "test@example.com");
        setDetails(prev => prev + "✅ Firebase Auth API is accessible\n\n");
      } catch (authErr: any) {
        if (authErr.code === 'auth/operation-not-allowed') {
          setDetails(prev => prev + "❌ Email/Password authentication is not enabled\n");
          setDetails(prev => prev + "Please enable it in the Firebase console:\n");
          setDetails(prev => prev + "1. Go to Firebase console > Authentication > Sign-in method\n");
          setDetails(prev => prev + "2. Enable Email/Password provider\n\n");
        } else {
          setDetails(prev => prev + `❌ Firebase Auth error: ${authErr.code} - ${authErr.message}\n\n`);
        }
      }
    } catch (authCheckErr: any) {
      setDetails(prev => prev + `❌ Error checking Firebase Auth: ${authCheckErr.message}\n\n`);
    }
    
    // Check Firestore
    try {
      setDetails(prev => prev + "---- FIRESTORE CHECK ----\n");
      
      if (db) {
        setDetails(prev => prev + "✅ Firestore instance exists\n");
      } else {
        setDetails(prev => prev + "❌ Firestore instance is undefined\n");
      }
      
      // Check if Firestore is accessible
      try {
        setDetails(prev => prev + "Testing Firestore read access...\n");
        const testCollection = collection(db, '_diagnostics');
        await getDocs(testCollection);
        setDetails(prev => prev + "✅ Firestore is accessible (read test passed)\n");
      } catch (readErr: any) {
        setDetails(prev => prev + `❌ Firestore read error: ${readErr.code} - ${readErr.message}\n`);
      }
      
      // Check if we can write to Firestore
      try {
        setDetails(prev => prev + "Testing Firestore write access...\n");
        const testDoc = doc(db, '_diagnostics', 'test');
        await setDoc(testDoc, { timestamp: new Date(), test: true }, { merge: true });
        setDetails(prev => prev + "✅ Firestore write successful\n");
        
        // Verify the write by reading it back
        const docSnap = await getDoc(testDoc);
        if (docSnap.exists()) {
          setDetails(prev => prev + "✅ Firestore read after write successful\n\n");
        } else {
          setDetails(prev => prev + "❌ Document was written but can't be read back\n\n");
        }
      } catch (writeErr: any) {
        setDetails(prev => prev + `❌ Firestore write error: ${writeErr.code} - ${writeErr.message}\n\n`);
      }
    } catch (firestoreCheckErr: any) {
      setDetails(prev => prev + `❌ Error checking Firestore: ${firestoreCheckErr.message}\n\n`);
    }
    
    // Check for third-party cookies
    try {
      setDetails(prev => prev + "---- BROWSER ENVIRONMENT CHECK ----\n");
      
      // Attempt to detect if third-party cookies are blocked
      const cookiesEnabled = navigator.cookieEnabled;
      if (cookiesEnabled) {
        setDetails(prev => prev + "✅ Cookies are enabled in the browser\n");
      } else {
        setDetails(prev => prev + "❌ Cookies are disabled in the browser\n");
      }
      
      // Check if running in a secure context (HTTPS)
      if (window.isSecureContext) {
        setDetails(prev => prev + "✅ Running in a secure context (HTTPS)\n");
      } else {
        setDetails(prev => prev + "❌ Not running in a secure context (HTTPS required for some features)\n");
      }
      
      setDetails(prev => prev + "\n");
    } catch (envErr: any) {
      setDetails(prev => prev + `❌ Error checking browser environment: ${envErr.message}\n\n`);
    }
    
    // Conclusions
    setDetails(prev => prev + "---- DIAGNOSTIC SUMMARY ----\n");
    setDetails(prev => prev + "Common issues that might be preventing registration:\n\n");
    setDetails(prev => prev + "1. Email/Password authentication not enabled in Firebase console\n");
    setDetails(prev => prev + "2. Firestore database not created or rules too restrictive\n");
    setDetails(prev => prev + "3. Firebase project configuration issues\n");
    setDetails(prev => prev + "4. Browser blocking third-party cookies\n");
    setDetails(prev => prev + "5. Network issues preventing connection to Firebase\n");
    
    setStatus('success');
    setMessage('Firebase diagnostics completed');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Firebase Diagnostics</h1>
      
      <Card className="w-full max-w-2xl mx-auto mb-6">
        <CardHeader>
          <CardTitle>Firebase Diagnostics Tool</CardTitle>
          <CardDescription>
            Troubleshoot issues with Firebase Authentication and Firestore
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`p-4 mb-4 rounded-lg ${
            status === 'idle' ? 'bg-gray-100 text-gray-800' :
            status === 'loading' ? 'bg-blue-100 text-blue-800' :
            status === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {message || 'Click the button to run Firebase diagnostics'}
          </div>
          
          {details && (
            <div className="p-4 bg-gray-100 rounded-lg overflow-auto max-h-96">
              <pre className="text-xs whitespace-pre-wrap">{details}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={runDiagnostics} 
            disabled={status === 'loading'}
            className="w-full"
          >
            {status === 'loading' ? 'Running diagnostics...' : 'Run Firebase Diagnostics'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">How to Fix Common Issues</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">1. Enable Email/Password Authentication</h3>
            <ol className="list-decimal ml-5 text-sm text-gray-600">
              <li>Go to the <a href="https://console.firebase.google.com/project/demol-99d6c/authentication/providers" target="_blank" className="text-blue-600 hover:underline">Firebase Authentication Console</a></li>
              <li>Click on the "Sign-in method" tab</li>
              <li>Click on "Email/Password" provider</li>
              <li>Toggle "Enable" to ON</li>
              <li>Click "Save"</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">2. Create Firestore Database</h3>
            <ol className="list-decimal ml-5 text-sm text-gray-600">
              <li>Go to the <a href="https://console.firebase.google.com/project/demol-99d6c/firestore" target="_blank" className="text-blue-600 hover:underline">Firebase Firestore Console</a></li>
              <li>Click "Create database"</li>
              <li>Choose "Start in test mode" for development</li>
              <li>Click "Next" and choose a database location</li>
              <li>Click "Enable"</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-lg">3. Allow Third-Party Cookies</h3>
            <p className="text-sm text-gray-600 mb-2">For Chrome:</p>
            <ol className="list-decimal ml-5 text-sm text-gray-600">
              <li>Go to Settings {'>'}Privacy and security {'>'}Cookies and other site data</li>
              <li>Select "Allow all cookies" or disable "Block third-party cookies"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 