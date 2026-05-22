import { Operator } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const operatorService = {
  getAll: () => request<Operator[]>('/operators'),
  
  getById: (id: string) => request<Operator>(`/operators/${id}`),
  
  create: async (data: Partial<Operator>) => {
    const result = await request<Operator>('/operators', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('operators');
    return result;
  },
  
  update: async (id: string, data: Partial<Operator>) => {
    const result = await request<Operator>(`/operators/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('operators');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/operators/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('operators');
    return result;
  }
};