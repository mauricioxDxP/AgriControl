import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { fieldsService } from '../services';
import { Field } from '../../../types';

export function useFields(terrainId?: string) {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = navigator.onLine;

  const loadFields = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isOnline) {
        const data = terrainId 
          ? await fieldsService.getByTerrain(terrainId)
          : await fieldsService.getAll();
        setFields(data);
        // Save to IndexedDB for offline access
        await dbHelpers.clearFields();
        for (const field of data) {
          await dbHelpers.addField(field);
        }
      } else {
        const localData = terrainId 
          ? await dbHelpers.getFieldsByTerrain(terrainId)
          : await dbHelpers.getAllFields();
        setFields(localData);
      }
    } catch (err) {
      // Try to load from IndexedDB on error
      const localData = terrainId 
        ? await dbHelpers.getFieldsByTerrain(terrainId)
        : await dbHelpers.getAllFields();
      setFields(localData);
      if (localData.length === 0) {
        setError('No connection and no local data');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, terrainId]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const addField = async (data: Partial<Field>) => {
    const newField: Field = {
      id: uuidv4(),
      name: data.name || '',
      area: data.area || 0,
      terrainId: data.terrainId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await fieldsService.create(newField);
        await dbHelpers.addField(created);
        setFields(prev => [created, ...prev]);
        return created;
      } catch (err) {
        // Save offline
        await dbHelpers.addField(newField);
        setFields(prev => [newField, ...prev]);
        return newField;
      }
    } else {
      await dbHelpers.addField(newField);
      setFields(prev => [newField, ...prev]);
      return newField;
    }
  };

  const updateField = async (id: string, data: Partial<Field>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await fieldsService.update(id, updated);
        await dbHelpers.updateField(id, result);
        setFields(prev => prev.map(f => f.id === id ? result : f));
        return result;
      } catch (err) {
        await dbHelpers.updateField(id, updated);
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
        return { ...fields.find(f => f.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateField(id, updated);
      setFields(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
      return { ...fields.find(f => f.id === id), ...updated };
    }
  };

  const deleteField = async (id: string) => {
    try {
      if (isOnline) {
        await fieldsService.delete(id);
      }
      await dbHelpers.deleteField(id);
      setFields(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting field:', err);
      throw err;
    }
  };

  return { fields, loading, error, addField, updateField, deleteField, refresh: loadFields };
}

// Alias for backwards compatibility
export const useCampos = useFields;