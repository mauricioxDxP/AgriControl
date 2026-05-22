import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { operatorService } from '../services';
import { Operator } from '../../../types';

export function useOperator() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadOperator = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = await operatorService.getAll();
        setOperators(data);
      } else {
        const localData = await dbHelpers.getAllOperators();
        setOperators(localData);
      }
    } catch {
      const localData = await dbHelpers.getAllOperators();
      setOperators(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadOperator();
  }, [loadOperator]);

  const addOperator = async (data: { name: string }) => {
    const newOperator: Operator = {
      id: uuidv4(),
      name: data.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await operatorService.create(newOperator);
        await dbHelpers.addOperator(created);
        setOperators(prev => [created, ...prev]);
        return created;
      } catch {
        await dbHelpers.addOperator(newOperator);
        setOperators(prev => [newOperator, ...prev]);
        return newOperator;
      }
    } else {
      await dbHelpers.addOperator(newOperator);
      setOperators(prev => [newOperator, ...prev]);
      return newOperator;
    }
  };

  const updateOperator = async (id: string, data: { name?: string }) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await operatorService.update(id, updated);
        await dbHelpers.updateOperator(id, result);
        setOperators(prev => prev.map(o => o.id === id ? result : o));
        return result;
      } catch {
        await dbHelpers.updateOperator(id, updated);
        setOperators(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
        return { ...operators.find(o => o.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateOperator(id, updated);
      setOperators(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
      return { ...operators.find(o => o.id === id), ...updated };
    }
  };

  const deleteOperator = async (id: string) => {
    if (isOnline) {
      try {
        await operatorService.delete(id);
      } catch {}
    }
    await dbHelpers.deleteOperator(id);
    setOperators(prev => prev.filter(o => o.id !== id));
  };

  return { operators, loading, addOperator, updateOperator, deleteOperator, refresh: loadOperator };
}