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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
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
        
        // Fetch recent claims
        const claimsData = await ClaimsService.getClaims({
          ...(user?.id && { submittedBy: user.id }),
          limit: 5,
        });
        const transformedClaims = claimsData.data.slice(0, 5).map((claim: any) => ({
          id: claim.id,
          title: claim.title,
          amount: claim.amount,
          status: claim.status,
          submitted_date: claim.submitted_date,
          category: claim.category,
        }));
        setRecentClaims(transformedClaims);
      } catch (error) {
        logger.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="loading-skeleton h-8 w-24 mb-2"></div>
              <div className="loading-skeleton h-6 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="heading-1 mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!</h1>
        <p className="body-large text-gray-600">
          Here's what's happening with your expense claims
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-small text-gray-600">Total Claims</p>
              <p className="heading-3">{stats.totalClaims}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-small text-gray-600">Pending</p>
              <p className="heading-3">{stats.pendingClaims}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-small text-gray-600">Approved</p>
              <p className="heading-3">{stats.approvedClaims}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-small text-gray-600">Total Amount</p>
              <p className="heading-3">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-3">Quick Actions</h2>
          </div>
          <div className="space-y-4">
            <Link
              to="/submit-claim"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Submit New Claim</p>
                  <p className="text-sm text-gray-600">Create a new expense claim</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link
              to="/claims"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View All Claims</p>
                  <p className="text-sm text-gray-600">See your claim history</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-3">Recent Activity</h2>
            <Link to="/claims" className="text-sm font-medium text-gray-900 hover:text-gray-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentClaims.length > 0 ? (
              recentClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(claim.status)}
                    <div>
                      <p className="font-medium text-gray-900">{claim.title}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(claim.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${getStatusColor(claim.status)}`}>
                      {claim.status}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(claim.submitted_date)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No claims yet</p>
                <p className="text-sm text-gray-500">Start by submitting your first claim</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Approval Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalClaims > 0 ? Math.round((stats.approvedClaims / stats.totalClaims) * 100) : 0}%
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.approvedClaims} out of {stats.totalClaims} claims approved
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Average Claim</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageAmount)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Average amount per claim
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</p>
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