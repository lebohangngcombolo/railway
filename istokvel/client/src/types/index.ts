// Create a new types file
export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  separator?: boolean;
}

export interface UserData {
  id: number;
  email: string;
  name: string;
  created_at: string;
  profilePicture?: string;
  role: 'admin' | 'member';
  is_verified?: boolean;
  is_suspended?: boolean;
  group?: string;
  total_contributions?: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountType: string;
  };
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  provider?: string;
  logo?: string;
  tags?: string[];
  verified?: boolean;
  buttonText?: string;
  buttonLink?: string;
} 