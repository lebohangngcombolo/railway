import { useNavigate } from 'react-router-dom';
import { User, Bell, Settings, LogOut, Camera, X, Upload, Image, Sparkles, Wand2, Moon, Sun } from 'lucide-react';
import Button from './Button';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '../hooks/useAuth';

interface ProfileDropdownProps {
  user: {
    name?: string;
    email?: string;
    profilePicture?: string;
  } | null;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user }) => {
  if (!user) {
    return <div>Loading...</div>;
  }

  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'edit' | 'complete'>('select');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filters = [
    { name: 'none', label: 'Original' },
    { name: 'vintage', label: 'Vintage' },
    { name: 'grayscale', label: 'Grayscale' },
    { name: 'warm', label: 'Warm' },
    { name: 'cool', label: 'Cool' },
    { name: 'dramatic', label: 'Dramatic' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfilePictureClick = () => {
    setShowUploadModal(true);
    setUploadStep('select');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setUploadStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationToggle = (type: 'email' | 'push') => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/user/profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.profile_picture) {
        setUploadStep('complete');
        await fetchUser();
      }
    } catch (err) {
      // Optionally show an error message here
    } finally {
      setIsUploading(false);
    }
  };

  const UploadModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-[480px] max-w-[90vw]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Profile Picture Studio
          </h3>
          <button
            onClick={() => setShowUploadModal(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {uploadStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Drop your image here</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </motion.div>
          )}

          {uploadStep === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="relative aspect-square w-full max-w-[300px] mx-auto">
                <img
                  src={previewUrl || ''}
                  alt="Preview"
                  className={`w-full h-full rounded-xl object-cover ${selectedFilter !== 'none' ? `filter-${selectedFilter}` : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Choose a Filter</h4>
                <div className="grid grid-cols-3 gap-3">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setSelectedFilter(filter.name)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFilter === filter.name
                          ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setUploadStep('select')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Apply Changes"}
                </button>
              </div>
            </motion.div>
          )}

          {uploadStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Updated!</h3>
              <p className="text-gray-500 mb-6">Your new profile picture has been saved successfully.</p>
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  const backendUrl = "http://localhost:5001";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button with Hover Effect */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <>
          {user.profilePicture ? (
            <img
              src={user.profilePicture && user.profilePicture.startsWith('http') 
                ? user.profilePicture 
                : backendUrl + user.profilePicture}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500"
              onError={e => { e.currentTarget.src = '/default-avatar.png'; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
          )}
        </>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg py-2 z-50"
          >
            {/* Profile Header with Enhanced UI */}
            <div className="px-4 py-3 border-b">
              <div className="flex items-center space-x-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="relative group cursor-pointer"
                  onClick={handleProfilePictureClick}
                >
                  <>
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture.startsWith('http') ? user.profilePicture : backendUrl + user.profilePicture}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </>
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Notifications Settings */}
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Notifications</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Email Notifications</span>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle('email')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Push Notifications</span>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle('push')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.push ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Theme</h3>
              <div className="flex items-center justify-around p-1 rounded-lg bg-gray-100 dark:bg-dark-background">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-colors ${
                    theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-colors ${
                    theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-500'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-2">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      {showUploadModal && <UploadModal />}
    </div>
  );
};

export default ProfileDropdown;