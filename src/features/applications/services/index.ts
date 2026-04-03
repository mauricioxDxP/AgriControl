import { Application, CreateApplicationInput } from '../../../types';
import { request } from '../../../shared/services/request';

export const applicationsService = {
  getAll: () => request<Application[]>('/applications'),
  
  getById: (id: string) => request<Application>(`/applications/${id}`),
  
  getByField: (fieldId: string) => request<Application[]>(`/applications/field/${fieldId}`),
  
  create: (data: CreateApplicationInput) => request<Application>('/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: CreateApplicationInput) => request<Application>(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => request<void>(`/applications/${id}`, { method: 'DELETE' })
};
