import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircleIcon, ShieldCheckIcon, DevicePhoneMobileIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'devices', label: 'Devices', icon: DevicePhoneMobileIcon },
  { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon },
];

export default function SettingsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [syncInterval, setSyncInterval] = useState(30);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

  const handleSaveProfile = () => {
    toast.success('Profile updated');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) { toast.error('Fill all fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    toast.success('Password changed');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const inputClass = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800')}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 text-2xl font-bold">{name.charAt(0) || 'U'}</span>
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">Change Avatar</button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <button onClick={handleSaveProfile} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">Save Changes</button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
                  </div>
                  <button onClick={handleChangePassword} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">Change Password</button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add an extra layer of security to your account.</p>
                  <button className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">Enable 2FA</button>
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sync Settings</h3>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Data sync interval: <span className="text-primary-600 font-semibold">{syncInterval} seconds</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>5s (faster)</span>
                    <span>120s (battery saver)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-red-600">Danger Zone</h3>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">Pause All Monitoring</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-3">Temporarily stop all data collection from paired devices.</p>
                  <button
                    onClick={() => setShowPauseConfirm(true)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Pause Monitoring
                  </button>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
                  <h4 className="font-medium text-red-800 dark:text-red-400 mb-1">Delete Account</h4>
                  <p className="text-sm text-red-700 dark:text-red-500 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="This will permanently delete your account and all monitoring data. This action cannot be undone."
        confirmLabel="Delete Account"
        variant="danger"
        onConfirm={() => { toast.success('Account deleted'); setShowDeleteConfirm(false); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showPauseConfirm}
        title="Pause Monitoring"
        message="All data collection from paired devices will be paused. You can resume at any time."
        confirmLabel="Pause All"
        variant="warning"
        onConfirm={() => { toast.success('Monitoring paused'); setShowPauseConfirm(false); }}
        onCancel={() => setShowPauseConfirm(false)}
      />
    </div>
  );
}
