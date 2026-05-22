import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { machineryService } from '../services';
import { Machinery } from '../../../types';

export function useMachinery() {
  const [machineries, setMachineries] = useState<Machinery[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadMachinery = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = await machineryService.getAll();
        setMachineries(data);
      } else {
        const localData = await dbHelpers.getAllMachinery();
        setMachineries(localData);
      }
    } catch {
      const localData = await dbHelpers.getAllMachinery();
      setMachineries(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadMachinery();
  }, [loadMachinery]);

  const addMachinery = async (data: { name: string }) => {
    const newMachinery: Machinery = {
      id: uuidv4(),
      name: data.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await machineryService.create(newMachinery);
        await dbHelpers.addMachinery(created);
        setMachineries(prev => [created, ...prev]);
        return created;
      } catch {
        await dbHelpers.addMachinery(newMachinery);
        setMachineries(prev => [newMachinery, ...prev]);
        return newMachinery;
      }
    } else {
      await dbHelpers.addMachinery(newMachinery);
      setMachineries(prev => [newMachinery, ...prev]);
      return newMachinery;
    }
  };

  const updateMachinery = async (id: string, data: { name?: string }) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await machineryService.update(id, updated);
        await dbHelpers.updateMachinery(id, result);
        setMachineries(prev => prev.map(m => m.id === id ? result : m));
        return result;
      } catch {
        await dbHelpers.updateMachinery(id, updated);
        setMachineries(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
        return { ...machineries.find(m => m.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateMachinery(id, updated);
      setMachineries(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      return { ...machineries.find(m => m.id === id), ...updated };
    }
  };

  const deleteMachinery = async (id: string) => {
    if (isOnline) {
      try {
        await machineryService.delete(id);
      } catch {}
    }
    await dbHelpers.deleteMachinery(id);
    setMachineries(prev => prev.filter(m => m.id !== id));
  };

  return { machineries, loading, addMachinery, updateMachinery, deleteMachinery, refresh: loadMachinery };
}