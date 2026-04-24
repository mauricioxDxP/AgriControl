import { Terrain } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const terrainsService = {
  getAll: () => request<Terrain[]>('/terrains'),
  
  getById: (id: string) => request<Terrain>(`/terrains/${id}`),
  
  create: async (data: Partial<Terrain>) => {
    const result = await request<Terrain>('/terrains', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('terrains');
    return result;
  },
  
  update: async (id: string, data: Partial<Terrain>) => {
    const result = await request<Terrain>(`/terrains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('terrains');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/terrains/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('terrains');
    return result;
  }
};