import React, { useState } from 'react';
import Button from './Button';

interface CreateStokvelGroupProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TIER_OPTIONS = [
  { value: '', label: 'Select Tier' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select Category' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment' },
  { value: 'burial', label: 'Burial' },
  { value: 'business', label: 'Business' },
  // Add more as needed
];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    if (
      isNaN(contributionAmount) ||
      contributionAmount <= 0
    ) {
      setError('Contribution amount must be a positive number.');
      return;
    }

    if (
      isNaN(maxMembers) ||
      maxMembers <= 0
    ) {
      setError('Maximum members must be a positive number.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      contribution_amount: contributionAmount,
      frequency: formData.contributionFrequency,
      max_members: maxMembers,
      rules: formData.rules.trim(),
      tier: formData.tier,
    };

    console.log('Payload being sent:', payload); // Debug log

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Stokvel Group</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contribution Amount (R)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.contributionAmount}
                  onChange={e => setFormData({ ...formData, contributionAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contribution Frequency</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  value={formData.contributionFrequency}
                  onChange={e => setFormData({ ...formData, contributionFrequency: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Members</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxMembers}
                  onChange={e => setFormData({ ...formData, maxMembers: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Rules</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  value={formData.rules}
                  onChange={e => setFormData({ ...formData, rules: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tier</label>
                <select
                  required
                  value={formData.tier}
                  onChange={e => setFormData({ ...formData, tier: e.target.value })}
                >
                  <option value="">Select Tier</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={onCancel}>Cancel</Button>
              <Button variant="primary" type="submit">Create Group</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStokvelGroup;
