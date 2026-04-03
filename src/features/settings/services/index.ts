import { request } from '../../../shared/services/request';

export const settingsService = {
  // Product Types
  getProductTypes: () => request<any[]>('/settings/product-types'),
  
  createProductType: (name: string) => request<any>('/settings/product-types', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),
  
  deleteProductType: (id: string) => request<void>(`/settings/product-types/${id}`, { method: 'DELETE' }),
  
  // Product States
  getProductStates: () => request<any[]>('/settings/product-states'),
  
  createProductState: (name: string) => request<any>('/settings/product-states', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),
  
  deleteProductState: (id: string) => request<void>(`/settings/product-states/${id}`, { method: 'DELETE' }),
  
  // Container Types
  getContainerTypes: () => request<any[]>('/settings/container-types'),
  
  createContainerType: (name: string) => request<any>('/settings/container-types', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),
  
  deleteContainerType: (id: string) => request<void>(`/settings/container-types/${id}`, { method: 'DELETE' })
};
