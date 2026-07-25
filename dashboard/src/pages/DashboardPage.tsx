import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DevicePhoneMobileIcon,
  UserGroupIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
  BellIcon,
  WifiIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageHeader from '../components/PageHeader';
import { useDashboard } from '../hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Overview of monitored activity" />
        <LoadingSkeleton type="stat" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 dark:text-white font-medium">Failed to load dashboard</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const devices = data?.devices || [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of all monitored devices" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Devices"
          value={summary?.totalDevices || 0}
          icon={DevicePhoneMobileIcon}
          gradient="from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Total Contacts"
          value={summary?.totalContacts || 0}
          icon={UserGroupIcon}
          gradient="from-green-500 to-emerald-600"
        />
        <StatCard
          title="Calls Today"
          value={summary?.todayCalls || 0}
          icon={PhoneIcon}
          gradient="from-purple-500 to-pink-600"
        />
        <StatCard
          title="SMS Today"
          value={summary?.todaySms || 0}
          icon={ChatBubbleLeftEllipsisIcon}
          gradient="from-orange-500 to-red-600"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <WifiIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.onlineDevices || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <SignalSlashIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.offlineDevices || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Offline</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.lowBatteryDevices || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Low Battery</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.unreadNotifications || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Unread Alerts</p>
          </div>
        </motion.div>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Devices</h3>
      {devices.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <DevicePhoneMobileIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No devices paired yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {devices.map((device, idx) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/devices/${device.id}`)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{device.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{device.model}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={clsx('w-2 h-2 rounded-full', device.isOnline ? 'bg-green-500' : 'bg-gray-400')} />
                  <span className={clsx('text-xs font-medium', device.isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')}>
                    {device.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Battery</span>
                  <span className="text-gray-900 dark:text-white">{device.batteryLevel}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', device.batteryLevel > 50 ? 'bg-green-500' : device.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${device.batteryLevel}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Storage</span>
                  <span className="text-gray-900 dark:text-white">
                    {device.storagePercentage}% used
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', device.storagePercentage > 80 ? 'bg-red-500' : 'bg-primary-500')}
                    style={{ width: `${device.storagePercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last sync</span>
                  <span className="text-gray-900 dark:text-white">
                    {device.lastSyncAt ? formatDistanceToNow(new Date(device.lastSyncAt), { addSuffix: true }) : 'Never'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Today's Activity</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{device.todayActivity.totalCalls}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Calls</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{device.todayActivity.totalSms}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SMS</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {device.isMonitoringActive ? (
                        <span className="text-green-600 dark:text-green-400">Active</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">Paused</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {data?.lastUpdated && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-2">
          Last updated: {formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
