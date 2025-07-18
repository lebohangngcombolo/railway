import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Edit2, Trash2, UserPlus, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const RELATIONSHIPS = [
  { label: "Spouse", color: "bg-pink-100 text-pink-700" },
  { label: "Child", color: "bg-yellow-100 text-yellow-700" },
  { label: "Parent", color: "bg-green-100 text-green-700" },
  { label: "Sibling", color: "bg-blue-100 text-blue-700" },
  { label: "Friend", color: "bg-purple-100 text-purple-700" },
  { label: "Other", color: "bg-gray-100 text-gray-700" },
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const getRelationshipColor = (relationship) =>
  RELATIONSHIPS.find((r) => r.label === relationship)?.color || "bg-gray-100 text-gray-700";

const getFileType = (url: string) => {
  if (!url) return "";
  if (url.endsWith(".pdf")) return "pdf";
  if (url.match(/\.(jpeg|jpg|png|gif|png)$/i)) return "image";
  return "";
};

const docTypes = [
  { key: "id_doc_url", label: "ID Document", icon: "🪪" },
  { key: "address_doc_url", label: "Proof of Address", icon: "🏠" },
  { key: "relationship_doc_url", label: "Proof of Relationship", icon: "📄" },
];

const Beneficiaries = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string, type: string, label: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<any[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/beneficiaries", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBeneficiaries(data);
    } catch {
      toast.error("Could not load beneficiaries.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleDelete = async (id) => {
    await fetch(`/api/beneficiaries/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    toast.success("Beneficiary removed");
    setConfirmDelete(null);
    fetchBeneficiaries();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditing(null);
    fetchBeneficiaries(); // <-- refresh the list after closing the form
  };

  const handleFormSave = () => {
    handleFormClose();
    fetchBeneficiaries(); // Refresh the table immediately
  };

  // Helper: collect all available docs for a beneficiary
  const getDocsArray = (b) => [
    b.id_doc_url && { url: b.id_doc_url, type: getFileType(b.id_doc_url), label: "ID Document" },
    b.address_doc_url && { url: b.address_doc_url, type: getFileType(b.address_doc_url), label: "Proof of Address" },
    b.relationship_doc_url && { url: b.relationship_doc_url, type: getFileType(b.relationship_doc_url), label: "Proof of Relationship" },
  ].filter(Boolean);

  // Filtered beneficiaries
  const filtered = beneficiaries.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.id_number?.toLowerCase().includes(search.toLowerCase())
  );

  console.log("Beneficiaries:", beneficiaries);
  console.log("Selected beneficiary:", selectedBeneficiary);

  return (
    <div className="min-h-[80vh] bg-[#f4f6fb] py-10 px-2 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-[#1a237e]">Beneficiaries</h1>
          <button
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-lg font-semibold shadow transition"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <UserPlus className="inline w-5 h-5 mr-2" />
            Add Beneficiary
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Search beneficiaries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-80 px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          />
          </div>

        {/* Table */}
        <div className="rounded-2xl bg-white shadow border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f4f6fb]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Beneficiary ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Relationship</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">No beneficiaries found.</td>
                </tr>
              ) : (
                filtered.map((b, idx) => (
                  <tr
                key={b.id}
                    onClick={() => {
                      setSelectedBeneficiary(b);
                      setPreviewDoc(null);
                    }}
                    className="cursor-pointer hover:bg-blue-50 border-t border-gray-100 transition"
                  >
                    {/* Beneficiary ID as blue link */}
                    <td className="px-4 py-3 font-semibold text-[#2563eb]">
                      {b.id_number || b.id}
                    </td>
                    {/* Name with avatar/initials */}
                    <td className="px-4 py-3 flex items-center gap-3">
                      {b.profile_pic_url ? (
                        <img src={b.profile_pic_url} alt={b.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-base font-extrabold text-white shadow border-2 border-white">
                    {getInitials(b.name)}
                  </div>
                      )}
                      <span className="font-medium text-gray-900">{b.name}</span>
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-3 text-gray-700">{b.phone || "-"}</td>
                    {/* Relationship */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRelationshipColor(b.relationship)}`}>
                        {b.relationship}
                      </span>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-gray-700">{b.email || "-"}</td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                  <button
                          className="p-2 rounded-full hover:bg-blue-100 transition"
                          onClick={e => { e.stopPropagation(); setEditing(b); setShowForm(true); }}
                    title="Edit"
                  >
                          <Edit2 className="w-5 h-5 text-[#2563eb]" />
                  </button>
                  <button
                          className="p-2 rounded-full hover:bg-red-100 transition"
                          onClick={e => { e.stopPropagation(); setConfirmDelete(b); }}
                    title="Remove"
                  >
                          <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Documents Section Below Table */}
        {selectedBeneficiary && (
          <div className="mt-8 p-6 bg-white rounded-xl shadow max-w-lg">
            <h2 className="text-lg font-bold mb-4">Documents for {selectedBeneficiary.name}</h2>
            <div className="flex gap-8">
              {docTypes.map(doc => {
                const url = selectedBeneficiary[doc.key];
                return (
                  <div key={doc.key} className="flex flex-col items-center">
                    <span
                      className="text-3xl text-blue-600 cursor-pointer hover:scale-110"
                      onClick={e => {
                        e.stopPropagation();
                        if (url) {
                          setPreviewDoc({ url, type: getFileType(url), label: doc.label });
                        } else {
                          alert("No document uploaded yet.");
                        }
                      }}
                      title={doc.label}
                    >
                      {doc.icon}
                    </span>
                    <span className="text-xs mt-2">{doc.label}</span>
                    {url && <span className="text-green-600 text-xs mt-1">Uploaded</span>}
                    {!url && <span className="text-gray-400 text-xs mt-1">Not uploaded</span>}
                  </div>
                );
              })}
            </div>
            {previewDoc && (
              <div className="mt-4 p-2 border rounded bg-gray-50 max-w-xs">
                {previewDoc.type === "image" ? (
                  <img src={previewDoc.url} alt="Preview" className="max-w-[180px] max-h-[120px] rounded" />
                ) : previewDoc.type === "pdf" ? (
                  <iframe src={previewDoc.url} title="Preview" className="w-40 h-28" />
                ) : (
                  <span>Cannot preview this file type.</span>
                )}
                <button onClick={() => setPreviewDoc(null)} className="block mt-2 text-blue-600 underline">Close</button>
              </div>
            )}
          </div>
        )}

        {/* Floating Add Button (Mobile) */}
        <button
          className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg md:hidden"
          onClick={() => { setEditing(null); setShowForm(true); }}
          title="Add Beneficiary"
        >
          <UserPlus className="w-6 h-6" />
        </button>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <BeneficiaryForm
            beneficiary={editing}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        )}

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-8 flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4 text-center">
                Remove Beneficiary?
              </h2>
              <div className="mb-6 text-gray-600 text-center">
                Are you sure you want to remove <b>{confirmDelete.name}</b> as a beneficiary?
              </div>
              <div className="flex gap-4">
                <button
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold"
                  onClick={() => handleDelete(confirmDelete.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => {
              setPreviewDoc(null);
              setPreviewDocs([]);
              setPreviewIndex(0);
              setPreviewLoading(false);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewDocs([]);
                  setPreviewIndex(0);
                  setPreviewLoading(false);
                }}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold mb-4">{previewDoc.label}</h3>
              {/* Navigation arrows */}
              {previewDocs.length > 1 && (
                <>
                  <button
                    className="absolute top-1/2 left-2 -translate-y-1/2 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                    disabled={previewIndex === 0}
                    onClick={() => {
                      if (previewIndex > 0) {
                        setPreviewIndex(previewIndex - 1);
                        setPreviewDoc(previewDocs[previewIndex - 1]);
                        setPreviewLoading(true);
                      }
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                    disabled={previewIndex === previewDocs.length - 1}
                    onClick={() => {
                      if (previewIndex < previewDocs.length - 1) {
                        setPreviewIndex(previewIndex + 1);
                        setPreviewDoc(previewDocs[previewIndex + 1]);
                        setPreviewLoading(true);
                      }
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {/* Loading spinner */}
              {previewLoading && (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                  <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-2" />
                  <span className="text-gray-500">Loading document...</span>
                </div>
              )}
              {/* Document preview */}
              {!previewLoading && previewDoc.type === "image" ? (
                <img
                  src={previewDoc.url}
                  alt="Document"
                  className="max-h-[70vh] rounded-lg shadow"
                  onLoad={() => setPreviewLoading(false)}
                />
              ) : !previewLoading && previewDoc.type === "pdf" ? (
                <iframe
                  src={previewDoc.url}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-lg border"
                  onLoad={() => setPreviewLoading(false)}
                />
              ) : !previewLoading && (
                <div className="text-gray-500">Cannot preview this file type.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Add/Edit Beneficiary Form ---
const BeneficiaryForm = ({ beneficiary, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: beneficiary?.name || "",
    id_number: beneficiary?.id_number || "",
    relationship: beneficiary?.relationship || "",
    date_of_birth: beneficiary?.date_of_birth || "",
    phone: beneficiary?.phone || "",
    email: beneficiary?.email || "",
  });
  const [loading, setLoading] = useState(false);

  // --- Add these states for document files and URLs ---
  const [idFile, setIdFile] = useState(null);
  const [addressFile, setAddressFile] = useState(null);
  const [relationshipFile, setRelationshipFile] = useState(null);

  const [idUrl, setIdUrl] = useState(beneficiary?.id_doc_url || "");
  const [addressUrl, setAddressUrl] = useState(beneficiary?.address_doc_url || "");
  const [relationshipUrl, setRelationshipUrl] = useState(beneficiary?.relationship_doc_url || "");

  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingAddress, setUploadingAddress] = useState(false);
  const [uploadingRelationship, setUploadingRelationship] = useState(false);

  const isEdit = !!beneficiary;

  function getDOBFromID(idNumber) {
    if (!/^\d{6}/.test(idNumber)) return "";
    let year = idNumber.slice(0, 2);
    let month = idNumber.slice(2, 4);
    let day = idNumber.slice(4, 6);

    const currentYear = new Date().getFullYear() % 100;
    let fullYear = parseInt(year, 10) > currentYear
      ? "19" + year
      : "20" + year;

    return `${fullYear}-${month}-${day}`;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "id_number" && value.length >= 6) {
        const dob = getDOBFromID(value);
        if (dob) updated.date_of_birth = dob;
      }
      return updated;
    });
  };

  // --- Add this helper for uploading a document ---
  const uploadDoc = async (beneficiaryId, file, type, setUrl) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    const data = await res.json();
    if (data.url) setUrl(data.url);
  };

  // --- Update handleSubmit to upload documents after saving beneficiary ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit
      ? `/api/beneficiaries/${beneficiary.id}`
      : "/api/beneficiaries";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(isEdit ? "Beneficiary updated" : "Beneficiary added");
      // Save beneficiary first (POST or PUT), get beneficiaryId
      let beneficiaryId = beneficiary?.id;
      if (!beneficiaryId) {
        // Create new beneficiary
        const data = await res.json();
        beneficiaryId = data.id;
      }

      // --- Upload documents if selected ---
      await uploadDoc(beneficiaryId, idFile, "id", setIdUrl);
      await uploadDoc(beneficiaryId, addressFile, "address", setAddressUrl);
      await uploadDoc(beneficiaryId, relationshipFile, "relationship", setRelationshipUrl);

      if (onSave) onSave(); // <-- Call this to close and refresh
      return;
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save beneficiary");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-auto p-8 space-y-6"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-[#1a237e]">Beneficiary Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Relationship</label>
            <select
              name="relationship"
              value={form.relationship}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select...</option>
              {RELATIONSHIPS.map(r => (
                <option key={r.label} value={r.label}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">ID Number</label>
            <input
              type="text"
              name="id_number"
              value={form.id_number}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Document Uploads */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-[#2563eb]">Upload Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium mb-1">ID Document</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={async e => {
                  const file = e.target.files[0];
                  setIdFile(file);
                  if (file && beneficiary?.id) {
                    setUploadingId(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("type", "id");
                    const res = await fetch(`/api/beneficiaries/${beneficiary.id}/documents`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.url) setIdUrl(data.url);
                    setUploadingId(false);
                  }
                }}
                className="w-full"
              />
              {/* Show upload status here */}
          </div>
          <div>
            <label className="block font-medium mb-1">Proof of Address</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={async e => {
                  const file = e.target.files[0];
                  setAddressFile(file);
                  if (file && beneficiary?.id) {
                    setUploadingAddress(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("type", "address");
                    const res = await fetch(`/api/beneficiaries/${beneficiary.id}/documents`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.url) setAddressUrl(data.url);
                    setUploadingAddress(false);
                  }
                }}
                className="w-full"
              />
              {/* Show upload status here */}
          </div>
          <div>
            <label className="block font-medium mb-1">Proof of Relationship</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={async e => {
                  const file = e.target.files[0];
                  setRelationshipFile(file);
                  if (file && beneficiary?.id) {
                    setUploadingRelationship(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("type", "relationship");
                    const res = await fetch(`/api/beneficiaries/${beneficiary.id}/documents`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.url) setRelationshipUrl(data.url);
                    setUploadingRelationship(false);
                  }
                }}
                className="w-full"
              />
              {/* Show upload status here */}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Beneficiary"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Beneficiaries;