import { Lot } from '../../../types';
import { request } from '../../../shared/services/request';

export const lotsService = {
  getAll: () => request<Lot[]>('/lots'),
  
  getById: (id: string) => request<Lot>(`/lots/${id}`),
  
  getByProduct: (productId: string) => request<Lot[]>(`/lots/product/${productId}`),
  
  create: (data: Partial<Lot>) => request<Lot>('/lots', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: Partial<Lot>) => request<Lot>(`/lots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => request<void>(`/lots/${id}`, { method: 'DELETE' })
};
