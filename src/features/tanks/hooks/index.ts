import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { tanksService } from '../services';
import { Tank } from '../../../types';

export function useTanks() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadTanks = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = await tanksService.getAll();
        setTanks(data);
      } else {
        const localData = await dbHelpers.getAllTanks();
        setTanks(localData);
      }
    } catch {
      const localData = await dbHelpers.getAllTanks();
      setTanks(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadTanks();
  }, [loadTanks]);

  const addTank = async (data: { name: string; capacity: number }) => {
    const newTank: Tank = {
      id: uuidv4(),
      name: data.name,
      capacity: data.capacity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await tanksService.create(newTank);
        await dbHelpers.addTank(created);
        setTanks(prev => [created, ...prev]);
        return created;
      } catch {
        await dbHelpers.addTank(newTank);
        setTanks(prev => [newTank, ...prev]);
        return newTank;
      }
    } else {
      await dbHelpers.addTank(newTank);
      setTanks(prev => [newTank, ...prev]);
      return newTank;
    }
  };

  const updateTank = async (id: string, data: { name?: string; capacity?: number }) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await tanksService.update(id, updated);
        await dbHelpers.updateTank(id, result);
        setTanks(prev => prev.map(t => t.id === id ? result : t));
        return result;
      } catch {
        await dbHelpers.updateTank(id, updated);
        setTanks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
        return { ...tanks.find(t => t.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateTank(id, updated);
      setTanks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      return { ...tanks.find(t => t.id === id), ...updated };
    }
  };

  const deleteTank = async (id: string) => {
    if (isOnline) {
      try {
        await tanksService.delete(id);
      } catch {}
    }
    await dbHelpers.deleteTank(id);
    setTanks(prev => prev.filter(t => t.id !== id));
  };

  return { tanks, loading, addTank, updateTank, deleteTank, refresh: loadTanks };
}