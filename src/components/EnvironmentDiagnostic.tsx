import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ExternalLink, X, Settings } from 'lucide-react';

const EnvironmentDiagnostic: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const resendKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const issues = [];
  
  if (!supabaseUrl) issues.push('Missing VITE_SUPABASE_URL');
  if (!supabaseKey) issues.push('Missing VITE_SUPABASE_ANON_KEY');
  if (!resendKey) issues.push('Missing VITE_EMAILJS_PUBLIC_KEY');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors duration-200"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">Environment Status</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Supabase URL:</span>
            <span className="text-green-600">✅ Set</span>
          </div>
          <div className="flex justify-between">
            <span>Supabase Key:</span>
            <span className="text-green-600">✅ Set</span>
          </div>
          <div className="flex justify-between">
            <span>Email Service:</span>
            <span className="text-green-600">✅ Set</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
          <span className="text-sm font-medium text-gray-900">Environment Issues</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 text-xs text-gray-600">
        {issues.map((issue, index) => (
          <div key={index} className="flex items-center">
            <XCircle className="w-3 h-3 text-red-500 mr-2" />
            <span>{issue}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <a 
          href="https://supabase.com/dashboard/project/dhhsmadffhlztiofrvjf/settings/api" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
        >
          Get Supabase Keys <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  );
};

export default EnvironmentDiagnostic; 