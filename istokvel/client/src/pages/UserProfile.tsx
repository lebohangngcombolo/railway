import React, { useState, useEffect } from 'react';
import {
  User as UserIcon, // Alias to avoid conflict if User is used elsewhere
  Shield,
  BellRing,
  Lock,
  Trash2,
  ChevronRight, // Use ChevronRight for the "View" button icon
  Mail, // for email notification toggle
  Bell, // for push notification toggle
  ShieldCheck,
  LogOut as LogoutIcon,
  Monitor,
  Download,
  FileText,
  ExternalLink,
  Key
} from 'lucide-react'; // Import necessary icons
import moment from 'moment'; // Import moment for date formatting
import toast from 'react-hot-toast';
// Import navigation items from the new file
import { userNavItems, marketplaceNavItem } from '../navItems';
import { authAPI, securityAPI, userAPI } from '../services/api';
import api from '../services/api'; // <-- Make sure this is here
import { getCurrentUser } from '../utils/auth'; // Add this import




const mockSessions = [
  { id: 1, device: 'Windows 10 - Chrome', location: 'Cape Town, South Africa', time: '2023-10-27T10:00:00Z', current: true },
  { id: 2, device: 'Android Phone - Chrome', location: 'Johannesburg, South Africa', time: '2023-10-26T18:30:00Z', current: false },
];

// Define the tabs for the internal horizontal navigation
const userProfileTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'your-details', label: 'My details' },
  { id: 'account-security', label: 'Account & security' },
  { id: 'communication', label: 'Communication' },
  { id: 'privacy', label: 'Privacy' },
];

// Component for a single information card
interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-dark-card shadow rounded-lg p-6 flex flex-col justify-between text-left w-full transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      <div className="flex-shrink-0 mb-4">
        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-grow mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <span className="self-start flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300">
        View
        <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </button>
  );
};

