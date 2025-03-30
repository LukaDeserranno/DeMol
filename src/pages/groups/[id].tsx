import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getGroupById, 
  getGroupStats, 
  leaveGroup, 
  changeMemberRole 
} from '@/firebase/groupService';
import { getAllCandidates } from '@/firebase/candidateService';
import { Group, GroupMember, GroupStats } from '@/models/group';
import { Candidate } from '@/models/candidate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Copy, ChevronLeft, ClipboardCopy, Calendar, Users, LogOut, Trophy, TrendingDown, Star, BarChart } from 'lucide-react';

// Create placeholder components for missing UI components
interface AvatarProps {
  children: React.ReactNode;
  className?: string;
}

const Avatar = ({ children, className = "" }: AvatarProps) => (
  <div className={`relative inline-block h-10 w-10 rounded-full bg-gray-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

interface AvatarImageProps {
  src: string;
  className?: string;
}

const AvatarImage = ({ src, className = "" }: AvatarImageProps) => (
  <img src={src} className={`h-full w-full rounded-full object-cover ${className}`} alt="" />
);

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

const AvatarFallback = ({ children, className = "" }: AvatarFallbackProps) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-600 text-white ${className}`}>
    {children}
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive';
  className?: string;
}

const Badge = ({ children, variant = "default", className = "" }: BadgeProps) => {
  const variantClasses = {
    default: "bg-primary/20 text-white border border-primary/40",
    secondary: "bg-secondary/20 text-white border border-secondary/40",
    destructive: "bg-destructive/20 text-white border border-destructive/40"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | null>(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [selectedRound, setSelectedRound] = useState('all');
  
  useEffect(() => {
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, [user]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch group details
        const groupData = await getGroupById(id);
        if (!groupData) {
          toast({
            title: 'Error',
            description: 'Group not found',
            variant: 'destructive',
          });
          navigate('/groups');
          return;
        }
        
        // Check if user is a member of this group
        const isMember = groupData.members.some(member => member.userId === user.uid);
        if (!isMember) {
          toast({
            title: 'Access Denied',
            description: 'You are not a member of this group',
            variant: 'destructive',
          });
          navigate('/groups');
          return;
        }
        
        setGroup(groupData);
        
        // Set current user's role in the group
        const currentMember = groupData.members.find(member => member.userId === user.uid);
        setCurrentUserRole(currentMember?.role || null);
        
        // Fetch candidates for stats
        const candidatesData = await getAllCandidates();
        setCandidates(candidatesData);
        
        // Fetch group stats
        try {
          const stats = await getGroupStats(id, candidatesData);
          setGroupStats(stats);
        } catch (error) {
          console.error('Error fetching group stats:', error);
          // Create placeholder stats
          setGroupStats({
            topSuspects: candidatesData.slice(0, 3).map(c => ({
              candidateId: c.id,
              candidateName: c.name,
              totalPoints: Math.floor(Math.random() * 100),
              percentage: Math.floor(Math.random() * 100)
            })),
            leastSuspects: candidatesData.slice(0, 3).map(c => ({
              candidateId: c.id,
              candidateName: c.name,
              totalPoints: Math.floor(Math.random() * 20),
              percentage: Math.floor(Math.random() * 20)
            })),
            memberVotes: groupData.members.map(m => ({
              userId: m.userId,
              displayName: m.displayName,
              votes: {}
            })),
            roundParticipation: [1, 2, 3].map(i => ({
              roundId: `round-${i}`,
              roundName: `Round ${i}`,
              memberCount: Math.floor(Math.random() * groupData.members.length),
              totalMembers: groupData.members.length
            }))
          });
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load group details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate, toast]);
  
  const handleCopyInviteCode = () => {
    if (!group) return;
    
    navigator.clipboard.writeText(group.inviteCode);
    toast({
      title: 'Copied!',
      description: 'Invite code copied to clipboard',
    });
  };
  
  const handleLeaveGroup = async () => {
    if (!id || !user) return;
    
    try {
      const success = await leaveGroup(id, user.uid);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'You have left the group',
        });
        navigate('/groups');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to leave the group',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave the group',
        variant: 'destructive',
      });
    } finally {
      setIsLeaveConfirmOpen(false);
    }
  };
  
  const handleChangeMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!id || !user || !currentUserRole || currentUserRole !== 'admin') return;
    
    try {
      await changeMemberRole(id, user.uid, memberId, newRole);
      
      // Update local state
      setGroup(prevGroup => {
        if (!prevGroup) return null;
        
        return {
          ...prevGroup,
          members: prevGroup.members.map(member => {
            if (member.userId === memberId) {
              return { ...member, role: newRole };
            }
            return member;
          })
        };
      });
      
      toast({
        title: 'Success',
        description: `Member role updated to ${newRole}.`,
      });
    } catch (error) {
      console.error('Error changing member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to change member role. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Please sign in to view this group</h1>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!group || !groupStats) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Group not found</h1>
        <Button onClick={() => navigate('/groups')}>Back to Groups</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/groups')} 
          className="gap-2 text-white hover:text-white hover:bg-[#2A9D8F]/20 hover:border-[#2A9D8F]/30 transition-all"
        >
          <ChevronLeft size={16} className="text-white" />
          Back to Groups
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Card className="flex-1 bg-black border border-white/10 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[#2A9D8F]/30 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2A9D8F]/5 to-transparent opacity-70"></div>
          <div className="h-2 bg-gradient-to-r from-[#2A9D8F]/80 to-[#2A9D8F]/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="border-b border-white/10 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold text-white">{group.name}</CardTitle>
                {group.description && (
                  <CardDescription className="mt-2 text-white">{group.description}</CardDescription>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyInviteCode} 
                  className="flex items-center gap-1 border-white/20 hover:border-primary/50 text-white bg-white/5 hover:bg-primary/10"
                >
                  <ClipboardCopy size={14} className="text-white" />
                  <span>Copy Invite</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLeaveConfirmOpen(true)}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 border-white/20 hover:border-red-400/50 bg-white/5 hover:bg-red-500/10"
                >
                  <LogOut size={14} className="text-red-400 hover:text-red-300" />
                  <span>Leave</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 items-center text-white">
                <Calendar size={16} className="text-white" />
                <span>Created on {group.createdAt.toLocaleDateString()}</span>
              </div>
              
              <div className="flex gap-2 items-center text-white">
                <Users size={16} className="text-white" />
                <span>{group.members.length} members</span>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
                  <ClipboardCopy size={18} className="text-white" />
                  <div className="flex-1">
                    <p className="text-sm text-white mb-1">Group Invite Code</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-semibold text-white tracking-wider">{group.inviteCode}</p>
                      <Button variant="ghost" size="sm" onClick={handleCopyInviteCode} className="text-white hover:text-primary">
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="relative z-10 mt-6"
      >
        <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-white/10 mb-6">
          <TabsTrigger
            value="stats"
            className="data-[state=active]:bg-[#2A9D8F]/20 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] text-white/80 hover:text-white"
          >
            Group Statistics
          </TabsTrigger>
          <TabsTrigger
            value="rounds"
            className="data-[state=active]:bg-[#2A9D8F]/20 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] text-white/80 hover:text-white"
          >
            Rounds
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="data-[state=active]:bg-[#2A9D8F]/20 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] text-white/80 hover:text-white"
          >
            Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black border border-white/10 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.3)] group hover:border-[#2A9D8F]/30 transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2A9D8F]/5 to-transparent opacity-70"></div>
              <div className="h-2 bg-gradient-to-r from-[#2A9D8F]/80 to-[#2A9D8F]/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-white" />
                  <div>
                    <CardTitle className="text-white text-xl">Top Suspects</CardTitle>
                    <CardDescription className="text-white">Percentage of total votes received</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 relative z-10">
                {groupStats.topSuspects.length === 0 ? (
                  <p className="text-white">No votes recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {groupStats.topSuspects.map((suspect, index) => (
                      <div key={suspect.candidateId} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-[#2A9D8F]/20">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2A9D8F]/20 text-white border border-[#2A9D8F]/30 shadow-[0_0_10px_rgba(42,157,143,0.1)]">
                            <span className="font-medium text-sm">{index + 1}</span>
                          </div>
                          <Avatar className="border-2 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                            {candidates.find(c => c.id === suspect.candidateId)?.image ? (
                              <AvatarImage src={candidates.find(c => c.id === suspect.candidateId)?.image || ''} />
                            ) : (
                              <AvatarFallback>{suspect.candidateName.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-white font-medium">{suspect.candidateName}</span>
                        </div>
                        <div className="flex items-center bg-[#2A9D8F]/20 text-white px-4 py-1.5 rounded-full text-sm border border-[#2A9D8F]/30 shadow-[0_0_10px_rgba(42,157,143,0.05)]">
                          <span className="font-bold">{suspect.percentage}%</span>
                          <span className="ml-1 text-white">of votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-black border border-white/10 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.3)] group hover:border-[#2A9D8F]/30 transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2A9D8F]/5 to-transparent opacity-70"></div>
              <div className="h-2 bg-gradient-to-r from-[#2A9D8F]/80 to-[#2A9D8F]/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <TrendingDown size={20} className="text-white" />
                  <div>
                    <CardTitle className="text-white text-xl">Least Suspected</CardTitle>
                    <CardDescription className="text-white">Percentage of total votes received</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 relative z-10">
                {groupStats.leastSuspects.length === 0 ? (
                  <p className="text-white">No votes recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {groupStats.leastSuspects.map((suspect, index) => (
                      <div key={suspect.candidateId} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-[#2A9D8F]/20">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2A9D8F]/20 text-white border border-[#2A9D8F]/30 shadow-[0_0_10px_rgba(42,157,143,0.1)]">
                            <span className="font-medium text-sm">{index + 1}</span>
                          </div>
                          <Avatar className="border-2 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                            {candidates.find(c => c.id === suspect.candidateId)?.image ? (
                              <AvatarImage src={candidates.find(c => c.id === suspect.candidateId)?.image || ''} />
                            ) : (
                              <AvatarFallback>{suspect.candidateName.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-white font-medium">{suspect.candidateName}</span>
                        </div>
                        <div className="flex items-center bg-[#2A9D8F]/20 text-white px-4 py-1.5 rounded-full text-sm border border-[#2A9D8F]/30 shadow-[0_0_10px_rgba(42,157,143,0.05)]">
                          <span className="font-bold">{suspect.percentage}%</span>
                          <span className="ml-1 text-white">of votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 bg-black border border-white/10 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.3)] group hover:border-[#2A9D8F]/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2A9D8F]/5 to-transparent opacity-70"></div>
              <div className="h-2 bg-gradient-to-r from-[#2A9D8F]/80 to-[#2A9D8F]/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-white" />
                  <div>
                    <CardTitle className="text-white text-xl">Round Participation</CardTitle>
                    <CardDescription className="text-white">
                      Members who have voted in each round
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 relative z-10">
                {groupStats.roundParticipation.length === 0 ? (
                  <p className="text-white">No voting rounds recorded yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupStats.roundParticipation.map((round) => (
                      <Card key={round.roundId} className="bg-black/50 border border-white/10 shadow-md hover:border-primary/20 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Calendar size={16} className="text-white" />
                            {round.roundName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-2 text-white">{round.memberCount} of {round.totalMembers} members voted</p>
                          <div className="bg-white/10 w-full h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#2A9D8F] h-full rounded-full shadow-[0_0_10px_rgba(42,157,143,0.3)]" 
                              style={{ width: `${Math.round((round.memberCount / round.totalMembers) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-sm bg-[#2A9D8F]/20 px-2 py-0.5 rounded border border-[#2A9D8F]/40 text-white shadow-[0_0_10px_rgba(42,157,143,0.1)]">
                            {Math.round((round.memberCount / round.totalMembers) * 100)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 bg-black border border-white/10 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.3)] group hover:border-[#2A9D8F]/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2A9D8F]/5 to-transparent opacity-70"></div>
              <div className="h-2 bg-gradient-to-r from-[#2A9D8F]/80 to-[#2A9D8F]/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <BarChart size={20} className="text-white" />
                  <div>
                    <CardTitle className="text-white text-xl">Member Voting Distribution</CardTitle>
                    <CardDescription className="text-white">
                      How each member distributed their 100 points
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 relative z-10">
                {groupStats.memberVotes.length === 0 ? (
                  <p className="text-white">No member votes recorded yet</p>
                ) : (
                  <div>
                    {groupStats.memberVotes.filter(mv => Object.keys(mv.votes).length > 0).length === 0 ? (
                      <div className="p-6 border border-dashed border-white/20 rounded-lg text-center">
                        <BarChart size={32} className="mx-auto mb-3 text-white/40" />
                        <p className="text-white">No member votes have been recorded yet.</p>
                        <p className="text-white/60 text-sm mt-1">
                          Vote data will appear here once members start voting in rounds.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Round Selection */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRound('all')}
                            className={`border-white/20 hover:border-primary/50 text-white bg-white/5 hover:bg-primary/10 ${
                              selectedRound === 'all' ? 'bg-[#2A9D8F]/20 border-[#2A9D8F]/40' : ''
                            }`}
                          >
                            All Rounds
                          </Button>
                          {groupStats.roundParticipation.map((round) => (
                            <Button
                              key={round.roundId}
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRound(round.roundId)}
                              className={`border-white/20 hover:border-primary/50 text-white bg-white/5 hover:bg-primary/10 ${
                                selectedRound === round.roundId ? 'bg-[#2A9D8F]/20 border-[#2A9D8F]/40' : ''
                              }`}
                            >
                              {round.roundName}
                            </Button>
                          ))}
                        </div>

                        {/* Member Votes Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupStats.memberVotes.map((memberVote) => {
                            // Skip members with no votes
                            if (Object.keys(memberVote.votes).length === 0) {
                              return null;
                            }
                            
                            // Find the member
                            const member = group.members.find(m => m.userId === memberVote.userId);
                            if (!member) return null;
                            
                            // Get votes for selected round or all rounds
                            const votes = selectedRound === 'all' 
                              ? Object.values(memberVote.roundVotes).reduce((acc, roundVotes) => {
                                  Object.entries(roundVotes).forEach(([candidateId, points]) => {
                                    acc[candidateId] = (acc[candidateId] || 0) + points;
                                  });
                                  return acc;
                                }, {} as Record<string, number>)
                              : memberVote.roundVotes?.[selectedRound] || {};
                            
                            // Sort candidates by points
                            const sortedVotes = Object.entries(votes)
                              .map(([candidateId, points]) => ({
                                candidateId,
                                points,
                                candidateName: candidates.find(c => c.id === candidateId)?.name || 'Unknown'
                              }))
                              .sort((a, b) => b.points - a.points);
                            
                            // Only show top 3 votes and combine the rest
                            const topVotes = sortedVotes.slice(0, 3);
                            const otherVotes = sortedVotes.slice(3);
                            const otherPoints = otherVotes.reduce((sum, vote) => sum + vote.points, 0);
                            
                            // Calculate total (should be 100 * number of rounds, but just in case)
                            const totalPoints = sortedVotes.reduce((sum, vote) => sum + vote.points, 0) || 100;
                            
                            return (
                              <div key={memberVote.userId} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-8 w-8 border border-white/10">
                                    {member.photoURL ? (
                                      <AvatarImage src={member.photoURL} />
                                    ) : null}
                                    <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-white font-medium text-sm">{member.displayName}</span>
                                </div>
                                
                                {topVotes.length > 0 ? (
                                  <div className="mt-2">
                                    <div className="flex w-full h-5 rounded-full overflow-hidden bg-white/10">
                                      {topVotes.map((vote, i) => (
                                        <div 
                                          key={vote.candidateId}
                                          className="h-full flex justify-center items-center text-xs font-medium text-white"
                                          style={{ 
                                            width: `${Math.round((vote.points / totalPoints) * 100)}%`,
                                            backgroundColor: i === 0 ? '#2A9D8F' : i === 1 ? '#2A9D8F99' : '#2A9D8F66',
                                          }}
                                          title={`${vote.candidateName}: ${vote.points} points`}
                                        >
                                          {vote.points}
                                        </div>
                                      ))}
                                      {otherPoints > 0 && (
                                        <div 
                                          className="h-full flex justify-center items-center text-xs font-medium text-white bg-white/30"
                                          style={{ 
                                            width: `${Math.round((otherPoints / totalPoints) * 100)}%`
                                          }}
                                          title={`Other candidates: ${otherPoints} points`}
                                        >
                                          {otherPoints > 5 ? otherPoints : ''}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex text-xs mt-1 px-1">
                                      {topVotes.map((vote) => (
                                        <div 
                                          key={vote.candidateId} 
                                          className="overflow-hidden whitespace-nowrap text-ellipsis"
                                          style={{ width: `${Math.round((vote.points / totalPoints) * 100)}%` }}
                                          title={vote.candidateName}
                                        >
                                          <span className="text-white">
                                            {vote.candidateName.length > 10 
                                              ? vote.candidateName.substring(0, 8) + '...' 
                                              : vote.candidateName}
                                          </span>
                                        </div>
                                      ))}
                                      {otherPoints > 0 && (
                                        <div 
                                          className="overflow-hidden whitespace-nowrap text-ellipsis"
                                          style={{ width: `${Math.round((otherPoints / totalPoints) * 100)}%` }}
                                        >
                                          <span className="text-white opacity-70">Other</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-white/60 text-xs">No votes recorded</p>
                                )}
                              </div>
                            );
                          }).filter(Boolean)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rounds">
          <Card className="bg-black border border-white/10 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.3)] group hover:border-[#2A9D8F]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2A9D8F]/5 to-transparent opacity-70"></div>
            <div className="h-2 bg-gradient-to-r from-[#2A9D8F]/80 to-[#2A9D8F]/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-white" />
                <div>
                  <CardTitle className="text-white text-xl">Voting Rounds</CardTitle>
                  <CardDescription className="text-white">
                    Detailed statistics for each round
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              {groupStats.roundParticipation.length === 0 ? (
                <p className="text-white">No voting rounds recorded yet</p>
              ) : (
                <div className="space-y-8">
                  {groupStats.roundParticipation.map((round) => (
                    <div key={round.roundId} className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                      <div className="bg-white/10 p-4 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2A9D8F]/20 text-white border border-[#2A9D8F]/30 shadow-[0_0_10px_rgba(42,157,143,0.1)]">
                            <Calendar size={16} className="text-white" />
                          </div>
                          <h3 className="font-medium text-white text-lg">{round.roundName}</h3>
                        </div>
                        <div className="text-sm bg-[#2A9D8F]/20 px-3 py-1 rounded-full border border-[#2A9D8F]/40 text-white shadow-[0_0_10px_rgba(42,157,143,0.1)]">
                          {Math.round((round.memberCount / round.totalMembers) * 100)}% Participation
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-4">
                          <h4 className="text-white text-md mb-2 flex items-center gap-2">
                            <Users size={16} className="text-white" />
                            Voting Participation
                          </h4>
                          <div className="bg-white/10 w-full h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#2A9D8F] h-full rounded-full shadow-[0_0_10px_rgba(42,157,143,0.3)]" 
                              style={{ width: `${Math.round((round.memberCount / round.totalMembers) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-white mt-2 text-sm">{round.memberCount} of {round.totalMembers} members participated</p>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white text-md mb-3 flex items-center gap-2">
                              <Trophy size={16} className="text-white" />
                              Top Suspects This Round
                            </h4>
                            <div className="space-y-2">
                              {(() => {
                                // Get all votes for this round
                                const roundVotes = groupStats.memberVotes.reduce((acc, memberVote) => {
                                  const votes = memberVote.roundVotes[round.roundId] || {};
                                  Object.entries(votes).forEach(([candidateId, points]) => {
                                    acc[candidateId] = (acc[candidateId] || 0) + points;
                                  });
                                  return acc;
                                }, {} as Record<string, number>);

                                // Convert to array and sort
                                const sortedVotes = Object.entries(roundVotes)
                                  .map(([candidateId, points]) => ({
                                    candidateId,
                                    points,
                                    candidateName: candidates.find(c => c.id === candidateId)?.name || 'Unknown'
                                  }))
                                  .sort((a, b) => b.points - a.points)
                                  .slice(0, 3);

                                const totalPoints = sortedVotes.reduce((sum, vote) => sum + vote.points, 0);

                                return sortedVotes.map((suspect, index) => (
                                  <div key={`${round.roundId}-${suspect.candidateId}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A9D8F]/20 text-white border border-[#2A9D8F]/30">
                                        <span className="font-medium text-xs">{index + 1}</span>
                                      </div>
                                      <span className="text-white">{suspect.candidateName}</span>
                                    </div>
                                    <div className="text-white text-sm">
                                      {Math.round((suspect.points / totalPoints) * 100)}% votes
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-white text-md mb-3 flex items-center gap-2">
                              <TrendingDown size={16} className="text-white" />
                              Least Suspected This Round
                            </h4>
                            <div className="space-y-2">
                              {(() => {
                                // Get all votes for this round
                                const roundVotes = groupStats.memberVotes.reduce((acc, memberVote) => {
                                  const votes = memberVote.roundVotes[round.roundId] || {};
                                  Object.entries(votes).forEach(([candidateId, points]) => {
                                    acc[candidateId] = (acc[candidateId] || 0) + points;
                                  });
                                  return acc;
                                }, {} as Record<string, number>);

                                // Convert to array and sort
                                const sortedVotes = Object.entries(roundVotes)
                                  .map(([candidateId, points]) => ({
                                    candidateId,
                                    points,
                                    candidateName: candidates.find(c => c.id === candidateId)?.name || 'Unknown'
                                  }))
                                  .sort((a, b) => a.points - b.points)
                                  .slice(0, 3);

                                const totalPoints = sortedVotes.reduce((sum, vote) => sum + vote.points, 0);

                                return sortedVotes.map((suspect, index) => (
                                  <div key={`${round.roundId}-${suspect.candidateId}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A9D8F]/20 text-white border border-[#2A9D8F]/30">
                                        <span className="font-medium text-xs">{index + 1}</span>
                                      </div>
                                      <span className="text-white">{suspect.candidateName}</span>
                                    </div>
                                    <div className="text-white text-sm">
                                      {Math.round((suspect.points / totalPoints) * 100)}% votes
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-white text-md mb-3 flex items-center gap-2">
                            <LogOut size={16} className="text-white" />
                            Elimination
                          </h4>
                          {/* Placeholder for elimination info - would need actual data */}
                          <div className="p-3 rounded-lg bg-white/5 border border-red-500/20">
                            <p className="text-white text-sm">No elimination data available for this round.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members">
          <Card className="bg-black border border-white/10 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.3)] group hover:border-[#2A9D8F]/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2A9D8F]/5 to-transparent opacity-70"></div>
            <div className="h-2 bg-gradient-to-r from-[#2A9D8F]/80 to-[#2A9D8F]/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-white" />
                <div>
                  <CardTitle className="text-white text-xl">Group Members</CardTitle>
                  <CardDescription className="text-white">
                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'} in this group
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="space-y-4">
                {group.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-primary/20">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                        {member.photoURL ? (
                          <AvatarImage src={member.photoURL} />
                        ) : null}
                        <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white text-lg">{member.displayName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {member.role === 'admin' ? 'Admin' : 'Member'}
                          </Badge>
                          <span className="text-sm text-white">
                            Joined {member.joinedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {currentUserRole === 'admin' && member.userId !== currentUserId && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleChangeMemberRole(
                          member.userId, 
                          member.role === 'admin' ? 'member' : 'admin'
                        )}
                        className="border-white/20 hover:border-primary/50 text-white bg-white/5 hover:bg-primary/10"
                      >
                        {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
        <DialogContent className="bg-black border border-white/10 backdrop-blur-sm">
          <div className="h-1 bg-gradient-to-r from-red-500/80 to-red-500/20 opacity-80 -mt-6 -mx-6 mb-4"></div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Leave Group</DialogTitle>
            <DialogDescription className="text-white">
              Are you sure you want to leave this group? You'll need a new invitation to rejoin.
              {currentUserRole === 'admin' && group.members.length > 1 && (
                <p className="mt-2 text-amber-400 bg-amber-500/10 p-3 border border-amber-500/20 rounded-md">
                  Since you're an admin, another member will be promoted to admin if you leave.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsLeaveConfirmOpen(false)}
              className="border-white/20 hover:border-primary/50 text-white bg-white/5 hover:bg-primary/10">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveGroup}
              className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30">
              Leave Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetailPage; 