// src/pages/AdminFAQs.tsx
import React, { useEffect, useState } from "react";
import { HiOutlineSearch, HiOutlinePlus } from "react-icons/hi";
import { toast } from "react-hot-toast";
import api from "../services/api"; // <-- add this import
import { useNavigate } from "react-router-dom"; // Add this import
import Modal from "react-modal"; // npm install react-modal

const STATUS_COLORS = {
  Published: "bg-green-100 text-green-800",
  Unpublished: "bg-gray-200 text-gray-600",
};

function AdminFAQs() {
  const [faqs, setFaqs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "",
    is_published: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Build query string only if needed
  const buildFaqsUrl = () => {
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (category) params.push(`category=${category}`);
    return `/api/admin/faqs${params.length ? `?${params.join("&")}` : ""}`;
  };

  // Fetch FAQs
  const fetchFaqs = async () => {
    setLoading(true);
    const url = buildFaqsUrl();
    try {
      const res = await api.get(url);
      setFaqs(res.data);
      setCategories([...new Set(res.data.map(f => f.category))]);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response && err.response.status === 404) {
        toast.error("FAQ endpoint not found. Please check your backend route.");
      } else {
        toast.error("Failed to load FAQs");
      }
    }
    setLoading(false);
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/admin/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
      // Optionally handle other errors
    }
  };

  useEffect(() => { fetchFaqs(); }, [search, category]);
  useEffect(() => { fetchNotifications(); }, []);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    await api.post("/api/admin/notifications/mark-all-read");
    fetchNotifications();
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ question: "", answer: "", category: "", is_published: true });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/admin/faqs", form);
      toast.success("FAQ created!");
      handleCloseModal();
      fetchFaqs(); // refresh list
    } catch (err) {
      toast.error("Failed to create FAQ");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (optional, for full dashboard layout) */}
      {/* <Sidebar /> */}

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">FAQs</h1>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            onClick={handleOpenModal}
          >
            <HiOutlinePlus size={20} />
            Create FAQ
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border rounded pl-10 pr-3 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border rounded px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FAQ Table */}
          <div className="md:col-span-2 bg-white rounded-xl shadow p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-[#3B4CCA]">
                  <th className="p-3 text-left font-semibold text-white">Question</th>
                  <th className="p-3 text-left font-semibold text-white">Category</th>
                  <th className="p-3 text-left font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : faqs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">No FAQs found.</td>
                  </tr>
                ) : (
                  faqs.map(faq => (
                    <tr key={faq.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3">{faq.question}</td>
                      <td className="p-3">{faq.category}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${faq.is_published ? STATUS_COLORS.Published : STATUS_COLORS.Unpublished}`}>
                          {faq.is_published ? "Published" : "Unpublished"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Notifications</h2>
              <button onClick={markAllAsRead} className="text-blue-600 text-sm hover:underline">Mark all as read</button>
            </div>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-gray-400 text-sm">No notifications.</div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="bg-white rounded-lg p-4 shadow border">
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-gray-600 text-sm truncate">{n.message}</div>
                    <div className="text-gray-400 text-xs mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={showModal}
        onRequestClose={handleCloseModal}
        className="bg-white rounded-xl p-8 max-w-lg mx-auto mt-24 shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        <h2 className="text-xl font-bold mb-4">Create FAQ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Question</label>
            <input
              name="question"
              value={form.question}
              onChange={handleFormChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Answer</label>
            <textarea
              name="answer"
              value={form.answer}
              onChange={handleFormChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleFormChange}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={handleFormChange}
              id="is_published"
            />
            <label htmlFor="is_published">Published</label>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminFAQs;