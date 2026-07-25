import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { queryKeys } from '../lib/query-keys';
import { SmsMessage, PaginatedResponse } from '../types';

interface SmsParams {
  page?: number;
  limit?: number;
  deviceId?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useSms(params: SmsParams = {}) {
  const { page = 1, limit = 20, deviceId, type = '', search = '', startDate, endDate } = params;
  return useQuery({
    queryKey: queryKeys.sms.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<SmsMessage>>('/sms', {
        params: { page, limit, deviceId, type: type || undefined, search: search || undefined, startDate, endDate },
      });
      return data;
    },
  });
}
