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
      <div className="container mx-auto py-6 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/groups')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-pulse h-4 w-1/3 bg-muted rounded mb-4"></div>
              <div className="animate-pulse h-4 w-1/4 bg-muted rounded mb-8"></div>
              <p className="text-muted-foreground">Loading group details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/groups')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center">
              <p className="text-red-500 mb-4">{error || 'Group not found.'}</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/groups')}
              >
                View All Groups
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
      <div className="container mx-auto py-6 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/groups')}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>
              {group.createdAt ? (
                `Created on ${group.createdAt.toLocaleDateString('nl-BE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
              ) : (
                'Recently created'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-6">
              <p>You're not a member of this group yet.</p>
              <Button 
                onClick={handleJoinGroup} 
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join This Group'}
              </Button>
            </div>
          </CardContent>
        </Card>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {success && <p className="text-green-500 mt-4">{success}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate('/groups')}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Groups
      </Button>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>
                {group.createdAt ? (
                  `Created on ${group.createdAt.toLocaleDateString('nl-BE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}`
                ) : (
                  'Recently created'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Invite Others</h3>
                
                {/* Share Section */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Input 
                      ref={inviteLinkRef}
                      readOnly 
                      value={inviteLink} 
                      className="flex-1"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyLink}
                      className="whitespace-nowrap"
                    >
                      {linkCopied ? (
                        <>
                          <CheckIcon className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Link1Icon className="mr-2 h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openShareLink('whatsapp')}
                      className="flex-1 min-w-[120px]"
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
                      className="flex-1 min-w-[120px]"
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
                      className="flex-1 min-w-[120px]"
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
                      className="flex-1 min-w-[120px]"
                    >
                      <EnvelopeClosedIcon className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center my-4">
                  <div className="grow h-px bg-muted"></div>
                  <span className="px-3 text-xs text-muted-foreground">OR</span>
                  <div className="grow h-px bg-muted"></div>
                </div>
                
                {/* Email Invite Form */}
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="invite-email">Invite by Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="invite-email"
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={inviting}
                        className="flex-1"
                        type="email"
                      />
                      <Button 
                        type="submit" 
                        disabled={inviting || !inviteEmail.trim()}
                      >
                        {inviting ? 'Inviting...' : 'Invite'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Group Info */}
              <div className="grid gap-2">
                <div>
                  <h3 className="font-medium">Group ID</h3>
                  <p className="text-sm text-muted-foreground">{group?.id}</p>
                </div>
                <div>
                  <h3 className="font-medium">Members</h3>
                  <p className="text-sm text-muted-foreground">
                    {group?.members.length} members in this group
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PersonIcon className="h-5 w-5" />
                Members ({group.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div 
                      key={member.uid}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted"
                    >
                      <div>
                        <div className="font-medium">{member.displayName || 'Anonymous'}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                      {group.createdBy === member.uid && (
                        <span className="text-xs bg-blue-100 text-blue-800 py-0.5 px-1.5 rounded">
                          Creator
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Loading member details...</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Voting button card */}
          <Card>
            <CardHeader>
              <CardTitle>Current Round</CardTitle>
            </CardHeader>
            <CardContent>
              {hasActiveRound ? (
                <p className="text-sm mb-4">Vote on who you think is the Mol by distributing 100 points among the candidates.</p>
              ) : (
                <p className="text-sm mb-4">There is no active voting round at the moment.</p>
              )}
            </CardContent>
            <CardFooter>
              {hasActiveRound ? (
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/vote?group=${groupId}`)}
                >
                  Vote Now
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  disabled
                >
                  No Active Round
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Results button card */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {hasActiveRound ? (
                <p className="text-sm mb-4">View voting results for this group.</p>
              ) : (
                <p className="text-sm mb-4">No results available yet. A voting round must be active.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/results?group=${groupId}`)}
                disabled={!hasActiveRound}
              >
                View Results
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 