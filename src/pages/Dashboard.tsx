import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClaimsService } from '../services/claimsService';
import { logger } from '../lib/supabase';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Plus,
  ArrowRight,
  Calendar,
  AlertCircle,
  X,
  Users,
} from 'lucide-react';

interface DashboardStats {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalAmount: number;
  averageAmount: number;
}

interface RecentClaim {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_date: string;
  category: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalAmount: 0,
    averageAmount: 0,
  });
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Check if we're in demo mode (user id starts with 'demo')
        if (user?.id?.startsWith('demo')) {
          // Load demo data
          setStats({
            totalClaims: 12,
            pendingClaims: 3,
            approvedClaims: 8,
            rejectedClaims: 1,
            totalAmount: 2450.75,
            averageAmount: 204.23,
          });
          
          setRecentClaims([
            {
              id: 'demo-1',
              title: 'Business Lunch Meeting',
              amount: 85.50,
              status: 'approved',
              submitted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              category: 'Meals'
            },
            {
              id: 'demo-2',
              title: 'Travel Expenses - Client Visit',
              amount: 245.00,
              status: 'pending',
              submitted_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              category: 'Travel'
            },
            {
              id: 'demo-3',
              title: 'Office Supplies',
              amount: 67.25,
              status: 'approved',
              submitted_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              category: 'Office'
            }
          ]);
        } else {
          // Fetch real stats from the service
          const statsData = await ClaimsService.getClaimsStats(user?.id);
          setStats({
            totalClaims: statsData.total,
            pendingClaims: statsData.pending,
            approvedClaims: statsData.approved,
            rejectedClaims: statsData.rejected,
            totalAmount: statsData.totalAmount,
            averageAmount: statsData.averageAmount,
          });
          
          const claimsData = await ClaimsService.getClaims({
            ...(user?.id && { submittedBy: user.id }),
            limit: 5,
          });
          const transformedClaims = claimsData.data.slice(0, 5).map((claim) => ({
            id: claim.id,
            title: claim.title,
            amount: claim.amount,
            status: claim.status,
            submitted_date: claim.submitted_date,
            category: claim.category,
          }));
          setRecentClaims(transformedClaims);
        }
      } catch (error) {
        logger.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Demo Mode Banner */}
      {user?.id?.startsWith('demo') && showDemoBanner && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mt-0.5">
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Demo Mode</h3>
                <p className="text-sm text-gray-600 mt-1">You're viewing demo data. Set up your Supabase credentials to use real data.</p>
              </div>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Section with Context Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your expense claims
          </p>
        </div>
        
        {/* Context Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Claims</p>
              <p className="text-xs text-gray-500">{stats.pendingClaims} pending review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Claims</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalClaims}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.pendingClaims}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.approvedClaims}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/submit-claim"
            className="group flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Submit Claim</p>
              <p className="text-sm text-gray-600">Create a new expense claim</p>
            </div>
          </Link>

          <Link
            to="/claims"
            className="group flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Claims</p>
              <p className="text-sm text-gray-600">See your claim history</p>
            </div>
          </Link>

          <Link
            to="/approvals"
            className="group flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Review Approvals</p>
              <p className="text-sm text-gray-600">Manage pending approvals</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link
            to="/claims"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            View all
          </Link>
        </div>
        
        <div className="space-y-4">
          {recentClaims.length > 0 ? (
            recentClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getStatusIcon(claim.status)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{claim.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{claim.category}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatDate(claim.submitted_date)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(claim.amount)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No claims yet</p>
              <Link
                to="/submit-claim"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                <span>Submit your first claim</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Approval Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalClaims > 0 ? Math.round((stats.approvedClaims / stats.totalClaims) * 100) : 0}%
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.approvedClaims} out of {stats.totalClaims} claims approved
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Average Claim</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.averageAmount)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Average amount per claim
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingClaims}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Claims pending approval
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 