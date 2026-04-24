import { Planting } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const plantingsService = {
  getAll: () => request<Planting[]>('/plantings'),
  
  getById: (id: string) => request<Planting>(`/plantings/${id}`),
  
  getByField: (fieldId: string) => request<Planting[]>(`/plantings/field/${fieldId}`),
  
  getCurrentByField: (fieldId: string) => request<Planting[]>(`/plantings?fieldId=${fieldId}&active=true`),
  
  create: async (data: Partial<Planting>) => {
    const result = await request<Planting>('/plantings', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('plantings');
    return result;
  },
  
  update: async (id: string, data: Partial<Planting>) => {
    const result = await request<Planting>(`/plantings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('plantings');
    return result;
  },
  
  endPlanting: async (id: string, endDate: string) => {
    const result = await request<Planting>(`/plantings/${id}/end`, {
      method: 'PATCH',
      body: JSON.stringify({ endDate }),
      useCache: false
    });
    apiCache.invalidateResource('plantings');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/plantings/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('plantings');
    return result;
  }
};