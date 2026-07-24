import { motion } from 'framer-motion';
import {
  DevicePhoneMobileIcon,
  UserGroupIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageHeader from '../components/PageHeader';
import { useDashboard } from '../hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Overview of monitored activity" />
        <LoadingSkeleton type="stat" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <LoadingSkeleton type="chart" />
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

  const stats = data?.stats;
  const device = data?.device;

  const pieData = {
    labels: ['Incoming', 'Outgoing', 'Missed'],
    datasets: [
      {
        data: [data?.callDistribution?.incoming || 0, data?.callDistribution?.outgoing || 0, data?.callDistribution?.missed || 0],
        backgroundColor: ['#22c55e', '#3b82f6', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Screen Time (min)',
        data: data?.screenTimeByHour || Array(24).fill(0),
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
    ],
  };

  const doughnutData = {
    labels: data?.appUsage?.map((a) => a.name) || [],
    datasets: [
      {
        data: data?.appUsage?.map((a) => a.hours) || [],
        backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9ca3af', font: { size: 12 } } } },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } },
    },
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of monitored activity" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Battery Level"
          value={device ? `${device.batteryLevel}%` : 'N/A'}
          icon={DevicePhoneMobileIcon}
          gradient="from-green-500 to-emerald-600"
        />
        <StatCard
          title="Total Contacts"
          value={stats?.totalContacts || 0}
          icon={UserGroupIcon}
          gradient="from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Calls Today"
          value={stats?.callsToday || 0}
          icon={PhoneIcon}
          gradient="from-purple-500 to-pink-600"
        />
        <StatCard
          title="SMS Today"
          value={stats?.smsToday || 0}
          icon={ChatBubbleLeftEllipsisIcon}
          gradient="from-orange-500 to-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {device && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Device Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <span className={clsx('flex items-center gap-1.5 text-sm font-medium', device.isOnline ? 'text-green-600' : 'text-gray-500')}>
                  <span className={clsx('w-2 h-2 rounded-full', device.isOnline ? 'bg-green-500' : 'bg-gray-400')} />
                  {device.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Model</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{device.model}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Sync</span>
                <span className="text-sm text-gray-900 dark:text-white">{formatDistanceToNow(new Date(device.lastSync), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Network</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{device.networkType}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Storage</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {((device.storageUsed / device.storageTotal) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all', device.storageUsed / device.storageTotal > 0.8 ? 'bg-red-500' : 'bg-primary-500')}
                    style={{ width: `${(device.storageUsed / device.storageTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Call Distribution</h3>
          <div className="h-52">
            <Pie data={pieData} options={chartOptions as any} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">App Usage</h3>
          <div className="h-52">
            <Doughnut data={doughnutData} options={chartOptions as any} />
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Screen Time (24h)</h3>
        <div className="h-64">
          <Bar data={barData} options={barOptions as any} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {data?.recentActivity?.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{item.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
            {(!data?.recentActivity || data.recentActivity.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Permission Status</h3>
          <div className="space-y-3">
            {data?.permissions?.map((perm) => (
              <div key={perm.name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-900 dark:text-white">{perm.name}</span>
                {perm.granted ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <CheckCircleIcon className="w-4 h-4" /> Granted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <XCircleIcon className="w-4 h-4" /> Denied
                  </span>
                )}
              </div>
            ))}
            {(!data?.permissions || data.permissions.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No permission data</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
