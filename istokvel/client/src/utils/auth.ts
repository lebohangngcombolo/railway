import { authAPI } from '../services/api';
import api from '../services/api';

interface User {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  idNumber?: string;
  role?: string;
  is_verified?: boolean;
  profile_picture?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export const signup = async (userData: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}) => {
  try {
    console.log('Sending registration data:', userData);
    
    const response = await authAPI.register({
      full_name: userData.fullName,
      email: userData.email,
      password: userData.password,
      phone: userData.phoneNumber,
      confirm_password: userData.password
    });
    
    console.log('Registration response:', response.data);
    
    // Check for successful registration
    if (response.data && (response.data.message?.includes('successfully') || response.data.user_id)) {
      return { 
        success: true, 
        message: 'Account created successfully',
        user_id: response.data.user_id,
        user: response.data.user
      };
    }
    
    return {
      success: false,
      message: response.data?.error || 'Signup failed'
    };
  } catch (error: any) {
    console.error('Signup error details:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.error || 'Signup failed. Please try again.'
    };
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await authAPI.login(email, password);

    // 2FA required branch
    if (response.data.two_factor_required) {
      return {
        two_factor_required: true,
        user_id: response.data.user_id,
        message: response.data.message || '2FA required',
      };
    }

    // Normal login branch
    const { access_token, user } = response.data;
    // Map profile_picture to profilePicture
    const mappedUser = {
      ...user,
      profilePicture: user.profile_picture,
    };
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(mappedUser));
    const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return {
      success: true,
      message: 'Login successful',
      redirectTo,
      user: mappedUser,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Login failed. Please check your credentials.',
    };
  }
};

export const logout = () => {
  try {
    // Clear auth state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Attempt to call logout endpoint
    authAPI.post('/api/auth/logout').catch(error => {
      console.error('Logout API call failed:', error);
    });
    
    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if there's an error
    window.location.href = '/login';
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Validate token structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const tokenData = JSON.parse(atob(parts[1]));
    const expirationTime = tokenData.exp * 1000;
    const currentTime = Date.now();
    
    // Check if token is expired or about to expire
    if (expirationTime <= currentTime) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
    
    // SECURITY FIX: Check if user is verified
    const user = getCurrentUser();
    if (!user || !user.is_verified) {
      // Clear invalid authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    // SECURITY FIX: Return null if user is not verified
    if (!user.is_verified) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
};

export const hasRole = (role: 'admin' | 'member'): boolean => {
  const user = getCurrentUser();
  return user?.role === role;
};

export const requireRole = (role: 'admin' | 'member'): boolean => {
  if (!isAuthenticated()) {
    return false;
  }
  return hasRole(role);
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || 'member';
};

export const verifyEmailCode = async (email: string, verificationCode: string) => {
  try {
    // Clean the verification code by removing any spaces
    const cleanCode = verificationCode.replace(/\s/g, '');
    const response = await authAPI.verifyEmail(email, cleanCode);
    return {
      success: true,
      message: response.data.message || 'Account verified successfully'
    };
  } catch (error: any) {
    console.error('Verification error:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Verification failed'
    };
  }
};

export const resendEmailVerificationCode = async (email: string) => {
  try {
    const response = await authAPI.resendVerificationCode(email);
    return {
      success: true,
      message: response.data.message || 'New verification code sent'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.error || 'Failed to resend code'
    };
  }
};

export const verifyPhoneCode = async (phone: string, verificationCode: string) => {
  try {
    const response = await authAPI.verifyPhone(phone, verificationCode);
    return response.data; // This will include access_token and user if backend sends them
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.error || 'Verification failed'
    };
  }
};

export const resendSmsVerificationCode = async (phone: string) => {
  try {
    const response = await authAPI.resendSmsVerificationCode(phone);
    return {
      success: true,
      message: response.data.message || 'New verification code sent'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.error || 'Failed to resend code'
    };
  }
};

export async function sendSmsVerificationCode(phone: string) {
  // Use the axios instance directly
  return api.post('/api/auth/send-otp', { phone })
    .then(res => res.data)
    .catch(err => ({ success: false, message: err?.response?.data?.message || 'Failed to send code' }));
}
