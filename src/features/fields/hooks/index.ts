import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { fieldsService } from '../services';
import { Field } from '../../../types';

export function useFields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadFields = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = await fieldsService.getAll();
        setFields(data);
      } else {
        setFields(await dbHelpers.getAllFields());
      }
    } catch {
      setFields(await dbHelpers.getAllFields());
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const addField = async (data: Partial<Field>) => {
    const newField: Field = {
      id: uuidv4(),
      name: data.name || '',
      area: data.area || 0,
      location: data.location,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      productId: data.productId ?? null,
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
      } catch {
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
      } catch {
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
    if (isOnline) {
      try {
        await fieldsService.delete(id);
      } catch {}
    }
    await dbHelpers.deleteField(id);
    setFields(prev => prev.filter(f => f.id !== id));
  };

  return { fields, loading, addField, updateField, deleteField, refresh: loadFields };
}