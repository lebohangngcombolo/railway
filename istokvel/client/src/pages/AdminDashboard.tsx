import { useEffect, useState } from "react";
import {
  Users, Group, AlertCircle, CheckCircle, UserPlus, Plus, Activity, TrendingUp, CreditCard, ShieldCheck
} from "lucide-react";
import { adminAPI, userAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [todo, setTodo] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [adminRes, statsRes, todoRes, activityRes, annRes] = await Promise.all([
          userAPI.getProfile(),
          adminAPI.getStats(),
          adminAPI.getTodo(),
          adminAPI.getActivity(),
          adminAPI.getAnnouncements(),
        ]);
        setAdmin(adminRes.data);
        setStats(statsRes.data);
        setTodo(todoRes.data);
        setActivity(activityRes.data);
        setAnnouncements(annRes.data);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Large Welcome Message */}
      <div className="mb-8">
        <div className="text-2xl md:text-3xl font-bold text-indigo-800 leading-tight">
          Welcome back, {admin?.full_name || admin?.name || "Admin"}!
        </div>
        <div className="text-lg text-gray-500 mt-2">
          {admin?.role ? `Role: ${admin.role}` : "Admin"}
        </div>
      </div>

      {/* System Status */}
      <div className="flex items-center gap-4 mb-8">
        <ShieldCheck className="text-green-500" />
        <span className="text-green-700 font-medium">All systems operational</span>
      </div>

      {/* To-Do Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <div>
            <div className="font-semibold">{todo?.pendingKYC || 0} KYC to approve</div>
            <button className="text-xs text-indigo-600 hover:underline" onClick={() => navigate('/admin/kyc')}>Review</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <CreditCard className="w-6 h-6 text-purple-500" />
          <div>
            <div className="font-semibold">{todo?.overduePayouts || 0} payouts overdue</div>
            <button className="text-xs text-indigo-600 hover:underline" onClick={() => navigate('/admin/payouts')}>Process</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <Group className="w-6 h-6 text-red-500" />
          <div>
            <div className="font-semibold">{todo?.flaggedGroups || 0} flagged groups</div>
            <button className="text-xs text-indigo-600 hover:underline" onClick={() => navigate('/admin/groups')}>View</button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <CreditCard className="w-6 h-6 text-blue-500" />
          <div>
            <div className="text-2xl font-semibold">R{stats?.totalFunds?.toLocaleString() || "0"}</div>
            <div className="text-gray-500 text-sm">Total Funds</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <Group className="w-6 h-6 text-green-500" />
          <div>
            <div className="text-2xl font-semibold">{stats?.activeGroups || 0}</div>
            <div className="text-gray-500 text-sm">Active Groups</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <Users className="w-6 h-6 text-indigo-500" />
          <div>
            <div className="text-2xl font-semibold">{stats?.newMembers || 0}</div>
            <div className="text-gray-500 text-sm">New Members</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <TrendingUp className="w-6 h-6 text-purple-500" />
          <div>
            <div className="text-2xl font-semibold">{stats?.payoutsDue || 0}</div>
            <div className="text-gray-500 text-sm">Payouts Due</div>
          </div>
        </div>
      </div>

      {/* Quick Create */}
      <div className="mb-8 flex gap-4 flex-wrap">
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          onClick={() => navigate('/admin/groups/new')}>
          <Plus /> New Group
        </button>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          onClick={() => navigate('/admin/members/add')}>
          <UserPlus /> Add Member
        </button>
        <button className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-600 transition"
          onClick={() => navigate('/admin/kyc')}>
          <CheckCircle /> Approve KYC
        </button>
        <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition"
          onClick={() => navigate('/admin/payouts')}>
          <CreditCard /> Payout Now
        </button>
      </div>

      {/* Live Feed */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Live Activity</h2>
        <div className="bg-white rounded-xl shadow-sm p-4 max-h-64 overflow-y-auto">
          {activity.length === 0 ? (
            <div className="text-gray-400 text-sm">No recent activity.</div>
          ) : (
            activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                <Activity className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-gray-800">{a.text}</div>
                  <div className="text-xs text-gray-400">{a.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Milestones & Goals */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Milestones & Goals</h2>
        <div className="bg-white rounded-xl shadow-sm p-4">
          {/* Example: */}
          <div className="mb-2">{stats?.goalMessage || "80% to group savings goal!"}</div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div className="bg-indigo-500 h-3 rounded-full transition-all"
              style={{ width: stats?.goalProgress ? `${stats.goalProgress}%` : "80%" }}></div>
          </div>
          <div className="text-xs text-gray-400">{stats?.nextPayoutMessage || "2 days to next payout"}</div>
        </div>
      </div>

      {/* Announcements/News */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Announcements</h2>
        <div className="bg-white rounded-xl shadow-sm p-4">
          {announcements.length === 0 ? (
            <div className="text-gray-400 text-sm">No announcements.</div>
          ) : (
            announcements.map((a, i) => (
              <div key={i} className="mb-2">
                <div className="font-semibold">{a.title}</div>
                <div className="text-gray-600 text-sm">{a.body}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
