// my-flask-app-vite/src/components/groups/GroupManagement.tsx
import React, { useState } from 'react';
import { groupService, GroupData } from '../../services/groupService';

const tierDetails: Record<string, Record<string, {
  amountRange: string;
  interest: string;
  access: string;
  description: string;
  support: string;
}>> = {
  Savings: {
    Bronze: {
      amountRange: "R200–R450",
      interest: "2.5% p.a.",
      access: "Anytime",
      description: "Perfect for individuals or small groups starting their savings journey. Flexible deposits and easy withdrawals.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R500–R950",
      interest: "3.2% p.a.",
      access: "Anytime",
      description: "Ideal for growing savings groups looking for better rates and more flexibility.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R1000–R1950",
      interest: "4.1% p.a.",
      access: "Anytime",
      description: "Best for established groups wanting higher limits and added perks.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R2000+",
      interest: "5.0% p.a.",
      access: "Anytime",
      description: "Premium tier for large groups seeking maximum benefits and exclusive features.",
      support: "24/7 VIP support"
    }
  },
  // ... (add other categories as needed, same as in previous examples)
};

export const GroupManagement: React.FC = () => {
  // State for create group form
  const [createFormData, setCreateFormData] = useState<GroupData>({
    name: '',
    description: '',
    contribution_amount: 0,
    frequency: 'monthly',
    max_members: 10
  });
  const [groupCode, setGroupCode] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');

  // State for join group form
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  // Create group handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await groupService.createGroup(createFormData);
      setGroupCode(result.group_code);
      setCreateError('');
      // Reset form
      setCreateFormData({
        name: '',
        description: '',
        contribution_amount: 0,
        frequency: 'monthly',
        max_members: 10
      });
    } catch (err) {
      setCreateError('Failed to create group. Please try again.');
    }
  };

  // Join group handlers
  const handlePreview = async () => {
    try {
      const result = await groupService.getGroupByCode(joinGroupCode);
      setGroupDetails(result.group);
      setJoinError('');
    } catch (err) {
      setJoinError('Invalid group code or group not found');
      setGroupDetails(null);
    }
  };

  const handleJoin = async () => {
    try {
      await groupService.joinGroup(joinGroupCode);
      setJoinSuccess('Successfully joined the group!');
      setGroupDetails(null);
      setJoinGroupCode('');
    } catch (err) {
      setJoinError('Failed to join group. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Create Group Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Group</h2>
        {createError && <div className="text-red-500 mb-4">{createError}</div>}
        {groupCode && (
          <div className="mb-4 p-4 bg-green-100 rounded">
            <p className="font-bold">Group Created Successfully!</p>
            <p>Share this code with your members: <span className="font-mono">{groupCode}</span></p>
          </div>
        )}
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Group Name</label>
            <input
              type="text"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={createFormData.description}
              onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contribution Amount (R)</label>
            <input
              type="number"
              value={createFormData.contribution_amount}
              onChange={(e) => setCreateFormData({ ...createFormData, contribution_amount: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Frequency</label>
            <select
              value={createFormData.frequency}
              onChange={(e) => setCreateFormData({ ...createFormData, frequency: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              value={createFormData.max_members}
              onChange={(e) => setCreateFormData({ ...createFormData, max_members: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              min="2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Group
          </button>
        </form>
      </div>

      {/* Join Group Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Join Existing Group</h2>
        {joinError && <div className="text-red-500 mb-4">{joinError}</div>}
        {joinSuccess && <div className="text-green-500 mb-4">{joinSuccess}</div>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Group Code</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={joinGroupCode}
                onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
                className="flex-1 block w-full rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter group code"
              />
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Preview
              </button>
            </div>
          </div>

          {groupDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="text-lg font-medium text-gray-900">{groupDetails.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{groupDetails.description}</p>
              <dl className="mt-4 space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contribution Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900">R{groupDetails.contribution_amount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                  <dd className="mt-1 text-sm text-gray-900">{groupDetails.frequency}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Members</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {groupDetails.current_members} / {groupDetails.max_members}
                  </dd>
                </div>
              </dl>
              <button
                onClick={handleJoin}
                className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Join Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};