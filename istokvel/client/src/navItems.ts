import {
  User,
  CreditCard,
  CheckCircle,
  Users,
  Briefcase,
  ShoppingBag,
  LayoutDashboard,
  UserPlus,
  DollarSign,
  FileText,
  BarChart2,
  Calendar,
  MessageSquare,
  Shield,
  Activity
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  separator?: boolean;
}

export const userNavItems: NavItem[] = [
  { id: 'user', label: 'User', icon: User, path: '/dashboard/profile' },
  { id: 'digital-wallet', label: 'Digital Wallet', icon: CreditCard, path: '/dashboard/digital-wallet' },
  { id: 'kyc', label: 'KYC', icon: CheckCircle, path: '/dashboard/kyc' },
  { id: 'beneficiaries', label: 'Beneficiaries', icon: Users, path: '/dashboard/beneficiaries' },
  { id: 'refer', label: 'Refer & Earn', icon: Users, path: '/dashboard/refer' },
  { id: 'groups', label: 'Stokvel Groups', icon: Briefcase, path: '/dashboard/groups' },
];

export const memberNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity, path: '/dashboard' },
  { id: 'wallet', label: 'My Wallet', icon: CreditCard, path: '/wallet' },
  { id: 'groups', label: 'My Groups', icon: Users, path: '/groups' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' }
];

export const adminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2, path: '/admin/dashboard' },
  { id: 'users', label: 'Manage Users', icon: Users, path: '/admin/users' },
  { id: 'groups', label: 'Group Management', icon: Briefcase, path: '/admin/groups' },
  { id: 'transactions', label: 'Transactions', icon: DollarSign, path: '/admin/transactions' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  { id: 'polls', label: 'Polls', icon: BarChart2, path: '/admin/polls' },
  { id: 'meetings', label: 'Meetings', icon: Calendar, path: '/admin/meetings' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/admin/messages' },
  { id: 'settings', label: 'Settings', icon: Shield, path: '/admin/settings' },
];

export const marketplaceNavItem: NavItem = {
  id: 'marketplace',
  label: 'Marketplace',
  icon: ShoppingBag,
  path: '/dashboard/marketplace'
}; 