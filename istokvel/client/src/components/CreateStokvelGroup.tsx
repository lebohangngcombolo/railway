import React, { useState } from 'react';
import Button from './Button';

const TIER_OPTIONS = [
  { value: '', label: 'Select Tier' },
  { value: 'Bronze', label: 'Bronze' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Platinum', label: 'Platinum' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select Category' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment' },
  { value: 'burial', label: 'Burial' },
  { value: 'business', label: 'Business' },
];

interface CreateStokvelGroupProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const CreateStokvelGroup: React.FC<CreateStokvelGroupProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    contributionAmount: '',
    contributionFrequency: 'monthly',
    maxMembers: '',
    rules: '',
    tier: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (
      !formData.name.trim() ||
      !formData.contributionAmount.trim() ||
      !formData.maxMembers.trim() ||
      !formData.tier ||
      !formData.category
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate numbers
    const contributionAmount = Number(formData.contributionAmount);
    const maxMembers = Number(formData.maxMembers);

    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      setError('Contribution amount must be a positive number.');
      return;
    }
    if (isNaN(maxMembers) || maxMembers <= 0) {
      setError('Maximum members must be a positive number.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      contributionAmount: contributionAmount,
      frequency: formData.contributionFrequency,
      maxMembers: maxMembers,
      rules: formData.rules.trim(),
      tier: formData.tier,
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      setSuccess('Group created successfully!');
      setFormData({
        name: '',
        description: '',
        category: '',
        contributionAmount: '',
        contributionFrequency: 'monthly',
        maxMembers: '',
        rules: '',
        tier: '',
      });
      setTimeout(() => {
        setSuccess('');
        onCancel();
      }, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong. Please check your input and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
      <div className="relative w-full max-w-lg rounded-xl shadow-xl bg-white max-h-[80vh] flex flex-col">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 px-6 pt-6">Create New Stokvel Group</h2>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 pb-6 space-y-3"
          style={{ minHeight: 0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                disabled={loading}
                required
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.tier}
                onChange={e => setFormData({ ...formData, tier: e.target.value })}
                disabled={loading}
                required
              >
                {TIER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Amount (R) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.contributionAmount}
                onChange={e => setFormData({ ...formData, contributionAmount: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Members <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.maxMembers}
                onChange={e => setFormData({ ...formData, maxMembers: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Frequency</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.contributionFrequency}
                onChange={e => setFormData({ ...formData, contributionFrequency: e.target.value })}
                disabled={loading}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Rules</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.rules}
              onChange={e => setFormData({ ...formData, rules: e.target.value })}
              disabled={loading}
              rows={2}
            />
          </div>
          {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
          {success && <div className="text-emerald-600 mt-2 text-sm">{success}</div>}
          <div className="mt-4 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStokvelGroup;
