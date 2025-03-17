import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
import { PlusIcon, PersonIcon } from '@radix-ui/react-icons';

interface Group {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
}

export default function GroupsList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGroups() {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError('');

        // Fetch groups where the user is a member
        const groupsQuery = query(
          collection(db, 'groups'),
          where('members', 'array-contains', currentUser.uid)
        );

        const querySnapshot = await getDocs(groupsQuery);
        const groupsList: Group[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Handle createdAt field which might be a Firestore timestamp or null
          let createdAt;
          try {
            createdAt = data.createdAt?.toDate() || new Date();
          } catch (e) {
            console.error('Error converting timestamp:', e);
            createdAt = new Date(); // Fallback to current date
          }
          
          groupsList.push({
            id: doc.id,
            name: data.name || 'Unnamed Group',
            createdBy: data.createdBy || '',
            members: data.members || [],
            createdAt: createdAt,
          });
        });

        setGroups(groupsList);
      } catch (err: any) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, [currentUser]);

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Groups</h1>
          <p className="text-gray-500">Manage your De Mol prediction groups and track your ranking</p>
        </div>
        <Button 
          onClick={() => navigate('/groups/create')} 
          className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:shadow-lg px-5 py-6 h-auto rounded-xl self-start md:self-auto"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Create New Group
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <Card className="text-center p-8 border-0 shadow-md rounded-xl bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
              <p className="text-gray-500">Loading your groups...</p>
            </div>
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="text-center p-10 border-0 shadow-md rounded-xl bg-gradient-to-br from-white to-gray-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center">
                <PersonIcon className="h-12 w-12 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Groups Found</h3>
                <CardDescription className="text-lg mb-6">
                  You are not a member of any groups yet.
                </CardDescription>
              </div>
              <Button 
                onClick={() => navigate('/groups/create')}
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg px-6 py-6 h-auto rounded-xl text-lg font-medium"
              >
                Create Your First Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="overflow-hidden border-0 shadow-md rounded-xl hover:shadow-xl transition-all duration-300 group">
              <div className="h-3 bg-gradient-to-r from-red-500 to-red-600"></div>
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-xl">{group.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center mt-1">
                    <PersonIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{group.members.length} members</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Created on{' '}
                  {group.createdAt.toLocaleDateString('nl-BE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
              <CardFooter className="border-t border-gray-100 bg-gray-50/50 p-4">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-white hover:bg-red-600 border-red-200 transition-all duration-300"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  View Group
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 