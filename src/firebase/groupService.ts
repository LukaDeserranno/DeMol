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
  getFirestore,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { app } from './config';
import { Group, GroupInvite, GroupMember } from '../models/group';
import { User } from '../models/user';
import { nanoid } from 'nanoid';

const db = getFirestore(app);
const GROUPS_COLLECTION = 'groups';
const GROUP_INVITES_COLLECTION = 'groupInvites';

// Generate a unique invite code
const generateInviteCode = () => {
  return nanoid(8); // Generate an 8 character unique code
};

// Create a new group
export const createGroup = async (name: string, description: string, currentUser: User): Promise<Group> => {
  try {
    const groupRef = doc(collection(db, GROUPS_COLLECTION));
    
    const member: GroupMember = {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      role: 'owner',
      joinedAt: new Date()
    };

    const inviteCode = generateInviteCode();
    
    const newGroup: Group = {
      id: groupRef.id,
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: currentUser.uid,
      members: { [currentUser.uid]: member },
      inviteCode,
      isActive: true
    };
    
    await setDoc(groupRef, {
      ...newGroup,
      createdAt: Timestamp.fromDate(newGroup.createdAt),
      updatedAt: Timestamp.fromDate(newGroup.updatedAt),
      members: { [currentUser.uid]: {
        ...member,
        joinedAt: Timestamp.fromDate(member.joinedAt)
      }}
    });
    
    return newGroup;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// Get a group by ID
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      return null;
    }
    
    const groupData = groupSnap.data();
    
    // Convert Firestore timestamps to Date objects
    const group: Group = {
      ...groupData,
      id: groupSnap.id,
      createdAt: groupData.createdAt.toDate(),
      updatedAt: groupData.updatedAt.toDate(),
      members: Object.entries(groupData.members).reduce((acc: Record<string, GroupMember>, [uid, member]: [string, any]) => {
        acc[uid] = {
          ...member,
          joinedAt: member.joinedAt.toDate()
        };
        return acc;
      }, {})
    } as Group;
    
    return group;
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
};

// Get all groups for a user
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(groupsRef, where(`members.${userId}`, '!=', null));
    const querySnapshot = await getDocs(q);
    
    const groups: Group[] = [];
    
    querySnapshot.forEach((doc) => {
      const groupData = doc.data();
      
      // Convert Firestore timestamps to Date objects
      const group: Group = {
        ...groupData,
        id: doc.id,
        createdAt: groupData.createdAt.toDate(),
        updatedAt: groupData.updatedAt.toDate(),
        members: Object.entries(groupData.members).reduce((acc: Record<string, GroupMember>, [uid, member]: [string, any]) => {
          acc[uid] = {
            ...member,
            joinedAt: member.joinedAt.toDate()
          };
          return acc;
        }, {})
      } as Group;
      
      groups.push(group);
    });
    
    return groups;
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

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

// Join a group using an invite
export const joinGroupWithInvite = async (inviteCode: string, currentUser: User): Promise<Group | null> => {
  try {
    // Get the invite
    const invite = await getInviteByCode(inviteCode);
    
    if (!invite) {
      throw new Error('Invite not found');
    }
    
    // Check if invite is expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new Error('Invite has expired');
    }
    
    // Check if max uses is exceeded
    if (invite.maxUses !== null && invite.usedBy.length >= invite.maxUses) {
      throw new Error('Invite has reached maximum number of uses');
    }
    
    // Get the group
    const group = await getGroupById(invite.groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if user is already a member
    if (group.members[currentUser.uid]) {
      return group; // User is already a member, just return the group
    }
    
    // Add user to group
    const member: GroupMember = {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      role: 'member',
      joinedAt: new Date()
    };
    
    const groupRef = doc(db, GROUPS_COLLECTION, group.id);
    
    await updateDoc(groupRef, {
      [`members.${currentUser.uid}`]: {
        ...member,
        joinedAt: Timestamp.fromDate(member.joinedAt)
      },
      updatedAt: serverTimestamp()
    });
    
    // Update invite usage
    const inviteRef = doc(db, GROUP_INVITES_COLLECTION, invite.id);
    await updateDoc(inviteRef, {
      usedBy: [...invite.usedBy, currentUser.uid]
    });
    
    // Get updated group
    return await getGroupById(group.id);
  } catch (error) {
    console.error('Error joining group with invite:', error);
    throw error;
  }
};

// Leave a group
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const group = await getGroupById(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if user is the owner
    if (group.ownerId === userId) {
      throw new Error('Group owner cannot leave the group. Transfer ownership first or delete the group.');
    }
    
    // Remove user from group
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    
    await updateDoc(groupRef, {
      [`members.${userId}`]: null,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error leaving group:', error);
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
    if (group.ownerId !== userId) {
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