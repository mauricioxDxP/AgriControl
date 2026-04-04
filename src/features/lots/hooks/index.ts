import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { lotsService } from '../services';
import { Lot } from '../../../types';

export function useLots(productId?: string) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadLots = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = productId 
          ? await lotsService.getByProduct(productId)
          : await lotsService.getAll();
        setLots(data);
      } else {
        const localData = productId
          ? await dbHelpers.getLotsByProduct(productId)
          : await dbHelpers.getAllLots();
        setLots(localData);
      }
    } catch {
      const localData = productId
        ? await dbHelpers.getLotsByProduct(productId)
        : await dbHelpers.getAllLots();
      setLots(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline, productId]);

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  const addLot = async (data: Partial<Lot>) => {
    const newLot: Lot = {
      id: uuidv4(),
      productId: data.productId || '',
      entryDate: data.entryDate || new Date().toISOString(),
      expiryDate: data.expiryDate,
      supplier: data.supplier,
      lotCode: data.lotCode,
      initialStock: data.initialStock || 0,
      containerType: data.containerType,
      containerCapacity: data.containerCapacity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await lotsService.create(newLot);
        await dbHelpers.addLot(created);
        setLots(prev => [created, ...prev]);
        return created;
      } catch {
        await dbHelpers.addLot(newLot);
        setLots(prev => [newLot, ...prev]);
        return newLot;
      }
    } else {
      await dbHelpers.addLot(newLot);
      setLots(prev => [newLot, ...prev]);
      return newLot;
    }
  };

  const updateLot = async (id: string, data: Partial<Lot>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await lotsService.update(id, updated);
        await dbHelpers.updateLot(id, result);
        setLots(prev => prev.map(l => l.id === id ? result : l));
        return result;
      } catch {
        await dbHelpers.updateLot(id, updated);
        setLots(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
        return { ...lots.find(l => l.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateLot(id, updated);
      setLots(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
      return { ...lots.find(l => l.id === id), ...updated };
    }
  };

  const deleteLot = async (id: string) => {
    if (isOnline) {
      try {
        
        await lotsService.delete(id);
      } catch {}
    }
    await dbHelpers.deleteLot(id);
    setLots(prev => prev.filter(l => l.id !== id));
  };

  return { lots, loading, addLot, updateLot, deleteLot, refresh: loadLots };
}