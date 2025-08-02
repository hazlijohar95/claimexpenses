import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ResendService } from '../services/resendService';
import { Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { logger } from '../lib/supabase';

const AuthVerify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithMagicLink } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('No verification token found');
          return;
        }

        // Verify the magic link token
        const verification = ResendService.verifyMagicLinkToken(token);
        
        if (!verification.valid) {
          setStatus('error');
          setMessage(verification.error || 'Invalid or expired token');
          return;
        }

        // Sign in with the verified data
        await signInWithMagicLink(verification.data);
        
        setStatus('success');
        setMessage('Successfully signed in! Redirecting to dashboard...');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
        
      } catch (error) {
        logger.error('Verification error:', error);
        setStatus('error');
        setMessage('Failed to verify authentication. Please try again.');
      }
    };

    verifyToken();
  }, [searchParams, navigate, signInWithMagicLink]);

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/login-picture.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      {/* Gradient Overlay for Better Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/60"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Cynclaim</h1>
              <p className="text-sm text-white/80">by Cynco</p>
            </div>
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
          <div className="px-8 py-8">
            <div className="text-center">
              {status === 'loading' && (
                <>
                  <div className="flex justify-center mb-4">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Verifying Authentication
                  </h2>
                  <p className="text-white/80">
                    Please wait while we verify your magic link...
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-400/30">
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Authentication Successful!
                  </h2>
                  <p className="text-white/80">
                    {message}
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-400/30">
                      <XCircle className="w-7 h-7 text-red-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Authentication Failed
                  </h2>
                  <p className="text-white/80 mb-6">
                    {message}
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent backdrop-blur-sm border border-white/20"
                  >
                    Back to Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-xs">
            Secure authentication powered by Resend
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthVerify; 