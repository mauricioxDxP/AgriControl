import { Machinery } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const machineryService = {
  getAll: () => request<Machinery[]>('/machinery'),
  
  getById: (id: string) => request<Machinery>(`/machinery/${id}`),
  
  create: async (data: Partial<Machinery>) => {
    const result = await request<Machinery>('/machinery', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('machinery');
    return result;
  },
  
  update: async (id: string, data: Partial<Machinery>) => {
    const result = await request<Machinery>(`/machinery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('machinery');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/machinery/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('machinery');
    return result;
  }
};