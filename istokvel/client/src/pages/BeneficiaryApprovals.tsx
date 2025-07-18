import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const BeneficiaryApprovals = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [previewBeneficiary, setPreviewBeneficiary] = useState<{ url: string; label: string; beneficiaryId: string; docType: string } | null>(null);
  const [docPreview, setDocPreview] = useState<{ url: string; label: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBeneficiaries = () => {
    fetch('/api/admin/beneficiaries', {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(setBeneficiaries);
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const filteredBeneficiaries = beneficiaries.filter(b =>
    (b.name?.toLowerCase().includes(search.toLowerCase()) ||
     b.id_number?.toLowerCase().includes(search.toLowerCase()) ||
     b.email?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || b.status === statusFilter)
  );

  const handleApprove = async () => {
    await fetch(`/api/admin/beneficiaries/${previewBeneficiary.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    toast.success("Beneficiary approved and user notified!");
    // Update status in local state
    setBeneficiaries(prev =>
      prev.map(b =>
        b.id === previewBeneficiary.id ? { ...b, status: "Approved" } : b
      )
    );
    setPreviewBeneficiary(null);
  };

  const handleReject = async () => {
    await fetch(`/api/admin/beneficiaries/${previewBeneficiary.id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    toast.success("Beneficiary rejected and user notified!");
    // Update status in local state
    setBeneficiaries(prev =>
      prev.map(b =>
        b.id === previewBeneficiary.id ? { ...b, status: "Rejected" } : b
      )
    );
    setPreviewBeneficiary(null);
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#1a237e]">Beneficiary Document Approvals</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-80 px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f4f6fb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Relationship</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID Number</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredBeneficiaries.map(b => (
              <tr key={b.id} className="hover:bg-blue-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                <td className="px-4 py-3 text-gray-700">{b.relationship}</td>
                <td className="px-4 py-3 text-gray-700">{b.id_number}</td>
                <td className="px-4 py-3 text-gray-700">{b.email}</td>
                <td className="px-4 py-3 text-gray-700">
                  <span className={
                    b.status === "Approved" ? "text-green-600 font-semibold" :
                    b.status === "Rejected" ? "text-red-500 font-semibold" :
                    (!b.id_doc_url && !b.address_doc_url && !b.relationship_doc_url) ? "text-gray-400 font-semibold" :
                    "text-yellow-600 font-semibold"
                  }>
                    {b.status === "Approved" ? "Approved"
                      : b.status === "Rejected" ? "Rejected"
                      : (!b.id_doc_url && !b.address_doc_url && !b.relationship_doc_url) ? "No Documents"
                      : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className="text-blue-600 underline font-semibold"
                    onClick={() => setPreviewBeneficiary(b)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setPreviewBeneficiary(null)}
            >✕</button>
            <h3 className="text-xl font-bold mb-4">Beneficiary Details</h3>
            <div className="mb-4">
              <div><b>Name:</b> {previewBeneficiary.name}</div>
              <div><b>Relationship:</b> {previewBeneficiary.relationship}</div>
              <div><b>ID Number:</b> {previewBeneficiary.id_number}</div>
              <div><b>Email:</b> {previewBeneficiary.email}</div>
              <div><b>Status:</b> <span className={
                previewBeneficiary.status === "Approved" ? "text-green-600 font-semibold" :
                previewBeneficiary.status === "Rejected" ? "text-red-500 font-semibold" :
                "text-yellow-600 font-semibold"
              }>
                {previewBeneficiary.status || "Pending"}
              </span></div>
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Documents:</h4>
              <ul className="space-y-2">
                {previewBeneficiary.id_doc_url && (
                  <li>
                    🪪 ID Document
                    <button
                      className="ml-2 text-blue-600 underline"
                      onClick={() => setDocPreview({ url: previewBeneficiary.id_doc_url, label: "ID Document" })}
                    >Preview</button>
                    <a
                      href={previewBeneficiary.id_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline"
                    >Download</a>
                  </li>
                )}
                {previewBeneficiary.address_doc_url && (
                  <li>
                    🏠 Proof of Address
                    <button
                      className="ml-2 text-blue-600 underline"
                      onClick={() => setDocPreview({ url: previewBeneficiary.address_doc_url, label: "Proof of Address" })}
                    >Preview</button>
                    <a
                      href={previewBeneficiary.address_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline"
                    >Download</a>
                  </li>
                )}
                {previewBeneficiary.relationship_doc_url && (
                  <li>
                    📄 Proof of Relationship
                    <button
                      className="ml-2 text-blue-600 underline"
                      onClick={() => setDocPreview({ url: previewBeneficiary.relationship_doc_url, label: "Proof of Relationship" })}
                    >Preview</button>
                    <a
                      href={previewBeneficiary.relationship_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline"
                    >Download</a>
                  </li>
                )}
              </ul>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                onClick={handleApprove}
              >
                Approve
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
                onClick={handleReject}
              >
                Reject
              </button>
            </div>
          </div>
          {/* Document Preview Modal */}
          {docPreview && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                  onClick={() => setDocPreview(null)}
                >✕</button>
                <h4 className="font-semibold mb-2">{docPreview.label}</h4>
                {docPreview.url.endsWith('.pdf') ? (
                  <iframe src={docPreview.url} title="Preview" className="w-full h-64" />
                ) : (
                  <img src={docPreview.url} alt="Preview" className="max-w-full max-h-64 rounded" />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BeneficiaryApprovals;