import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SubmitClaim from './pages/SubmitClaim';
import ClaimsList from './pages/ClaimsList';
import ClaimDetails from './pages/ClaimDetails';
import Approvals from './pages/Approvals';
import Login from './pages/Login';
import AuthVerify from './pages/AuthVerify';
import EnvironmentTest from './components/EnvironmentTest';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Error Component
const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
        Configuration Error
      </h2>
      <p className="text-gray-600 text-center mb-6">
        {error}
      </p>
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
        <div className="text-xs text-gray-500 text-center">
          If the problem persists, please check your environment variables in Netlify.
        </div>
      </div>
    </div>
  </div>
);

// Loading Component
const LoadingDisplay: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Cynclaim...</p>
    </div>
  </div>
);

// Main App Component
const AppContent: React.FC = () => {
  const { user, loading, error, clearError } = useAuth();

  // Show error if there's a configuration issue
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={() => {
          clearError();
          window.location.reload();
        }} 
      />
    );
  }

  // Show loading while checking authentication
  if (loading) {
    return <LoadingDisplay />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user ? (
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submit-claim" element={<SubmitClaim />} />
              <Route path="/claims" element={<ClaimsList />} />
              <Route path="/claims/:id" element={<ClaimDetails />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/verify" element={<AuthVerify />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
        {/* Environment test component for debugging */}
        {process.env.NODE_ENV === 'development' && <EnvironmentTest />}
      </div>
    </Router>
  );
};

// Root App Component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
