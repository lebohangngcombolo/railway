import { motion } from 'framer-motion';
import {
  Users,
  CreditCard,
  Calendar,
  Bell,
  TrendingUp,
  Clock
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { memberNavItems, marketplaceNavItem } from '../../navItems';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useEffect, useState } from 'react';

const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const res = await api.get('/api/dashboard/stats');
        setMemberData(res.data);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <DashboardLayout
      user={{
        name: "Member User",
        email: "member@example.com",
        role: "member"
      }}
      sidebarNavItems={memberNavItems}
      marketplaceNavItem={marketplaceNavItem}
    >
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-600">Here's your stokvel activity overview.</p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stokvel Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold mb-4">My Stokvel Info</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Group Name</span>
                <span className="font-medium">{memberData.stokvelInfo?.groupName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">
                  {new Date(memberData.stokvelInfo?.joinDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Monthly Contribution</span>
                <span className="font-medium">R {memberData.stokvelInfo?.monthlyContribution}</span>
              </div>
            </div>
          </motion.div>

          {/* Contribution Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold mb-4">Contribution Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium text-blue-600">Paid</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Next Payment</span>
                <span className="font-medium">
                  {new Date(memberData.contributionStatus?.nextPayment).toLocaleDateString()}
                </span>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Request Withdrawal
              </button>
            </div>
          </motion.div>

          {/* Announcements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold mb-4">Announcements</h2>
            <div className="space-y-4">
              {memberData.announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">{announcement.title}</span>
                  </div>
                  <p className="text-sm text-gray-600">{announcement.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(announcement.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {memberData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;
