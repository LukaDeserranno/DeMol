import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin w-12 h-12 border-4 border-[#2A9D8F] border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect to dashboard if authenticated but not admin
  if (!isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  // Render children if user is admin
  return <MainLayout>{children}</MainLayout>;
} 