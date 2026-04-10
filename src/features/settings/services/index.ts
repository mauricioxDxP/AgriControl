import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';
import { PlantedProductType } from '../../../types';

export const settingsService = {
  // Product Types
  getProductTypes: () => request<any[]>('/settings/product-types'),
  
  createProductType: async (name: string) => {
    const result = await request<any>('/settings/product-types', {
      method: 'POST',
      body: JSON.stringify({ name }),
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  },
  
  deleteProductType: async (id: string) => {
    const result = await request<void>(`/settings/product-types/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  },
  
  // Product States
  getProductStates: () => request<any[]>('/settings/product-states'),
  
  createProductState: async (name: string) => {
    const result = await request<any>('/settings/product-states', {
      method: 'POST',
      body: JSON.stringify({ name }),
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  },
  
  deleteProductState: async (id: string) => {
    const result = await request<void>(`/settings/product-states/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  },
  
  // Container Types
  getContainerTypes: () => request<any[]>('/settings/container-types'),
  
  createContainerType: async (name: string) => {
    const result = await request<any>('/settings/container-types', {
      method: 'POST',
      body: JSON.stringify({ name }),
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  },
  
  deleteContainerType: async (id: string) => {
    const result = await request<void>(`/settings/container-types/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  },
 
  // Planted Product Types (tipos plantados - configuración global para campos)
  getPlantedProductTypes: () => request<PlantedProductType[]>('/settings/field-product-types'),
  
  addPlantedProductType: async (productTypeId: string) => {
    const result = await request<PlantedProductType>('/settings/field-product-types', {
      method: 'POST',
      body: JSON.stringify({ productTypeId }),
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  },
  
  deletePlantedProductType: async (id: string) => {
    const result = await request<void>(`/settings/field-product-types/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('settings');
    return result;
  }
};
