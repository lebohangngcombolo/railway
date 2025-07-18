import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
};

const AdminConcerns = () => {
  const [concerns, setConcerns] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
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

  const handleStatusChange = async (id, newStatus) => {
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

  const handleDelete = async (id) => {
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Customer Concerns</h1>
      <div className="flex gap-4 mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
        <input
          type="text"
          placeholder="Search by name, email, subject"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Subject</th>
            <th className="p-2">Status</th>
            <th className="p-2">Date</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {concerns.map(c => (
            <tr key={c.id}>
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.email}</td>
              <td className="p-2">{c.subject}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded ${STATUS_COLORS[c.status]}`}>{c.status}</span>
              </td>
              <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
              <td className="p-2">
                <button onClick={() => setSelected(c)} className="text-blue-600 underline mr-2">View</button>
                <button onClick={() => handleDelete(c.id)} className="text-red-600 underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
      </div>
      {/* Modal for single concern */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-2">{selected.subject}</h2>
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
            <div className="mb-4"><b>Message:</b> <div className="border rounded p-2 bg-gray-50">{selected.message}</div></div>
            <div className="flex gap-4">
              <button onClick={() => setSelected(null)} className="bg-gray-200 px-4 py-2 rounded">Close</button>
              <button onClick={() => handleDelete(selected.id)} className="bg-red-600 text-white px-4 py-2 rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConcerns;