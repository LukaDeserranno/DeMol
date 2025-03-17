import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
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
import { ArrowLeftIcon } from '@radix-ui/react-icons';

export default function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to create a group');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare the group data
      const groupData = {
        name: groupName.trim(),
        createdBy: currentUser.uid,
        members: [currentUser.uid], // Initially, only the creator is a member
        createdAt: serverTimestamp(),
      };

      console.log('Creating group with data:', JSON.stringify(groupData));

      // Create the group in Firestore
      const groupRef = await addDoc(collection(db, 'groups'), groupData);

      console.log('Group created with ID:', groupRef.id);
      
      // Also update the user's groups array
      try {
        // Make sure the user document exists
        const userDoc = doc(db, 'users', currentUser.uid);
        await updateDoc(userDoc, {
          groups: arrayUnion(groupRef.id)
        });
      } catch (userErr) {
        console.error('Error updating user document with new group:', userErr);
        // Continue anyway since the group was created
      }
      
      // Wait a moment to ensure Firestore updates are processed
      setTimeout(() => {
        // Navigate to the group details page
        navigate(`/groups/${groupRef.id}`);
      }, 1500); // Increased timeout for safer navigation
    } catch (err: any) {
      console.error('Error creating group:', err);
      setError(`Failed to create group: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <Button 
        variant="ghost" 
        className="mb-6 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors gap-2"
        onClick={() => navigate('/groups')}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Groups
      </Button>

      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="text-2xl font-bold">Create New Group</CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            Create a group and invite your friends to join for De Mol predictions.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-4">
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="groupName" className="text-gray-700 font-medium">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Enter your group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={loading}
                  className="rounded-lg border-gray-300 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-gray-50/50 border-t border-gray-100 p-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/groups')} 
              disabled={loading}
              className="hover:bg-gray-100 hover:text-gray-800 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : 'Create Group'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 