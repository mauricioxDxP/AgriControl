import { Movement } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const movementsService = {
  getAll: () => request<Movement[]>('/movements'),
  
  getByProduct: (productId: string) => request<Movement[]>(`/movements/product/${productId}`),
  
  getByLot: (lotId: string) => request<Movement[]>(`/movements/lot/${lotId}`),
  
  getStock: (productId: string) => request<{ productId: string; stock: number }>(`/movements/stock/${productId}`),
  
  getLotStock: (lotId: string) => request<{ lotId: string; stock: number }>(`/movements/stock/lot/${lotId}`),
  
  create: async (data: Partial<Movement>) => {
    const result = await request<Movement>('/movements', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('movements');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/movements/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('movements');
    return result;
  }
};
