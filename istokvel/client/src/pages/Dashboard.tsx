import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from "react-chartjs-2";
import { Star, Users } from "lucide-react";
import { userAPI } from '../services/api'; // Use userAPI for clarity
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Title);

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [trendTab, setTrendTab] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [savingsGoal, setSavingsGoal] = useState({ label: '', target: 0, progress: 0 });
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [userResponse, statsResponse, groupsResponse] = await Promise.all([
          userAPI.getProfile(),
          userAPI.getUserStats(),
          userAPI.getAvailableGroups()
        ]);
        
        setUser(userResponse.data);
        setUserStats(statsResponse.data);
        setAvailableGroups(groupsResponse.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(err.response?.data?.error || 'Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const fetchSavingsGoal = async () => {
      try {
        const res = await userAPI.getSavingsGoal();
        setSavingsGoal(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(err.response?.data?.error || 'Failed to load savings goal');
        }
      }
    };

    fetchSavingsGoal();
  }, []);

  // Prepare real data for widgets
  const summaryCards = [
    { label: "Total Balance", value: userStats?.walletBalance !== undefined ? `R${userStats.walletBalance.toLocaleString()}` : "-" },
    { label: "Contributions", value: userStats?.totalContributions !== undefined ? `R${userStats.totalContributions.toLocaleString()}` : "-" },
    { label: "Withdrawn", value: userStats?.totalWithdrawn !== undefined ? `R${userStats.totalWithdrawn.toLocaleString()}` : "R0" },
    { label: "Next Payout", value: userStats?.next_payout || "-" },
  ];

  const dailySummary = Array.isArray(userStats?.dailySummary) ? userStats.dailySummary : [];
  const weeklySummary = userStats?.weeklySummary ?? [];
  const monthlySummary = userStats?.monthlySummary ?? [];

  const chartData = {
    daily: {
      labels: dailySummary.map((c: any) => c.date),
      datasets: [{ label: "Contributions", data: dailySummary.map((c: any) => c.total), borderColor: "#6366f1", tension: 0.4 }]
    },
    weekly: {
      labels: weeklySummary.map((c: any) => c.week),
      datasets: [{ label: "Contributions", data: weeklySummary.map((c: any) => c.total), borderColor: "#6366f1", tension: 0.4 }]
    },
    monthly: {
      labels: monthlySummary.map((c: any) => c.month),
      datasets: [{ label: "Contributions", data: monthlySummary.map((c: any) => c.total), borderColor: "#6366f1", tension: 0.4 }]
    }
  };

  const recentContributions = userStats?.recentTransactions ?? [];
  const savingsGoalAPI = {
    get: () => userAPI.getSavingsGoal(),
    set: (data: { label: string; target: number }) => userAPI.setSavingsGoal(data),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen-minus-header">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-8">
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="text-2xl font-bold text-gray-800 mb-4">
          Welcome back, <span className="text-indigo-600">{user?.full_name || user?.name || "User"}!</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow p-5 flex flex-col items-center"
            >
              <div className="text-xs text-gray-500 mb-1">{card.label}</div>
              <div className="text-xl font-bold text-indigo-700">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid: Contribution Trend & Recent Contributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Contribution Trend */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col h-[340px]">
            <div className="font-semibold mb-2">Contribution Trend</div>
            {/* Tabs */}
            <div className="flex space-x-2 mb-4">
              {['daily', 'weekly', 'monthly'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                    trendTab === tab
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-gray-200 text-gray-600 hover:bg-indigo-100'
                  }`}
                  onClick={() => setTrendTab(tab as 'daily' | 'weekly' | 'monthly')}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {/* Chart */}
            <div className="flex-1 min-h-[180px]">
              <Line
                data={chartData[trendTab]}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
                height={180}
              />
            </div>
          </div>

          {/* Recent Contributions */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col h-[340px]">
            <div className="font-semibold mb-2">Recent Contributions</div>
            <div className="flex-1 overflow-y-auto max-h-72">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b">
                    <th className="py-2 text-left">User</th>
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Amount</th>
                    <th className="py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContributions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-400 py-4">
                        No recent contributions.
                      </td>
                    </tr>
                  ) : (
                    recentContributions.map((rc: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-indigo-50/40 transition group"
                      >
                        <td className="py-2 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                            {user?.full_name?.[0] || user?.name?.[0] || "U"}
                          </span>
                          <span>{user?.full_name || user?.name || "You"}</span>
                        </td>
                        <td className="py-2">{new Date(rc.date).toLocaleDateString()}</td>
                        <td className="py-2">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold
                            bg-green-100 text-green-700">
                            +R{rc.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-2">{rc.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Savings Goals & Invite Friends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Savings Goals */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-yellow-400" />
              <span className="font-semibold">Savings Goal</span>
              <button
                className="ml-auto text-xs text-indigo-600 hover:underline"
                onClick={() => setGoalModalOpen(true)}
              >
                {savingsGoal.label ? "Edit" : "Set Goal"}
              </button>
            </div>
            <div className="text-sm text-gray-500 mb-1">{savingsGoal.label || "No goal set"}</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all"
                style={{
                  width: savingsGoal.target
                    ? `${Math.min((savingsGoal.progress / savingsGoal.target) * 100, 100)}%`
                    : "0%",
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-400">
              {savingsGoal.target
                ? `${Math.round((savingsGoal.progress / savingsGoal.target) * 100)}% of R${savingsGoal.target.toLocaleString()}`
                : "Set a target to start saving!"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Saved: <span className="font-bold text-indigo-600">R{savingsGoal.progress.toLocaleString()}</span>
            </div>
          </div>

          {/* My Groups Quick Access */}
          <div
            className="bg-white rounded-xl shadow p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition"
            onClick={() => navigate('/dashboard/my-groups')}
          >
            <Users className="w-10 h-10 text-indigo-400 mb-2" />
            <div className="font-semibold mb-2">My Groups</div>
            <div className="text-xs text-gray-500 mb-2">
              View and manage your stokvel groups
            </div>
            <span className="text-indigo-600 font-bold">
              {userStats?.activeGroupsCount || 0} Active
            </span>
          </div>
        </div>
      </div>

      {goalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <div className="font-semibold mb-2">Set Savings Goal</div>
            <input
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Goal name (e.g. Holiday)"
              value={savingsGoal.label}
              onChange={e => setSavingsGoal(g => ({ ...g, label: e.target.value }))}
            />
            <input
              className="w-full border rounded px-3 py-2 mb-4"
              type="number"
              placeholder="Target amount"
              value={savingsGoal.target}
              onChange={e => setSavingsGoal(g => ({ ...g, target: Number(e.target.value) }))}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 bg-indigo-600 text-white rounded px-4 py-2"
                onClick={async () => {
                  if (!savingsGoal.label || !savingsGoal.target) {
                    alert("Please enter a goal name and target amount.");
                    return;
                  }
                  await savingsGoalAPI.set({ label: savingsGoal.label, target: savingsGoal.target });
                  const res = await savingsGoalAPI.get();
                  setSavingsGoal(res.data);
                  setGoalModalOpen(false);
                }}
              >
                Save
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2"
                onClick={() => setGoalModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 