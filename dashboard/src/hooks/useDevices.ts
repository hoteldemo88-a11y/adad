import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { queryKeys } from '../lib/query-keys';
import { Device } from '../types';

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices.list(),
    queryFn: async () => {
      const { data } = await api.get<{ devices: Device[] }>('/devices');
      return data.devices;
    },
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id),
    queryFn: async () => {
      const { data } = await api.get<{ device: Device }>(`/devices/${id}`);
      return data.device;
    },
    enabled: !!id,
  });
}

export function usePauseDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPaused }: { id: string; isPaused: boolean }) => {
      const { data } = await api.patch<{ device: Device }>(`/devices/${id}/pause`, { isPaused });
      return data.device;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device updated');
    },
    onError: () => toast.error('Failed to update device'),
  });
}

export function useRemoveDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device removed');
    },
    onError: () => toast.error('Failed to remove device'),
  });
}

export function usePairDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pairingCode: string) => {
      const { data } = await api.post<{ device: Device }>('/devices/pair', { code: pairingCode });
      return data.device;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device paired successfully');
    },
    onError: () => toast.error('Invalid pairing code'),
  });
}
