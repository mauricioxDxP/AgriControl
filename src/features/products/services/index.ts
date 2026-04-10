import { Product } from '../../../types';
import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export const productsService = {
  getAll: () => request<Product[]>('/products'),
  
  getById: (id: string) => request<Product>(`/products/${id}`),
  
  create: async (data: Partial<Product>) => {
    const result = await request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false // No usar cache para mutations
    });
    apiCache.invalidateResource('products');
    return result;
  },
  
  update: async (id: string, data: Partial<Product>) => {
    const result = await request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('products');
    return result;
  },
  
  delete: async (id: string) => {
    const result = await request<void>(`/products/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('products');
    return result;
  }
};
