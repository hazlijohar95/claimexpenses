import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 Error Boundary Caught Error:', error);
    console.error('📍 Component Stack:', errorInfo.componentStack);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Report to error tracking service in production
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Log to console for now, but you can integrate with services like:
    // - Sentry: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // - LogRocket: LogRocket.captureException(error);
    // - Bugsnag: Bugsnag.notify(error, { context: 'React Error Boundary' });
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('📊 Error Report Data:', errorData);
    
    // Example: Send to your error reporting endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // }).catch(err => console.error('Failed to report error:', err));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private copyErrorToClipboard = async () => {
    const { error, errorInfo } = this.state;
    const errorText = `
🚨 Error Report
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Message: ${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      alert('Error details copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: create a text area and select it
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard!');
    }
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  override render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-900">
                    Oops! Something went wrong
                  </h2>
                  <p className="text-sm text-red-700">
                    The application encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Error Message */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Error Message:</h3>
                <div className="bg-gray-100 rounded-md p-3 font-mono text-sm text-gray-800">
                  {error?.message || 'Unknown error occurred'}
                </div>
              </div>

              {/* Development Mode Details */}
              {import.meta.env.DEV && (
                <div className="mb-6">
                  <button
                    onClick={this.toggleDetails}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-3"
                  >
                    <Bug className="w-4 h-4" />
                    <span>Technical Details</span>
                    {showDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showDetails && (
                    <div className="space-y-4">
                      {/* Stack Trace */}
                      {error?.stack && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Stack Trace:</h4>
                          <div className="bg-gray-900 text-green-400 rounded-md p-3 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                            <pre>{error.stack}</pre>
                          </div>
                        </div>
                      )}

                      {/* Component Stack */}
                      {errorInfo?.componentStack && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Component Stack:</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                            <pre>{errorInfo.componentStack}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>

                <button
                  onClick={this.handleReset}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <span>Try Again</span>
                </button>

                <button
                  onClick={this.copyErrorToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Error Details</span>
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What can you do?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Try reloading the page</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  {import.meta.env.DEV && (
                    <li>• Copy the error details above for debugging</li>
                  )}
                  <li>• If the problem persists, contact support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: string) => {
    console.error('🚨 Manual Error Report:', error);
    if (errorInfo) {
      console.error('📍 Additional Info:', errorInfo);
    }

    // Report to error tracking service
    if (import.meta.env.PROD) {
      // Same reporting logic as above
      const errorData = {
        message: error.message,
        stack: error.stack,
        additionalInfo: errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      console.error('📊 Manual Error Report Data:', errorData);
    }
  }, []);

  return { handleError };
};

export default ErrorBoundary;