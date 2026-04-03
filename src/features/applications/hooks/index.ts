import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { applicationsService } from '../services';
import { Application, CreateApplicationInput } from '../../../types';

export function useApplications(fieldId?: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = fieldId
          ? await applicationsService.getByField(fieldId)
          : await applicationsService.getAll();
        setApplications(data);
      } else {
        const localData = fieldId
          ? await dbHelpers.getApplicationsByField(fieldId)
          : await dbHelpers.getAllApplications();
        setApplications(localData);
      }
    } catch {
      const localData = fieldId
        ? await dbHelpers.getApplicationsByField(fieldId)
        : await dbHelpers.getAllApplications();
      setApplications(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline, fieldId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const addApplication = async (data: CreateApplicationInput) => {
    const { lots, products, ...appData } = data;
    const newApplication: Application = {
      id: uuidv4(),
      fieldId: appData.fieldId || '',
      type: appData.type || 'FUMIGACION',
      date: appData.date || new Date().toISOString(),
      waterAmount: appData.waterAmount,
      notes: appData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
      applicationProducts: products?.map(p => ({
        id: uuidv4(),
        applicationId: '',
        productId: p.productId,
        dosePerHectare: p.dosePerHectare,
        concentration: p.concentration,
        quantityUsed: p.quantityUsed,
        createdAt: new Date().toISOString(),
        synced: false
      })),
      applicationLots: lots?.map(l => ({
        id: uuidv4(),
        applicationId: '',
        lotId: l.lotId,
        quantityUsed: l.quantityUsed,
        createdAt: new Date().toISOString(),
        synced: false
      }))
    };

    if (isOnline) {
      try {
        const created = await applicationsService.create({ ...appData, products, lots });
        await dbHelpers.addApplication(created);
        setApplications(prev => [created, ...prev]);
        return created;
      } catch {
        await dbHelpers.addApplication(newApplication);
        setApplications(prev => [newApplication, ...prev]);
        return newApplication;
      }
    } else {
      await dbHelpers.addApplication(newApplication);
      setApplications(prev => [newApplication, ...prev]);
      return newApplication;
    }
  };

  const deleteApplication = async (id: string) => {
    if (isOnline) {
      try {
        await applicationsService.delete(id);
      } catch {}
    }
    await dbHelpers.deleteApplication(id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  const updateApplication = async (id: string, data: CreateApplicationInput) => {
    const { lots, products, ...appData } = data;
    const updatedApplication: Application = {
      id,
      fieldId: appData.fieldId || '',
      type: appData.type || 'FUMIGACION',
      date: appData.date || new Date().toISOString(),
      waterAmount: appData.waterAmount,
      notes: appData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
      applicationProducts: products?.map(p => ({
        id: uuidv4(),
        applicationId: id,
        productId: p.productId,
        dosePerHectare: p.dosePerHectare,
        concentration: p.concentration,
        quantityUsed: p.quantityUsed,
        createdAt: new Date().toISOString(),
        synced: false
      })),
      applicationLots: lots?.map(l => ({
        id: uuidv4(),
        applicationId: id,
        lotId: l.lotId,
        quantityUsed: l.quantityUsed,
        createdAt: new Date().toISOString(),
        synced: false
      }))
    };

    if (isOnline) {
      try {
        const updated = await applicationsService.update(id, { ...appData, products, lots });
        await dbHelpers.updateApplication(id, updated);
        setApplications(prev => prev.map(a => a.id === id ? updated : a));
        return updated;
      } catch {
        await dbHelpers.updateApplication(id, updatedApplication);
        setApplications(prev => prev.map(a => a.id === id ? updatedApplication : a));
        return updatedApplication;
      }
    } else {
      await dbHelpers.updateApplication(id, updatedApplication);
      setApplications(prev => prev.map(a => a.id === id ? updatedApplication : a));
      return updatedApplication;
    }
  };

  return { applications, loading, addApplication, updateApplication, deleteApplication, refresh: loadApplications };
}