import { Field } from '../../../types';
import { request } from '../../../shared/services/request';

export const fieldsService = {
  getAll: () => request<Field[]>('/fields'),
  
  getById: (id: string) => request<Field>(`/fields/${id}`),
  
  create: (data: Partial<Field>) => request<Field>('/fields', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: Partial<Field>) => request<Field>(`/fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => request<void>(`/fields/${id}`, { method: 'DELETE' })
};
