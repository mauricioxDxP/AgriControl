import { Tank } from '../../../types';
import { request } from '../../../shared/services/request';

export const tanksService = {
  getAll: () => request<Tank[]>('/tanks'),
  
  getById: (id: string) => request<Tank>(`/tanks/${id}`),
  
  create: (data: Partial<Tank>) => request<Tank>('/tanks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: Partial<Tank>) => request<Tank>(`/tanks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => request<void>(`/tanks/${id}`, { method: 'DELETE' })
};
