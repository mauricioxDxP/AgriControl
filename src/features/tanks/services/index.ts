import { Tank } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const tanksService = {
  getAll: () => request<Tank[]>('/tanks'),
  
  getById: (id: string) => request<Tank>(`/tanks/${id}`),
  
  create: async (data: Partial<Tank>) => {
    const result = await request<Tank>('/tanks', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('tanks');
    return result;
  },
  
  update: async (id: string, data: Partial<Tank>) => {
    const result = await request<Tank>(`/tanks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('tanks');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/tanks/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('tanks');
    return result;
  }
};
