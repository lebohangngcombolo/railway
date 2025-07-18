import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup, verifyEmailCode, resendEmailVerificationCode, verifyPhoneCode, resendSmsVerificationCode } from '../utils/auth';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Shield, Lock, Zap, Clock } from 'lucide-react';

// Password strength types
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

// Password requirement interface
interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [userEmailForVerification, setUserEmailForVerification] = useState('');
  const [userPhoneForVerification, setUserPhoneForVerification] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone' | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  // Resend functionality states
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  // Password requirements
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (password: string) => password.length >= 8,
      met: false
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      test: (password: string) => /[A-Z]/.test(password),
      met: false
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      test: (password: string) => /[a-z]/.test(password),
      met: false
    },
    {
      id: 'number',
      label: 'One number',
      test: (password: string) => /\d/.test(password),
      met: false
    },
    {
      id: 'special',
      label: 'One special character',
      test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
      met: false
    }
  ]);

  // Calculate password strength
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (password.length === 0) return 'weak';
    
    let score = 0;
    
    // Length contribution
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety contribution
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Bonus for mixed case and numbers
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'fair';
    if (score <= 6) return 'good';
    if (score <= 8) return 'strong';
    return 'very-strong';
  };

  // Update password requirements
  const updatePasswordRequirements = (password: string) => {
    const updatedRequirements = passwordRequirements.map(req => ({
      ...req,
      met: req.test(password)
    }));
    setPasswordRequirements(updatedRequirements);
  };

  // Get strength info with modern styling
  const getStrengthInfo = (strength: PasswordStrength) => {
    switch (strength) {
      case 'weak':
        return { 
          color: 'text-red-600', 
          bgColor: 'bg-red-500', 
          borderColor: 'border-red-200',
          bgLight: 'bg-red-50',
          label: 'Too weak', 
          progress: 20,
          icon: <XCircle className="w-4 h-4" />
        };
      case 'fair':
        return { 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-500', 
          borderColor: 'border-orange-200',
          bgLight: 'bg-orange-50',
          label: 'Fair', 
          progress: 40,
          icon: <AlertCircle className="w-4 h-4" />
        };
      case 'good':
        return { 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-500', 
          borderColor: 'border-yellow-200',
          bgLight: 'bg-yellow-50',
          label: 'Good', 
          progress: 60,
          icon: <Shield className="w-4 h-4" />
        };
      case 'strong':
        return { 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-500', 
          borderColor: 'border-blue-200',
          bgLight: 'bg-blue-50',
          label: 'Strong', 
          progress: 80,
          icon: <Lock className="w-4 h-4" />
        };
      case 'very-strong':
        return { 
          color: 'text-green-600', 
          bgColor: 'bg-green-500', 
          borderColor: 'border-green-200',
          bgLight: 'bg-green-50',
          label: 'Very strong', 
          progress: 100,
          icon: <Zap className="w-4 h-4" />
        };
      default:
        return { 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-500', 
          borderColor: 'border-gray-200',
          bgLight: 'bg-gray-50',
          label: 'Weak', 
          progress: 0,
          icon: <XCircle className="w-4 h-4" />
        };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update password strength and requirements when password changes
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
      updatePasswordRequirements(value);
      setShowPasswordStrength(value.length > 0);
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (passwordStrength === 'weak') {
      newErrors.password = 'Please choose a stronger password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // Handle paste event - distribute the pasted value across boxes
      const pastedValue = numericValue.slice(0, 6); // Take only first 6 digits
      const newOtp = [...otp];
      
      // Fill current and subsequent boxes with pasted digits
      for (let i = 0; i < pastedValue.length && index + i < 6; i++) {
        newOtp[index + i] = pastedValue[i];
      }
      
      setOtp(newOtp);
      
      // Focus the next empty box or the last box
      const nextIndex = Math.min(index + pastedValue.length, 5);
      const nextInput = document.querySelector(`input[name="otp-${nextIndex}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    } else {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);
      
      // Move to next input if a digit was entered
      if (numericValue && index < 5) {
        const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
    
    setOtpError('');
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    // Handle paste event
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
        if (numericText.length > 0) {
          const newOtp = [...otp];
          for (let i = 0; i < numericText.length && i < 6; i++) {
            newOtp[i] = numericText[i];
          }
          setOtp(newOtp);
          
          // Focus the next empty box or the last box
          const nextIndex = Math.min(numericText.length, 5);
          const nextInput = document.querySelector(`input[name="otp-${nextIndex}"]`) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
          }
        }
      }).catch(() => {
        // Fallback if clipboard API fails
        console.log('Clipboard paste failed');
      });
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numericText = pastedText.replace(/[^0-9]/g, '').slice(0, 6);
    
    if (numericText.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < numericText.length && i < 6; i++) {
        newOtp[i] = numericText[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty box or the last box
      const nextIndex = Math.min(numericText.length, 5);
      const nextInput = document.querySelector(`input[name="otp-${nextIndex}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signup(formData);
      
      if (result.success) {
        setUserEmailForVerification(formData.email);
        setUserPhoneForVerification(formData.phoneNumber);
        setVerificationMethod('email');
        setShowOtpVerification(true);
        setSuccessMessage('Account created successfully! Please check your email for verification code.');
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.error || 'Signup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent, code?: string) => {
    e.preventDefault();
    
    const verificationCode = code || otp.join('');
    
    if (verificationCode.length !== 6) {
      setOtpError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      let result;
      if (verificationMethod === 'email') {
        result = await verifyEmailCode(userEmailForVerification, verificationCode);
      } else if (verificationMethod === 'phone') {
        result = await verifyPhoneCode(userPhoneForVerification, verificationCode);
      }

      if (result.success) {
        toast.success('Account verified successfully!');
        navigate('/login');
      } else {
        setOtpError(result.message);
      }
    } catch (error: any) {
      setOtpError(error.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setOtpError('');
    setSuccessMessage('');
    setResendMessage('');

    try {
      let result;
      if (verificationMethod === 'email') {
        result = await resendEmailVerificationCode(userEmailForVerification);
      } else if (verificationMethod === 'phone') {
        result = await resendSmsVerificationCode(userPhoneForVerification);
      }
      
      if (result.success) {
        // Show success message
        setResendMessage('New verification code sent successfully!');
        setOtp(['', '', '', '', '', '']);
        
        // Start countdown timer (30 seconds)
        setResendCountdown(30);
        const timer = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setResendMessage('');
        }, 3000);
        
        toast.success('New verification code sent!');
      } else {
        toast.error(result.message);
        setOtpError(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to resend code. Please try again.';
      toast.error(errorMessage);
      setOtpError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    setShowTransition(true);
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  const strengthInfo = getStrengthInfo(passwordStrength);
  const allRequirementsMet = passwordRequirements.every(req => req.met);

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
        <div className="absolute top-10 right-10 w-24 h-32 opacity-10 animate-bounce">
          <div className="w-full h-full bg-blue-600 rounded-full border-4 border-blue-800 relative">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-blue-800 rounded-full"></div>
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
                {showOtpVerification
                  ? verificationMethod === 'email'
                    ? 'Verify Your Email'
                    : 'Verify Your Phone Number'
                  : 'Create Your Account'}
              </h2>
              <p className="text-sm text-gray-600">
                {showOtpVerification 
                  ? verificationMethod === 'email'
                    ? `Enter the 6-digit code sent to ${userEmailForVerification}`
                    : `Enter the 6-digit code sent to ${userPhoneForVerification}`
                  : 'Join i-STOKVEL and start your savings journey'}
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {showOtpVerification ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      name={`otp-${index}`}
                      maxLength={6} // Allow paste of full OTP
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder=""
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                
                {otpError && (
                  <p className="text-sm text-red-600 text-center">{otpError}</p>
                )}

                {/* Success message for resend */}
                {resendMessage && (
                  <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">{resendMessage}</p>
                  </div>
                )}

                <div className="text-center text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    className={`font-medium transition-all duration-200 ${
                      resendCountdown > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-700 hover:underline'
                    }`}
                    onClick={handleResendCode}
                    disabled={isLoading || resendCountdown > 0}
                  >
                    {resendCountdown > 0 ? (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Resend in {resendCountdown}s</span>
                      </span>
                    ) : (
                      'Resend'
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? 'Verifying...' : 'Verify Account'}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 text-sm border ${
                        errors.fullName ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                    )}
                  </div>

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
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 text-sm border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 text-sm border ${
                      errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="+27 71 234 5678"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 pr-12 text-sm border ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Modern Password Strength Indicator */}
                    {showPasswordStrength && (
                      <div className="mt-3 space-y-3">
                        {/* Strength Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">Password strength</span>
                            <div className="flex items-center gap-1.5">
                              {strengthInfo.icon}
                              <span className={`text-xs font-semibold ${strengthInfo.color}`}>
                                {strengthInfo.label}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ease-out ${strengthInfo.bgColor}`}
                              style={{ width: `${strengthInfo.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Requirements List */}
                        <div className="space-y-2">
                          {passwordRequirements.map((requirement) => (
                            <div key={requirement.id} className="flex items-center space-x-2">
                              {requirement.met ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                              )}
                              <span className={`text-xs ${requirement.met ? 'text-green-600' : 'text-gray-500'}`}>
                                {requirement.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 pr-12 text-sm border ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Password match indicator */}
                    {formData.confirmPassword && (
                      <div className="mt-1 flex items-center space-x-1">
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !allRequirementsMet}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                { <GoogleLoginButton /> }
              </form>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Signup;