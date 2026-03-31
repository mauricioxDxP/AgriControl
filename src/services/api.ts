import { Product, Lot, Field, Application, Movement, SyncData, CreateApplicationInput, Container, Tancada, Tank } from '../types';

// Use environment variable or detect from current location for mobile access
const getApiBase = (): string => {
  // If explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Otherwise, construct from current window location for mobile
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Running on mobile/remote device, use current host
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  // Default to relative path for local development
  return '/api';
};

const API_BASE = getApiBase();

// Debug log in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE);
}

// Helper para hacer requests
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  if (import.meta.env.DEV) {
    console.log(`API Request: ${options?.method || 'GET'} ${url}`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`No se pudo conectar al servidor. Verifica que el backend esté corriendo en ${API_BASE}`);
    }
    throw error;
  }
}

// API de Productos
export const productsApi = {
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

// API de Lotes
export const lotsApi = {
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

// API de Campos
export const fieldsApi = {
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

// API de Aplicaciones
export const applicationsApi = {
  getAll: () => request<Application[]>('/applications'),
  getById: (id: string) => request<Application>(`/applications/${id}`),
  getByField: (fieldId: string) => request<Application[]>(`/applications/field/${fieldId}`),
  create: (data: CreateApplicationInput) => request<Application>('/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: Partial<Application>) => request<Application>(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => request<void>(`/applications/${id}`, { method: 'DELETE' })
};

// API de Movimientos
export const movementsApi = {
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

// API de Contenedores
export const containersApi = {
  getAll: () => request<Container[]>('/containers'),
  getById: (id: string) => request<Container>(`/containers/${id}`),
  getByLot: (lotId: string) => request<Container[]>(`/containers/lot/${lotId}`),
  create: (data: Partial<Container>) => request<Container>('/containers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: Partial<Container>) => request<Container>(`/containers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  consume: (id: string, quantity: number) => request<Container>(`/containers/${id}/consume`, {
    method: 'PUT',
    body: JSON.stringify({ quantity })
  }),
  delete: (id: string) => request<void>(`/containers/${id}`, { method: 'DELETE' }),
  getMovements: (containerId: string) => request<any[]>(`/containers/${containerId}/movements`),
  getAllMovements: () => request<any[]>('/containers/movements/all')
};

// API de Tancadas
export const tancadasApi = {
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

// API de Tanques
export const tanksApi = {
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

// API de Sincronización
export const syncApi = {
  sync: (data: SyncData) => request<{ success: boolean; serverData: SyncData }>('/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getUnsynced: () => request<SyncData>('/sync')
};

// Health check
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/health')
};

// Settings API
export const settingsApi = {
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
  deleteContainerType: (id: string) => request<void>(`/settings/container-types/${id}`, { method: 'DELETE' }),
};
