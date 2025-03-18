import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import Dashboard from './components/Dashboard';
import FirestoreTest from './components/FirestoreTest';
import FirebaseConfigCheck from './components/FirebaseConfigCheck';
import FirebaseDiagnostics from './components/FirebaseDiagnostics';
import GroupsList from './components/groups/GroupsList';
import CreateGroup from './components/groups/CreateGroup';
import GroupDetails from './components/groups/GroupDetails';
import GroupInvite from './components/groups/GroupInvite';
// import VotingForm from './components/voting/VotingForm';
import VotingResults from './components/voting/VotingResults';
import RoundManager from './components/admin/RoundManager';
import PointDistribution from './components/voting/PointDistribution';
import Candidates from './components/Candidates';
import { Layout } from './components/layout/Layout';

// Wrap the component with layout for protected routes
const withLayout = (Component: React.ComponentType<any>) => (props: any) => (
  <Layout>
    <Component {...props} />
  </Layout>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<SignupForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route path="/firebase-test" element={<FirestoreTest />} />
          <Route path="/firebase-config" element={<FirebaseConfigCheck />} />
          <Route path="/diagnostics" element={<FirebaseDiagnostics />} />
          
          <Route path="/" element={<ProtectedRoute>{withLayout(Dashboard)({})}</ProtectedRoute>} />
          <Route path="/candidates" element={<ProtectedRoute>{withLayout(Candidates)({})}</ProtectedRoute>} />
          
          {/* Group Routes */}
          <Route path="/groups" element={<ProtectedRoute>{withLayout(GroupsList)({})}</ProtectedRoute>} />
          <Route path="/groups/create" element={<ProtectedRoute>{withLayout(CreateGroup)({})}</ProtectedRoute>} />
          <Route path="/groups/:groupId" element={<ProtectedRoute>{withLayout(GroupDetails)({})}</ProtectedRoute>} />
          <Route path="/invite/:groupId" element={<ProtectedRoute>{withLayout(GroupInvite)({})}</ProtectedRoute>} />
          
          {/* Voting Routes */}
          <Route path="/vote" element={<ProtectedRoute>{withLayout(PointDistribution)({})}</ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute>{withLayout(VotingResults)({})}</ProtectedRoute>} />
          <Route path="/points" element={<ProtectedRoute>{withLayout(PointDistribution)({})}</ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/rounds" element={<ProtectedRoute>{withLayout(RoundManager)({})}</ProtectedRoute>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
