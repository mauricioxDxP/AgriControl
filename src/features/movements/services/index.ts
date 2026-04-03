import { Movement } from '../../../types';
import { request } from '../../../shared/services/request';

export const movementsService = {
  getAll: () => request<Movement[]>('/movements'),
  
  getByProduct: (productId: string) => request<Movement[]>(`/movements/product/${productId}`),
  
  getByLot: (lotId: string) => request<Movement[]>(`/movements/lot/${lotId}`),
  
  getStock: (productId: string) => request<{ productId: string; stock: number }>(`/movements/stock/${productId}`),
  
  getLotStock: (lotId: string) => request<{ lotId: string; stock: number }>(`/movements/stock/lot/${lotId}`),
  
  create: (data: Partial<Movement>) => request<Movement>('/movements', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => request<void>(`/movements/${id}`, { method: 'DELETE' })
};
