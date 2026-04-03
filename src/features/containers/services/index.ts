import { LotLine } from '../../../types';
import { request } from '../../../shared/services/request';

export const lotLinesService = {
  getAll: () => request<LotLine[]>('/lotlines'),
  
  getById: (id: string) => request<LotLine>(`/lotlines/${id}`),
  
  getByLot: (lotId: string) => request<LotLine[]>(`/lotlines/lot/${lotId}`),
  
  create: (data: Partial<LotLine>) => request<LotLine>('/lotlines', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: Partial<LotLine>) => request<LotLine>(`/lotlines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  consume: (id: string, quantity: number) => request<LotLine>(`/lotlines/${id}/consume`, {
    method: 'POST',
    body: JSON.stringify({ quantity })
  }),
  
  recharge: (id: string, quantity?: number) => request<LotLine>(`/lotlines/${id}/recharge`, {
    method: 'POST',
    body: JSON.stringify({ quantity })
  }),
  
  delete: (id: string) => request<void>(`/lotlines/${id}`, { method: 'DELETE' })
};

// Alias para compatibilidad hacia atrás
export const containersService = lotLinesService;
