import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Moon, 
  Sun, 
  Save, 
  Menu,
  Eye,
  EyeOff,
  Shield,
  Trash2
} from 'lucide-react';
import * as usersApi from '../services/users';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import AppSidebar from '../components/Sidebar';

export default function Settings() {
  const { user, setUser } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    bio: '',
    avatar: '',
    email: '',
    phone: ''
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    isProfilePublic: true,
    allowFollowRequests: true,
    showOnlineStatus: true
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true
  });

  // Load user profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { user: profileData } = await usersApi.getMyProfile();
      
      setProfileForm({
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        email: profileData.email || '',
        phone: profileData.phone || ''
      });
      
      // Load privacy settings if available
      if (profileData.privacySettings) {
        setPrivacySettings(profileData.privacySettings);
      }
      
      // Load notification settings if available
      if (profileData.notificationSettings) {
        setNotificationSettings(profileData.notificationSettings);
      }
      
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      const { user: updatedUser } = await usersApi.updateProfile({
        bio: profileForm.bio,
        avatar: profileForm.avatar,
        email: profileForm.email,
        phone: profileForm.phone
      });
      
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyUpdate = async (key, value) => {
    try {
      const newSettings = { ...privacySettings, [key]: value };
      setPrivacySettings(newSettings);
      
      await usersApi.updateProfile({
        privacySettings: newSettings
      });
      
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update privacy settings');
      console.error('Error updating privacy:', error);
      // Revert on error
      setPrivacySettings(privacySettings);
    }
  };

  const handleNotificationUpdate = async (key, value) => {
    try {
      const newSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(newSettings);
      
      await usersApi.updateProfile({
        notificationSettings: newSettings
      });
      
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
      console.error('Error updating notifications:', error);
      // Revert on error
      setNotificationSettings(notificationSettings);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <AppSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <AppSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Settings</h1>
            <Menu 
              className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer" 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Settings</h1>

            <div className="space-y-8">
              {/* Profile Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0">
                        <Avatar 
                          name={user?.anonymousName || 'User'} 
                          src={profileForm.avatar} 
                          size={80} 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Profile Picture
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 dark:file:bg-blue-900
                            file:text-blue-700 dark:file:text-blue-300
                            hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Max file size: 5MB. Supported formats: JPG, PNG, GIF
                        </p>
                      </div>
                    </div>

                    {/* Avatar URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Avatar URL (Alternative)
                      </label>
                      <input
                        type="url"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 
                          bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell people about yourself..."
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                          bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {profileForm.bio.length}/500 characters
                      </p>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                            bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                            bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleProfileSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md 
                          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {isDark ? <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${isDark ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${isDark ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy & Security</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Profile Visibility */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Public Profile</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Make your profile visible to everyone</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyUpdate('isProfilePublic', !privacySettings.isProfilePublic)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${privacySettings.isProfilePublic ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${privacySettings.isProfilePublic ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Follow Requests */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Allow Follow Requests</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Let people send you follow requests</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyUpdate('allowFollowRequests', !privacySettings.allowFollowRequests)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${privacySettings.allowFollowRequests ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${privacySettings.allowFollowRequests ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Online Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show Online Status</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Let others see when you're online</p>
                      </div>
                      <button
                        onClick={() => handlePrivacyUpdate('showOnlineStatus', !privacySettings.showOnlineStatus)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${privacySettings.showOnlineStatus ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${privacySettings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => handleNotificationUpdate('emailNotifications', !notificationSettings.emailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device</p>
                      </div>
                      <button
                        onClick={() => handleNotificationUpdate('pushNotifications', !notificationSettings.pushNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Like Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Like Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone likes your posts</p>
                      </div>
                      <button
                        onClick={() => handleNotificationUpdate('likeNotifications', !notificationSettings.likeNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${notificationSettings.likeNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${notificationSettings.likeNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Comment Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Comment Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone comments on your posts</p>
                      </div>
                      <button
                        onClick={() => handleNotificationUpdate('commentNotifications', !notificationSettings.commentNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${notificationSettings.commentNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${notificationSettings.commentNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Follow Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Follow Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone follows you</p>
                      </div>
                      <button
                        onClick={() => handleNotificationUpdate('followNotifications', !notificationSettings.followNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${notificationSettings.followNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${notificationSettings.followNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Management</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Change Password */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
                      </div>
                      <button 
                        onClick={() => toast.info('Password change functionality coming soon!')}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                      </div>
                      <button 
                        onClick={() => toast.info('2FA setup coming soon!')}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Enable 2FA
                      </button>
                    </div>

                    {/* Export Data */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Data</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of your data</p>
                      </div>
                      <button 
                        onClick={() => toast.info('Data export functionality coming soon!')}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Export Data
                      </button>
                    </div>

                    {/* Delete Account */}
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-red-900 dark:text-red-300">Delete Account</h3>
                        <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account and all data</p>
                      </div>
                      <button 
                        onClick={() => toast.error('Account deletion requires confirmation via email')}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* App Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">About</h2>
                  
                  <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>App Version</span>
                      <span className="font-mono">1.0.0</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Last Updated</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => toast.info('Terms of Service')}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Terms of Service
                        </button>
                        <button 
                          onClick={() => toast.info('Privacy Policy')}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Privacy Policy
                        </button>
                        <button 
                          onClick={() => toast.info('Support Center')}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}