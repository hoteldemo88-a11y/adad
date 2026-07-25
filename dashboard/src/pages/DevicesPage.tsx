import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDevices, usePendingDevices, useApproveDevice, usePauseDevice, useRemoveDevice, useRegisterDevice } from '../hooks/useDevices';
import { Device } from '../types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function DevicesPage() {
  const { data: devices, isLoading } = useDevices();
  const { data: pendingDevices } = usePendingDevices();
  const approveDevice = useApproveDevice();
  const pauseDevice = usePauseDevice();
  const removeDevice = useRemoveDevice();
  const registerDevice = useRegisterDevice();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', model: '', manufacturer: '', androidVersion: '' });
  const [registeredDevice, setRegisteredDevice] = useState<{ pairingCode: string; name: string } | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  if (isLoading) return <div><PageHeader title="Devices" subtitle="Manage paired devices" /><LoadingSkeleton type="table" /></div>;

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle="Manage paired devices"
        actions={
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Device
          </button>
        }
      />

      {pendingDevices && pendingDevices.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Approval</h2>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
              {pendingDevices.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingDevices.map((device, idx) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-300 dark:border-amber-700 p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <DevicePhoneMobileIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{device.manufacturer} {device.model}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Pending
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Android</span>
                    <span className="text-gray-900 dark:text-white">{device.androidVersion}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Registered</span>
                    <span className="text-gray-900 dark:text-white">{formatDistanceToNow(new Date(device.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => approveDevice.mutate(device.id)}
                    disabled={approveDevice.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {approveDevice.isPending ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!devices || devices.length === 0 ? (
        <EmptyState
          message="No devices paired yet"
          action={{ label: 'Add a Device', onClick: () => setShowRegisterModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device, idx) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <DevicePhoneMobileIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{device.manufacturer} {device.model}</p>
                  </div>
                </div>
                <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', device.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>
                  {device.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Android</span>
                  <span className="text-gray-900 dark:text-white">{device.androidVersion}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Battery</span>
                  <span className="text-gray-900 dark:text-white">{device.batteryLevel}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', device.batteryLevel > 50 ? 'bg-green-500' : device.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${device.batteryLevel}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last sync</span>
                  <span className="text-gray-900 dark:text-white">{device.lastSyncAt ? formatDistanceToNow(new Date(device.lastSyncAt), { addSuffix: true }) : 'Never'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Storage</span>
                  <span className="text-gray-900 dark:text-white">{(device.storageUsed / 1073741824).toFixed(1)}GB / {(device.storageTotal / 1073741824).toFixed(0)}GB</span>
                </div>
                {device._count && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Synced data</span>
                    <span className="text-gray-900 dark:text-white">{device._count.contacts} contacts, {device._count.callLogs} calls, {device._count.smsMessages} sms</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => pauseDevice.mutate({ id: device.id, isPaused: device.isMonitoringActive })}
                  className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors', !device.isMonitoringActive ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30')}
                >
                  {!device.isMonitoringActive ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                  {!device.isMonitoringActive ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={() => setShowRemoveConfirm(device.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showRegisterModal && !registeredDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRegisterModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add a New Device</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter the device details. A pairing code will be generated for the child's device.</p>
            <div className="space-y-3">
              <input
                type="text"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Device name (e.g. My Phone)"
              />
              <input
                type="text"
                value={newDevice.model}
                onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Model (e.g. Galaxy S24)"
              />
              <input
                type="text"
                value={newDevice.manufacturer}
                onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Manufacturer (e.g. Samsung)"
              />
              <input
                type="text"
                value={newDevice.androidVersion}
                onChange={(e) => setNewDevice({ ...newDevice, androidVersion: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Android version (e.g. Android 14)"
              />
            </div>
            {registerDevice.isError && <p className="mt-2 text-xs text-red-500 text-center">Failed to register device</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowRegisterModal(false); setNewDevice({ name: '', model: '', manufacturer: '', androidVersion: '' }); }} className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newDevice.name && newDevice.model && newDevice.manufacturer && newDevice.androidVersion) {
                    registerDevice.mutate(newDevice, {
                      onSuccess: (device) => {
                        setRegisteredDevice({ pairingCode: device.pairingCode || '', name: device.name });
                        setNewDevice({ name: '', model: '', manufacturer: '', androidVersion: '' });
                      },
                    });
                  }
                }}
                disabled={!newDevice.name || !newDevice.model || !newDevice.manufacturer || !newDevice.androidVersion || registerDevice.isPending}
                className="flex-1 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400"
              >
                {registerDevice.isPending ? 'Registering...' : 'Register Device'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {registeredDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setRegisteredDevice(null); setShowRegisterModal(false); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Device Registered!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter this code on <strong>{registeredDevice.name}</strong>:</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-3xl font-mono font-bold tracking-[0.3em] text-gray-900 dark:text-white">{registeredDevice.pairingCode}</p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">This code will pair the device to your account.</p>
            <button
              onClick={() => { setRegisteredDevice(null); setShowRegisterModal(false); }}
              className="w-full py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!showRemoveConfirm}
        title="Remove Device"
        message="This will permanently unpair the device. You'll need a new pairing code to reconnect."
        confirmLabel="Remove"
        onConfirm={() => { if (showRemoveConfirm) removeDevice.mutate(showRemoveConfirm); setShowRemoveConfirm(null); }}
        onCancel={() => setShowRemoveConfirm(null)}
      />
    </div>
  );
}
