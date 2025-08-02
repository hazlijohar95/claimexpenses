import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Claim {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  category: string;
  description: string;
}

const ClaimsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const claims: Claim[] = [
    {
      id: 'CLM-001',
      title: 'Business Travel - Conference',
      amount: 450,
      status: 'approved',
      date: '2024-01-15',
      category: 'Travel',
      description: 'Conference registration and travel expenses for Tech Summit 2024'
    },
    {
      id: 'CLM-002',
      title: 'Office Supplies',
      amount: 125,
      status: 'pending',
      date: '2024-01-14',
      category: 'Office Supplies',
      description: 'Printer paper, pens, and other office essentials'
    },
    {
      id: 'CLM-003',
      title: 'Client Dinner',
      amount: 89,
      status: 'rejected',
      date: '2024-01-13',
      category: 'Meals & Entertainment',
      description: 'Business dinner with potential client'
    },
    {
      id: 'CLM-004',
      title: 'Software Subscription',
      amount: 299,
      status: 'approved',
      date: '2024-01-12',
      category: 'Software & Subscriptions',
      description: 'Annual subscription for design software'
    },
    {
      id: 'CLM-005',
      title: 'Training Course',
      amount: 150,
      status: 'pending',
      date: '2024-01-11',
      category: 'Training & Education',
      description: 'Online course for project management certification'
    },
    {
      id: 'CLM-006',
      title: 'Hotel Accommodation',
      amount: 320,
      status: 'approved',
      date: '2024-01-10',
      category: 'Accommodation',
      description: 'Hotel stay during business trip'
    }
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

  const filteredClaims = claims
    .filter(claim => {
      const matchesSearch = claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
          <p className="text-gray-600">View and manage your expense claims</p>
        </div>
        <Link
          to="/submit-claim"
          className="btn-primary"
        >
          Submit New Claim
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="card">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Claim ID</span>
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Title</span>
                    {getSortIcon('title')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Amount</span>
                    {getSortIcon('amount')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    {getSortIcon('date')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {claim.id}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{claim.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{claim.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${claim.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {claim.category}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/claims/${claim.id}`}
                      className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClaims.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by submitting your first expense claim.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/submit-claim" className="btn-primary mt-4">
                Submit Your First Claim
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredClaims.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredClaims.length}</div>
            <div className="text-sm text-gray-600">Total Claims</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              ${filteredClaims.reduce((sum, claim) => sum + claim.amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Amount</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredClaims.filter(claim => claim.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsList; 