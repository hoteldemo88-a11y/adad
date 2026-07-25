import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  WifiIcon,
  SignalSlashIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useDevice, usePauseDevice } from '../hooks/useDevices';
import { useCalls } from '../hooks/useCalls';
import { useSms } from '../hooks/useSms';
import { useContacts } from '../hooks/useContacts';

type Tab = 'overview' | 'calls' | 'sms' | 'contacts';

const typeBadge: Record<string, { bg: string; text: string; label: string }> = {
  INCOMING: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Incoming' },
  OUTGOING: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Outgoing' },
  MISSED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Missed' },
};

const smsTypeBadge: Record<string, { bg: string; text: string; label: string }> = {
  INCOMING: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Received' },
  OUTGOING: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Sent' },
};

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: device, isLoading: deviceLoading } = useDevice(id || '');
  const pauseDevice = usePauseDevice();

  const [callsPage, setCallsPage] = useState(1);
  const [callsSearch, setCallsSearch] = useState('');
  const [callsTypeFilter, setCallsTypeFilter] = useState('');
  const { data: callsData, isLoading: callsLoading } = useCalls({
    page: callsPage,
    deviceId: id,
    search: callsSearch,
    type: callsTypeFilter,
  });

  const [smsPage, setSmsPage] = useState(1);
  const [smsSearch, setSmsSearch] = useState('');
  const [smsTypeFilter, setSmsTypeFilter] = useState('');
  const { data: smsData, isLoading: smsLoading } = useSms({
    page: smsPage,
    deviceId: id,
    search: smsSearch,
    type: smsTypeFilter,
  });

  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSearch, setContactsSearch] = useState('');
  const { data: contactsData, isLoading: contactsLoading } = useContacts({
    page: contactsPage,
    deviceId: id,
    search: contactsSearch,
    limit: 50,
  });

  if (deviceLoading) {
    return (
      <div>
        <PageHeader title="Device Details" breadcrumbs={[{ label: 'Devices', path: '/devices' }, { label: 'Loading...' }]} />
        <LoadingSkeleton type="stat" />
        <div className="mt-6"><LoadingSkeleton type="table" /></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-900 dark:text-white font-medium">Device not found</p>
          <button onClick={() => navigate('/devices')} className="mt-3 text-sm text-primary-600 hover:underline">Back to Devices</button>
        </div>
      </div>
    );
  }

  const calls = callsData?.data || [];
  const sms = smsData?.data || [];
  const contacts = contactsData?.data || [];

  const tabs: { key: Tab; label: string; icon: typeof PhoneIcon; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: WifiIcon },
    { key: 'calls', label: 'Calls', icon: PhoneIcon, count: callsData?.total },
    { key: 'sms', label: 'SMS', icon: ChatBubbleLeftEllipsisIcon, count: smsData?.total },
    { key: 'contacts', label: 'Contacts', icon: UserGroupIcon, count: contactsData?.total },
  ];

  const callColumns = [
    {
      key: 'contactName',
      header: 'Contact',
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">{item.contactName?.charAt(0) || '?'}</span>
          </div>
          <span className="font-medium">{item.contactName || 'Unknown'}</span>
        </div>
      ),
    },
    { key: 'phoneNumber', header: 'Number', render: (item: any) => <span className="font-mono text-xs">{item.phoneNumber}</span> },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (item: any) => {
        const badge = typeBadge[item.type] || typeBadge.INCOMING;
        return <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', badge.bg, badge.text)}>{badge.label}</span>;
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      render: (item: any) => {
        const m = Math.floor(item.duration / 60);
        const s = item.duration % 60;
        return `${m}m ${s}s`;
      },
    },
    { key: 'timestamp', header: 'Date', sortable: true, render: (item: any) => format(new Date(item.timestamp), 'MMM d, yyyy HH:mm') },
  ];

  const smsColumns = [
    {
      key: 'senderNumber',
      header: 'From',
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">{item.senderNumber?.charAt(0) || '?'}</span>
          </div>
          <span className="font-medium">{item.senderNumber}</span>
        </div>
      ),
    },
    { key: 'body', header: 'Message', render: (item: any) => <span className="text-gray-600 dark:text-gray-400 truncate max-w-xs block">{item.body}</span> },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (item: any) => {
        const badge = smsTypeBadge[item.type] || smsTypeBadge.INCOMING;
        return <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', badge.bg, badge.text)}>{badge.label}</span>;
      },
    },
    { key: 'timestamp', header: 'Date', sortable: true, render: (item: any) => format(new Date(item.timestamp), 'MMM d, yyyy HH:mm') },
  ];

  return (
    <div>
      <PageHeader
        title={device.name}
        subtitle={`${device.manufacturer} ${device.model} · ${device.androidVersion}`}
        breadcrumbs={[{ label: 'Devices', path: '/devices' }, { label: device.name }]}
        actions={
          <button
            onClick={() => pauseDevice.mutate({ id: device.id, isPaused: device.isMonitoringActive })}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              !device.isMonitoringActive
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
            )}
          >
            {!device.isMonitoringActive ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
            {!device.isMonitoringActive ? 'Resume' : 'Pause'}
          </button>
        }
      />

      <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={clsx('w-3 h-3 rounded-full', device.isOnline ? 'bg-green-500' : 'bg-gray-400')} />
              <span className={clsx('text-sm font-medium', device.isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')}>
                {device.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last sync</p>
            <p className="text-sm text-gray-900 dark:text-white mt-1">
              {device.lastSyncAt ? formatDistanceToNow(new Date(device.lastSyncAt), { addSuffix: true }) : 'Never'}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Battery</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{device.batteryLevel}%</p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
              <div
                className={clsx('h-full rounded-full', device.batteryLevel > 50 ? 'bg-green-500' : device.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500')}
                style={{ width: `${device.batteryLevel}%` }}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Storage</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(device.storageUsed / 1073741824).toFixed(1)} <span className="text-sm font-normal text-gray-500">/ {(device.storageTotal / 1073741824).toFixed(0)} GB</span>
            </p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
              <div
                className={clsx('h-full rounded-full', (device.storageUsed / device.storageTotal) * 100 > 80 ? 'bg-red-500' : 'bg-primary-500')}
                style={{ width: `${(device.storageUsed / device.storageTotal) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Monitoring</p>
            <p className={clsx('text-lg font-bold', device.isMonitoringActive ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400')}>
              {device.isMonitoringActive ? 'Active' : 'Paused'}
            </p>
            {device._count && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {device._count.contacts} contacts · {device._count.callLogs} calls · {device._count.smsMessages} sms
              </p>
            )}
          </motion.div>
        </div>
      )}

      {activeTab === 'calls' && (
        <DataTable
          columns={callColumns}
          data={calls}
          isLoading={callsLoading}
          totalItems={callsData?.total || 0}
          currentPage={callsPage}
          totalPages={callsData?.totalPages || 1}
          onPageChange={setCallsPage}
          searchValue={callsSearch}
          onSearch={(v) => { setCallsSearch(v); setCallsPage(1); }}
          searchPlaceholder="Search calls..."
          keyExtractor={(item) => item.id}
          emptyMessage="No call logs for this device"
        />
      )}

      {activeTab === 'sms' && (
        <DataTable
          columns={smsColumns}
          data={sms}
          isLoading={smsLoading}
          totalItems={smsData?.total || 0}
          currentPage={smsPage}
          totalPages={smsData?.totalPages || 1}
          onPageChange={setSmsPage}
          searchValue={smsSearch}
          onSearch={(v) => { setSmsSearch(v); setSmsPage(1); }}
          searchPlaceholder="Search messages..."
          keyExtractor={(item) => item.id}
          emptyMessage="No SMS messages for this device"
        />
      )}

      {activeTab === 'contacts' && (
        <div>
          {contactsLoading ? (
            <LoadingSkeleton type="table" />
          ) : contacts.length === 0 ? (
            <EmptyState message="No contacts for this device" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">{contact.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.phoneNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
