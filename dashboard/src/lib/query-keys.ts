export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  devices: {
    all: ['devices'] as const,
    list: () => [...queryKeys.devices.all, 'list'] as const,
    pending: () => [...queryKeys.devices.all, 'pending'] as const,
    detail: (id: string) => [...queryKeys.devices.all, 'detail', id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: (params?: Record<string, unknown> | object) => [...queryKeys.contacts.all, 'list', params] as const,
  },
  calls: {
    all: ['calls'] as const,
    list: (params?: Record<string, unknown> | object) => [...queryKeys.calls.all, 'list', params] as const,
  },
  sms: {
    all: ['sms'] as const,
    list: (params?: Record<string, unknown> | object) => [...queryKeys.sms.all, 'list', params] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
};
