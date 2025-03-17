import { useState } from 'react';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

export default function FirestoreTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');

  const testFirestore = async () => {
    setStatus('loading');
    setMessage('Testing Firestore connection...');
    setDetails('');
    
    try {
      // Check if Firestore database exists
      try {
        const testCollection = collection(db, '_test_collection');
        await getDocs(testCollection);
        setDetails(prev => prev + "✅ Successfully connected to Firestore database\n");
      } catch (error: any) {
        setDetails(prev => prev + `❌ Failed to connect to Firestore database: ${error.message}\n`);
        throw error;
      }
      
      // Try to write to a test document
      try {
        const testDoc = doc(db, '_test_connection', 'test');
        const timestamp = new Date();
        await setDoc(testDoc, { timestamp }, { merge: true });
        setDetails(prev => prev + "✅ Successfully wrote to Firestore\n");
      } catch (error: any) {
        setDetails(prev => prev + `❌ Failed to write to Firestore: ${error.message}\n`);
        throw error;
      }
      
      // Try to read the document back
      try {
        const testDoc = doc(db, '_test_connection', 'test');
        const docSnap = await getDoc(testDoc);
        
        if (docSnap.exists()) {
          setDetails(prev => prev + `✅ Successfully read from Firestore: ${docSnap.data().timestamp.toDate().toLocaleString()}\n`);
        } else {
          setDetails(prev => prev + "❌ Document exists but has no data\n");
          throw new Error("Document exists but has no data");
        }
      } catch (error: any) {
        setDetails(prev => prev + `❌ Failed to read from Firestore: ${error.message}\n`);
        throw error;
      }
      
      // Check authentication status
      if (auth.currentUser) {
        setDetails(prev => prev + `✅ User is authenticated: ${auth.currentUser?.email}\n`);
      } else {
        setDetails(prev => prev + "ℹ️ User is not authenticated\n");
      }
      
      setStatus('success');
      setMessage('Firestore connection successful!');
    } catch (error: any) {
      console.error('Firestore test error:', error);
      setStatus('error');
      setMessage(`Firestore connection failed: ${error.message}`);
    }
  };

  const checkFirebaseConfig = () => {
    setStatus('loading');
    setMessage('Checking Firebase configuration...');
    setDetails('');
    
    try {
      // Get the Firebase config from the window object
      const config = {
        apiKey: "AIzaSyCcf7vXG3jzJTfUaAbpE6KtZjcsn2Yf9hQ",
        authDomain: "demol-99d6c.firebaseapp.com",
        projectId: "demol-99d6c",
        storageBucket: "demol-99d6c.appspot.com",
        messagingSenderId: "1098893515403",
        appId: "1:1098893515403:web:edd5be4f87be1f65e9928e",
        measurementId: "G-6JST25QZ72"
      };
      
      setDetails(JSON.stringify(config, null, 2));
      setStatus('success');
      setMessage('Firebase configuration loaded');
    } catch (error: any) {
      setStatus('error');
      setMessage(`Failed to load Firebase configuration: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Firestore Connection Test</CardTitle>
        <CardDescription>
          Test if your application can connect to Firestore
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`p-4 mb-4 rounded-lg ${
          status === 'idle' ? 'bg-gray-100 text-gray-800' :
          status === 'loading' ? 'bg-blue-100 text-blue-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {message || 'Click the button to test Firestore connectivity'}
        </div>
        
        {details && (
          <div className="p-4 mt-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
            <pre className="text-xs whitespace-pre-wrap">{details}</pre>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Common issues:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Firestore database not created in Firebase console</li>
            <li>Incorrect Firebase configuration</li>
            <li>Third-party cookies blocked in browser</li>
            <li>Firebase security rules too restrictive</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          onClick={testFirestore} 
          disabled={status === 'loading'}
          className="w-full"
        >
          {status === 'loading' ? 'Testing...' : 'Test Firestore Connection'}
        </Button>
        <Button 
          onClick={checkFirebaseConfig}
          variant="outline"
          className="w-full"
        >
          Check Firebase Config
        </Button>
      </CardFooter>
    </Card>
  );
} 