import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../db/database';
import { productsApi, lotsApi, fieldsApi, applicationsApi, containersApi, movementsApi, tancadasApi, tanksApi, syncApi } from '../services/api';
import { Product, Lot, Field, Application, CreateApplicationInput, Container, Movement, Tancada, Tank, CreateTancadaInput } from '../types';

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
        const data = await productsApi.getAll();
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
      type: data.type || 'SEMILLA',
      state: data.state || 'SOLIDO',
      baseUnit: data.baseUnit || 'KG',
      dosePerHectareMin: data.dosePerHectareMin,
      dosePerHectareMax: data.dosePerHectareMax,
      concentration: data.concentration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await productsApi.create(newProduct);
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
        const result = await productsApi.update(id, updated);
        await dbHelpers.updateProduct(id, result);
        setProducts(prev => prev.map(p => p.id === id ? result : p));
        return result;
      } catch (err) {
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
    if (isOnline) {
      try {
        await productsApi.delete(id);
      } catch (err) {
        // Ignorar error offline
      }
    }
    await dbHelpers.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
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
          ? await lotsApi.getByProduct(productId)
          : await lotsApi.getAll();
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
      initialStock: data.initialStock || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await lotsApi.create(newLot);
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

  const deleteLot = async (id: string) => {
    if (isOnline) {
      try {
        await lotsApi.delete(id);
      } catch {}
    }
    await dbHelpers.deleteLot(id);
    setLots(prev => prev.filter(l => l.id !== id));
  };

  return { lots, loading, addLot, deleteLot, refresh: loadLots };
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
        const data = await fieldsApi.getAll();
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
        const created = await fieldsApi.create(newField);
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
        const result = await fieldsApi.update(id, updated);
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
        await fieldsApi.delete(id);
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
          ? await applicationsApi.getByField(fieldId)
          : await applicationsApi.getAll();
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
        const created = await applicationsApi.create({ ...appData, products, lots });
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
        await applicationsApi.delete(id);
      } catch {}
    }
    await dbHelpers.deleteApplication(id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  return { applications, loading, addApplication, deleteApplication, refresh: loadApplications };
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
      const result = await syncApi.sync(unsyncedData);
      
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
    productState: 'LIQUIDO' | 'SOLIDO'
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

// Hook para contenedores
export function useContainers(lotId?: string) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const loadContainers = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const data = lotId 
          ? await containersApi.getByLot(lotId)
          : await containersApi.getAll();
        setContainers(data);
      } else {
        const localData = lotId
          ? await dbHelpers.getContainersByLot(lotId)
          : await dbHelpers.getAllContainers();
        setContainers(localData);
      }
    } catch {
      const localData = lotId
        ? await dbHelpers.getContainersByLot(lotId)
        : await dbHelpers.getAllContainers();
      setContainers(localData);
    } finally {
      setLoading(false);
    }
  }, [isOnline, lotId]);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  const addContainer = async (data: Partial<Container>) => {
    const newContainer: Container = {
      id: uuidv4(),
      lotId: data.lotId || '',
      type: data.type || 'BIDON',
      capacity: data.capacity || 0,
      unit: data.unit || 'L',
      status: data.status || 'DISPONIBLE',
      name: data.name,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await containersApi.create(newContainer);
        await dbHelpers.addContainer(created);
        setContainers(prev => [created, ...prev]);
        return created;
      } catch {
        await dbHelpers.addContainer(newContainer);
        setContainers(prev => [newContainer, ...prev]);
        return newContainer;
      }
    } else {
      await dbHelpers.addContainer(newContainer);
      setContainers(prev => [newContainer, ...prev]);
      return newContainer;
    }
  };

  const updateContainer = async (id: string, data: Partial<Container>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await containersApi.update(id, updated);
        await dbHelpers.updateContainer(id, result);
        setContainers(prev => prev.map(c => c.id === id ? result : c));
        return result;
      } catch {
        await dbHelpers.updateContainer(id, updated);
        setContainers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
        return { ...containers.find(c => c.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateContainer(id, updated);
      setContainers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      return { ...containers.find(c => c.id === id), ...updated };
    }
  };

  const consumeContainer = async (id: string, quantity: number) => {
    // Consume is handled by the API - just refresh the list
    await containersApi.consume(id, quantity);
    await loadContainers();
  };

  const deleteContainer = async (id: string) => {
    if (isOnline) {
      try {
        await containersApi.delete(id);
      } catch {}
    }
    await dbHelpers.deleteContainer(id);
    setContainers(prev => prev.filter(c => c.id !== id));
  };

  return { containers, loading, addContainer, updateContainer, consumeContainer, deleteContainer, refresh: loadContainers };
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
          ? await movementsApi.getByProduct(productId)
          : await movementsApi.getAll();
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
        const data = await tancadasApi.getAll();
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
        const created = await tancadasApi.create(data);
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
        await tancadasApi.delete(id);
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
        const result = await tancadasApi.update(id, data);
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
        const data = await tanksApi.getAll();
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
        const created = await tanksApi.create(newTank);
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
        const result = await tanksApi.update(id, updated);
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
        await tanksApi.delete(id);
      } catch {}
    }
    await dbHelpers.deleteTank(id);
    setTanks(prev => prev.filter(t => t.id !== id));
  };

  return { tanks, loading, addTank, updateTank, deleteTank, refresh: loadTanks };
}
