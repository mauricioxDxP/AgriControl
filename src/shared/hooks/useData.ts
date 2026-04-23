import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../db/database';
import { productsService, lotsService, fieldsService, applicationsService, movementsService, tancadasService, tanksService, syncService } from '../../services';
import { Product, Lot, Field, Application, CreateApplicationInput, Movement, Tancada, Tank, CreateTancadaInput } from '../../types';

// Hook para detectar estado online/offline
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook para productos
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isOnline) {
        const data = await productsService.getAll();
        setProducts(data);
        // Guardar en IndexedDB
        await dbHelpers.clearAllData();
        for (const product of data) {
          await dbHelpers.addProduct(product);
        }
      } else {
        const localData = await dbHelpers.getAllProducts();
        setProducts(localData);
      }
    } catch (err) {
      // Si falla, intentar desde IndexedDB
      const localData = await dbHelpers.getAllProducts();
      setProducts(localData);
      if (localData.length === 0) {
        setError('No hay conexión y no hay datos locales');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = async (data: Partial<Product>) => {
    const newProduct: Product = {
      id: uuidv4(),
      name: data.name || '',
      productCode: data.productCode || null,
      genericName: data.genericName || null,
      typeId: data.typeId || '',
      stateId: data.stateId || '',
      baseUnit: data.baseUnit || 'KG',
      doseType: data.doseType,
      doseUnit: data.doseUnit,
      dosePerHectareMin: data.dosePerHectareMin,
      dosePerHectareMax: data.dosePerHectareMax,
      concentrationPerLiter: data.concentrationPerLiter,
      concentration: data.concentration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await productsService.create(newProduct);
        await dbHelpers.addProduct(created);
        setProducts(prev => [created, ...prev]);
        return created;
      } catch (err) {
        // Guardar offline
        await dbHelpers.addProduct(newProduct);
        setProducts(prev => [newProduct, ...prev]);
        return newProduct;
      }
    } else {
      await dbHelpers.addProduct(newProduct);
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await productsService.update(id, updated);
        await dbHelpers.updateProduct(id, result);
        setProducts(prev => prev.map(p => p.id === id ? result : p));
        return result;
      } catch (err) {
        throw err;
        await dbHelpers.updateProduct(id, updated);
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
        return { ...products.find(p => p.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateProduct(id, updated);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      return { ...products.find(p => p.id === id), ...updated };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (isOnline) {
          await productsService.delete(id);
      }
      await dbHelpers.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refresh: loadProducts };
}

// Hook para lotes
export function useLots(productId?: string) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

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

// Hook para campos
export function useFields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

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

// Hook para aplicaciones
export function useApplications(fieldId?: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

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
      applicationProducts: (products || []).map(p => ({
        id: uuidv4(),
        applicationId: '',
        productId: p.productId,
        dosePerHectare: p.dosePerHectare,
        concentration: p.concentration,
        quantityUsed: p.quantityUsed,
        createdAt: new Date().toISOString(),
        synced: false
      })),
      applicationLots: (lots || []).map(l => ({
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
      applicationProducts: (products || []).map(p => ({
        id: uuidv4(),
        applicationId: id,
        productId: p.productId,
        dosePerHectare: p.dosePerHectare,
        concentration: p.concentration,
        quantityUsed: p.quantityUsed,
        createdAt: new Date().toISOString(),
        synced: false
      })),
      applicationLots: (lots || []).map(l => ({
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

// Hook para sincronización
export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const sync = async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    try {
      const unsyncedData = await dbHelpers.getUnsyncedData();
      const result = await syncService.sync(unsyncedData);
      
      // Guardar datos del servidor en IndexedDB
      if (result.serverData.products) {
        for (const p of result.serverData.products) {
          await dbHelpers.addProduct(p);
        }
      }
      if (result.serverData.lots) {
        for (const l of result.serverData.lots) {
          await dbHelpers.addLot(l);
        }
      }
      if (result.serverData.fields) {
        for (const f of result.serverData.fields) {
          await dbHelpers.addField(f);
        }
      }
      if (result.serverData.applications) {
        for (const a of result.serverData.applications) {
          await dbHelpers.addApplication(a);
        }
      }
      if (result.serverData.movements) {
        for (const m of result.serverData.movements) {
          await dbHelpers.addMovement(m);
        }
      }

      setLastSync(new Date().toISOString());
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync cuando se recupera la conexión
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline]);

  return { syncing, lastSync, sync };
}

// Hook para calcular dosificación
export function useDosageCalculation() {
  const calculate = (
    fieldArea: number,
    dosePerHectare: number,
    concentration: number,
    productState: string
  ) => {
    const productUsed = fieldArea * dosePerHectare;
    let waterNeeded = 0;

    // Para productos líquidos, calcular agua necesaria
    if (productState === 'LIQUIDO' && concentration > 0) {
      // Concentración = (producto / agua) * 100
      // agua = (producto * 100) / concentración
      waterNeeded = (productUsed * 100) / concentration;
    }

    return {
      fieldArea,
      dosePerHectare,
      productUsed,
      concentration,
      waterNeeded
    };
  };

  return { calculate };
}

// Hook para movimientos
export function useMovements(productId?: string) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = productId 
          ? await movementsService.getByProduct(productId)
          : await movementsService.getAll();
        setMovements(data);
      } else {
        const localData = productId
          ? await dbHelpers.getMovementsByProduct(productId)
          : await dbHelpers.getAllMovements();
        setMovements(localData);
      }
    } catch {
      const localData = productId
        ? await dbHelpers.getMovementsByProduct(productId)
        : await dbHelpers.getAllMovements();
      setMovements(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline, productId]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return { movements, loading, refresh: loadMovements };
}

// Hook para Tancadas
export function useTancadas() {
  const [tancadas, setTancadas] = useState<Tancada[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

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
      tancadaProducts: data.products?.map((p: CreateTancadaInput['products'][number]) => ({
        id: uuidv4(),
        tancadaId: '',
        productId: p.productId,
        concentration: p.concentration,
        quantity: p.quantity,
        lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
        createdAt: new Date().toISOString(),
        synced: false
      })),
      tancadaFields: data.fields?.map((f: CreateTancadaInput['fields'][number]) => ({
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
          tancadaProducts: data.products?.map((p: CreateTancadaInput['products'][number]) => ({
            id: uuidv4(),
            tancadaId: id,
            productId: p.productId,
            concentration: p.concentration,
            quantity: p.quantity,
            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
            createdAt: new Date().toISOString(),
            synced: false
          })),
          tancadaFields: data.fields?.map((f: CreateTancadaInput['fields'][number]) => ({
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

// Hook para Tanques
export function useTanks() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

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
