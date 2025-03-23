import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import DashboardPage from './pages/dashboard';
import { VotingPage } from './pages/VotingPage';
import { AdminVotingRounds } from './pages/admin/AdminVotingRounds';
import { MainLayout } from './components/layout/MainLayout';
import { AdminRoute } from './components/auth/AdminRoute';
import GroupsPage from './pages/groups';
import GroupDetailPage from './pages/groups/[id]';
import { ToastProvider } from './components/ui/toast';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}

function App() {
  const { user } = useAuth();
  
  return (
    <ToastProvider>
      <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route 
              path="/vote" 
              element={
                <PrivateRoute>
                  <VotingPage userId={user?.uid ?? ''} />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/predictions" 
              element={
                <PrivateRoute>
                  <div className="py-8 text-center text-white">
                    <h1 className="text-2xl font-bold mb-4">Voorspellingen</h1>
                    <p>Voorspellingen pagina komt binnenkort beschikbaar</p>
                  </div>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <PrivateRoute>
                  <div className="py-8 text-center text-white">
                    <h1 className="text-2xl font-bold mb-4">Resultaten</h1>
                    <p>Resultaten pagina komt binnenkort beschikbaar</p>
                  </div>
                </PrivateRoute>
              } 
            />
            
            {/* Groups Routes */}
            <Route 
              path="/groups" 
              element={
                <PrivateRoute>
                  <GroupsPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/groups/:id" 
              element={
                <PrivateRoute>
                  <GroupDetailPage />
                </PrivateRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/voting-rounds" 
              element={
                <AdminRoute>
                  <AdminVotingRounds />
                </AdminRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
