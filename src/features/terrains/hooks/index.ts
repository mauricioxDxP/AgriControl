import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { terrainsService } from '../services';
import { Terrain } from '../../../types';

export function useTerrains() {
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = navigator.onLine;

  const loadTerrains = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isOnline) {
        const data = await terrainsService.getAll();
        setTerrains(data);
        // Save to IndexedDB for offline access
        await dbHelpers.clearTerrains();
        for (const terrain of data) {
          await dbHelpers.addTerrain(terrain);
        }
      } else {
        const localData = await dbHelpers.getAllTerrains();
        setTerrains(localData);
      }
    } catch (err) {
      // Try to load from IndexedDB on error
      const localData = await dbHelpers.getAllTerrains();
      setTerrains(localData);
      if (localData.length === 0) {
        setError('No connection and no local data');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadTerrains();
  }, [loadTerrains]);

  const addTerrain = async (data: Partial<Terrain>) => {
    const newTerrain: Terrain = {
      id: uuidv4(),
      name: data.name || '',
      location: data.location,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await terrainsService.create(newTerrain);
        await dbHelpers.addTerrain(created);
        setTerrains(prev => [created, ...prev]);
        return created;
      } catch (err) {
        // Save offline
        await dbHelpers.addTerrain(newTerrain);
        setTerrains(prev => [newTerrain, ...prev]);
        return newTerrain;
      }
    } else {
      await dbHelpers.addTerrain(newTerrain);
      setTerrains(prev => [newTerrain, ...prev]);
      return newTerrain;
    }
  };

  const updateTerrain = async (id: string, data: Partial<Terrain>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await terrainsService.update(id, updated);
        await dbHelpers.updateTerrain(id, result);
        setTerrains(prev => prev.map(t => t.id === id ? result : t));
        return result;
      } catch (err) {
        await dbHelpers.updateTerrain(id, updated);
        setTerrains(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
        return { ...terrains.find(t => t.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateTerrain(id, updated);
      setTerrains(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      return { ...terrains.find(t => t.id === id), ...updated };
    }
  };

  const deleteTerrain = async (id: string) => {
    try {
      if (isOnline) {
        await terrainsService.delete(id);
      }
      await dbHelpers.deleteTerrain(id);
      setTerrains(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting terrain:', err);
      throw err;
    }
  };

  return { terrains, loading, error, addTerrain, updateTerrain, deleteTerrain, refresh: loadTerrains };
}

// Alias for backwards compatibility
export const useTerrenos = useTerrains;