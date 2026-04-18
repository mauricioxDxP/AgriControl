import { useState, useEffect } from 'react';
import { dbHelpers } from '../db/database';
import { syncService } from '../services';

// Re-export desde features para compatibilidad hacia atrás
export { useProducts } from '../features/products/hooks';
export { useLots } from '../features/lots/hooks';
export { useFields } from '../features/fields/hooks';
export { useApplications } from '../features/applications/hooks';
export { useMovements } from '../features/movements/hooks';
export { useTancadas } from '../features/tancadas/hooks';
export { useTanks } from '../features/tanks/hooks';

// useOnlineStatus - helper simple para estado de conexión
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

// ═══════════════════════════════════════════════════════════════════════════
// NOTA: Los hooks de entidades fueron distribuidos a features/
//
//   useProducts     → features/products/hooks
//   useLots         → features/lots/hooks
//   useFields       → features/fields/hooks
//   useApplications → features/applications/hooks
//   useContainers   → features/containers/hooks
//   useMovements    → features/movements/hooks
//   useTancadas     → features/tancadas/hooks
//   useTanks        → features/tanks/hooks
//
//   Usa imports directos desde las carpetas features/ para mejor organización
// ═══════════════════════════════════════════════════════════════════════════