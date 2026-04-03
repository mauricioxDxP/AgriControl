import { Product } from '../../../types';
import { request } from '../../../shared/services/request';

export const productsService = {
  getAll: () => request<Product[]>('/products'),
  
  getById: (id: string) => request<Product>(`/products/${id}`),
  
  create: (data: Partial<Product>) => request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' })
};
