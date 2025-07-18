import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { toast } from "react-hot-toast";
import { getAvailableGroups } from '../services/groupService';

const initialForm = {
  name: '',
  description: '',
  contribution_amount: '',
  frequency: 'monthly',
  max_members: '',
  tier: '',
};

const tierOptions = ['Bronze', 'Silver', 'Gold', 'Platinum'];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const GroupAdminManagement: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Create group modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Join Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Active tab state
  const [activeTab, setActiveTab] = useState<'groups' | 'joinRequests'>('groups');

  // New status filter state
  const [statusFilter, setStatusFilter] = useState('pending');

  // Delete all join requests state
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  // New selection state
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const filteredRequests = requests.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const allSelected = selectedRequests.length === filteredRequests.length && filteredRequests.length > 0;

  // View group modal state
  const [showView, setShowView] = useState(false);

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line
  }, []);

  // Fetch join requests
  useEffect(() => {
    if (activeTab === 'joinRequests') fetchRequests();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchGroups = () => {
    setLoading(true);
    adminAPI.getGroups()
      .then(res => {
        setGroups(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load groups");
        setLoading(false);
      });
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await adminAPI.getJoinRequests();
      setRequests(
        res.data.map((req: any) => ({
          id: req.id,
          user: req.user,
          category: req.category,
          tier: req.tier,
          amount: req.amount,
          status: req.status,
          reason: req.reason,
          createdAt: req.created_at,
        }))
      );
    } catch (err) {
      toast.error("Failed to load join requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && group.is_active) ||
      (filter === 'inactive' && !group.is_active);
    return matchesSearch && matchesFilter;
  });

  // Summary stats
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.is_active).length;

  // Handle create group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.createGroup(form);
      setShowCreate(false);
      setForm(initialForm);
      fetchGroups();
    } catch (err: any) {
      alert('Failed to create group');
    }
  };

  // Edit group
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      await adminAPI.updateGroup(selectedGroup.id, editForm);
      setShowEdit(false);
      setEditForm(initialForm);
      setSelectedGroup(null);
      fetchGroups();
    } catch (err: any) {
      alert('Failed to update group');
    }
  };

  // Delete group
  const handleDelete = async () => {
    if (!selectedGroup) return;
    try {
      await adminAPI.deleteGroup(selectedGroup.id);
      setShowDelete(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (err: any) {
      alert('Failed to delete group');
    }
  };

  // Open edit modal
  const openEdit = (group: any) => {
    setSelectedGroup(group);
    setEditForm({
      name: group.name || '',
      description: group.description || '',
      contribution_amount: group.contribution_amount || '',
      frequency: group.frequency || 'monthly',
      max_members: group.max_members || '',
      tier: group.tier || '',
    });
    setShowEdit(true);
  };

  // Open delete modal
  const openDelete = (group: any) => {
    setSelectedGroup(group);
    setShowDelete(true);
  };

  // View group handler
  const openView = (group: any) => {
    setSelectedGroup(group);
    setShowView(true);
  };

  const handleApprove = async (requestId: number) => {
    try {
      const res = await adminAPI.approveJoinRequest(requestId);
      toast.success("Request approved successfully!");
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      if (err.response?.status === 400) {
        const data = err.response.data;
        toast.error(`${data.error} Notification sent to user.`);
        console.log("User email:", data.user_email);
      } else {
        toast.error("Failed to approve request");
      }
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await adminAPI.rejectJoinRequest(id, { reason: rejectReason });
      toast.success("Request rejected!");
      setRejectingId(null);
      setRejectReason("");
      fetchRequests();
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to get group name
  const getGroupName = (category: string, tier: string) => {
    return `${category} (${tier})`;
  };

  // New selection functions
  const toggleSelectAll = () => {
    if (allSelected) setSelectedRequests([]);
    else setSelectedRequests(filteredRequests.map(r => r.id));
  };

  const toggleSelect = (id: number) => {
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // New delete selected state
  const [showDeleteSelected, setShowDeleteSelected] = useState(false);

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'groups' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'joinRequests' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('joinRequests')}
        >
          Join Requests
        </button>
      </div>

      {/* Conditional Rendering */}
      {activeTab === 'groups' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
              <span className="text-gray-500">Total Groups</span>
              <span className="text-3xl font-bold text-blue-700">{totalGroups}</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
              <span className="text-gray-500">Active Groups</span>
              <span className="text-3xl font-bold text-green-600">{activeGroups}</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
              <span className="text-gray-500">Inactive Groups</span>
              <span className="text-3xl font-bold text-red-500">{totalGroups - activeGroups}</span>
            </div>
          </div>

          {/* Search, Filter, and Create */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold">Manage Groups</h1>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border rounded px-3 py-2 w-full md:w-56"
              />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                onClick={() => setShowCreate(true)}
              >
                + Create Group
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-8">
                No groups found.
              </div>
            )}
            {filteredGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-blue-700">{group.name}</h2>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        group.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {group.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono text-gray-700">
                      Code: {group.group_code || <span className="italic text-gray-400">N/A</span>}
                    </span>
                    {group.group_code && (
                      <button
                        className="text-blue-600 text-xs underline hover:text-blue-800"
                        onClick={() => {
                          copyToClipboard(group.group_code);
                          alert('Group code copied!');
                        }}
                        title="Copy group code"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  <div className="mb-2 text-gray-600">{group.description || <span className="italic text-gray-400">No description</span>}</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      <b>Tier:</b> {group.tier || <span className="italic text-gray-400">-</span>}
                    </span>
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      <b>Contribution:</b> R{group.contribution_amount}
                    </span>
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      <b>Frequency:</b> {group.frequency}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                      <b>Members:</b> {group.member_count ?? group.current_members ?? 0}
                    </span>
                    <span className="inline-block bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                      <b>Max:</b> {group.max_members || <span className="italic text-gray-400">-</span>}
                    </span>
                    <span className="inline-block bg-gray-50 text-gray-700 px-2 py-1 rounded text-xs">
                      <b>Created:</b> {group.created_at ? new Date(group.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    onClick={() => openEdit(group)}
                  >
                    Edit
                  </button>
                  <button
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                    onClick={() => openDelete(group)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create Group Modal */}
          {showCreate && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create New Group</h2>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contribution Amount (R)</label>
                    <input
                      type="number"
                      value={form.contribution_amount}
                      onChange={e => setForm({ ...form, contribution_amount: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={form.frequency}
                      onChange={e => setForm({ ...form, frequency: e.target.value })}
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
                      value={form.max_members}
                      onChange={e => setForm({ ...form, max_members: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      min="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tier</label>
                    <select
                      value={form.tier}
                      onChange={e => setForm({ ...form, tier: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Tier</option>
                      {tierOptions.map(tier => (
                        <option key={tier} value={tier}>{tier}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      className="bg-gray-300 px-4 py-2 rounded"
                      onClick={() => setShowCreate(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Group Modal */}
          {showEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Group</h2>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contribution Amount (R)</label>
                    <input
                      type="number"
                      value={editForm.contribution_amount}
                      onChange={e => setEditForm({ ...editForm, contribution_amount: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={editForm.frequency}
                      onChange={e => setEditForm({ ...editForm, frequency: e.target.value })}
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
                      value={editForm.max_members}
                      onChange={e => setEditForm({ ...editForm, max_members: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      min="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tier</label>
                    <select
                      value={editForm.tier}
                      onChange={e => setEditForm({ ...editForm, tier: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Tier</option>
                      {tierOptions.map(tier => (
                        <option key={tier} value={tier}>{tier}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      className="bg-gray-300 px-4 py-2 rounded"
                      onClick={() => setShowEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Delete Group</h2>
                <p>Are you sure you want to delete <span className="font-semibold">{selectedGroup?.name}</span>?</p>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setShowDelete(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Group Modal */}
          {showView && selectedGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-2 p-8 relative">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                  onClick={() => setShowView(false)}
                  aria-label="Close"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold mb-4">Group Details</h2>
                <div className="mb-2"><b>Name:</b> {selectedGroup.name}</div>
                <div className="mb-2"><b>Category:</b> {selectedGroup.category}</div>
                <div className="mb-2"><b>Tier:</b> {selectedGroup.tier}</div>
                <div className="mb-2"><b>Members:</b> {selectedGroup.members}</div>
                <div className="mb-2"><b>Status:</b> {selectedGroup.status}</div>
                <div className="mb-2"><b>Description:</b> {selectedGroup.description}</div>
                {/* Add more fields as needed */}
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition mt-4"
                  onClick={() => setShowView(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Join Requests</h2>
          {loadingRequests ? (
            <div>Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-gray-500">No join requests found.</div>
          ) : (
            <>
              {selectedRequests.length > 0 && (
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded mb-4"
                  onClick={() => setShowDeleteSelected(true)}
                >
                  Delete Selected ({selectedRequests.length})
                </button>
              )}
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                    <th className="p-2"></th>
                  <th className="p-2">User</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Group (Tier)</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                  {filteredRequests.map((req: any, idx: number) => (
                  <tr key={req.id} className="border-t">
                      <td className="p-2">
                        {idx !== 0 && (
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(req.id)}
                            onChange={() => toggleSelect(req.id)}
                          />
                        )}
                      </td>
                    <td className="p-2">{req.user?.name}</td>
                    <td className="p-2">{req.user?.email}</td>
                    <td className="p-2">{getGroupName(req.category, req.tier)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        req.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : req.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-2">{req.reason || "-"}</td>
                    <td className="p-2">{new Date(req.createdAt).toLocaleString()}</td>
                    <td className="p-2 flex gap-2">
                      {req.status === "pending" && (
                        <>
                          <button
                            className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 font-semibold"
                            disabled={actionLoading === req.id}
                            onClick={() => handleApprove(req.id)}
                          >
                            {actionLoading === req.id ? "Approving..." : "Approve"}
                          </button>
                          <button
                            className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-semibold"
                            disabled={actionLoading === req.id}
                            onClick={() => setRejectingId(req.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {/* Show nothing for approved/rejected */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}

          {/* Reject Modal */}
          {rejectingId && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setRejectingId(null)}
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-2">Reject Join Request</h2>
                <div className="mb-4 text-gray-600">
                  Please provide a reason for rejection:
                </div>
                <textarea
                  className="w-full border rounded p-2 mb-4"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    className="bg-gray-200 px-4 py-2 rounded"
                    onClick={() => setRejectingId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    disabled={actionLoading === rejectingId || !rejectReason.trim()}
                    onClick={() => handleReject(rejectingId)}
                  >
                    {actionLoading === rejectingId ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDeleteSelected && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
                <h2 className="text-xl font-bold mb-2 text-red-600">Delete Selected Join Requests?</h2>
                <p className="mb-4">Are you sure you want to delete the selected join requests? This cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                  <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setShowDeleteSelected(false)}>Cancel</button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={async () => {
                      await adminAPI.deleteJoinRequests(selectedRequests);
                      setShowDeleteSelected(false);
                      setSelectedRequests([]);
                      fetchRequests();
                      toast.success("Selected join requests deleted!");
                    }}
                  >Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default GroupAdminManagement;