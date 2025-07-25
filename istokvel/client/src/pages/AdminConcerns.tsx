import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineTrash, HiOutlineEye, HiX } from "react-icons/hi"; // Add react-icons for better UI

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
};

const AdminConcerns = () => {
  const [concerns, setConcerns] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchConcerns = async () => {
    setLoading(true);
    let url = `/api/admin/concerns?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setConcerns(data.concerns);
      setTotal(data.total);
    } else {
      toast.error('Failed to load concerns');
    }
    setLoading(false);
  };

  useEffect(() => { fetchConcerns(); }, [status, search, page]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/concerns/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success('Status updated');
      fetchConcerns();
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this concern?')) return;
    const res = await fetch(`/api/admin/concerns/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast.success('Concern deleted');
      fetchConcerns();
    } else {
      toast.error('Failed to delete concern');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-gray-800 tracking-tight">Customer Concerns</h1>
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border rounded px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, subject"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border rounded pl-10 pr-3 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#3B4CCA]">
              <tr>
                <th className="p-3 text-left font-semibold text-white">Name</th>
                <th className="p-3 text-left font-semibold text-white">Email</th>
                <th className="p-3 text-left font-semibold text-white">Subject</th>
                <th className="p-3 text-left font-semibold text-white">Status</th>
                <th className="p-3 text-left font-semibold text-white">Date</th>
                <th className="p-3 text-left font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : concerns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No concerns found.</td>
                </tr>
              ) : (
                concerns.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3">{c.subject}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[c.status as keyof typeof STATUS_COLORS]}`}>
                        {/* Optionally add a colored dot or icon here */}
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">{new Date(c.created_at).toLocaleString()}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="View"
                      >
                        <HiOutlineEye size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Delete"
                      >
                        <HiOutlineTrash size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center gap-4 mt-6 justify-center">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-gray-700 font-medium">Page {page}</span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {/* Modal for single concern */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                title="Close"
              >
                <HiX size={28} />
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-700">{selected.subject}</h2>
              <div className="mb-2"><b>Name:</b> {selected.name}</div>
              <div className="mb-2"><b>Email:</b> {selected.email}</div>
              <div className="mb-2"><b>Date:</b> {new Date(selected.created_at).toLocaleString()}</div>
              <div className="mb-2"><b>Status:</b>
                <select
                  value={selected.status}
                  onChange={e => handleStatusChange(selected.id, e.target.value)}
                  className="ml-2 border rounded px-2 py-1"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="mb-4"><b>Message:</b>
                <div className="border rounded p-3 bg-gray-50 mt-1">{selected.message}</div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setSelected(null)}
                  className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConcerns;
