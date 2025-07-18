import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../utils/auth';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import GoogleLoginButton from '../components/GoogleLoginButton'; // Assuming you have a GoogleLoginButton component

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [show2FALogin, setShow2FALogin] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login...');
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.two_factor_required) {
        setTwoFAUserId(result.user_id);
        setShow2FALogin(true);
        setLoading(false);
        toast('Enter the code sent to your email or phone.');
        return;
      }
      
      if (result.success) {
        console.log('Login successful, redirecting to:', result.redirectTo);
        setLoading(false);
        navigate(result.redirectTo);
      } else {
        console.error('Login failed:', result.message);
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 422) {
        setError('Please check your input and try again');
      } else if (!err.response) {
        setError('Network error. Please check your connection');
      } else {
        setError(err.message || 'An error occurred during login');
      }
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    setShowTransition(true);
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  const handleVerify2FALogin = async () => {
    setIsVerifying(true);
    try {
      const response = await api.post('/api/auth/verify-2fa-login', {
        user_id: twoFAUserId,
        otp_code: otp,
      });
      // Store token and user info as you do on normal login
      localStorage.setItem('token', response.data.access_token);
      // Optionally fetch user info and redirect
      toast.success('2FA login successful!');
      setShow2FALogin(false);
      // Redirect to dashboard or wherever
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <PageTransition show={showTransition}>
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Coins Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, index) => (
          <div
            key={index}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full opacity-20 transform rotate-45" />
          </div>
        ))}
      </div>

      {/* Animated Savings Jar */}
      <div className="absolute top-10 right-10 w-32 h-40 animate-bounce-slow">
        <div className="relative w-full h-full">
          <div className="absolute bottom-0 w-full h-3/4 bg-blue-100 rounded-b-3xl border-2 border-blue-300">
            <div className="absolute inset-0 bg-blue-200 opacity-50 rounded-b-3xl animate-fill" />
          </div>
          <div className="absolute top-0 w-full h-1/4 bg-blue-200 rounded-t-3xl border-2 border-blue-300" />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center h-screen p-4">
        <div className="w-full max-w-[600px] bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6">
          <div className="mb-4 text-center">
            <button
              onClick={handleBackToHome}
              className="absolute top-4 left-4 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-600">
              Please enter your details to sign in
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-gray-700">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                onClick={() => navigate('/phone-auth')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M17.5 2C19.9853 2 22 4.01472 22 6.5V17.5C22 19.9853 19.9853 22 17.5 22H6.5C4.01472 22 2 19.9853 2 17.5V6.5C2 4.01472 4.01472 2 6.5 2H17.5ZM17.5 3.5H6.5C4.84315 3.5 3.5 4.84315 3.5 6.5V17.5C3.5 19.1569 4.84315 20.5 6.5 20.5H17.5C19.1569 20.5 20.5 19.1569 20.5 17.5V6.5C20.5 4.84315 19.1569 3.5 17.5 3.5ZM12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11C8 8.79086 9.79086 7 12 7ZM12 8.5C10.6193 8.5 9.5 9.61929 9.5 11C9.5 12.3807 10.6193 13.5 12 13.5C13.3807 13.5 14.5 12.3807 14.5 11C14.5 9.61929 13.3807 8.5 12 8.5ZM6.5 17.5C6.5 16.1193 7.61929 15 9 15H15C16.3807 15 17.5 16.1193 17.5 17.5V18C17.5 18.8284 16.8284 19.5 16 19.5H8C7.17157 19.5 6.5 18.8284 6.5 18V17.5ZM9 16.5C8.17157 16.5 7.5 17.1716 7.5 18V18H16.5V18C16.5 17.1716 15.8284 16.5 15 16.5H9Z" fill="currentColor"/>
                </svg>
                Continue with Phone
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </div>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          { <GoogleLoginButton /> }
        </div>
      </div>

      {show2FALogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Two-Factor Authentication</h2>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            />
            <button
              onClick={handleVerify2FALogin}
              className="w-full bg-blue-600 text-white py-2 rounded"
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              onClick={() => setShow2FALogin(false)}
              className="w-full mt-2 text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default Login;