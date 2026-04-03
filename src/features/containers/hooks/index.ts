import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { lotLinesService } from '../services';
import { LotLine } from '../../../types';

export function useLotLines(lotId?: string) {
  const [lotLines, setLotLines] = useState<LotLine[]>(() => []);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadLotLines = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = lotId 
          ? await lotLinesService.getByLot(lotId)
          : await lotLinesService.getAll();
        setLotLines(Array.isArray(data) ? data : []);
      } else {
        const localData = lotId
          ? await dbHelpers.getLotLinesByLot(lotId)
          : await dbHelpers.getAllLotLines();
        setLotLines(Array.isArray(localData) ? localData : []);
      }
    } catch {
      const localData = lotId
        ? await dbHelpers.getLotLinesByLot(lotId)
        : await dbHelpers.getAllLotLines();
      setLotLines(Array.isArray(localData) ? localData : []);
    } finally {
      setLoading(false);
    }
  }, [isOnline, lotId]);

  useEffect(() => {
    loadLotLines();
  }, [loadLotLines]);

  const addLotLine = async (data: Partial<LotLine>) => {
    const newLotLine: LotLine = {
      id: uuidv4(),
      lotId: data.lotId || '',
      productId: data.productId || '',
      type: data.type || 'FULL',
      units: data.units || 1,
      remainingVolume: data.remainingVolume ?? data.capacity ?? undefined,
      capacity: data.capacity || 0,
      unit: data.unit || 'L',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    // Limpiar propiedades undefined
    const cleanLotLine = Object.fromEntries(
      Object.entries(newLotLine).filter(([_, v]) => v !== undefined)
    ) as LotLine;

    if (isOnline) {
      try {
        // Ignorar la respuesta del servidor, usar nuestro propio ID
        await lotLinesService.create(cleanLotLine);
        await dbHelpers.addLotLine(cleanLotLine);
        setLotLines(prev => Array.isArray(prev) ? [cleanLotLine, ...prev] : [cleanLotLine]);
        return cleanLotLine;
      } catch (err) {
        console.error('Error creating LotLine:', err);
        await dbHelpers.addLotLine(cleanLotLine);
        setLotLines(prev => Array.isArray(prev) ? [cleanLotLine, ...prev] : [cleanLotLine]);
        return cleanLotLine;
      }
    } else {
      await dbHelpers.addLotLine(cleanLotLine);
      setLotLines(prev => Array.isArray(prev) ? [cleanLotLine, ...prev] : [cleanLotLine]);
      return cleanLotLine;
    }
  };

  const updateLotLine = async (id: string, data: Partial<LotLine>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    const currentLines = Array.isArray(lotLines) ? lotLines : [];
    
    if (isOnline) {
      try {
        const result = await lotLinesService.update(id, updated);
        await dbHelpers.updateLotLine(id, result);
        setLotLines(prev => Array.isArray(prev) ? prev.map(l => l.id === id ? result : l) : []);
        return result;
      } catch {
        await dbHelpers.updateLotLine(id, updated);
        setLotLines(prev => Array.isArray(prev) ? prev.map(l => l.id === id ? { ...l, ...updated } : l) : []);
        return { ...currentLines.find(l => l.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateLotLine(id, updated);
      setLotLines(prev => Array.isArray(prev) ? prev.map(l => l.id === id ? { ...l, ...updated } : l) : []);
      return { ...currentLines.find(l => l.id === id), ...updated };
    }
  };

  const consumeLotLine = async (id: string, quantity: number) => {
    const currentLines = Array.isArray(lotLines) ? lotLines : [];
    
    if (isOnline) {
      try {
        await lotLinesService.consume(id, quantity);
      } catch {
        // En offline, actualizar localmente
        const lotLine = currentLines.find(l => l.id === id);
        if (lotLine) {
          let newRemaining = (lotLine.remainingVolume || lotLine.capacity) - quantity;
          let newUnits = lotLine.units;
          let newType: 'FULL' | 'PARTIAL' | 'EMPTY' = lotLine.type;

          if (lotLine.type === 'FULL') {
            newType = 'PARTIAL';
          } else if (lotLine.type === 'PARTIAL') {
            if (newRemaining <= 0) {
              newRemaining = 0;
              newType = 'EMPTY';
              newUnits = lotLine.units - 1;
              if (newUnits > 0) {
                newRemaining = lotLine.capacity;
                newType = 'FULL';
              }
            }
          }

          await updateLotLine(id, {
            type: newType,
            units: newUnits,
            remainingVolume: newRemaining
          });
        }
      }
    }
    await loadLotLines();
  };

  const rechargeLotLine = async (id: string, quantity?: number) => {
    const currentLines = Array.isArray(lotLines) ? lotLines : [];
    
    if (isOnline) {
      try {
        await lotLinesService.recharge(id, quantity);
      } catch {
        // En offline, actualizar localmente
        const lotLine = currentLines.find(l => l.id === id);
        if (lotLine) {
          let newRemaining = quantity || lotLine.capacity;
          let newUnits = lotLine.units;
          let newType: 'FULL' | 'PARTIAL' | 'EMPTY' = lotLine.type;

          if (lotLine.type === 'EMPTY') {
            newType = 'PARTIAL';
            newUnits = lotLine.units + 1;
          } else if (lotLine.type === 'PARTIAL') {
            newRemaining = (lotLine.remainingVolume || 0) + (quantity || lotLine.capacity);
            if (newRemaining >= lotLine.capacity) {
              newRemaining = lotLine.capacity;
              newType = 'FULL';
            }
          }

          await updateLotLine(id, {
            type: newType,
            units: newUnits,
            remainingVolume: newRemaining
          });
        }
      }
    }
    await loadLotLines();
  };

  const deleteLotLine = async (id: string) => {
    if (isOnline) {
      try {
        await lotLinesService.delete(id);
      } catch {}
    }
    await dbHelpers.deleteLotLine(id);
    setLotLines(prev => Array.isArray(prev) ? prev.filter(l => l.id !== id) : []);
  };

  return { lotLines, loading, addLotLine, updateLotLine, consumeLotLine, rechargeLotLine, deleteLotLine, refresh: loadLotLines };
}
