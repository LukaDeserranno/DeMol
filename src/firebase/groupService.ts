import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp,
  serverTimestamp,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './config';
import { Group, GroupMember, GroupStats, GroupInvite } from '../models/group';
import { Candidate } from '../models/candidate';
import { Vote } from '../models/vote';
import { getUserVoteForRound, getAllVotingRounds, getUserVotes } from './votingService';

const auth = getAuth();
const GROUPS_COLLECTION = 'groups';
const GROUP_INVITES_COLLECTION = 'groupInvites';

// Collection references
const groupsCollection = collection(db, GROUPS_COLLECTION);

// Generate a random invite code
function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new group
export async function createGroup(
  name: string, 
  description: string | undefined, 
  userId: string
): Promise<Group> {
  const inviteCode = generateInviteCode(8);
  
  // Get current user's display name
  const user = auth.currentUser;
  const displayName = user?.displayName || 'Anonymous';
  const photoURL = user?.photoURL || null;
  
  const member: GroupMember = {
    userId,
    displayName,
    role: 'admin',
    joinedAt: new Date()
  };
  
  // Add photoURL if it exists
  if (photoURL) {
    member.photoURL = photoURL;
  }
  
  // Create base group data - omit description if undefined
  const groupData: any = {
    name,
    createdBy: userId,
    createdAt: serverTimestamp(),
    members: [{
      userId,
      displayName,
      role: 'admin',
      joinedAt: Timestamp.now()
    }],
    inviteCode
  };
  
  // Add photoURL to the member in groupData if it exists
  if (photoURL) {
    groupData.members[0].photoURL = photoURL;
  }
  
  // Only add description if it exists (avoid sending undefined to Firestore)
  if (description) {
    groupData.description = description;
  }
  
  try {
    console.log('Creating group with data:', JSON.stringify(groupData));
    
    const docRef = await addDoc(groupsCollection, groupData);
    
    console.log('Group created with ID:', docRef.id);
    
    // Return the group with local time
    return {
      id: docRef.id,
      name,
      description,
      createdBy: userId,
      createdAt: new Date(),
      members: [member],
      inviteCode
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

// Get a group by ID
export async function getGroupById(groupId: string): Promise<Group | null> {
  const groupRef = doc(groupsCollection, groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    return null;
  }
  
  const data = groupSnap.data();
  
  return {
    id: groupSnap.id,
    name: data.name,
    description: data.description,
    createdBy: data.createdBy,
    createdAt: data.createdAt.toDate(),
    members: data.members.map((member: any) => ({
      ...member,
      joinedAt: member.joinedAt instanceof Timestamp ? member.joinedAt.toDate() : new Date(member.joinedAt)
    })),
    inviteCode: data.inviteCode
  };
}

// Get all groups a user is a member of
export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    console.log(`Getting groups for user: ${userId}`);
    
    // Fetch all groups and filter client-side
    // This is more reliable than array-contains with complex objects
    const snapshot = await getDocs(groupsCollection);
    const groups: Group[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if the user is a member by userId
      const isUserMember = data.members && 
        Array.isArray(data.members) && 
        data.members.some((member: any) => member.userId === userId);
      
      if (isUserMember) {
        console.log(`Found group ${doc.id} for user ${userId}`);
        
        try {
          groups.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: data.createdAt.toDate(),
            members: data.members.map((member: any) => ({
              ...member,
              joinedAt: member.joinedAt instanceof Timestamp ? member.joinedAt.toDate() : new Date(member.joinedAt)
            })),
            inviteCode: data.inviteCode
          });
        } catch (parseError) {
          console.error(`Error parsing group ${doc.id}:`, parseError);
        }
      }
    });
    
    console.log(`Found ${groups.length} groups for user ${userId}`);
    return groups;
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
}

