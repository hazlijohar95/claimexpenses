import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  DollarSign, 
  Calendar, 
  FileText, 
  X,
  Plus,
  Trash2
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const SubmitClaim: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalAmount: 0,
    currency: 'USD',
    claimDate: new Date().toISOString().split('T')[0],
  });

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Travel',
    'Meals & Entertainment',
    'Office Supplies',
    'Software & Subscriptions',
    'Transportation',
    'Accommodation',
    'Training & Education',
    'Other'
  ];

  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
    };
    setExpenseItems([...expenseItems, newItem]);
  };

  const removeExpenseItem = (id: string) => {
    setExpenseItems(expenseItems.filter(item => item.id !== id));
  };

  const updateExpenseItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setExpenseItems(expenseItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return expenseItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reset form
    setFormData({
      title: '',
      description: '',
      totalAmount: 0,
      currency: 'USD',
      claimDate: new Date().toISOString().split('T')[0],
    });
    setExpenseItems([]);
    setAttachments([]);
    setIsSubmitting(false);

    // Navigate to claims list
    navigate('/claims');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submit Expense Claim</h1>
        <p className="text-gray-600">Fill out the form below to submit your expense claim for approval.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Claim Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="e.g., Business Travel - Conference"
              />
            </div>

            <div>
              <label htmlFor="claimDate" className="block text-sm font-medium text-gray-700 mb-2">
                Claim Date *
              </label>
              <input
                type="date"
                id="claimDate"
                required
                value={formData.claimDate}
                onChange={(e) => setFormData({ ...formData, claimDate: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="Provide additional details about your expense claim..."
              />
            </div>
          </div>
        </div>

        {/* Expense Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Expense Items</h2>
            <button
              type="button"
              onClick={addExpenseItem}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>

          {expenseItems.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No expense items</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first expense item.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenseItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Expense Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExpenseItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Conference registration"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        required
                        value={item.category}
                        onChange={(e) => updateExpenseItem(item.id, 'category', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateExpenseItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="input-field pl-10"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={item.date}
                        onChange={(e) => updateExpenseItem(item.id, 'date', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {expenseItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Attachments</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Receipts & Documents
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB each</p>
                </div>
              </div>
            </div>

            {attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files:</h4>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/claims')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || expenseItems.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Claim</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitClaim; 