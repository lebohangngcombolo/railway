import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
// You might add imports for API calls later, e.g.:
// import { requestPasswordReset } from '../utils/auth';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showTransition, setShowTransition] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // In a real application, you would call your backend API here
    // try {
    //   const result = await requestPasswordReset(email);
    //   if (result.success) {
    //     setMessage('If an account with that email exists, a password reset link has been sent.');
    //     setEmail(''); // Clear the input field on success
    //   } else {
    //     // Handle specific error messages from the backend if needed
    //     setError(result.message || 'Failed to request password reset.');
    //   }
    // } catch (err) {
    //   console.error('Password reset request error:', err);
    //   setError('An error occurred while requesting password reset.');
    // } finally {
    //   setLoading(false);
    // }

    // --- Placeholder for demonstration ---
    console.log(`Password reset requested for: ${email}`);
    // Simulate a successful request after a short delay
    setTimeout(() => {
      setLoading(false);
      setMessage('If an account with that email exists, a password reset link has been sent.');
      setEmail(''); // Clear the input field on success
    }, 1500);
    // --- End Placeholder ---
  };

  const handleBackToHome = () => {
    setShowTransition(true);
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      <PageTransition show={showTransition} />

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
              Forgot Your Password?
            </h2>
            <p className="text-sm text-gray-600">
              Enter your email address below and we'll send you a link to reset your password.
            </p>
          </div>

          {message && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 