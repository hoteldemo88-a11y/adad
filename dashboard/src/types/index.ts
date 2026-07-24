export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'parent' | 'child';
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  os: string;
  osVersion: string;
  batteryLevel: number;
  isOnline: boolean;
  lastSync: string;
  storageUsed: number;
  storageTotal: number;
  networkType: string;
  pairedAt: string;
  isPaused: boolean;
}

export interface Contact {
  id: string;
  deviceId: string;
  name: string;
  phone: string;
  email?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface CallLog {
  id: string;
  deviceId: string;
  contactId?: string;
  contactName: string;
  phoneNumber: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: string;
}

export interface SmsMessage {
  id: string;
  deviceId: string;
  contactId?: string;
  sender: string;
  recipient: string;
  body: string;
  type: 'received' | 'sent';
  timestamp: string;
  isRead: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  device: Device | null;
  stats: {
    totalContacts: number;
    callsToday: number;
    smsToday: number;
    avgScreenTime: number;
  };
  callDistribution: {
    incoming: number;
    outgoing: number;
    missed: number;
  };
  screenTimeByHour: number[];
  appUsage: { name: string; hours: number }[];
  recentActivity: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }[];
  permissions: {
    name: string;
    granted: boolean;
  }[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SyncState {
  lastSync: string;
  isSyncing: boolean;
  error: string | null;
}
