import { LotLine } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const lotLinesService = {
  getAll: () => request<LotLine[]>('/lotlines'),
  
  getById: (id: string) => request<LotLine>(`/lotlines/${id}`),
  
  getByLot: (lotId: string) => request<LotLine[]>(`/lotlines/lot/${lotId}`),
  
  create: async (data: Partial<LotLine>) => {
    const result = await request<LotLine>('/lotlines', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('lotlines');
    return result;
  },
  
  update: async (id: string, data: Partial<LotLine>) => {
    const result = await request<LotLine>(`/lotlines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('lotlines');
    return result;
  },
  
  consume: async (id: string, quantity: number) => {
    const result = await request<LotLine>(`/lotlines/${id}/consume`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
      useCache: false
    });
    apiCache.invalidateResource('lotlines');
    return result;
  },
  
  recharge: async (id: string, quantity?: number) => {
    const result = await request<LotLine>(`/lotlines/${id}/recharge`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
      useCache: false
    });
    apiCache.invalidateResource('lotlines');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/lotlines/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('lotlines');
    return result;
  }
};

// Alias para compatibilidad hacia atrás
export const containersService = lotLinesService;
