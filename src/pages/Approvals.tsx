import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Check,
  X,
  User,
  DollarSign,
  Calendar
} from 'lucide-react';

interface Claim {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  category: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
}

const Approvals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const claims: Claim[] = [
    {
      id: 'CLM-002',
      title: 'Office Supplies',
      amount: 125,
      status: 'pending',
      date: '2024-01-14',
      category: 'Office Supplies',
      description: 'Printer paper, pens, and other office essentials',
      submittedBy: 'Alice Johnson',
      submittedDate: '2024-01-14T09:15:00Z'
    },
    {
      id: 'CLM-005',
      title: 'Training Course',
      amount: 150,
      status: 'pending',
      date: '2024-01-11',
      category: 'Training & Education',
      description: 'Online course for project management certification',
      submittedBy: 'Bob Wilson',
      submittedDate: '2024-01-11T14:30:00Z'
    },
    {
      id: 'CLM-007',
      title: 'Client Lunch',
      amount: 75,
      status: 'pending',
      date: '2024-01-10',
      category: 'Meals & Entertainment',
      description: 'Business lunch with potential client',
      submittedBy: 'Carol Davis',
      submittedDate: '2024-01-10T12:45:00Z'
    },
    {
      id: 'CLM-008',
      title: 'Software License',
      amount: 199,
      status: 'pending',
      date: '2024-01-09',
      category: 'Software & Subscriptions',
      description: 'Annual license for design software',
      submittedBy: 'David Brown',
      submittedDate: '2024-01-09T16:20:00Z'
    }
  ];

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectClaim = (claimId: string) => {
    setSelectedClaims(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClaims.length === filteredClaims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(filteredClaims.map(claim => claim.id));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedClaims.length === 0) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reset selection
    setSelectedClaims([]);
    setIsProcessing(false);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600">Review and approve expense claims from your team</p>
        </div>
        
        {selectedClaims.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {selectedClaims.length} claim{selectedClaims.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={isProcessing}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>Approve Selected</span>
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              <X size={16} />
              <span>Reject Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search claims by title, ID, or submitter..."
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
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Status</option>
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
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedClaims.includes(claim.id)}
                      onChange={() => handleSelectClaim(claim.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {claim.id}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{claim.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{claim.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{claim.submittedBy}</span>
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
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/claims/${claim.id}`}
                        className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                      >
                        <Eye size={16} />
                        <span>Review</span>
                      </Link>
                      {claim.status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900 flex items-center space-x-1">
                            <Check size={16} />
                            <span>Approve</span>
                          </button>
                          <button className="text-red-600 hover:text-red-900 flex items-center space-x-1">
                            <X size={16} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClaims.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Clock size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No claims to review</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'pending' 
                ? 'Try adjusting your search or filter criteria.'
                : 'All pending claims have been reviewed.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredClaims.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredClaims.filter(claim => claim.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals; 