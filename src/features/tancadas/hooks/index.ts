import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { tancadasService } from '../services';
import { Tancada, CreateTancadaInput } from '../../../types';

export function useTancadas() {
  const [tancadas, setTancadas] = useState<Tancada[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadTancadas = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = await tancadasService.getAll();
        setTancadas(data);
      } else {
        const localData = await dbHelpers.getAllTancadas();
        setTancadas(localData);
      }
    } catch {
      const localData = await dbHelpers.getAllTancadas();
      setTancadas(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadTancadas();
  }, [loadTancadas]);

  const addTancada = async (data: CreateTancadaInput) => {
    const newTancada: Tancada = {
      id: uuidv4(),
      date: data.date || new Date().toISOString(),
      tankCapacity: data.tankCapacity,
      waterAmount: data.waterAmount,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
      tancadaProducts: data.products?.map(p => ({
        id: uuidv4(),
        tancadaId: '',
        productId: p.productId,
        concentration: p.concentration,
        quantity: p.quantity,
        lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
        createdAt: new Date().toISOString(),
        synced: false
      })),
      tancadaFields: data.fields?.map(f => ({
        id: uuidv4(),
        tancadaId: '',
        fieldId: f.fieldId,
        hectaresTreated: f.hectaresTreated,
        productUsed: f.productUsed,
        createdAt: new Date().toISOString(),
        synced: false
      }))
    };

    if (isOnline) {
      try {
        const created = await tancadasService.create(data);
        await dbHelpers.addTancada(created);
        setTancadas(prev => [created, ...prev]);
        return created;
      } catch {
        await dbHelpers.addTancada(newTancada);
        setTancadas(prev => [newTancada, ...prev]);
        return newTancada;
      }
    } else {
      await dbHelpers.addTancada(newTancada);
      setTancadas(prev => [newTancada, ...prev]);
      return newTancada;
    }
  };

  const deleteTancada = async (id: string) => {
    // Optimistic delete - remove from UI immediately
    setTancadas(prev => prev.filter(t => t.id !== id));
    
    try {
      if (isOnline) {
        // Try to delete from API
        await tancadasService.delete(id);
      }
      // Also delete from local DB
      await dbHelpers.deleteTancada(id);
    } catch (error) {
      console.error('Error deleting tancada:', error);
      // Reload to sync state if error
      loadTancadas();
    }
  };

  const updateTancada = async (id: string, data: CreateTancadaInput) => {
    if (isOnline) {
      try {
        const result = await tancadasService.update(id, data);
        await dbHelpers.addTancada(result);
        setTancadas(prev => prev.map(t => t.id === id ? result : t));
        return result;
      } catch {
        // Handle offline
        const localTancada: Tancada = {
          id,
          date: data.date || new Date().toISOString(),
          tankCapacity: data.tankCapacity,
          waterAmount: data.waterAmount,
          notes: data.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: false,
          tancadaProducts: data.products?.map(p => ({
            id: uuidv4(),
            tancadaId: id,
            productId: p.productId,
            concentration: p.concentration,
            quantity: p.quantity,
            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
            createdAt: new Date().toISOString(),
            synced: false
          })),
          tancadaFields: data.fields?.map(f => ({
            id: uuidv4(),
            tancadaId: id,
            fieldId: f.fieldId,
            hectaresTreated: f.hectaresTreated,
            productUsed: f.productUsed,
            createdAt: new Date().toISOString(),
            synced: false
          }))
        };
        await dbHelpers.addTancada(localTancada);
        setTancadas(prev => prev.map(t => t.id === id ? localTancada : t));
        return localTancada;
      }
    } else {
      const localTancada: Tancada = {
        id,
        date: data.date || new Date().toISOString(),
        tankCapacity: data.tankCapacity,
        waterAmount: data.waterAmount,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
        tancadaProducts: data.products?.map(p => ({
          id: uuidv4(),
          tancadaId: id,
          productId: p.productId,
          concentration: p.concentration,
          quantity: p.quantity,
          lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
          createdAt: new Date().toISOString(),
          synced: false
        })),
        tancadaFields: data.fields?.map(f => ({
          id: uuidv4(),
          tancadaId: id,
          fieldId: f.fieldId,
          hectaresTreated: f.hectaresTreated,
          productUsed: f.productUsed,
          createdAt: new Date().toISOString(),
          synced: false
        }))
      };
      await dbHelpers.addTancada(localTancada);
      setTancadas(prev => prev.map(t => t.id === id ? localTancada : t));
      return localTancada;
    }
  };

  return { tancadas, loading, addTancada, updateTancada, deleteTancada, refresh: loadTancadas };
}