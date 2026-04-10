import { Tancada } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const tancadasService = {
  getAll: () => request<Tancada[]>('/tancadas'),
  
  getById: (id: string) => request<Tancada>(`/tancadas/${id}`),
  
  create: async (data: any) => {
    const result = await request<Tancada>('/tancadas', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('tancadas');
    return result;
  },
  
  update: async (id: string, data: any) => {
    const result = await request<Tancada>(`/tancadas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('tancadas');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/tancadas/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('tancadas');
    return result;
  }
};
