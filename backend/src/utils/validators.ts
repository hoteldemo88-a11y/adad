import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const DevicePairSchema = z.object({
  pairingCode: z
    .string()
    .length(6, 'Pairing code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Pairing code must contain only digits')
    .optional(),
  deviceName: z.string().min(1, 'Device name is required').max(100, 'Device name is too long'),
  deviceModel: z.string().min(1, 'Device model is required').max(100, 'Device model is too long'),
  androidVersion: z.string().min(1, 'Android version is required').max(20, 'Android version is too long'),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100, 'Manufacturer is too long'),
});

export const AutoRegisterSchema = z.object({
  deviceName: z.string().min(1, 'Device name is required').max(100, 'Device name is too long'),
  deviceModel: z.string().min(1, 'Device model is required').max(100, 'Device model is too long'),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100, 'Manufacturer is too long'),
  androidVersion: z.string().min(1, 'Android version is required').max(20, 'Android version is too long'),
});

export const ApproveDeviceSchema = z.object({
  parentId: z.string().uuid('Invalid parent ID').optional(),
});

export const DeviceRegisterSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(100, 'Device name is too long'),
  model: z.string().min(1, 'Device model is required').max(100, 'Device model is too long'),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100, 'Manufacturer is too long'),
  androidVersion: z.string().min(1, 'Android version is required').max(20, 'Android version is too long'),
});

export const ContactSyncSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID'),
  contacts: z.array(
    z.object({
      systemContactId: z.string(),
      displayName: z.string(),
      phoneNumber: z.string().optional(),
      email: z.string().email().optional(),
      syncHash: z.string(),
    })
  ).min(1, 'At least one contact is required'),
});

export const CallLogSyncSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID'),
  calls: z.array(
    z.object({
      systemCallId: z.string(),
      phoneNumber: z.string(),
      contactName: z.string().optional(),
      callType: z.enum(['INCOMING', 'OUTGOING', 'MISSED']),
      duration: z.number().int().min(0),
      timestamp: z.union([z.string().datetime(), z.number()]),
      syncHash: z.string(),
    })
  ).min(1, 'At least one call log is required'),
});

export const SmsSyncSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID'),
  messages: z.array(
    z.object({
      systemSmsId: z.string(),
      senderNumber: z.string(),
      recipientNumber: z.string(),
      body: z.string(),
      type: z.enum(['INCOMING', 'OUTGOING']),
      timestamp: z.union([z.string().datetime(), z.number()]),
      syncHash: z.string(),
    })
  ).min(1, 'At least one SMS message is required'),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const UpdateSyncIntervalSchema = z.object({
  intervalMs: z.number().int().min(60000, 'Minimum sync interval is 1 minute').max(86400000, 'Maximum sync interval is 24 hours'),
});
