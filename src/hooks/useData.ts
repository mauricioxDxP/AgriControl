import { useState, useEffect } from 'react';
import { dbHelpers } from '../db/database';
import { syncService } from '../services';
import { Field } from '../types';

// Re-export from features for backwards compatibility
export { useProducts } from '../features/products/hooks';
export { useLots } from '../features/lots/hooks';
export { useFields } from '../features/fields/hooks';
export { useApplications } from '../features/applications/hooks';
export { useMovements } from '../features/movements/hooks';
export { useTancadas } from '../features/tancadas/hooks';
export { useTanks } from '../features/tanks/hooks';
export { useTerrains } from '../features/terrains/hooks';
export { usePlantings } from '../features/plantings/hooks';
export { usePlantedProductTypes } from '../features/settings/hooks';

// Aliases for backwards compatibility
export { useCampos } from '../features/fields/hooks';
export { useSiembra, useSiembras } from '../features/plantings/hooks';
export { useTerrenos } from '../features/terrains/hooks';

// useOnlineStatus - simple helper for connection status
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

// Hook for synchronization
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
      
      // Save server data to IndexedDB
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
          await dbHelpers.addField(f as Field);
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

  // Auto-sync when connection is restored
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline]);

  return { syncing, lastSync, sync };
}

// Hook for dosage calculation
export function useDosageCalculation() {
  const calculate = (
    fieldArea: number,
    dosePerHectare: number,
    concentration: number,
    productState: string
  ) => {
    const productUsed = fieldArea * dosePerHectare;
    let waterNeeded = 0;

    // For liquid products, calculate water needed
    if (productState === 'LIQUIDO' && concentration > 0) {
      // Concentration = (product / water) * 100
      // water = (product * 100) / concentration
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
// NOTE: Entity hooks were distributed to features/
//
//   useProducts     → features/products/hooks
//   useLots         → features/lots/hooks
//   useFields       → features/fields/hooks
//   useApplications → features/applications/hooks
//   useContainers   → features/containers/hooks
//   useMovements    → features/movements/hooks
//   useTancadas     → features/tancadas/hooks
//   useTanks        → features/tanks/hooks
//   useTerrains     → features/terrains/hooks
//   usePlantings    → features/plantings/hooks
//
//   Use direct imports from features/ folders for better organization
// ═══════════════════════════════════════════════════════════════════════════