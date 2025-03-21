import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import DashboardPage from './pages/dashboard';
import { MainLayout } from './components/layout/MainLayout';

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
  return (
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
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    </Router>
  );
}

export default App;
