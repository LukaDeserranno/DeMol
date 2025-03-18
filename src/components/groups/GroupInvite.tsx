import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

interface Group {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
}

export default function GroupInvite() {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMember, setIsMember] = useState(false);

  const { currentUser } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is not logged in, redirect to login with return URL
    if (!currentUser && groupId) {
      // Save the current URL to redirect back after login
      localStorage.setItem('authRedirectUrl', location.pathname);
      navigate('/login');
      return;
    }

    async function fetchGroupData() {
      if (!groupId || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Fetch group data
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        
        if (!groupDoc.exists()) {
          setError('Groep niet gevonden');
          setLoading(false);
          return;
        }

        const groupData = groupDoc.data();
        let createdAt = new Date();
        try {
          createdAt = groupData.createdAt?.toDate() || new Date();
        } catch (e) {
          console.error('Error parsing createdAt date:', e);
          // Use current date as fallback
        }

        const groupObj: Group = {
          id: groupDoc.id,
          name: groupData.name || 'Naamloze Groep',
          createdBy: groupData.createdBy || '',
          members: groupData.members || [],
          createdAt: createdAt,
        };

        // Check if current user is already a member
        const userIsMember = groupObj.members.includes(currentUser.uid);
        setIsMember(userIsMember);
        setGroup(groupObj);

      } catch (err: any) {
        console.error('Error fetching group:', err);
        setError('Fout bij het laden van groepsgegevens. Probeer het later opnieuw.');
      } finally {
        setLoading(false);
      }
    }

    fetchGroupData();
    
    // Check if user just logged in and needs to be redirected back
    const checkRedirectAfterAuth = () => {
      if (currentUser) {
        const redirectUrl = localStorage.getItem('authRedirectUrl');
        if (redirectUrl && redirectUrl.includes('/invite/')) {
          localStorage.removeItem('authRedirectUrl');
        }
      }
    };
    
    checkRedirectAfterAuth();
  }, [groupId, currentUser, navigate, location.pathname]);

  async function handleJoinGroup() {
    if (!group || !currentUser) return;
    
    try {
      setJoining(true);
      setError('');
      
      // Add the current user to the group
      await updateDoc(doc(db, 'groups', group.id), {
        members: arrayUnion(currentUser.uid)
      });
      
      // Update the user's groups list
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          groups: arrayUnion(group.id)
        });
      } catch (err) {
        console.error('Error updating user groups array:', err);
        // Continue even if this fails, as the most important part is being in the group
      }
      
      setIsMember(true);
      setSuccess('Je bent succesvol toegevoegd aan de groep!');
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Fout bij het deelnemen aan de groep. Probeer het opnieuw.');
    } finally {
      setJoining(false);
    }
  }

  if (!currentUser) {
    // This is a fallback, but the useEffect should handle redirecting already
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Button 
          variant="ghost" 
          className="mb-6 rounded-xl hover:bg-gray-100 transition-all"
          onClick={() => navigate('/groups')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Terug naar Groepen
        </Button>
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-pulse h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
              <div className="animate-pulse h-4 w-1/4 bg-gray-200 rounded mb-8"></div>
              <div className="animate-pulse w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
              <p className="text-gray-500">Groepsgegevens laden...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Button 
          variant="ghost" 
          className="mb-6 rounded-xl hover:bg-gray-100 transition-all"
          onClick={() => navigate('/groups')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Terug naar Groepen
        </Button>
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-red-100 p-4 mb-4">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <p className="text-red-600 text-lg font-medium mb-4">{error || 'Groep niet gevonden of je hebt geen toegang.'}</p>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
                onClick={() => navigate('/groups')}
              >
                Alle Groepen Bekijken
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-md">
      <Button 
        variant="ghost" 
        className="mb-6 rounded-xl hover:bg-gray-100 transition-all"
        onClick={() => navigate('/groups')}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Terug naar Groepen
      </Button>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-800 bg-red-100 rounded-xl border border-red-200 flex items-start">
          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
          {error}
        </div>
      )}

      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
          <CardTitle className="text-2xl font-bold">Word lid van {group.name}</CardTitle>
          <CardDescription className="text-gray-300">
            {group.createdAt ? (
              `Aangemaakt op ${group.createdAt.toLocaleDateString('nl-BE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}`
            ) : (
              'Recent aangemaakt'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center">
            {isMember ? (
              <div className="text-center">
                <div className="bg-green-100 text-green-800 rounded-full p-4 inline-flex mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-gray-700 font-medium mb-6">Je bent al lid van deze groep!</p>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  Naar Groepspagina
                </Button>
              </div>
            ) : success ? (
              <div className="text-center">
                <div className="bg-green-100 text-green-800 rounded-full p-4 inline-flex mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-gray-700 font-medium mb-6">{success}</p>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  Naar Groepspagina
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100 max-w-md mb-6">
                  <div className="text-yellow-600 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Je bent uitgenodigd om lid te worden van deze groep</p>
                  <p className="text-sm text-gray-500">Word lid om de inhoud van de groep te bekijken en deel te nemen aan stemrondes.</p>
                </div>
                
                <Button 
                  onClick={handleJoinGroup} 
                  disabled={joining}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300 w-full"
                >
                  {joining ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deelnemen...
                    </span>
                  ) : 'Word Lid van Groep'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button 
            variant="outline" 
            className="rounded-xl border-gray-300 hover:bg-gray-50 transition-all"
            onClick={() => navigate('/groups')}
          >
            Terug naar Groepenlijst
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 