import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  Download,
  Eye
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface Claim {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  category: string;
  submittedBy: string;
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  expenseItems: ExpenseItem[];
  attachments: string[];
}

const ClaimDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Mock data - in a real app, this would come from an API
  const claim: Claim = {
    id: id || 'CLM-001',
    title: 'Business Travel - Conference',
    description: 'Conference registration and travel expenses for Tech Summit 2024. This includes airfare, hotel accommodation, and conference registration fees.',
    amount: 450,
    status: 'approved',
    date: '2024-01-15',
    category: 'Travel',
    submittedBy: 'John Doe',
    submittedDate: '2024-01-15T10:30:00Z',
    approvedBy: 'Jane Smith',
    approvedDate: '2024-01-16T14:20:00Z',
    expenseItems: [
      {
        id: '1',
        description: 'Conference Registration',
        amount: 250,
        category: 'Training & Education',
        date: '2024-01-15'
      },
      {
        id: '2',
        description: 'Airfare - Round Trip',
        amount: 150,
        category: 'Travel',
        date: '2024-01-15'
      },
      {
        id: '3',
        description: 'Hotel Accommodation',
        amount: 50,
        category: 'Accommodation',
        date: '2024-01-15'
      }
    ],
    attachments: [
      'conference_receipt.pdf',
      'airfare_ticket.pdf',
      'hotel_invoice.pdf'
    ]
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
        return <CheckCircle size={20} className="text-green-600" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-600" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending Approval';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/claims"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Claim Details</h1>
            <p className="text-gray-600">View detailed information about your expense claim</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
            {getStatusIcon(claim.status)}
            <span className="ml-1">{getStatusText(claim.status)}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Claim Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Claim Title</label>
                <p className="mt-1 text-sm text-gray-900">{claim.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{claim.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{claim.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Claim Date</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(claim.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Items */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Items</h2>
            <div className="space-y-4">
              {claim.expenseItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{item.description}</h4>
                    <span className="text-sm font-medium text-gray-900">${item.amount}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span>{item.category}</span>
                  </div>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-primary-600">${claim.amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {claim.attachments.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
              <div className="space-y-3">
                {claim.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{attachment}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-700">
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700">
                        <Download size={16} />
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
          {/* Status Timeline */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Claim Approved</p>
                  <p className="text-xs text-gray-500">
                    {claim.approvedBy} • {claim.approvedDate ? new Date(claim.approvedDate).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Claim Submitted</p>
                  <p className="text-xs text-gray-500">
                    {claim.submittedBy} • {new Date(claim.submittedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                <MessageSquare size={16} />
                <span>Add Comment</span>
              </button>
              
              <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                <Download size={16} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Claim Summary */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Claim Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Claim ID</span>
                <span className="text-sm font-medium text-gray-900">{claim.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Submitted By</span>
                <span className="text-sm font-medium text-gray-900">{claim.submittedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Submitted Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(claim.submittedDate).toLocaleDateString()}
                </span>
              </div>
              {claim.approvedBy && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved By</span>
                  <span className="text-sm font-medium text-gray-900">{claim.approvedBy}</span>
                </div>
              )}
              {claim.rejectionReason && (
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Rejection Reason</span>
                  <p className="text-sm text-gray-900 mt-1">{claim.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetails; 