import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as authLogout, isAuthenticated } from '../utils/auth';
import { authAPI } from '../services/api';

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  is_verified?: boolean;
  // Add other user properties as needed
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      if (isAuthenticated()) {
        // Fetch from backend
        const response = await authAPI.getCurrentUser();
        const user = response.data;
        const mappedUser = {
          ...user,
          profilePicture: user.profile_picture,
        };
        setUser(mappedUser);
        localStorage.setItem('user', JSON.stringify(mappedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    authLogout();
    navigate('/login');
  }, [navigate]);

  return {
    user,
    loading,
    isAuthenticated: !!user && user.is_verified,
    fetchUser,
    logout
  };
}; 