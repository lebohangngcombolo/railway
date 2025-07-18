import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Loader2, CheckCircle, XCircle, Clock, Eye, ChevronDown } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const AdminPayouts: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/withdrawals");
      setRequests(res.data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await api.post(`/api/admin/withdrawals/${id}/approve`);
      fetchRequests();
      setSelected(null);
    } catch {}
    setActionLoading(false);
  };

  const handleReject = async (id: number, reason: string) => {
    setActionLoading(true);
    try {
      await api.post(`/api/admin/withdrawals/${id}/reject`, { reason });
      fetchRequests();
      setSelected(null);
      setShowRejectModal(false);
      setRejectReason("");
    } catch {}
    setActionLoading(false);
  };

  const filtered = requests.filter(r => {
    const matchesSearch =
      (r.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.group_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Payout Requests</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          className="border rounded px-3 py-2 w-64"
          placeholder="Search by user, email, group..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-gray-500 text-center">No payout requests found.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Group</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.id} className="border-t hover:bg-blue-50 transition">
                  <td className="p-3 font-semibold">{r.user_name}</td>
                  <td className="p-3">{r.user_email}</td>
                  <td className="p-3">{r.group_name}</td>
                  <td className="p-3">R{r.amount.toLocaleString()}</td>
                  <td className="p-3 max-w-xs truncate" title={r.reason}>{r.reason || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[r.status] || 'bg-gray-100 text-gray-800'}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
                  </td>
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      className="text-blue-600 hover:underline flex items-center gap-1"
                      onClick={() => setSelected(r)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Drawer/Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setSelected(null)}
              title="Close"
            >
              <XCircle className="w-7 h-7" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Payout Request Details</h2>
            <div className="mb-2"><b>User:</b> {selected.user_name}</div>
            <div className="mb-2"><b>Email:</b> {selected.user_email}</div>
            <div className="mb-2"><b>Group:</b> {selected.group_name}</div>
            <div className="mb-2"><b>Amount:</b> R{selected.amount.toLocaleString()}</div>
            <div className="mb-2"><b>Reason:</b> {selected.reason || '-'}</div>
            <div className="mb-2"><b>Status:</b> <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[selected.status]}`}>{selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}</span></div>
            <div className="mb-2"><b>Date:</b> {new Date(selected.created_at).toLocaleString()}</div>
            <div className="mb-2"><b>Approvals:</b> {selected.approvals_received} / {selected.approvals_needed}</div>
            {selected.status === 'pending' && (
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                  disabled={actionLoading}
                  onClick={() => handleApprove(selected.id)}
                >
                  {actionLoading ? <Loader2 className="animate-spin w-4 h-4 inline" /> : "Approve"}
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-semibold"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-60">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
                <h2 className="text-xl font-bold mb-2 text-red-600">Reject Payout Request?</h2>
                <p className="mb-4">Please provide a reason for rejection:</p>
                <textarea
                  className="w-full border rounded p-2 mb-4"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                />
                <div className="flex gap-2 justify-end">
                  <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setShowRejectModal(false)}>Cancel</button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={() => handleReject(selected.id, rejectReason)}
                    disabled={actionLoading || !rejectReason.trim()}
                  >Reject</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default AdminPayouts;