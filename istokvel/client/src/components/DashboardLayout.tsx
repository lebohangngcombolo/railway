import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  CreditCard,
  CheckCircle,
  Users,
  Gift,
  Briefcase,
  ShoppingBag,
  Menu,
  Bell,
  DollarSign
} from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../hooks/useAuth';
import notificationSound from '../assets/notification.mp3';
import logo2 from '../assets/iSTOKVEL2.png';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const sidebarItems = [
  { label: 'User Profile', path: '/dashboard/profile', icon: User },
  { label: 'Digital Wallet', path: '/dashboard/digital-wallet', icon: CreditCard },
  { label: 'KYC', path: '/dashboard/kyc', icon: CheckCircle },
  { label: 'Beneficiaries', path: '/dashboard/beneficiaries', icon: Users },
  { label: 'Refer & Earn', path: '/dashboard/refer', icon: Gift },
  { label: 'Stokvel Groups', path: '/dashboard/stokvel-groups', icon: Briefcase },
  { label: 'Request Payout', path: '/dashboard/claims/new', icon: DollarSign },
];


const topNavItems = [
  { label: 'Offers', path: '/dashboard/marketplace' },
  { label: 'Learning', path: '/learning' },
];

const SEEN_NOTIFICATIONS_KEY = 'seenNotificationIds';

const getSeenNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const setSeenNotificationIds = (ids: Set<number>) => {
  localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify(Array.from(ids)));
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevNotificationIds = useRef<Set<number>>(new Set());
  const soundPlayedThisSession = useRef(false); // <-- NEW
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [tab, setTab] = useState<'unread' | 'read'>('unread');

  // Define fetchNotifications at the top level of your component
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const newNotifications = Array.isArray(data) ? data : (data.notifications || []);
        const newIds = new Set(newNotifications.map(n => n.id));
        const unread = newNotifications.filter(n => !n.is_read);

        // --- Play sound only once per session if there are unread notifications on first load ---
        if (!soundPlayedThisSession.current) {
          if (unread.length > 0) {
            const audio = new Audio(notificationSound);
            audio.volume = 0.5;
            audio.play();
          }
          soundPlayedThisSession.current = true;
        } else {
          // On subsequent polls, play sound for truly new notifications
          const prevIds = prevNotificationIds.current;
          const isNew = newNotifications.some(n => !prevIds.has(n.id));
          if (prevIds.size && isNew) {
            const audio = new Audio(notificationSound);
            audio.volume = 0.5;
            audio.play();
          }
        }

        prevNotificationIds.current = newIds;
        setNotifications(newNotifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Use it in useEffect
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark as read/unread
  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    await fetch('/api/user/notifications/mark-as-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notification_ids: [id] })
    });
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAsUnread = async (id: number) => {
    // You need a backend endpoint for this, or allow toggling is_read in the DB.
    // For now, just update local state for demo:
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: false } : n)
    );
  };

  // Now you can also use it in markAllAsRead
  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/user/notifications/mark-as-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // empty means mark all
    });
    fetchNotifications(); // <-- This works now!
  };

  const unreadNotifications = (notifications ?? []).filter(n => !n.is_read);
  const readNotifications = (notifications ?? []).filter(n => n.is_read);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-dark-background">
      {/* --- TOP HEADER --- */}
      <header className="bg-white dark:bg-dark-card border-b dark:border-dark-border px-4 h-16 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-dark-border mx-4"></div>
          <div className="cursor-pointer flex items-center" onClick={() => navigate('/dashboard')}>
            <img src={logo2} alt="i-STOKVEL Logo" className="h-10 w-auto" />
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          {/* Top Nav Items */}
          <div className="flex items-center space-x-2">
            {topNavItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`text-sm font-medium px-3 py-2 rounded transition-colors ${
                  location.pathname.startsWith(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* Notifications Bell (Gmail-style) */}
          <div className="relative">
            <button
              className="relative notification-button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="h-6 w-6" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-2 py-0.5 font-bold">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="notification-dropdown absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg z-50">
                <div className="flex border-b">
                  <button
                    className={`flex-1 py-2 font-semibold ${tab === 'unread' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    onClick={() => setTab('unread')}
                  >
                    Unread ({unreadNotifications.length})
                  </button>
                  <button
                    className={`flex-1 py-2 font-semibold ${tab === 'read' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    onClick={() => setTab('read')}
                  >
                    Read ({readNotifications.length})
                  </button>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {(tab === 'unread' ? unreadNotifications : readNotifications).length === 0 ? (
                    <li className="p-4 text-gray-500 text-center">
                      {tab === 'unread' ? "No unread notifications" : "No read notifications"}
                    </li>
                  ) : (
                    (tab === 'unread' ? unreadNotifications : readNotifications).map((n) => (
                      <li
                        key={n.id}
                        className={`p-4 border-b last:border-0 flex items-start gap-2 ${!n.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{n.title}</div>
                          <div className="text-sm text-gray-600">{n.message}</div>
                          <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {tab === 'unread' ? (
                            <button
                              className="text-xs text-indigo-600 hover:underline"
                              onClick={() => markAsRead(n.id)}
                            >
                              Mark as read
                            </button>
                          ) : (
                            <button
                              className="text-xs text-gray-500 hover:underline"
                              onClick={() => markAsUnread(n.id)}
                            >
                              Mark as unread
                            </button>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
                <div className="p-2 border-t flex justify-end">
                  {tab === 'unread' && unreadNotifications.length > 0 && (
                    <button
                      className="text-xs text-indigo-600 hover:underline"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Profile Dropdown */}
          <ProfileDropdown user={user} />
        </div>
      </header>
      
      {/* --- MAIN BODY --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* --- SIDEBAR --- */}
        <aside
          className={`bg-[#23295A] min-h-screen w-64 flex flex-col py-6 px-2 transition-all duration-300 ease-in-out ${
            sidebarOpen ? '' : 'hidden'
          }`}
        >
          <nav className="flex-1 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.label}
                  className={`flex items-center w-full gap-3 px-4 py-2 rounded-lg transition font-medium
                    ${location.pathname.startsWith(item.path)
                      ? 'bg-[#3B4CCA] text-white font-bold shadow'
                      : 'text-white'}
                  `}
                  style={{
                    background: location.pathname.startsWith(item.path) ? undefined : 'transparent',
                    border: 'none',
                    boxShadow: location.pathname.startsWith(item.path) ? undefined : 'none',
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;