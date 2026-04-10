import { Field } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const fieldsService = {
  getAll: () => request<Field[]>('/fields'),
  
  getById: (id: string) => request<Field>(`/fields/${id}`),
  
  create: async (data: Partial<Field>) => {
    const result = await request<Field>('/fields', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('fields');
    return result;
  },
  
  update: async (id: string, data: Partial<Field>) => {
    const result = await request<Field>(`/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('fields');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/fields/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('fields');
    return result;
  }
};
