import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { queryKeys } from '../lib/query-keys';
import { Device } from '../types';

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices.list(),
    queryFn: async () => {
      const { data } = await api.get<Device[]>('/devices');
      return data;
    },
  });
}

export function usePendingDevices() {
  return useQuery({
    queryKey: queryKeys.devices.pending(),
    queryFn: async () => {
      const { data } = await api.get<Device[]>('/devices/pending');
      return data;
    },
  });
}

export function useApproveDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const { data } = await api.post<Device>(`/devices/${deviceId}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device approved');
    },
    onError: () => toast.error('Failed to approve device'),
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Device>(`/devices/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceInfo: { name: string; model: string; manufacturer: string; androidVersion: string }) => {
      const { data } = await api.post<Device>('/devices/register', deviceInfo);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device registered successfully');
    },
    onError: () => toast.error('Failed to register device'),
  });
}

export function usePauseDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPaused }: { id: string; isPaused: boolean }) => {
      const endpoint = isPaused ? `/devices/${id}/pause` : `/devices/${id}/resume`;
      const { data } = await api.post<Device>(endpoint);
      return data;
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
