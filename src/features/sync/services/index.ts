import { SyncData } from '../../../types';
import { request } from '../../../shared/services/request';

export const syncService = {
  sync: (data: SyncData) => request<{ success: boolean; serverData: SyncData }>('/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  getUnsynced: () => request<SyncData>('/sync')
};
