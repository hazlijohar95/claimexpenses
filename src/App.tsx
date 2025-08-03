import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import DebugPanel, { useDebugPanel } from './components/DebugPanel';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { ENV, APP_CONFIG } from './utils/constants';
import { validateEnvironment } from './utils/security';

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SubmitClaim = React.lazy(() => import('./pages/SubmitClaim'));
const ClaimsList = React.lazy(() => import('./pages/ClaimsList'));
const ClaimDetails = React.lazy(() => import('./pages/ClaimDetails'));
const Approvals = React.lazy(() => import('./pages/Approvals'));
const Login = React.lazy(() => import('./pages/Login'));
const AuthVerify = React.lazy(() => import('./pages/AuthVerify'));
const EnvironmentTest = React.lazy(() => import('./components/EnvironmentTest'));
const EnvironmentDiagnostic = React.lazy(() => import('./components/EnvironmentDiagnostic'));

// Initialize global error handler
import './utils/errorHandler';

// Error Display Component
const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => {
  const envValidation = validateEnvironment();
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-50 rounded-lg mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Configuration Error
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {error}
        </p>
        {!envValidation.isValid && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-1">Environment Issues:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {envValidation.errors.map((err, index) => (
                <li key={index}>• {err}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
          <div className="text-xs text-gray-500 text-center">
            If the problem persists, please check your environment variables.
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Display Component
const LoadingDisplay: React.FC = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
      </div>
      <p className="text-sm text-gray-600">Loading {APP_CONFIG.NAME}...</p>
    </div>
  </div>
);

// Suspense Fallback Component
const SuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
      <span className="text-sm text-gray-600">Loading...</span>
    </div>
  </div>
);

// Main App Component
const AppContent: React.FC = () => {
  const { user, loading, error, clearError } = useAuth();
  const debugPanel = useDebugPanel();

  // Show error if there's a configuration issue
  if (error) {
    return (
      <ErrorBoundary>
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            clearError();
            window.location.reload();
          }} 
        />
        <DebugPanel isOpen={debugPanel.isOpen} onToggle={debugPanel.toggle} />
      </ErrorBoundary>
    );
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <ErrorBoundary>
        <LoadingDisplay />
        <DebugPanel isOpen={debugPanel.isOpen} onToggle={debugPanel.toggle} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {user ? (
            <Layout>
              <ErrorBoundary fallback={
                <div className="p-8 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Page Error</h2>
                  <p className="text-gray-600 mb-4">This page encountered an error. Please try refreshing.</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  >
                    Refresh Page
                  </button>
                </div>
              }>
                <Suspense fallback={<SuspenseFallback />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/submit-claim" element={<SubmitClaim />} />
                    <Route path="/claims" element={<ClaimsList />} />
                    <Route path="/claims/:id" element={<ClaimDetails />} />
                    <Route path="/approvals" element={<Approvals />} />
                    <Route path="/login" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Layout>
          ) : (
            <ErrorBoundary fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Error</h2>
                  <p className="text-gray-600 mb-4">There was a problem with the login system.</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  >
                    Reload App
                  </button>
                </div>
              </div>
            }>
              <Suspense fallback={<SuspenseFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/verify" element={<AuthVerify />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          )}
          {/* Development tools - only in development mode */}
          {ENV.isDevelopment && (
            <Suspense fallback={null}>
              <EnvironmentTest />
            </Suspense>
          )}
          {/* Environment diagnostic component */}
          <Suspense fallback={null}>
            <EnvironmentDiagnostic />
          </Suspense>
          {/* Debug Panel */}
          <DebugPanel isOpen={debugPanel.isOpen} onToggle={debugPanel.toggle} />
        </div>
      </Router>
    </ErrorBoundary>
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
