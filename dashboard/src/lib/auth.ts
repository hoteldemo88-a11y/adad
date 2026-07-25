import api from './api';
import { AuthResponse } from '../types';

const ACCESS_TOKEN_KEY = 'sg_access_token';
const REFRESH_TOKEN_KEY = 'sg_refresh_token';
const USER_KEY = 'sg_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthResponse['parent'] | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function storeUser(user: AuthResponse['parent']) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  storeTokens(data.accessToken, data.refreshToken);
  storeUser(data.parent);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
  storeTokens(data.accessToken, data.refreshToken);
  storeUser(data.parent);
  return data;
}

export async function refreshToken(): Promise<string | null> {
  const rt = getStoredRefreshToken();
  if (!rt) return null;
  try {
    const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken: rt,
    });
    storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function logout() {
  const rt = getStoredRefreshToken();
  try {
    await api.post('/auth/logout', rt ? { refreshToken: rt } : undefined);
  } finally {
    clearTokens();
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await api.post<unknown>('/auth/forgot-password', { email });
  const msg = (response as any).apiMessage || 'If the email exists, a reset link has been sent';
  return { message: msg };
}
