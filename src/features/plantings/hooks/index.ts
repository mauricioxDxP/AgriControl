import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { plantingsService } from '../services';
import { Planting } from '../../../types';

export function usePlantings(fieldId?: string) {
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = navigator.onLine;

  const loadPlantings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isOnline) {
        let data: Planting[];
        if (fieldId) {
          data = await plantingsService.getByField(fieldId);
        } else {
          data = await plantingsService.getAll();
        }
        setPlantings(data);
        // Save to IndexedDB for offline access
        await dbHelpers.clearPlantings();
        for (const p of data) {
          await dbHelpers.addPlanting(p);
        }
      } else {
        const localData = fieldId
          ? await dbHelpers.getPlantingsByField(fieldId)
          : await dbHelpers.getAllPlantings();
        setPlantings(localData);
      }
    } catch (err) {
      // Try to load from IndexedDB on error
      const localData = fieldId
        ? await dbHelpers.getPlantingsByField(fieldId)
        : await dbHelpers.getAllPlantings();
      setPlantings(localData);
      if (localData.length === 0) {
        setError('No connection and no local data');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, fieldId]);

  useEffect(() => {
    loadPlantings();
  }, [loadPlantings]);

  // Helper to find current/active plantings for a field
  const findCurrentByField = useCallback(async (fieldId: string): Promise<Planting[]> => {
    if (isOnline) {
      return await plantingsService.getCurrentByField(fieldId);
    } else {
      const allPlantings = await dbHelpers.getPlantingsByField(fieldId);
      return allPlantings.filter(p => !p.endDate);
    }
  }, [isOnline]);

  // End a planting (mark as completed)
  const endPlanting = async (id: string) => {
    const endDate = new Date().toISOString();
    
    if (isOnline) {
      try {
        const result = await plantingsService.endPlanting(id, endDate);
        await dbHelpers.updatePlanting(id, result);
        setPlantings(prev => prev.map(p => p.id === id ? result : p));
        return result;
      } catch (err) {
        // Update locally
        const updated = { endDate, updatedAt: new Date().toISOString(), synced: false };
        await dbHelpers.updatePlanting(id, updated);
        setPlantings(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
        return { ...plantings.find(p => p.id === id), ...updated };
      }
    } else {
      const updated = { endDate, updatedAt: new Date().toISOString(), synced: false };
      await dbHelpers.updatePlanting(id, updated);
      setPlantings(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      return { ...plantings.find(p => p.id === id), ...updated };
    }
  };

  const addPlanting = async (data: Partial<Planting>) => {
    const newPlanting: Planting = {
      id: uuidv4(),
      fieldId: data.fieldId || '',
      productId: data.productId || '',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate ?? null,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await plantingsService.create(newPlanting);
        await dbHelpers.addPlanting(created);
        setPlantings(prev => [created, ...prev]);
        return created;
      } catch (err) {
        // Save offline
        await dbHelpers.addPlanting(newPlanting);
        setPlantings(prev => [newPlanting, ...prev]);
        return newPlanting;
      }
    } else {
      await dbHelpers.addPlanting(newPlanting);
      setPlantings(prev => [newPlanting, ...prev]);
      return newPlanting;
    }
  };

  const updatePlanting = async (id: string, data: Partial<Planting>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await plantingsService.update(id, updated);
        await dbHelpers.updatePlanting(id, result);
        setPlantings(prev => prev.map(p => p.id === id ? result : p));
        return result;
      } catch (err) {
        await dbHelpers.updatePlanting(id, updated);
        setPlantings(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
        return { ...plantings.find(p => p.id === id), ...updated };
      }
    } else {
      await dbHelpers.updatePlanting(id, updated);
      setPlantings(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      return { ...plantings.find(p => p.id === id), ...updated };
    }
  };

  const deletePlanting = async (id: string) => {
    try {
      if (isOnline) {
        await plantingsService.delete(id);
      }
      await dbHelpers.deletePlanting(id);
      setPlantings(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting planting:', err);
      throw err;
    }
  };

  return { plantings, loading, error, addPlanting, updatePlanting, deletePlanting, endPlanting, findCurrentByField, refresh: loadPlantings };
}

// Alias for backwards compatibility
export const useSiembra = usePlantings;
export const useSiembras = usePlantings;