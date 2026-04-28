import { request } from '../../../shared/services/request';
import { apiCache } from '../../../shared/services/cache';

export interface CreateInventoryCountDto {
  date: string;
  notes?: string;
  lines?: {
    productId: string;
    stockManual: number;
  }[];
}

export interface UpdateLineDto {
  stockManual: number;
}

export interface RequestAdjustmentDto {
  lineId: string;
  type: 'INCREASE' | 'DECREASE';
  lots: {
    lotId: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface InventoryCount {
  id: string;
  date: string;
  notes?: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
  lines: InventoryCountLine[];
}

export interface InventoryCountLine {
  id: string;
  inventoryCountId: string;
  productId: string;
  productCode: string;
  productName: string;
  stockActual: number;
  stockManual: number;
  adjustmentPending: boolean;
  adjustments?: InventoryCountAdjustment[];
}

export interface InventoryCountAdjustment {
  id: string;
  inventoryCountLineId: string;
  type: 'INCREASE' | 'DECREASE';
  totalQuantity: number;
  status: 'PENDING' | 'AUTHORIZED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  authorizedAt?: string;
  rejectedAt?: string;
  lots: InventoryCountAdjustmentLot[];
}

export interface InventoryCountAdjustmentLot {
  id: string;
  adjustmentId: string;
  lotId: string;
  quantity: number;
  lot?: {
    id: string;
    lotCode?: string;
    initialStock: number;
  };
}

export const inventoryCountService = {
  getAll: () => request<InventoryCount[]>('/inventory-count'),

  getById: (id: string) => request<InventoryCount>(`/inventory-count/${id}`),

  getPendingAdjustments: () => request<InventoryCountAdjustment[]>('/inventory-count/pending'),

  create: async (data: CreateInventoryCountDto) => {
    const result = await request<InventoryCount>('/inventory-count', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('inventory-count');
    return result;
  },

  delete: async (id: string) => {
    const result = await request(`/inventory-count/${id}`, {
      method: 'DELETE',
      useCache: false
    });
    apiCache.invalidateResource('inventory-count');
    return result;
  },

  addLine: async (countId: string, data: { productId: string; stockManual: number }) => {
    const result = await request<InventoryCountLine>(`/inventory-count/${countId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('inventory-count');
    return result;
  },

  updateLine: async (countId: string, lineId: string, data: UpdateLineDto) => {
    const result = await request<InventoryCountLine>(`/inventory-count/${countId}/lines/${lineId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('inventory-count');
    return result;
  },

  requestAdjustment: async (data: RequestAdjustmentDto) => {
    const result = await request('/inventory-count/request-adjust', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false
    });
    apiCache.invalidateResource('inventory-count');
    return result;
  },

  authorizeAdjustment: async (adjustmentId: string) => {
    const result = await request(`/inventory-count/authorize/${adjustmentId}`, {
      method: 'POST',
      useCache: false
    });
    apiCache.invalidateResource('inventory-count');
    apiCache.invalidateResource('movements');
    apiCache.invalidateResource('lots');
    return result;
  },

  rejectAdjustment: async (adjustmentId: string) => {
    const result = await request(`/inventory-count/reject/${adjustmentId}`, {
      method: 'POST',
      useCache: false
    });
    apiCache.invalidateResource('inventory-count');
    return result;
  }
};
