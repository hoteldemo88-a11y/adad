import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login as apiLogin, register as apiRegister, logout as apiLogout, forgotPassword as apiForgotPassword, getStoredToken, getStoredUser } from '../lib/auth';
import { queryKeys } from '../lib/query-keys';
import { User } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => {
      const stored = getStoredUser();
      if (!stored) return null;
      return stored as unknown as User;
    },
    enabled: !!getStoredToken(),
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiLogin(credentials.email, credentials.password),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.user(), data.parent as unknown as User);
      toast.success('Welcome back!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: { name: string; email: string; password: string }) =>
      apiRegister(credentials.name, credentials.email, credentials.password),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.user(), data.parent as unknown as User);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out');
      navigate('/login');
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => apiForgotPassword(email),
    onSuccess: () => {
      toast.success('Check your email for reset instructions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
    forgotPassword: forgotPasswordMutation,
  };
}
