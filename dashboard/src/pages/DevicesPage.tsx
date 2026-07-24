import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDevices, usePauseDevice, useRemoveDevice, usePairDevice } from '../hooks/useDevices';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function DevicesPage() {
  const { data: devices, isLoading } = useDevices();
  const pauseDevice = usePauseDevice();
  const removeDevice = useRemoveDevice();
  const pairDevice = usePairDevice();

  const [showPairModal, setShowPairModal] = useState(false);
  const [pairCode, setPairCode] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  if (isLoading) return <div><PageHeader title="Devices" subtitle="Manage paired devices" /><LoadingSkeleton type="table" /></div>;

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle="Manage paired devices"
        actions={
          <button
            onClick={() => setShowPairModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Device
          </button>
        }
      />

      {!devices || devices.length === 0 ? (
        <EmptyState
          message="No devices paired yet"
          action={{ label: 'Pair a Device', onClick: () => setShowPairModal(true) }}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">{device.model}</p>
                  </div>
                </div>
                <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', device.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>
                  {device.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">OS</span>
                  <span className="text-gray-900 dark:text-white">{device.os} {device.osVersion}</span>
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
                  <span className="text-gray-900 dark:text-white">{formatDistanceToNow(new Date(device.lastSync), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Storage</span>
                  <span className="text-gray-900 dark:text-white">{(device.storageUsed / 1073741824).toFixed(1)}GB / {(device.storageTotal / 1073741824).toFixed(0)}GB</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => pauseDevice.mutate({ id: device.id, isPaused: !device.isPaused })}
                  className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors', device.isPaused ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30')}
                >
                  {device.isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                  {device.isPaused ? 'Resume' : 'Pause'}
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

      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPairModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pair a Device</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter the 6-digit pairing code displayed on the child's device.</p>
            <input
              type="text"
              value={pairCode}
              onChange={(e) => setPairCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="000000"
              maxLength={6}
            />
            {pairDevice.isError && <p className="mt-2 text-xs text-red-500 text-center">Invalid pairing code</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPairModal(false)} className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={() => { if (pairCode.length === 6) pairDevice.mutate(pairCode, { onSuccess: () => { setShowPairModal(false); setPairCode(''); } }); }}
                disabled={pairCode.length !== 6 || pairDevice.isPending}
                className="flex-1 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400"
              >
                {pairDevice.isPending ? 'Pairing...' : 'Pair Device'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!showRemoveConfirm}
        title="Remove Device"
        message="This will permanently unpair the device. You'll need the pairing code to reconnect."
        confirmLabel="Remove"
        onConfirm={() => { if (showRemoveConfirm) removeDevice.mutate(showRemoveConfirm); setShowRemoveConfirm(null); }}
        onCancel={() => setShowRemoveConfirm(null)}
      />
    </div>
  );
}
