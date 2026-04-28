import { useState, useEffect } from 'react';
import { inventoryCountService, InventoryCount, InventoryCountAdjustment } from '../services';

export function useInventoryCounts() {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryCountService.getAll();
      setCounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading inventory counts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { counts, loading, error, refresh };
}

export function useInventoryCount(id: string | null) {
  const [count, setCount] = useState<InventoryCount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setCount(null);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await inventoryCountService.getById(id);
        setCount(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading inventory count');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id]);

  return { count, loading, error };
}

export function usePendingAdjustments() {
  const [adjustments, setAdjustments] = useState<InventoryCountAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryCountService.getPendingAdjustments();
      setAdjustments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading pending adjustments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { adjustments, loading, error, refresh };
}
