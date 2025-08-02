import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClaimsService } from '../services/claimsService';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Edit,
  Trash2,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  url?: string;
}

interface Claim {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  category: string;
  priority: string;
  submitted_date: string;
  submitted_by: string;
  submitted_by_name?: string;
  expense_items?: ExpenseItem[];
  attachments?: Attachment[];
}

const ClaimDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchClaimDetails();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClaimDetails = useCallback(async () => {
    try {
      setLoading(true);
      const claimData = await ClaimsService.getClaimById(id!);
      if (claimData) {
        setClaim({
          ...claimData,
          priority: claimData.priority || 'medium'
        } as unknown as Claim);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch claim details');
    } finally {
      setLoading(false);
    }
  }, [id]);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="loading-skeleton h-8 w-64 mb-4"></div>
          <div className="loading-skeleton h-4 w-full mb-2"></div>
          <div className="loading-skeleton h-4 w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Claim</h3>
            <p className="text-gray-600 mb-4">{error || 'Claim not found'}</p>
            <button
              onClick={() => navigate('/claims')}
              className="btn-primary"
            >
              Back to Claims
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="heading-1">{claim.title}</h1>
            <p className="body-medium text-gray-600">
              Claim submitted on {formatDate(claim.submitted_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {claim.status === 'pending' && (
            <>
              <button className="btn-secondary flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button className="btn-ghost flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </>
          )}
          <button className="btn-ghost flex items-center space-x-2">
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border ${
        claim.status === 'approved' ? 'bg-green-50 border-green-200' :
        claim.status === 'rejected' ? 'bg-red-50 border-red-200' :
        'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-3">
          {getStatusIcon(claim.status)}
          <div>
            <h3 className="font-medium text-gray-900 capitalize">
              Status: {claim.status}
            </h3>
            <p className="text-sm text-gray-600">
              {claim.status === 'pending' && 'Your claim is under review'}
              {claim.status === 'approved' && 'Your claim has been approved'}
              {claim.status === 'rejected' && 'Your claim has been rejected'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Details */}
          <div className="card">
            <div className="mb-6">
              <h2 className="heading-3 mb-2">Claim Details</h2>
              <p className="body-small text-gray-600">
                Basic information about this expense claim
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{claim.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {claim.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <span className={`badge ${getPriorityColor(claim.priority)}`}>
                      {claim.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium text-gray-900">{formatCurrency(claim.amount)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted Date</p>
                    <p className="font-medium text-gray-900">{formatDate(claim.submitted_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Items */}
          {claim.expense_items && claim.expense_items.length > 0 && (
            <div className="card">
              <div className="mb-6">
                <h2 className="heading-3 mb-2">Expense Items</h2>
                <p className="body-small text-gray-600">
                  Individual expenses included in this claim
                </p>
              </div>

              <div className="space-y-4">
                {claim.expense_items.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">
                        Item {index + 1}: {item.description}
                      </h3>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <span className="ml-2 text-gray-900 capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 text-gray-900">
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {claim.attachments && claim.attachments.length > 0 && (
            <div className="card">
              <div className="mb-6">
                <h2 className="heading-3 mb-2">Attachments</h2>
                <p className="body-small text-gray-600">
                  Receipts and supporting documents
                </p>
              </div>

              <div className="space-y-3">
                {claim.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{attachment.file_name}</p>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(attachment.file_size)} • {attachment.file_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Claim Summary */}
          <div className="card">
            <h3 className="heading-4 mb-4">Claim Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`badge ${getStatusColor(claim.status)}`}>
                  {claim.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Priority</span>
                <span className={`badge ${getPriorityColor(claim.priority)}`}>
                  {claim.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium text-gray-900">{formatCurrency(claim.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium text-gray-900">
                  {claim.expense_items?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Attachments</span>
                <span className="font-medium text-gray-900">
                  {claim.attachments?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Submitted By */}
          <div className="card">
            <h3 className="heading-4 mb-4">Submitted By</h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {claim.submitted_by_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {claim.submitted_by_name || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(claim.submitted_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="heading-4 mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="btn-primary w-full flex items-center justify-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Add Comment</span>
              </button>
              <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetails; 