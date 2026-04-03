import { Tancada } from '../../../types';
import { request } from '../../../shared/services/request';

export const tancadasService = {
  getAll: () => request<Tancada[]>('/tancadas'),
  
  getById: (id: string) => request<Tancada>(`/tancadas/${id}`),
  
  create: (data: any) => request<Tancada>('/tancadas', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: any) => request<Tancada>(`/tancadas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => request<void>(`/tancadas/${id}`, { method: 'DELETE' })
};
