export interface GroupMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string; // User ID of creator
  createdAt: Date;
  members: GroupMember[];
  inviteCode: string; // Unique code for invitations
}

export interface MemberVote {
  userId: string;
  displayName: string;
  votes: Record<string, number>; // candidateId -> total points
}

export interface RoundParticipation {
  roundId: string;
  roundName: string;
  memberCount: number;
  totalMembers: number;
}

export interface CandidatePoints {
  candidateId: string;
  candidateName: string;
  totalPoints: number;
  percentage: number;
}

export interface GroupStats {
  topSuspects: CandidatePoints[];
  leastSuspects: CandidatePoints[];
  memberVotes: MemberVote[];
  roundParticipation: RoundParticipation[];
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviteCode: string;
  createdAt: Date;
  expiresAt: Date | null;
  createdBy: string; // User ID who created the invite
  usedBy: string[]; // User IDs who used this invite
  maxUses: number | null; // Maximum number of uses, null = unlimited
} 