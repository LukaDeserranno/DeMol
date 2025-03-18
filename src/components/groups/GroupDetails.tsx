import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, arrayUnion, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { 
  ArrowLeftIcon, 
  EnvelopeClosedIcon, 
  PersonIcon, 
  Link1Icon, 
  CheckIcon,
} from '@radix-ui/react-icons';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface Group {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
  activeRound?: string;
}

export default function GroupDetails() {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasActiveRound, setHasActiveRound] = useState(false);
  
  const inviteLinkRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  // Generate invite link based on the group ID
  const inviteLink = `${window.location.origin}/invite/${groupId}`;

  useEffect(() => {
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
          setError('Group not found');
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
          name: groupData.name || 'Unnamed Group',
          createdBy: groupData.createdBy || '',
          members: groupData.members || [],
          createdAt: createdAt,
          activeRound: groupData.activeRound || null,
        };

        // Check if there's an active round
        setHasActiveRound(!!groupObj.activeRound);

        // Store the group in state
        setGroup(groupObj);

        // Only fetch members if user is a member
        if (groupObj.members.includes(currentUser.uid)) {
          // Fetch members data
          try {
            console.log(`Fetching data for ${groupObj.members.length} members`);
            const membersData: User[] = [];
            
            for (const memberId of groupObj.members) {
              console.log(`Fetching member data for ID: ${memberId}`);
              const memberDoc = await getDoc(doc(db, 'users', memberId));
              
              if (memberDoc.exists()) {
                const userData = memberDoc.data();
                membersData.push({
                  uid: memberDoc.id,
                  email: userData.email || '',
                  displayName: userData.displayName || '',
                });
                console.log(`Added member: ${userData.email || 'no email'}`);
              } else {
                console.log(`Member document not found for ID: ${memberId}`);
                // Add minimal info for members without complete profiles
                membersData.push({
                  uid: memberId,
                  email: memberId === currentUser.uid ? currentUser.email || '' : '',
                  displayName: memberId === currentUser.uid ? currentUser.displayName || '' : 'Unknown User',
                });
              }
            }
            
            console.log(`Total members loaded: ${membersData.length}`);
            setMembers(membersData);
          } catch (memberErr) {
            console.error('Error fetching members:', memberErr);
            // Don't fail the whole component if just the members list fails
            
            // Add at least current user to members list if they're in the group
            if (groupObj.members.includes(currentUser.uid)) {
              setMembers([{
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
              }]);
            } else {
              setMembers([]);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching group:', err);
        setError('Failed to load group details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchGroupData();
  }, [groupId, currentUser]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    
    if (!inviteEmail.trim() || !group || !currentUser) {
      return;
    }

    try {
      setInviting(true);
      setError('');
      setSuccess('');
      
      // Find user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', inviteEmail.trim().toLowerCase())
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.empty) {
        setError('User with this email not found');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      
      // Check if user is already a member
      if (group.members.includes(userId)) {
        setError('User is already a member of this group');
        return;
      }
      
      // Add user to group
      await updateDoc(doc(db, 'groups', group.id), {
        members: arrayUnion(userId)
      });
      
      // Add group to user's groups list
      await updateDoc(doc(db, 'users', userId), {
        groups: arrayUnion(group.id)
      });
      
      // Update local state
      setGroup({
        ...group,
        members: [...group.members, userId]
      });
      
      const userData = userDoc.data();
      setMembers([
        ...members,
        {
          uid: userId,
          email: userData.email || '',
          displayName: userData.displayName || '',
        }
      ]);
      
      setSuccess(`${inviteEmail} has been invited to the group`);
      setInviteEmail('');
    } catch (err: any) {
      console.error('Error inviting user:', err);
      setError('Failed to invite user. Please try again.');
    } finally {
      setInviting(false);
    }
  }

  function handleCopyLink() {
    if (inviteLinkRef.current) {
      inviteLinkRef.current.select();
      document.execCommand('copy');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  function openShareLink(platform: string) {
    let url = '';
    const message = `Join my group "${group?.name}" on De Mol!`;
    
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(message + ' ' + inviteLink)}`;
        break;
      case 'messenger':
        url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(inviteLink)}&app_id=123456789&redirect_uri=${encodeURIComponent(window.location.href)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(message)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Join my De Mol group')}&body=${encodeURIComponent(message + '\n\n' + inviteLink)}`;
        break;
      default:
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  }

  async function handleJoinGroup() {
    if (!group || !currentUser) return;
    
    try {
      setLoading(true);
      
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
      
      // Update local state
      const updatedGroup = {
        ...group,
        members: [...group.members, currentUser.uid]
      };
      setGroup(updatedGroup);
      
      // Add current user to members list
      const currentUserInfo = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
      };
      setMembers([...members, currentUserInfo]);
      
      setSuccess('You have successfully joined the group!');
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join the group. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
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
      <div className="container mx-auto py-8 px-4 max-w-4xl">
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
              <p className="text-red-600 text-lg font-medium mb-4">{error || 'Groep niet gevonden.'}</p>
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

  const isUserMember = currentUser && group.members.includes(currentUser.uid);

  if (!isUserMember) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
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
        
        {success && (
          <div className="p-3 mb-6 text-sm text-green-800 bg-green-100 rounded-xl border border-green-200 flex items-start">
            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            {success}
          </div>
        )}
        
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
            <CardTitle className="text-2xl font-bold">{group.name}</CardTitle>
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
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100 max-w-md">
                <div className="text-yellow-600 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-gray-700 font-medium mb-2">Je bent nog geen lid van deze groep.</p>
                <p className="text-sm text-gray-500 mb-4">Word lid om de inhoud van de groep te bekijken en deel te nemen aan stemrondes.</p>
              </div>
              <Button 
                onClick={handleJoinGroup} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Toevoegen...
                  </span>
                ) : 'Word Lid van Groep'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 max-w-4xl">
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
      
      {success && (
        <div className="p-3 mb-6 text-sm text-green-800 bg-green-100 rounded-xl border border-green-200 flex items-start">
          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <CardTitle className="text-2xl font-bold">{group?.name}</CardTitle>
              <CardDescription className="text-gray-300">
                {group?.createdAt ? (
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
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Nodig anderen uit</h3>
                
                {/* Share Section */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Input 
                      ref={inviteLinkRef}
                      readOnly 
                      value={inviteLink} 
                      className="flex-1 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyLink}
                      className="whitespace-nowrap rounded-xl hover:bg-gray-100 border-gray-300 transition-all"
                    >
                      {linkCopied ? (
                        <>
                          <CheckIcon className="mr-2 h-4 w-4" />
                          Gekopieerd!
                        </>
                      ) : (
                        <>
                          <Link1Icon className="mr-2 h-4 w-4" />
                          Kopieer Link
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openShareLink('whatsapp')}
                      className="flex-1 min-w-[120px] rounded-xl hover:bg-gray-100 border-gray-300 transition-all"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2 fill-current">
                        <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.966 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                      </svg>
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openShareLink('messenger')}
                      className="flex-1 min-w-[120px] rounded-xl hover:bg-gray-100 border-gray-300 transition-all"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2 fill-current">
                        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.744 6.615 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.986 8l3.126 3.259 5.893-3.259-6.812 6.963z" />
                      </svg>
                      Messenger
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openShareLink('telegram')}
                      className="flex-1 min-w-[120px] rounded-xl hover:bg-gray-100 border-gray-300 transition-all"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2 fill-current">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      Telegram
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openShareLink('email')}
                      className="flex-1 min-w-[120px] rounded-xl hover:bg-gray-100 border-gray-300 transition-all"
                    >
                      <EnvelopeClosedIcon className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center my-4">
                  <div className="grow h-px bg-muted"></div>
                  <span className="px-3 text-xs text-muted-foreground">OF</span>
                  <div className="grow h-px bg-muted"></div>
                </div>
                
                {/* Email Invite Form */}
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="invite-email" className="text-sm font-medium text-gray-700">Uitnodigen via email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="invite-email"
                        placeholder="email@voorbeeld.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={inviting}
                        className="flex-1 h-10 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500"
                        type="email"
                      />
                      <Button 
                        type="submit" 
                        disabled={inviting || !inviteEmail.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 duration-300"
                      >
                        {inviting ? 'Uitnodigen...' : 'Uitnodigen'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Group Info */}
              <div className="grid gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Groep ID</h3>
                  <p className="text-sm text-gray-600">{group?.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Leden</h3>
                  <p className="text-sm text-gray-600">
                    {group?.members.length} leden in deze groep
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PersonIcon className="h-5 w-5" />
                Leden ({group?.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div 
                      key={member.uid}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <div>
                        <div className="font-medium">{member.displayName || 'Anoniem'}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                      {group?.createdBy === member.uid && (
                        <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full font-medium">
                          Oprichter
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="animate-pulse flex space-x-4 items-center justify-center">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 max-w-[200px]">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Laden van ledengegevens...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Voting button card */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <CardTitle className="text-lg">Huidige Ronde</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {hasActiveRound ? (
                <p className="text-sm mb-4">Verdeel 100 punten over de kandidaten die volgens jou de mol zijn.</p>
              ) : (
                <p className="text-sm mb-4">Er is momenteel geen actieve stemronde.</p>
              )}
            </CardContent>
            <CardFooter className="pb-6 pt-0">
              {hasActiveRound ? (
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
                  onClick={() => navigate(`/vote?group=${groupId}`)}
                >
                  Stemmen
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gray-300 text-gray-600 rounded-xl cursor-not-allowed"
                  disabled
                >
                  Geen Actieve Ronde
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Results button card */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <CardTitle className="text-lg">Resultaten</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {hasActiveRound ? (
                <p className="text-sm mb-4">Bekijk de stemresultaten voor deze groep.</p>
              ) : (
                <p className="text-sm mb-4">Nog geen resultaten beschikbaar. Er moet een stemronde actief zijn.</p>
              )}
            </CardContent>
            <CardFooter className="pb-6 pt-0">
              <Button 
                variant="outline"
                className="w-full rounded-xl border-gray-300 hover:bg-gray-50 transition-all"
                onClick={() => navigate(`/results?group=${groupId}`)}
                disabled={!hasActiveRound}
              >
                Resultaten Bekijken
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 