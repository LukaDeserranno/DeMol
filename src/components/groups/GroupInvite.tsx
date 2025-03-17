import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        };

        // Check if current user is already a member
        const userIsMember = groupObj.members.includes(currentUser.uid);
        setIsMember(userIsMember);
        setGroup(groupObj);

      } catch (err: any) {
        console.error('Error fetching group:', err);
        setError('Failed to load group details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchGroupData();
  }, [groupId, currentUser]);

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
      setSuccess('You have successfully joined the group!');
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join the group. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-md">
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
      <div className="container mx-auto py-6 max-w-md">
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
              <p className="text-red-500 mb-4">{error || 'Group not found or you do not have access.'}</p>
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

  return (
    <div className="container mx-auto py-6 max-w-md">
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
          <CardTitle>Join {group.name}</CardTitle>
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
          <div className="flex flex-col items-center justify-center p-4">
            {isMember ? (
              <div className="text-center">
                <p className="text-green-500 font-medium mb-4">You are already a member of this group!</p>
                <Button 
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  Go to Group Page
                </Button>
              </div>
            ) : success ? (
              <div className="text-center">
                <p className="text-green-500 font-medium mb-4">{success}</p>
                <Button 
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  Go to Group Page
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4">You've been invited to join this group</p>
                <Button 
                  onClick={handleJoinGroup} 
                  disabled={joining}
                  className="mb-2"
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </Button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/groups')}
          >
            Return to Groups List
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 