import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Loader2,
  User,
} from 'lucide-react';

interface KYCSubmission {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  employment_status: string;
  bank_name: string;
  account_number: string;
  id_document_path: string;
  proof_of_address_path: string;
  proof_of_income_path: string;
  bank_statement_path: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

const KYCManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);
  const [previewLabel, setPreviewLabel] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/kyc/submissions');
      setSubmissions(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: number) => {
    try {
      setActionLoading(true);
      await api.post(`/api/admin/kyc/${submissionId}/approve`);
      toast.success('KYC submission approved successfully');
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve submission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (submissionId: number, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/api/admin/kyc/${submissionId}/reject`, {
        rejection_reason: reason
      });
      toast.success('KYC submission rejected successfully');
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject submission');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      (submission.full_name || submission.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.email || submission.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.phone || '').includes(searchTerm) ||
      (submission.id_number || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDocUrl = (docPath: string | null) => {
    if (!docPath) return null;
    if (docPath.includes('kyc_docs/')) {
      const filename = docPath.split('kyc_docs/').pop();
      return `${backendUrl}/uploads/kyc_docs/${filename}`;
    }
    if (docPath.startsWith('/')) {
      return `${backendUrl}${docPath}`;
    }
    return `${backendUrl}/${docPath}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  function DocPreview({ docPath, label, onPreview }: { docPath: string | null, label: string, onPreview: (url: string, type: 'image' | 'pdf', label: string) => void }) {
    const url = getDocUrl(docPath);
    if (!url) {
      return (
        <div className="flex flex-col items-center text-gray-400">
          <FileText className="w-8 h-8 mb-1" />
          <span className="text-xs italic">No file</span>
        </div>
      );
    }
    if (/\.(jpg|jpeg|png)$/i.test(url)) {
      return (
        <div className="flex flex-col items-center group">
            <img
              src={url}
              alt={label}
            className="rounded shadow max-w-[80px] max-h-[80px] object-cover border transition-transform duration-200 group-hover:scale-105 cursor-pointer"
              title={label}
              onClick={() => onPreview(url, 'image', label)}
            />
          <a
            href={url}
            download
            className="mt-1 text-xs text-blue-600 underline hover:text-blue-800 transition-colors"
            title={`Download ${label}`}
          >
            Download
          </a>
        </div>
      );
    }
    if (/\.pdf$/i.test(url)) {
      return (
        <div className="flex flex-col items-center group">
          <div
            className="w-[80px] h-[100px] border rounded group-hover:shadow-lg transition-shadow flex items-center justify-center bg-gray-50 cursor-pointer"
            onClick={() => onPreview(url, 'pdf', label)}
            title={`Preview ${label}`}
          >
            <FileText className="w-8 h-8 text-gray-400" />
            <span className="text-xs text-gray-500 ml-2">PDF</span>
          </div>
          <a
            href={url}
            download
            className="mt-1 text-xs text-blue-600 underline hover:text-blue-800 transition-colors"
            title={`Download ${label}`}
          >
            Download PDF
          </a>
        </div>
      );
    }
    return (
      <a
        href={url}
        download
        className="text-blue-600 underline hover:text-blue-800 transition-colors"
        title={`Download ${label}`}
      >
        Download
      </a>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-[#1a237e]">KYC Management</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-500">Total: {submissions.length}</span>
          <span className="bg-[#e8eaf6] text-[#1a237e] px-3 py-1 rounded-lg font-semibold">
              <User className="inline w-4 h-4 mr-1" /> Pending: {submissions.filter(s => s.status === 'pending').length}
          </span>
        </div>
      </div>
      <div className="mb-4 flex flex-col md:flex-row gap-2">
          <input
            type="text"
          placeholder="Search by name, email, phone, or ID..."
          className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3949ab] focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        <select
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3949ab] focus:outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-[#3B4CCA] text-white">
            <tr>
              <th className="py-3 px-4 font-semibold text-left">Status</th>
              <th className="py-3 px-4 font-semibold text-left">Name</th>
              <th className="py-3 px-4 font-semibold text-left">Submitted</th>
              <th className="py-3 px-4 font-semibold text-left">Docs</th>
              <th className="py-3 px-4 font-semibold text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No KYC submissions found.
                </td>
              </tr>
            )}
            {filteredSubmissions.map((submission) => {
              const docsCount = [
                submission.id_document_path,
                submission.proof_of_address_path,
                submission.proof_of_income_path,
                submission.bank_statement_path,
              ].filter(Boolean).length;
              return (
                <tr
                  key={submission.id}
                  className="border-b last:border-b-0 hover:bg-[#f5f5f5] transition"
                >
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      <span className="ml-1 capitalize">{submission.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{submission.full_name || submission.user_name}</td>
                  <td className="py-3 px-4">{new Date(submission.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{docsCount}/4</td>
                  <td className="py-3 px-4">
                    <button
                      className="text-[#3B4CCA] underline text-xs font-semibold"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Right-Side Drawer */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 z-50 flex"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setSelectedSubmission(null)}
          />
          {/* Drawer */}
          <div className="ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out"
            style={{
              transform: 'translateX(0%)',
            }}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#e8eaf6] flex items-center justify-center font-bold text-xl text-[#3B4CCA]">
                  {getInitials(selectedSubmission.full_name || selectedSubmission.user_name)}
                </div>
                <div>
                  <div className="font-bold text-lg">{selectedSubmission.full_name || selectedSubmission.user_name}</div>
                  <div className="text-gray-500 text-sm">{selectedSubmission.email || selectedSubmission.user_email}</div>
                  <div className="text-gray-500 text-xs">{selectedSubmission.phone}</div>
                </div>
              </div>
            <button
                className="text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setSelectedSubmission(null)}
            >
              &times;
            </button>
            </div>

            {/* Timeline/Progress Bar */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedSubmission.status)}`}>
                  {getStatusIcon(selectedSubmission.status)}
                  <span className="ml-1 capitalize">{selectedSubmission.status}</span>
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${selectedSubmission.status !== 'draft' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`flex-1 h-1 ${selectedSubmission.status === 'pending' || selectedSubmission.status === 'approved' || selectedSubmission.status === 'rejected' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-2 w-2 rounded-full ${selectedSubmission.status === 'approved' ? 'bg-green-600' : selectedSubmission.status === 'rejected' ? 'bg-red-600' : 'bg-gray-300'}`} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Submitted</span>
                <span>{selectedSubmission.status === 'approved' ? 'Approved' : selectedSubmission.status === 'rejected' ? 'Rejected' : 'Review'}</span>
              </div>
            </div>

            {/* Document Carousel/Grid */}
            <div className="px-6 py-4">
              <div className="font-semibold text-gray-700 mb-2">KYC Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Full Name:</span>
                  <div>{selectedSubmission.full_name || selectedSubmission.user_name}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <div>{selectedSubmission.email || selectedSubmission.user_email}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <div>{selectedSubmission.phone}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">ID Number:</span>
                  <div>{selectedSubmission.id_number}</div>
                </div>
                {/* Add these if you collect them */}
                {/* <div>
                  <span className="font-medium text-gray-600">Date of Birth:</span>
                  <div>{selectedSubmission.date_of_birth}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <div>{selectedSubmission.address}</div>
                </div> */}
                <div>
                  <span className="font-medium text-gray-600">Employment Status:</span>
                  <div>{selectedSubmission.employment_status}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Bank Name:</span>
                  <div>{selectedSubmission.bank_name}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Account Number:</span>
                  <div>{selectedSubmission.account_number}</div>
                </div>
              </div>
            </div>

            {/* Document Carousel/Grid */}
            <div className="px-6 py-4">
              <div className="font-semibold text-gray-700 mb-2">Documents</div>
              <div className="grid grid-cols-2 gap-3">
              <DocPreview docPath={selectedSubmission.id_document_path} label="ID Document" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
              <DocPreview docPath={selectedSubmission.proof_of_address_path} label="Proof of Address" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
              <DocPreview docPath={selectedSubmission.proof_of_income_path} label="Proof of Income" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
              <DocPreview docPath={selectedSubmission.bank_statement_path} label="Bank Statement" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
            </div>
            </div>

            {/* Admin Notes/Comments */}
            <div className="px-6 py-4">
              <div className="font-semibold text-gray-700 mb-2">Admin Notes</div>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={2}
                placeholder="Add a note for this application (not visible to user)..."
                // You can implement saving notes to backend if desired
              />
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 flex gap-3">
              {selectedSubmission.status === 'pending' && (
                <>
                  <button
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedSubmission.id)}
                  >
                    {actionLoading ? <Loader2 className="animate-spin w-4 h-4 inline" /> : "Approve"}
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    onClick={() => {
                      const reason = prompt("Please provide a reason for rejection:");
                      if (reason) handleReject(selectedSubmission.id, reason);
                    }}
                    disabled={actionLoading}
                  >
                    Reject
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                    onClick={() => toast.info("Feature coming soon: Request more info from user!")}
                  >
                    Request More Info
                  </button>
                </>
              )}
            </div>

            {/* Action Log/History (placeholder) */}
            <div className="px-6 py-4 border-t">
              <div className="font-semibold text-gray-700 mb-2">Action Log</div>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>2024-07-15 10:00 - Submitted by user</li>
                {/* You can fetch and display real action logs here */}
                {selectedSubmission.status === 'approved' && <li>{new Date(selectedSubmission.updated_at).toLocaleString()} - Approved by admin</li>}
                {selectedSubmission.status === 'rejected' && <li>{new Date(selectedSubmission.updated_at).toLocaleString()} - Rejected by admin</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setPreviewUrl(null)}
              title="Close"
            >
              &times;
            </button>
            <div className="mb-4 text-lg font-semibold">{previewLabel}</div>
            {previewType === 'image' ? (
              <img src={previewUrl} alt={previewLabel} className="max-h-[70vh] max-w-full rounded shadow" />
            ) : (
              <iframe src={previewUrl} title={previewLabel} className="w-full h-[70vh] rounded shadow" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement; 