import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/supabase';
import {
  Home,
  FileText,
  List,
  CheckCircle,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Settings,
  Bell,
  ChevronDown,
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Submit Claim', href: '/submit-claim', icon: FileText },
    { name: 'My Claims', href: '/claims', icon: List },
    { name: 'Approvals', href: '/approvals', icon: CheckCircle },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle sidebar hover interactions with improved sensitivity
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientX <= 16 && !sidebarHovered) {
        setSidebarHovered(true);
      } else if (event.clientX > 280 && sidebarHovered) {
        setSidebarHovered(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [sidebarHovered]);

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarHovered ? 'lg:translate-x-0' : 'lg:-translate-x-64'}`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Logo and header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className={`transition-opacity duration-300 ${sidebarHovered ? 'opacity-100' : 'lg:opacity-0'}`}>
                <h1 className="text-lg font-semibold text-gray-900">Cynclaim</h1>
                <p className="text-sm text-gray-500">by Cynco</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span className={`transition-opacity duration-300 ${sidebarHovered ? 'opacity-100' : 'lg:opacity-0'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-100">
            <div className={`flex items-center space-x-3 mb-4 p-3 rounded-lg bg-gray-50 transition-opacity duration-300 ${sidebarHovered ? 'opacity-100' : 'lg:opacity-0'}`}>
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.role || 'Employee'}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <button className="group flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                <User className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                <span className={`transition-opacity duration-300 ${sidebarHovered ? 'opacity-100' : 'lg:opacity-0'}`}>Profile</span>
              </button>
              <button className="group flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                <span className={`transition-opacity duration-300 ${sidebarHovered ? 'opacity-100' : 'lg:opacity-0'}`}>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="group flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors duration-200" />
                <span className={`transition-opacity duration-300 ${sidebarHovered ? 'opacity-100' : 'lg:opacity-0'}`}>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-8">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="relative p-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors duration-200" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* User menu dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role || 'Employee'}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200">
                      Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200">
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 