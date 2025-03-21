import { useAuth } from '@/contexts/AuthContext';
import { CandidatesBanner } from '@/components/candidates/CandidatesBanner';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Animated Banner */}
      <CandidatesBanner />
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        
      </div>

    </div>
  );
} 