import React, { useState, useEffect } from 'react';
import { Bug, X, Download, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { logger } from '../lib/supabase';
import { useErrorReporting } from '../utils/errorHandler';

interface DebugPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'errors' | 'environment' | 'performance'>('logs');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const { getErrorStats } = useErrorReporting();

  // Refresh logs periodically if auto-refresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const refreshLogs = () => {
    setLogs(logger.getLogs());
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const downloadLogs = () => {
    const logsData = logger.exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = filterLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === filterLevel);

  const errorStats = getErrorStats();
  const logStats = logger.getStats();

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Toggle Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bug className="w-5 h-5" />
                <h3 className="font-semibold">Debug Panel</h3>
              </div>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-purple-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {['logs', 'errors', 'environment', 'performance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2 px-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div className="h-full flex flex-col">
                  {/* Controls */}
                  <div className="p-3 border-b bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={refreshLogs}
                          className="p-1 text-gray-600 hover:text-gray-900"
                          title="Refresh"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={clearLogs}
                          className="p-1 text-gray-600 hover:text-gray-900"
                          title="Clear logs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={downloadLogs}
                          className="p-1 text-gray-600 hover:text-gray-900"
                          title="Download logs"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAutoRefresh(!autoRefresh)}
                          className={`p-1 ${autoRefresh ? 'text-green-600' : 'text-gray-600'} hover:text-gray-900`}
                          title="Auto refresh"
                        >
                          {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {filteredLogs.length} logs
                      </div>
                    </div>
                    
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="w-full text-sm border rounded px-2 py-1"
                    >
                      <option value="all">All Levels</option>
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warn</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  {/* Logs List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredLogs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No logs found
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {filteredLogs.slice(-50).reverse().map((log, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-xs border-l-4 ${
                              log.level === 'error'
                                ? 'bg-red-50 border-red-400 text-red-800'
                                : log.level === 'warn'
                                ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                                : log.level === 'info'
                                ? 'bg-blue-50 border-blue-400 text-blue-800'
                                : 'bg-gray-50 border-gray-400 text-gray-600'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <>
                                  <div className="font-medium">{log.message}</div>
                                  {log.data && (
                                    <div className="mt-1 opacity-75">
                                      {typeof log.data === 'string' 
                                        ? log.data 
                                        : JSON.stringify(log.data, null, 2)
                                      }
                                    </div>
                                  )}
                                </>
                              </div>
                              <div className="text-xs opacity-60 ml-2">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="text-xs opacity-60 mt-1">
                              [{log.level.toUpperCase()}] {log.context}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Errors Tab */}
              {activeTab === 'errors' && (
                <div className="p-4">
                  <h4 className="font-medium mb-3">Error Statistics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">Total Errors</div>
                      <div className="text-2xl font-bold text-red-600">{errorStats.total}</div>
                    </div>
                    
                    {Object.keys(errorStats.bySeverity).length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">By Severity</div>
                        {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                          <div key={severity} className="flex justify-between text-sm">
                            <span className="capitalize">{severity}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(errorStats.byType).length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">By Type</div>
                        {Object.entries(errorStats.byType).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="capitalize">{type}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Environment Tab */}
              {activeTab === 'environment' && (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Environment Variables</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>NODE_ENV</span>
                        <span className="font-mono">{import.meta.env.MODE}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Supabase URL</span>
                        <span className="font-mono text-xs">
                          {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Supabase Key</span>
                        <span className="font-mono text-xs">
                          {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Browser Info</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Online</span>
                        <span>{navigator.onLine ? '✅ Yes' : '❌ No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Language</span>
                        <span>{navigator.language}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform</span>
                        <span>{navigator.platform}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">App Info</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>URL</span>
                        <span className="font-mono text-xs">{window.location.href}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timestamp</span>
                        <span className="font-mono text-xs">{new Date().toISOString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Log Statistics</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Logs</span>
                        <span className="font-medium">{logStats.total}</span>
                      </div>
                      {Object.entries(logStats.byLevel).map(([level, count]) => (
                        <div key={level} className="flex justify-between">
                          <span className="capitalize">{level}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {logStats.oldestLog && (
                    <div>
                      <h4 className="font-medium mb-2">Log Timeline</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Oldest Log</span>
                          <span className="text-xs">{new Date(logStats.oldestLog).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Newest Log</span>
                          <span className="text-xs">{new Date(logStats.newestLog || '').toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Memory Usage</h4>
                    <div className="text-sm text-gray-600">
                      Use browser dev tools → Performance tab for detailed memory analysis
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Hook to manage debug panel state
export const useDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
};

export default DebugPanel;