// Join a group with invite code
export async function joinGroupWithCode(
  inviteCode: string,
  userId: string
): Promise<Group | null> {
  // Get current user's display name
  const user = auth.currentUser;
  const displayName = user?.displayName || 'Anonymous';
  const photoURL = user?.photoURL || null;
  
  const q = query(
    groupsCollection,
    where('inviteCode', '==', inviteCode)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const groupDoc = querySnapshot.docs[0];
  const groupData = groupDoc.data();
  
  // Check if user is already a member
  const isMember = groupData.members.some((member: any) => member.userId === userId);
  
  if (isMember) {
    return getGroupById(groupDoc.id);
  }
  
  // Add the user as a member
  const newMember: any = {
    userId,
    displayName,
    role: 'member',
    // Use Timestamp.now() instead of serverTimestamp() inside arrays
    joinedAt: Timestamp.now()
  };
  
  // Only add photoURL if it exists
  if (photoURL) {
    newMember.photoURL = photoURL;
  }
  
  console.log('Adding new member to group:', newMember);
  
  await updateDoc(doc(groupsCollection, groupDoc.id), {
    members: arrayUnion(newMember)
  });
  
  return getGroupById(groupDoc.id);
}

// Leave a group
export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  try {
    const groupRef = doc(groupsCollection, groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      return false;
    }
    
    const groupData = groupSnap.data();
    const memberToRemove = groupData.members.find((member: any) => member.userId === userId);
    
    if (!memberToRemove) {
      return false;
    }
    
    // If this is the only member, delete the group
    if (groupData.members.length === 1) {
      await deleteDoc(groupRef);
      return true;
    }
    
    // Remove the member
    await updateDoc(groupRef, {
      members: arrayRemove(memberToRemove)
    });
    
    // If this was an admin and no admins remain, promote the oldest member
    if (
      memberToRemove.role === 'admin' &&
      !groupData.members.some((m: any) => m.userId !== userId && m.role === 'admin')
    ) {
      const remainingMembers = groupData.members.filter((m: any) => m.userId !== userId);
      
      // Sort by join date
      remainingMembers.sort((a: any, b: any) => {
        const dateA = a.joinedAt instanceof Timestamp ? a.joinedAt.toDate() : new Date(a.joinedAt);
        const dateB = b.joinedAt instanceof Timestamp ? b.joinedAt.toDate() : new Date(b.joinedAt);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Promote the oldest member
      if (remainingMembers.length > 0) {
        const oldestMember = { ...remainingMembers[0], role: 'admin' };
        
        await updateDoc(groupRef, {
          members: arrayRemove(remainingMembers[0])
        });
        
        await updateDoc(groupRef, {
          members: arrayUnion(oldestMember)
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error leaving group:', error);
    return false;
  }
}

// Change a member's role
export async function changeMemberRole(
  groupId: string,
  adminUserId: string,
  memberUserId: string,
  newRole: 'admin' | 'member'
): Promise<boolean> {
  try {
    const groupRef = doc(groupsCollection, groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      return false;
    }
    
    const groupData = groupSnap.data();
    
    // Verify admin permissions
    const adminMember = groupData.members.find((m: any) => m.userId === adminUserId);
    
    if (!adminMember || adminMember.role !== 'admin') {
      return false;
    }
    
    // Find the target member
    const memberToUpdate = groupData.members.find((m: any) => m.userId === memberUserId);
    
    if (!memberToUpdate) {
      return false;
    }
    
    // Remove the old member entry
    await updateDoc(groupRef, {
      members: arrayRemove(memberToUpdate)
    });
    
    // Add the updated member entry
    await updateDoc(groupRef, {
      members: arrayUnion({
        ...memberToUpdate,
        role: newRole
      })
    });
    
    return true;
  } catch (error) {
    console.error('Error changing member role:', error);
    return false;
  }
}

// Get group stats - real implementation
export async function getGroupStats(groupId: string, activeCandidates: Candidate[]): Promise<GroupStats> {
  try {
    console.log("Calculating group stats for groupId:", groupId);
    
    const group = await getGroupById(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Create a map of candidate IDs for quick lookup
    const candidateMap = activeCandidates.reduce((map, candidate) => {
      map[candidate.id] = candidate;
      return map;
    }, {} as Record<string, Candidate>);
    
    // Get all active rounds
    const rounds = await getAllVotingRounds();
    console.log(`Found ${rounds.length} voting rounds`);
    
    // Fetch all votes for all members in this group
    const memberVotesPromises = group.members.map(async (member) => {
      try {
        const userVotes = await getUserVotes(member.userId);
        console.log(`Found ${userVotes.length} votes for user ${member.displayName}`);
        return {
          member,
          votes: userVotes
        };
      } catch (error) {
        console.error(`Error fetching votes for ${member.displayName}:`, error);
        return {
          member,
          votes: []
        };
      }
    });
    
    const memberVotesResults = await Promise.all(memberVotesPromises);
    
    // Initialize candidate points tracking
    const candidatePointsTotal: Record<string, number> = {};
    activeCandidates.forEach(c => candidatePointsTotal[c.id] = 0);
    
    // Process all votes to create statistics
    for (const { member, votes } of memberVotesResults) {
      for (const vote of votes) {
        if (vote.candidateVotes) {
          // Add points to the total for each candidate
          Object.entries(vote.candidateVotes).forEach(([candidateId, points]) => {
            if (candidatePointsTotal[candidateId] !== undefined) {
              candidatePointsTotal[candidateId] += points;
            }
          });
        }
      }
    }
    
    // Calculate total points allocated
    const totalPointsAllocated = Object.values(candidatePointsTotal).reduce((sum, points) => sum + points, 0);
    
    // Create sorted arrays for suspects
    const candidatePoints = activeCandidates.map(candidate => {
      const points = candidatePointsTotal[candidate.id] || 0;
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        totalPoints: points,
        percentage: totalPointsAllocated > 0 
          ? Math.round((points / totalPointsAllocated) * 100) 
          : 0
      };
    });
    
    console.log("Calculated candidate points:", candidatePoints);
    
    // Sort by points for top suspects (highest first)
    const topSuspects = [...candidatePoints]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);
      
    // Sort by points for least suspects (lowest first)  
    const leastSuspects = [...candidatePoints]
      .sort((a, b) => a.totalPoints - b.totalPoints)
      .slice(0, 3);
    
    // Calculate member votes - use the most recent vote for each member
    const memberVotes = memberVotesResults.map(({ member, votes }) => {
      // Create a map of votes by round
      const roundVotes: Record<string, Record<string, number>> = {};
      
      // Process all votes for this member
      votes.forEach(vote => {
        if (vote.candidateVotes) {
          roundVotes[vote.roundId] = vote.candidateVotes;
        }
      });
      
      // Find most recent vote for total votes
      const latestVote = votes.length > 0 
        ? votes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] 
        : null;
      
      if (latestVote) {
        return {
          userId: member.userId,
          displayName: member.displayName,
          votes: latestVote.candidateVotes,
          roundVotes
        };
      } else {
        // No votes - return zero for all candidates
        return {
          userId: member.userId,
          displayName: member.displayName,
          votes: activeCandidates.reduce((acc, c) => {
            acc[c.id] = 0;
            return acc;
          }, {} as Record<string, number>),
          roundVotes: {}
        };
      }
    });
    
    // Calculate participation per round
    const roundParticipation = rounds.map(round => {
      // Count how many members voted in this round
      let memberCount = 0;
      
      for (const { votes } of memberVotesResults) {
        // If any vote matches this round id, count the member
        if (votes.some(v => v.roundId === round.id)) {
          memberCount++;
        }
      }
      
      return {
        roundId: round.id,
        roundName: round.name,
        memberCount,
        totalMembers: group.members.length
      };
    });
    
    return {
      topSuspects,
      leastSuspects,
      memberVotes,
      roundParticipation
    };
  } catch (error) {
    console.error('Error calculating group stats:', error);
    // If there's an error, return empty data rather than crashing
    return {
      topSuspects: [],
      leastSuspects: [],
      memberVotes: [],
      roundParticipation: []
    };
  }
}

// Create a new invite for a group
export const createGroupInvite = async (
  groupId: string, 
  groupName: string, 
  createdBy: string, 
  expiresIn?: number, // in hours, undefined means never expires
  maxUses?: number // undefined means unlimited uses
): Promise<GroupInvite> => {
  try {
    const inviteCode = generateInviteCode();
    const now = new Date();
    
    const newInvite: GroupInvite = {
      id: '',
      groupId,
      groupName,
      inviteCode,
      createdAt: now,
      expiresAt: expiresIn ? new Date(now.getTime() + expiresIn * 60 * 60 * 1000) : null,
      createdBy,
      usedBy: [],
      maxUses: maxUses || null
    };
    
    const inviteRef = await addDoc(collection(db, GROUP_INVITES_COLLECTION), {
      ...newInvite,
      createdAt: Timestamp.fromDate(newInvite.createdAt),
      expiresAt: newInvite.expiresAt ? Timestamp.fromDate(newInvite.expiresAt) : null
    });
    
    newInvite.id = inviteRef.id;
    
    return newInvite;
  } catch (error) {
    console.error('Error creating group invite:', error);
    throw error;
  }
};

// Get invite by code
export const getInviteByCode = async (inviteCode: string): Promise<GroupInvite | null> => {
  try {
    const invitesRef = collection(db, GROUP_INVITES_COLLECTION);
    const q = query(invitesRef, where('inviteCode', '==', inviteCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const inviteDoc = querySnapshot.docs[0];
    const inviteData = inviteDoc.data();
    
    const invite: GroupInvite = {
      ...inviteData,
      id: inviteDoc.id,
      createdAt: inviteData.createdAt.toDate(),
      expiresAt: inviteData.expiresAt ? inviteData.expiresAt.toDate() : null
    } as GroupInvite;
    
    return invite;
  } catch (error) {
    console.error('Error getting invite by code:', error);
    throw error;
  }
};

// Delete a group
export const deleteGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const group = await getGroupById(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if user is the owner
    if (group.createdBy !== userId) {
      throw new Error('Only the group owner can delete the group');
    }
    
    // Delete group
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await deleteDoc(groupRef);
    
    // Delete all invites for this group
    const invitesRef = collection(db, GROUP_INVITES_COLLECTION);
    const q = query(invitesRef, where('groupId', '==', groupId));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}; 