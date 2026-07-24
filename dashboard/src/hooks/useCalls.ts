import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { queryKeys } from '../lib/query-keys';
import { CallLog, PaginatedResponse } from '../types';

interface CallParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useCalls(params: CallParams = {}) {
  const { page = 1, limit = 20, type = '', search = '', startDate, endDate } = params;
  return useQuery({
    queryKey: queryKeys.calls.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CallLog>>('/calls', {
        params: { page, limit, type: type || undefined, search: search || undefined, startDate, endDate },
      });
      return data;
    },
  });
}
