import api from './api';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_verified: boolean;
  profile_picture?: string;
}

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    const { access_token, user } = response.data;
    
    // Store token and user info
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify({
      id: user.id,
      name: user.full_name || user.name || 'User',
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'member',
      is_verified: user.is_verified || false,
      profile_picture: user.profile_picture || null
    }));
    
    // Return the expected format for the Login component
    return {
      success: true,
      message: 'Login successful',
      user: user,
      redirectTo: user.role === 'admin' ? '/admin-dashboard' : '/dashboard'
    };
  } catch (error: any) {
    console.error('Login error:', error);
    // Return error in the expected format instead of throwing
    return {
      success: false,
      message: error.response?.data?.error || 'Login failed. Please check your credentials.'
    };
  }
};

export const register = async (userData: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  // ... other fields
}) => {
  const response = await api.post('/api/auth/register', userData);
  const { access_token, user } = response.data;
  
  // Store token and user info
  localStorage.setItem('token', access_token);
  localStorage.setItem('user', JSON.stringify(user));
  
  return user;
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found');
      return null;
    }

    const response = await api.get('/api/user/profile');
    console.log('Current user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}; 