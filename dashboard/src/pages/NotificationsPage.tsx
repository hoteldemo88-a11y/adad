import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import clsx from 'clsx';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  LOW_BATTERY: { icon: ExclamationTriangleIcon, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  DEVICE_OFFLINE: { icon: ExclamationCircleIcon, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  PERMISSION_REVOKED: { icon: ExclamationTriangleIcon, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  SYNC_ERROR: { icon: ExclamationCircleIcon, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  NEW_DEVICE: { icon: InformationCircleIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  PAIRING_SUCCESS: { icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
};

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [filterType, setFilterType] = useState<string>('');

  if (isLoading) return <div><PageHeader title="Notifications" /><LoadingSkeleton type="table" /></div>;

  const filtered = notifications?.filter((n) => !filterType || n.type === filterType) || [];
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Mark all read
            </button>
          )
        }
      />

      <div className="flex items-center gap-2 mb-6">
        {['', 'LOW_BATTERY', 'DEVICE_OFFLINE', 'SYNC_ERROR', 'NEW_DEVICE', 'PAIRING_SUCCESS'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterType === type ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700')}
          >
            {type === '' ? 'All' : type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No notifications" icon={BellIcon} />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif, idx) => {
            const config = typeConfig[notif.type] || typeConfig.NEW_DEVICE;
            const Icon = config.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={clsx('flex items-start gap-4 p-4 rounded-xl border transition-colors', notif.isRead ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800' : 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800')}
              >
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                  <Icon className={clsx('w-5 h-5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={clsx('text-sm font-medium', notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white')}>{notif.title}</h4>
                    {!notif.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead.mutate(notif.id)}
                        className="text-xs text-primary-600 hover:text-primary-500 font-medium"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
