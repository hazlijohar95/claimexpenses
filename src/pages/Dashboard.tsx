import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Plus
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    {
      name: 'Total Claims',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: FileText,
    },
    {
      name: 'Pending Approval',
      value: '8',
      change: '+2',
      changeType: 'neutral',
      icon: Clock,
    },
    {
      name: 'Approved',
      value: '14',
      change: '+8%',
      changeType: 'positive',
      icon: CheckCircle,
    },
    {
      name: 'Total Amount',
      value: '$2,847',
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
    },
  ];

  const recentClaims = [
    {
      id: 'CLM-001',
      title: 'Business Travel - Conference',
      amount: 450,
      status: 'approved',
      date: '2024-01-15',
    },
    {
      id: 'CLM-002',
      title: 'Office Supplies',
      amount: 125,
      status: 'pending',
      date: '2024-01-14',
    },
    {
      id: 'CLM-003',
      title: 'Client Dinner',
      amount: 89,
      status: 'rejected',
      date: '2024-01-13',
    },
    {
      id: 'CLM-004',
      title: 'Software Subscription',
      amount: 299,
      status: 'approved',
      date: '2024-01-12',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your expense claims.</p>
        </div>
        <Link
          to="/submit-claim"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Submit Claim</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <TrendingUp
                  className={`h-4 w-4 ${
                    stat.changeType === 'positive' ? 'text-green-500' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Claims */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Claims</h2>
          <Link to="/claims" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </Link>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {claim.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {claim.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${claim.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                      {getStatusIcon(claim.status)}
                      <span className="ml-1 capitalize">{claim.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(claim.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 