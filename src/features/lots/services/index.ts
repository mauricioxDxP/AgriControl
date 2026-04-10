import { Lot } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const lotsService = {
  getAll: () => request<Lot[]>('/lots'),
  
  getById: (id: string) => request<Lot>(`/lots/${id}`),
  
  getByProduct: (productId: string) => request<Lot[]>(`/lots/product/${productId}`),
  
  create: async (data: Partial<Lot>) => {
    const result = await request<Lot>('/lots', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('lots');
    return result;
  },
  
  update: async (id: string, data: Partial<Lot>) => {
    const result = await request<Lot>(`/lots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('lots');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/lots/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('lots');
    return result;
  }
};
