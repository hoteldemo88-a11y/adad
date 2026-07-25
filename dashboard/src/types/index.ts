export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  pairingCode?: string | null;
  parentId?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isOnline: boolean;
  isMonitoringActive: boolean;
  batteryLevel: number;
  storageTotal: number;
  storageUsed: number;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    contacts: number;
    callLogs: number;
    smsMessages: number;
  };
}

export interface Contact {
  id: string;
  deviceId: string;
  name: string;
  phoneNumber: string | null;
  email?: string | null;
  isFavorite: boolean;
  syncHash: string;
  createdAt: string;
  device?: { id: string; name: string };
}

export interface CallLog {
  id: string;
  deviceId: string;
  contactName: string | null;
  phoneNumber: string;
  type: 'INCOMING' | 'OUTGOING' | 'MISSED';
  duration: number;
  timestamp: string;
  syncHash: string;
  device?: { id: string; name: string };
}

export interface SmsMessage {
  id: string;
  deviceId: string;
  senderNumber: string;
  recipientNumber: string;
  body: string;
  type: 'INCOMING' | 'OUTGOING';
  timestamp: string;
  syncHash: string;
  device?: { id: string; name: string };
}

export interface Notification {
  id: string;
  parentId: string;
  deviceId?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  device?: { id: string; name: string };
}

export interface DeviceStats {
  id: string;
  name: string;
  model: string;
  isOnline: boolean;
  isMonitoringActive: boolean;
  batteryLevel: number;
  storageTotal: number;
  storageUsed: number;
  lastSyncAt: string | null;
  storagePercentage: number;
  todayActivity: {
    incomingCalls: number;
    outgoingCalls: number;
    missedCalls: number;
    totalCalls: number;
    incomingSms: number;
    outgoingSms: number;
    totalSms: number;
  };
}

export interface DashboardSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lowBatteryDevices: number;
  totalContacts: number;
  todayCalls: number;
  todaySms: number;
  unreadNotifications: number;
}

export interface DashboardData {
  devices: DeviceStats[];
  summary: DashboardSummary;
  lastUpdated: string;
}

export interface AuthResponse {
  parent: { id: string; name: string; email: string };
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
