import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { queryKeys } from '../lib/query-keys';
import { Contact, PaginatedResponse } from '../types';

interface ContactParams {
  page?: number;
  limit?: number;
  search?: string;
  favoritesOnly?: boolean;
}

export function useContacts(params: ContactParams = {}) {
  const { page = 1, limit = 20, search = '', favoritesOnly = false } = params;
  return useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Contact>>('/contacts', {
        params: { page, limit, search, favoritesOnly: favoritesOnly || undefined },
      });
      return data;
    },
  });
}