const UserProfile: React.FC = () => {
  // State to manage the active horizontal tab within UserProfile
  const [activeTab, setActiveTab] = useState('overview');

   // State to manage user details for editing - Initialized with empty strings
   const [userDetails, setUserDetails] = useState({
     name: '', // Start with empty string
     phone: '', // Start with empty string
     dateOfBirth: '', // Start with empty string
     gender: '', // Start with empty string
     employmentStatus: '', // Added employmentStatus
   });

    // State to manage account & security settings (placeholders)
   const [securitySettings, setSecuritySettings] = useState({
     twoFactorEnabled: false,
     currentPassword: '',
     newPassword: '',
   });

    // State to manage communication settings
   const [communicationSettings, setCommunicationSettings] = useState({
     emailAnnouncements: true,
     emailStokvelUpdates: true,
     emailMarketplaceOffers: false,
     pushAnnouncements: true,
     pushStokvelUpdates: true,
     pushMarketplaceOffers: false,
     // Add more categories as needed
   });

    // State to manage privacy settings
   const [privacySettings, setPrivacySettings] = useState({
     dataForPersonalization: true,
     dataForAnalytics: true,
     dataForThirdParties: false, // Be cautious with defaults for data sharing
   });

  const [userEmail, setUserEmail] = useState<string>('');

  // Get current date for registration date display
  const currentRegistrationDate = moment().format('YYYY-MM-DD');

  // Add useEffect to fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        const userData = response.data;

        // Set all user details from the API response
        setUserEmail(userData.email);
        setUserDetails({
          name: userData.name || '',
          phone: userData.phone || '',
          // Format date for the input field, which expects 'YYYY-MM-DD'
          dateOfBirth: userData.date_of_birth ? moment(userData.date_of_birth).format('YYYY-MM-DD') : '',
          gender: userData.gender || '',
          employmentStatus: userData.employment_status || '',
        });
        setSecuritySettings(prev => ({
          ...prev,
          twoFactorEnabled: userData.two_factor_enabled
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
        toast.error('Could not load your profile data.');
      }
    };

    fetchUserData();
  }, []); // This empty dependency array means it only runs once on component mount

  // Handlers for card actions (placeholders)
  const handleViewDetails = () => {
    setActiveTab('your-details'); // Switch to 'My details' tab
  };

  const handleViewAccountSecurity = () => {
     setActiveTab('account-security');
  };

  const handleViewCommunication = () => {
     setActiveTab('communication');
  };

  const handleViewPrivacy = () => {
     setActiveTab('privacy');
  };

   // Handler for input changes
   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     const { name, value } = e.target;
     setUserDetails(prevDetails => ({
       ...prevDetails,
       [name]: value
     }));
   };

    // Handler for input changes in Account & Security
    const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const { name, value } = e.target;
       setSecuritySettings(prevSettings => ({
          ...prevSettings,
          [name]: value,
       }));
    };

     // Handler for communication toggle changes
    const handleCommunicationToggle = async (settingName: keyof typeof communicationSettings) => {
      const newSettings = {
        ...communicationSettings,
        [settingName]: !communicationSettings[settingName]
      };
      setCommunicationSettings(newSettings);

      // Map frontend keys to backend keys
      const backendMapping = {
        emailAnnouncements: 'email_announcements',
        emailStokvelUpdates: 'email_stokvel_updates',
        emailMarketplaceOffers: 'email_marketplace_offers',
        pushAnnouncements: 'push_announcements',
        pushStokvelUpdates: 'push_stokvel_updates',
        pushMarketplaceOffers: 'push_marketplace_offers',
      };

      // Prepare payload for backend
      const payload: any = {};
      Object.keys(newSettings).forEach(key => {
        payload[backendMapping[key as keyof typeof backendMapping]] = newSettings[key as keyof typeof newSettings];
      });

      await fetch('/api/user/communication', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    };

    // Handler for privacy toggle changes
    const handlePrivacyToggle = (settingName: keyof typeof privacySettings) => {
       setPrivacySettings(prevSettings => ({
          ...prevSettings,
          [settingName]: !prevSettings[settingName],
       }));
       console.log(`${settingName} toggled. New value: ${!privacySettings[settingName]}`);
       // In a real app, you would send this update to your backend
    };

    // Placeholder for saving profile changes
   const handleSaveDetails = async () => {
     try {
       // Prepare the data to send (match backend field names if different)
       const payload = {
         name: userDetails.name,
         phone: userDetails.phone,
         date_of_birth: userDetails.dateOfBirth,
         gender: userDetails.gender,
         employment_status: userDetails.employmentStatus,
       };

       // 1. Send the update to the backend
       await userAPI.updateProfile(payload);
       toast.success('Profile updated successfully!');

       // 2. Refetch the user's data to ensure UI is in sync
       const response = await userAPI.getProfile();
       setUserDetails(prev => ({
         ...prev,
         name: response.data.name !== undefined && response.data.name !== null ? response.data.name : prev.name,
         phone: response.data.phone !== undefined && response.data.phone !== null ? response.data.phone : prev.phone,
         dateOfBirth: response.data.date_of_birth
           ? moment(response.data.date_of_birth).format('YYYY-MM-DD')
           : prev.dateOfBirth,
         gender: response.data.gender !== undefined && response.data.gender !== null ? response.data.gender : prev.gender,
         employmentStatus: response.data.employment_status !== undefined && response.data.employment_status !== null
           ? response.data.employment_status
           : prev.employmentStatus,
       }));

       const updatedUser = {
         ...getCurrentUser(), // import from utils/auth
         name: response.data.name !== undefined && response.data.name !== null ? response.data.name : userDetails.name,
         phone: response.data.phone !== undefined && response.data.phone !== null ? response.data.phone : userDetails.phone,
         date_of_birth: response.data.date_of_birth
           ? moment(response.data.date_of_birth).format('YYYY-MM-DD')
           : userDetails.dateOfBirth,
         gender: response.data.gender !== undefined && response.data.gender !== null ? response.data.gender : userDetails.gender,
         employment_status: response.data.employment_status !== undefined && response.data.employment_status !== null
           ? response.data.employment_status
           : userDetails.employmentStatus,
         profilePicture: response.data.profile_picture || getCurrentUser().profilePicture || response.data.profilePicture,
       };
       localStorage.setItem('user', JSON.stringify(updatedUser));

     } catch (err: any) {
       toast.error(
         err.response?.data?.error ||
         err.response?.data?.message ||
         'Failed to update profile.'
       );
     }
   };

    // Placeholder handler for changing password
   const handleChangePassword = async () => {
     try {
       const { currentPassword, newPassword } = securitySettings;
       if (!currentPassword || !newPassword) {
         toast.error('Please enter both current and new password.');
         return;
       }
       const response = await securityAPI.changePassword({
         current_password: currentPassword,
         new_password: newPassword,
       });
       toast.success(response.data.message || 'Password changed successfully!');
      setSecuritySettings(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
     } catch (err: any) {
       toast.error(
         err.response?.data?.error ||
         err.response?.data?.message ||
         'Failed to change password.'
       );
     }
   };

    // Placeholder handler for toggling 2FA
   const handleToggleTwoFactor = async () => {
     try {
       const response = await securityAPI.toggle2FA();
       setSecuritySettings(prev => ({
         ...prev,
         twoFactorEnabled: response.data.two_factor_enabled
       }));
       toast.success(response.data.message || 'Two-Factor Authentication updated!');
     } catch (err: any) {
       toast.error(
         err.response?.data?.error ||
         err.response?.data?.message ||
         'Failed to update Two-Factor Authentication.'
       );
     }
   };

    // Placeholder handler for logging out a specific session
   const handleLogoutSession = async (sessionId: number) => {
     try {
       await api.post(`/api/user/session/${sessionId}/logout`);
       toast.success('Session logged out!');
       fetchSessions(); // Refresh after logout
     } catch (err: any) {
       toast.error(err.response?.data?.error || 'Failed to log out session');
     }
   };

    // Placeholder handler for requesting data download
   const handleDownloadData = () => {
      alert('Request data download functionality not implemented yet.');
      // Implement data export/download logic
   };

    // Placeholder handler for deleting account
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [deletePassword, setDeletePassword] = useState('');
   const [isDeleting, setIsDeleting] = useState(false);

   const handleDeleteAccount = async () => {
     setIsDeleting(true);
     try {
       await api.delete('/api/user/account', {
         data: { password: deletePassword }
       });
       toast.success('Account deleted successfully!');
       localStorage.removeItem('token');
       window.location.href = '/';
     } catch (err: any) {
       toast.error(err.response?.data?.error || 'Failed to delete account');
     } finally {
       setIsDeleting(false);
       setShowDeleteModal(false);
       setDeletePassword('');
     }
   };

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'email' | 'sms'>('email');
  const [otp, setOtp] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleStart2FA = async () => {
    try {
      await securityAPI.start2FA({ method: twoFAMethod });
      setShow2FAModal(true);
      toast.success(`OTP sent via ${twoFAMethod.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleVerify2FA = async () => {
    setIsVerifying(true);
    try {
      await securityAPI.verify2FA({ otp_code: otp });
      toast.success('Two-factor authentication enabled!');
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: true
      }));
      setShow2FAModal(false);
      setOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend2FAOtp = async () => {
    setIsResending(true);
    try {
      await securityAPI.start2FA({ method: twoFAMethod });
      toast.success(`OTP resent via ${twoFAMethod.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const handleDisable2FA = async () => {
    setIsDisabling2FA(true);
    try {
      await securityAPI.disable2FA({ password: disable2FAPassword });
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: false
      }));
      toast.success('Two-factor authentication disabled!');
      setShowDisable2FAModal(false);
      setDisable2FAPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    console.log('Fetching sessions...');
    try {
      const response = await api.get('/api/user/sessions');
      setSessions(response.data);
    } catch (err) {
      toast.error('Failed to load sessions');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutAllSessions = async () => {
    try {
      await api.post('/api/user/sessions/logout_all');
      toast.success('Logged out from all other sessions!');
      fetchSessions(); // Refresh the session list
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to log out all sessions');
    }
  };

  // Helper to filter unique sessions by user_agent and ip_address
  const getUniqueSessions = (sessions) => {
    const seen = new Set();
    return sessions.filter(session => {
      const key = `${session.user_agent}-${session.ip_address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon={UserIcon}
              title="My details"
              description="Your profile information"
              onClick={handleViewDetails}
            />
            <InfoCard
              icon={Lock}
              title="Account & security"
              description="Password and active sessions"
              onClick={handleViewAccountSecurity}
            />
             <InfoCard
              icon={Mail} // Using Mail for Communication as in the image
              title="Communication"
              description="Email and SMS communication"
              onClick={handleViewCommunication}
            />
             <InfoCard
              icon={Shield} // Using Shield for Privacy as in the image
              title="Privacy"
              description="T&Cs and your data"
              onClick={handleViewPrivacy}
            />
          </div>
        );
      case 'your-details': // This case handles the content for 'My details'
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Details</h2>
            <div className="bg-white p-6 rounded-lg shadow">
                 {/* Full Name */}
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.name} // Controlled component
                      onChange={handleInputChange}
                      placeholder="Enter your full name" // Added placeholder
                    />
                 </div>

                 {/* Email Address (Read-only) */}
                 <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
                      value={userEmail} // Use the real email from state
                      readOnly
                    />
                 </div>

                {/* Phone Number */}
                <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.phone} // Controlled component
                      onChange={handleInputChange}
                      placeholder="Enter your phone number" // Added placeholder
                    />
                 </div>

                {/* Date of Birth */}
                <div className="mb-4">
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.dateOfBirth} // Controlled component
                      onChange={handleInputChange}
                      // Placeholder for date input is often handled by browser UI
                    />
                 </div>

                 {/* Gender */}
                <div className="mb-4">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                    {/* Using a select dropdown for Gender is common */}
                    <select
                      id="gender"
                      name="gender"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.gender} // Controlled component
                      onChange={handleInputChange}
                    >
                      <option value="" disabled hidden>Select Gender</option> {/* Placeholder option */}
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                 </div>

                 {/* Employment Status - Added Field */}
                 <div className="mb-4">
                    <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">Employment Status</label>
                    <select
                      id="employmentStatus"
                      name="employmentStatus" // Added name attribute
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.employmentStatus} // Controlled component
                      onChange={handleInputChange}
                    >
                       <option value="" disabled hidden>Select Employment Status</option> {/* Placeholder */}
                       <option value="Full time">Full time</option>
                       <option value="Part time">Part time</option>
                       <option value="Work at home">Work at home</option>
                       <option value="Self-employed">Self-employed</option>
                       <option value="Unemployed">Unemployed</option>
                       <option value="Retired">Retired</option>
                       <option value="Student">Student</option>
                    </select>
                 </div>

                 {/* Registration Date (Read-only) */}
                 <div className="mb-4">
                    <label htmlFor="registrationDate" className="block text-sm font-medium text-gray-700">Registration Date</label>
                    <input
                      type="text"
                      id="registrationDate"
                      name="registrationDate"
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
                      value={currentRegistrationDate} // Display the current date
                      readOnly
                    />
                 </div>

                 {/* Save Changes Button - Updated Styling */}
                 <div className="mt-6">
                    <button
                      onClick={handleSaveDetails}
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                    >
                      Save Changes
                    </button>
                 </div>

            </div>
          </div>
        );
       case 'account-security':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Account & Security</h2>
             <div className="bg-white p-6 rounded-lg shadow space-y-6"> {/* Added spacing between sections */}

                 {/* Change Password Section - Updated Structure */}
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Key className="w-6 h-6 text-gray-600" />
                       <span>Change Password</span>
                    </h3>
                   <p className="text-gray-600 mb-4">Update your password to keep your account secure.</p>

                    {/* Current Password Field */}
                    <div className="mb-4">
                       <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                       <input
                         type="password" // Use type="password" for masking
                         id="currentPassword"
                         name="currentPassword"
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                         value={securitySettings.currentPassword} // Controlled component
                         onChange={handleSecurityInputChange} // Use security input handler
                         placeholder="Enter your current password" // Added placeholder
                       />
                    </div>

                     {/* New Password Field */}
                    <div className="mb-6"> {/* Increased bottom margin */}
                       <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                       <input
                         type="password" // Use type="password" for masking
                         id="newPassword"
                         name="newPassword"
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={securitySettings.newPassword} // Controlled component
                         onChange={handleSecurityInputChange} // Use security input handler
                         placeholder="Enter your new password" // Added placeholder
                       />
                    </div>

                   {/* Change Password Button */}
                   <button
                     onClick={handleChangePassword}
                     className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95"
                   >
                     Change Password
                   </button>
                 </div>

                 {/* Two-Factor Authentication (2FA) Section */}
                 <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <span>Two-Factor Authentication (2FA)</span>
                       {securitySettings.twoFactorEnabled ? (
                         <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">ENABLED</span>
                       ) : (
                         <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">DISABLED</span>
                       )}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <div className="flex gap-4">
                       <button
                        onClick={() => setShow2FAModal(true)}
                        className={`px-6 py-2 rounded-md font-semibold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
                          ${securitySettings.twoFactorEnabled
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'}`}
                        disabled={securitySettings.twoFactorEnabled}
                      >
                        Enable 2FA
                      </button>
                      <button
                        onClick={() => setShowDisable2FAModal(true)}
                        className={`px-6 py-2 rounded-md font-semibold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
                          ${!securitySettings.twoFactorEnabled
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'}`}
                        disabled={!securitySettings.twoFactorEnabled}
                      >
                        Disable 2FA
                       </button>
                    </div>
                    {/* Enable 2FA Modal */}
                    {show2FAModal && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                          <h2 className="text-lg font-bold mb-4">Enable Two-Factor Authentication</h2>
                          {/* Method selection */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Choose 2FA Method:</label>
                            <div className="flex gap-4">
                              <label>
                                <input
                                  type="radio"
                                  name="twoFAMethod"
                                  value="email"
                                  checked={twoFAMethod === 'email'}
                                  onChange={() => setTwoFAMethod('email')}
                                  disabled={isSendingOtp}
                                />
                                <span className="ml-2">Email</span>
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name="twoFAMethod"
                                  value="sms"
                                  checked={twoFAMethod === 'sms'}
                                  onChange={() => setTwoFAMethod('sms')}
                                  disabled={isSendingOtp}
                                />
                                <span className="ml-2">SMS</span>
                              </label>
                            </div>
                          </div>
                          {/* OTP sent message */}
                          {otpSentMessage && (
                            <p className="mb-4 text-green-600">{otpSentMessage}</p>
                          )}
                          {/* OTP input */}
                          <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="w-full border rounded p-2 mb-4"
                          />
                          {/* Resend OTP */}
                          <button
                            onClick={() => sendOtp(twoFAMethod)}
                            className="text-blue-600 hover:underline mb-4"
                            disabled={isSendingOtp}
                          >
                            {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                          </button>
                          {/* Submit */}
                          <button
                            onClick={handleVerify2FA}
                            className="w-full bg-green-600 text-white py-2 rounded mt-2"
                            disabled={isVerifying}
                          >
                            {isVerifying ? 'Verifying...' : 'Enable 2FA'}
                          </button>
                          <button
                            onClick={() => setShow2FAModal(false)}
                            className="w-full mt-2 text-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Disable 2FA Modal */}
                    {showDisable2FAModal && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                          <h2 className="text-lg font-bold mb-4">Disable Two-Factor Authentication</h2>
                          <p className="mb-4 text-gray-600">For your security, please enter your password to disable 2FA.</p>
                          <input
                            type="password"
                            placeholder="Enter your password"
                            value={disable2FAPassword}
                            onChange={e => setDisable2FAPassword(e.target.value)}
                            className="w-full border rounded p-2 mb-4"
                          />
                          <button
                            onClick={handleDisable2FA}
                            className="w-full bg-red-600 text-white py-2 rounded"
                            disabled={isDisabling2FA}
                          >
                            {isDisabling2FA ? 'Disabling...' : 'Disable 2FA'}
                          </button>
                          <button
                            onClick={() => setShowDisable2FAModal(false)}
                            className="w-full mt-2 text-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Active Sessions Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Monitor className="w-6 h-6 text-gray-600" />
                       <span>Active Sessions</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Review where you are currently logged in.</p>
                    {getUniqueSessions(sessions)
                      .filter(s => s.is_active)
                      .slice(0, 2) // Only show up to 2 unique sessions
                      .map(session => (
                        <div key={session.id} className="py-3 flex justify-between items-center">
                                <div>
                            <p className="font-medium text-gray-800">
                              {session.user_agent || 'Unknown Device'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {session.ip_address || 'Unknown Location'} - {moment(session.login_time).format('YYYY-MM-DD HH:mm')}
                            </p>
                                </div>
                        </div>
                      ))}
                    <div className="mt-4">
                                   <button
                        onClick={handleLogoutAllSessions}
                        className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold shadow-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                   >
                        Logout All Other Sessions
                                   </button>
                    </div>
                 </div>

                 {/* Account Deletion Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <LogoutIcon className="w-6 h-6 text-red-600" />
                       <span>Delete Account</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Permanently close your account and remove your data.</p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold shadow-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95"
                    >
                      Delete Account
                    </button>
                 </div>

             </div>
          </div>
        );
        case 'communication':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Communication</h2>
             <div className="bg-white p-6 rounded-lg shadow space-y-6"> {/* Added spacing between sections */}

                 {/* Email Notifications Section */}
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Mail className="w-6 h-6 text-gray-600" />
                       <span>Email Notifications</span>
                    </h3>
                   <p className="text-gray-600 mb-4">Manage the types of emails you receive.</p>

                    {/* Email Notification Toggles */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">General Announcements</span>
                          <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.emailAnnouncements}
                                   onChange={() => handleCommunicationToggle('emailAnnouncements')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Stokvel Updates</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.emailStokvelUpdates}
                                   onChange={() => handleCommunicationToggle('emailStokvelUpdates')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Marketplace Offers</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.emailMarketplaceOffers}
                                   onChange={() => handleCommunicationToggle('emailMarketplaceOffers')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    </div>
                 </div>

                 {/* Push Notifications Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Bell className="w-6 h-6 text-gray-600" />
                       <span>Push Notifications</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Manage the types of push notifications you receive.</p>

                     {/* Push Notification Toggles */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">General Announcements</span>
                          <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.pushAnnouncements}
                                   onChange={() => handleCommunicationToggle('pushAnnouncements')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Stokvel Updates</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.pushStokvelUpdates}
                                   onChange={() => handleCommunicationToggle('pushStokvelUpdates')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Marketplace Offers</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.pushMarketplaceOffers}
                                   onChange={() => handleCommunicationToggle('pushMarketplaceOffers')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    </div>
                 </div>

             </div>
          </div>
        );
         case 'privacy':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Privacy</h2>
             <div className="bg-white p-6 rounded-lg shadow space-y-6"> {/* Added spacing between sections */}

                 {/* Data Usage Preferences Section */}
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Shield className="w-6 h-6 text-gray-600" /> {/* Using Shield icon */}
                       <span>Data Usage Preferences</span>
                    </h3>
                   <p className="text-gray-600 mb-4">Control how your data is used to personalize your experience and improve our services.</p>

                    {/* Data Usage Toggles */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Use data for personalization (e.g., tailored offers)</span>
                          <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={privacySettings.dataForPersonalization}
                                   onChange={() => handlePrivacyToggle('dataForPersonalization')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Use data for analytics and service improvement (anonymized)</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={privacySettings.dataForAnalytics}
                                   onChange={() => handlePrivacyToggle('dataForAnalytics')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Allow data sharing with select third parties</span> {/* Be very clear about what this means */}
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={privacySettings.dataForThirdParties}
                                   onChange={() => handlePrivacyToggle('dataForThirdParties')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    </div>
                 </div>

                 {/* Data Access Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Download className="w-6 h-6 text-gray-600" /> {/* Using Download icon */}
                       <span>Access Your Data</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Request a copy of the personal data we hold about you.</p>
                    <button
                      onClick={handleDownloadData}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95"
                    >
                      Download Data
                    </button>
                 </div>

                 {/* Legal Documents Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <FileText className="w-6 h-6 text-gray-600" /> {/* Using FileText icon */}
                       <span>Legal Information</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Review our policies and terms of service.</p>
                    <div className="space-y-2">
                       <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200 space-x-1">
                         <span>Privacy Policy</span>
                         <ExternalLink className="w-4 h-4" /> {/* Using ExternalLink icon */}
                       </a>
                        <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200 space-x-1">
                         <span>Terms of Service</span>
                         <ExternalLink className="w-4 h-4" />
                       </a>
                    </div>
                 </div>

             </div>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (show2FAModal) {
      sendOtp(twoFAMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show2FAModal, twoFAMethod]);

  const sendOtp = async (method: 'email' | 'sms') => {
    setIsSendingOtp(true);
    setOtpSentMessage('');
    try {
      await securityAPI.start2FA({ method });
      setOtpSentMessage(
        `OTP has been sent to your ${method === 'email' ? 'email' : 'phone'}`
      );
      toast.success(`OTP sent via ${method.toUpperCase()}`);
    } catch (err: any) {
      setOtpSentMessage('Failed to send OTP. Please try again.');
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'communication') {
      fetchCommunicationSettings();
    }
  }, [activeTab]);

  const fetchCommunicationSettings = async () => {
    const res = await fetch('/api/user/communication', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setCommunicationSettings({
      emailAnnouncements: data.email_announcements,
      emailStokvelUpdates: data.email_stokvel_updates,
      emailMarketplaceOffers: data.email_marketplace_offers,
      pushAnnouncements: data.push_announcements,
      pushStokvelUpdates: data.push_stokvel_updates,
      pushMarketplaceOffers: data.push_marketplace_offers,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">User Profile</h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
            Manage your account details, security, and preferences.
          </p>
        </div>

        {/* Horizontal Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {userProfileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-lg font-medium focus:outline-none transition-colors
                  ${activeTab === tab.id
                    ? 'text-blue-700 border-b-4 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600 border-b-4 border-transparent'
                  }`}
                style={{
                  background: 'none',
                  boxShadow: 'none',
                  borderRadius: 0,
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dynamic Content Area */}
        <div>
          {renderContent()}
        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-red-600">Delete Account</h2>
            <p className="mb-4 text-gray-600">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>
            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              disabled={isDeleting}
            />
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 text-white py-2 rounded mb-2"
              disabled={isDeleting || !deletePassword}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full text-gray-500"
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 