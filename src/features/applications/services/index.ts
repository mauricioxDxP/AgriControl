import { Application, CreateApplicationInput } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const applicationsService = {
  getAll: () => request<Application[]>('/applications'),
  
  getById: (id: string) => request<Application>(`/applications/${id}`),
  
  getByField: (fieldId: string) => request<Application[]>(`/applications/field/${fieldId}`),
  
  create: async (data: CreateApplicationInput) => {
    const result = await request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('applications');
    return result;
  },
  
  update: async (id: string, data: CreateApplicationInput) => {
    const result = await request<Application>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('applications');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/applications/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('applications');
    return result;
  }
};
