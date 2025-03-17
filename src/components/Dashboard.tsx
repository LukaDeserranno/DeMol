import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { HeroBanner } from './dashboard/HeroBanner';
import { GroupsCard } from './dashboard/GroupsCard';
import { ActivityCard } from './dashboard/ActivityCard';
import { CandidatesCard } from './dashboard/CandidatesCard';
import { AdminPanel } from './dashboard/AdminPanel';
import { QuickLinks } from './dashboard/QuickLinks';
import { CANDIDATES } from '../models/Candidate';

interface Group {
  id: string;
  name: string;
  members: string[];
  createdAt: any;
  hasVotes?: boolean;
  activeRound?: string;
}

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [featuredCandidate, setFeaturedCandidate] = useState(
    CANDIDATES[Math.floor(Math.random() * CANDIDATES.length)]
  );

  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchGroups() {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Check if user is admin
        const adminCheck = await getDocs(
          query(collection(db, 'admins'), where('userId', '==', currentUser.uid))
        );
        setIsAdmin(!adminCheck.empty);

        // Get user's groups
        const groupsQuery = query(
          collection(db, 'groups'),
          where('members', 'array-contains', currentUser.uid)
        );
        
        const groupsSnapshot = await getDocs(groupsQuery);
        
        const groupsData: Group[] = [];
        groupsSnapshot.forEach((doc) => {
          const data = doc.data();
          groupsData.push({
            id: doc.id,
            name: data.name || 'Unnamed Group',
            members: data.members || [],
            createdAt: data.createdAt,
            hasVotes: data.hasVotes || false,
            activeRound: data.activeRound || null,
          });
        });
        
        setGroups(groupsData);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load your groups. Please refresh the page to try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();

    // Change featured candidate every 5 seconds
    const interval = setInterval(() => {
      setFeaturedCandidate(CANDIDATES[Math.floor(Math.random() * CANDIDATES.length)]);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  function handleRefresh() {
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <div className="container mx-auto py-8">
      {/* Hero Banner */}
      <HeroBanner featuredCandidate={featuredCandidate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* My Groups Section */}
          <GroupsCard 
            groups={groups} 
            loading={loading} 
            error={error} 
            onRefresh={handleRefresh} 
          />

          {/* Recent Activity */}
          <ActivityCard groups={groups} />
        </div>

        <div className="space-y-8">
          {/* Candidates Display */}
          <CandidatesCard candidates={CANDIDATES} />

          {/* Admin Panel Card (if user is admin) */}
          {isAdmin && <AdminPanel />}

          {/* Quick Links Card */}
          <QuickLinks groups={groups} />
        </div>
      </div>
    </div>
  );
} 