import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserGroups, createGroup, joinGroupWithCode } from '@/firebase/groupService';
import { Group } from '@/models/group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { ToastProvider } from '@/components/ui/toast';
import { PlusCircle, UserPlus, Users, Calendar } from 'lucide-react';

const GroupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const groups = await getUserGroups(user.uid);
        setUserGroups(groups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your groups. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user, toast]);

  const handleCreateGroup = async () => {
    if (!user) return;
    
    if (!newGroupName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreatingGroup(true);
      const group = await createGroup(
        newGroupName.trim(),
        newGroupDescription.trim() || undefined,
        user.uid
      );

      setUserGroups([...userGroups, group]);
      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: 'Success',
        description: `Group "${group.name}" created successfully!`,
      });
      
      // Navigate to the group detail page
      navigate(`/groups/${group.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) return;
    
    if (!joinCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invite code.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsJoiningGroup(true);
      const group = await joinGroupWithCode(
        joinCode.trim(),
        user.uid
      );

      if (!group) {
        toast({
          title: 'Error',
          description: 'Invalid invite code. Please check and try again.',
          variant: 'destructive',
        });
        return;
      }

      // Check if group is already in the list
      if (!userGroups.some(g => g.id === group.id)) {
        setUserGroups([...userGroups, group]);
      }
      
      setJoinCode('');
      setIsJoinDialogOpen(false);
      
      toast({
        title: 'Success',
        description: `You've joined "${group.name}" successfully!`,
      });
      
      // Navigate to the group detail page
      navigate(`/groups/${group.id}`);
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: 'Error',
        description: 'Failed to join group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsJoiningGroup(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Please sign in to view your groups</h1>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Groups</h1>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-white/20 hover:border-primary/50 text-white bg-white/5 hover:bg-primary/10 flex-1 md:flex-none"
                >
                  <UserPlus size={16} className="text-white" />
                  Join Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border border-white/10 backdrop-blur-sm max-w-[90vw] sm:max-w-md">
                <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/20 opacity-80 -mt-6 -mx-6 mb-4"></div>
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Join a Group</DialogTitle>
                  <DialogDescription className="text-white">
                    Enter the invite code to join an existing group.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="joinCode" className="col-span-4 text-white">
                      Invite Code
                    </Label>
                    <Input
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Enter invite code"
                      className="col-span-4 bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button 
                    type="submit" 
                    onClick={handleJoinGroup}
                    disabled={isJoiningGroup}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isJoiningGroup ? 'Joining...' : 'Join Group'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 flex-1 md:flex-none">
                  <PlusCircle size={16} className="text-white" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border border-white/10 backdrop-blur-sm max-w-[90vw] sm:max-w-md">
                <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/20 opacity-80 -mt-6 -mx-6 mb-4"></div>
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Create a New Group</DialogTitle>
                  <DialogDescription className="text-white">
                    Create a group to track voting statistics with friends.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="groupName" className="col-span-4 text-white">
                      Group Name
                    </Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="col-span-4 bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="groupDescription" className="col-span-4 text-white">
                      Description (Optional)
                    </Label>
                    <Input
                      id="groupDescription"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Enter group description"
                      className="col-span-4 bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button 
                    type="submit" 
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isCreatingGroup ? 'Creating...' : 'Create Group'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : userGroups.length === 0 ? (
          <div className="border border-white/10 p-12 rounded-lg text-center my-12 max-w-2xl mx-auto backdrop-blur-sm bg-black/30 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
            <div className="mb-6 flex justify-center">
              <Users size={64} className="text-white opacity-80" />
            </div>
            <h2 className="text-xl font-semibold mb-4 text-white">You're not in any groups yet</h2>
            <p className="mb-8 max-w-md mx-auto text-white">
              Create a group to invite friends or join an existing group with an invite code to compare voting stats.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <PlusCircle size={16} className="text-white" />
                Create a Group
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsJoinDialogOpen(true)} 
                className="flex items-center gap-2 border-white/20 hover:border-primary/50 text-white bg-white/5 hover:bg-primary/10"
              >
                <UserPlus size={16} className="text-white" />
                Join with Code
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 my-4 sm:my-8">
            {userGroups.map((group) => (
              <Card
                key={group.id} 
                className="cursor-pointer transition-all duration-200 overflow-hidden bg-black border border-white/10 hover:border-primary/40 hover:scale-[1.02] group backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_rgba(0,0,0,0.4)] relative" 
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-70"></div>
                <div className="h-2 bg-gradient-to-r from-primary/80 to-primary/20 opacity-80 group-hover:opacity-100"></div>
                <CardHeader className="pb-2 border-b border-white/10 relative z-10">
                  <CardTitle className="text-white text-lg sm:text-xl">{group.name}</CardTitle>
                  <CardDescription className="text-white text-xs sm:text-sm">
                    {group.description || `A group with ${group.members.length} members`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 pt-4 relative z-10">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white">
                    <Users size={14} className="text-white" />
                    <span>{group.members.length} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white mt-2">
                    <Calendar size={14} className="text-white" />
                    <span>Created on {group.createdAt.toLocaleDateString()}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4 border-t border-white/10 mt-2 bg-black/40 relative z-10">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 3).map((member, index) => (
                      <div 
                        key={index} 
                        className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center border-2 border-black overflow-hidden ring-1 ring-white/20 shadow-md"
                        title={member.displayName}
                      >
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.displayName} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium">{member.displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    ))}
                    {group.members.length > 3 && (
                      <div className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center border-2 border-black ring-1 ring-white/20 shadow-md">
                        <span className="text-xs font-medium">+{group.members.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0 bg-white/10 text-white hover:bg-primary hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToastProvider>
  );
};

export default GroupsPage; 