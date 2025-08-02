import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClaimsService } from '../services/claimsService';
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  DollarSign,
  Calendar,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: File;
}

const SubmitClaim: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'travel',
    priority: 'normal',
  });

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    {
      id: '1',
      description: '',
      amount: 0,
      category: 'travel',
      date: new Date().toISOString().split('T')[0] || '',
    },
  ]);

  const categories = [
    { value: 'travel', label: 'Travel & Transportation' },
    { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'office', label: 'Office Supplies' },
    { value: 'software', label: 'Software & Subscriptions' },
    { value: 'training', label: 'Training & Education' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleExpenseItemChange = (id: string, field: keyof ExpenseItem, value: string | number | File) => {
    setExpenseItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      category: 'travel',
      date: new Date().toISOString().split('T')[0] || '',
    };
    setExpenseItems(prev => [...prev, newItem]);
  };

  const removeExpenseItem = (id: string) => {
    if (expenseItems.length > 1) {
      setExpenseItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleFileUpload = (id: string, file: File) => {
    handleExpenseItemChange(id, 'receipt', file);
  };

  const calculateTotal = () => {
    return expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a claim title');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Please enter a claim description');
      return false;
    }

    for (const item of expenseItems) {
      if (!item.description.trim()) {
        setError('Please enter a description for all expense items');
        return false;
      }
      if (!item.amount || item.amount <= 0) {
        setError('Please enter a valid amount for all expense items');
        return false;
      }
      if (!item.date) {
        setError('Please select a date for all expense items');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const totalAmount = calculateTotal();
      
      // Prepare expense items data
      const expenseItemsData = expenseItems.map(item => ({
        description: item.description,
        amount: item.amount,
        category: item.category,
        expense_date: item.date,
        claim_id: '', // This will be set by the service
      }));

      // Create the claim with expense items
      const claimData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        amount: totalAmount,
        submitted_by: user?.id || '',
        claim_date: new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10),
        status: 'pending' as const
      };

      const claim = await ClaimsService.createClaim(claimData, expenseItemsData);

      // Upload receipts if provided
      for (const item of expenseItems) {
        if (item.receipt) {
          await ClaimsService.uploadAttachment(claim.id, item.receipt);
        }
      }

      setSuccess('Claim submitted successfully!');
      setTimeout(() => navigate('/claims'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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
            <h1 className="heading-1">Submit New Claim</h1>
            <p className="body-medium text-gray-600">
              Create a new expense claim for reimbursement
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Claim Details */}
        <div className="card">
          <div className="mb-6">
            <h2 className="heading-3 mb-2">Claim Details</h2>
            <p className="body-small text-gray-600">
              Provide basic information about your expense claim
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Claim Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                className="input-field"
                placeholder="e.g., Business Travel - Conference"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="input-field"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleFormChange}
                className="input-field"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                required
                rows={4}
                className="input-field"
                placeholder="Provide a detailed description of the expenses..."
              />
            </div>
          </div>
        </div>

        {/* Expense Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="heading-3 mb-2">Expense Items</h2>
              <p className="body-small text-gray-600">
                Add individual expense items with receipts
              </p>
            </div>
            <button
              type="button"
              onClick={addExpenseItem}
              className="btn-ghost flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-6">
            {expenseItems.map((item, index) => (
              <div key={item.id} className="p-6 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Expense Item {index + 1}</h3>
                  {expenseItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpenseItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleExpenseItemChange(item.id, 'description', e.target.value)}
                      required
                      className="input-field"
                      placeholder="e.g., Flight tickets"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount}
                        onChange={(e) => handleExpenseItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        required
                        className="input-field pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) => handleExpenseItemChange(item.id, 'category', e.target.value)}
                      className="input-field"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleExpenseItemChange(item.id, 'date', e.target.value)}
                        required
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(item.id, file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Upload Receipt</span>
                      </div>
                    </label>
                    {item.receipt && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{item.receipt.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Submit Claim</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitClaim; 