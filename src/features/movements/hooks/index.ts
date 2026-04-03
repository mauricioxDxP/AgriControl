import { useState, useEffect, useCallback } from 'react';
import { dbHelpers } from '../../../db/database';
import { movementsService } from '../services';
import { Movement } from '../../../types';

export function useMovements(productId?: string) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = navigator.onLine;

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