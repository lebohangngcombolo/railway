import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@mui/material'; // or use your own card component
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const summaryCardData = (data: any) => [
  { label: "Total Users", value: data?.user_stats?.total ?? '-' },
  { label: "Verified Users", value: data?.user_stats?.verified ?? '-' },
  { label: "New Users (7d)", value: data?.user_stats?.recent_last_7_days ?? '-' },
  { label: "Active Sessions", value: data?.sessions?.active ?? '-' },
  { label: "Total Transactions", value: data?.transactions?.total ?? '-' },
  { label: "Completed Transactions", value: data?.transactions?.completed ?? '-' },
  { label: "Total Volume", value: `R${data?.transactions?.volume?.toLocaleString() ?? '-'}` },
  { label: "Total Contributions", value: data?.contributions?.total ?? '-' },
];

const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    user_id: '',
    group_id: ''
  });

  // For controlled inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    adminAPI.getAnalyticsOverview(filters)
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    adminAPI.getAnalyticsOverview(filters)
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [filters]);

  // TODO: Add UI for filters, summary cards, charts, etc.

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics Overview</h1>
      {/* Filter Controls */}
      <form className="flex flex-wrap gap-4 mb-8 items-end" onSubmit={handleFilter}>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleInputChange}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleInputChange}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">User ID</label>
          <input
            type="text"
            name="user_id"
            value={filters.user_id}
            onChange={handleInputChange}
            placeholder="User ID"
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Group ID</label>
          <input
            type="text"
            name="group_id"
            value={filters.group_id}
            onChange={handleInputChange}
            placeholder="Group ID"
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
        >
          Filter
        </button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {summaryCardData(data).map(card => (
              <div key={card.label} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-1">{card.label}</div>
                <div className="text-xl font-bold text-indigo-700">{card.value}</div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Line Chart: Daily Transaction Volume */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Transaction Volume</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.transactions.daily_volume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart: Transaction Volume by Type */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Transaction Volume by Type</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={Object.entries(data.transactions.volume_by_type).map(([type, amount]) => ({ type, amount }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart for Referrals (optional) */}
          {data.referrals && (
            <div className="bg-white rounded-xl shadow p-6 mb-8 max-w-md">
              <h2 className="text-lg font-semibold mb-4">Referrals Completion</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: data.referrals.completed },
                      { name: 'Pending', value: data.referrals.total - data.referrals.completed }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#6366f1"
                    label
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e42" />
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div>No data available.</div>
      )}
    </div>
  );
};

export default AdminAnalytics;