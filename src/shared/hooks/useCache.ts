// Hook para acceder al cache y forzar refresh
import { useCallback } from 'react';
import { apiCache } from '../services/cache';

export function useCacheInvalidation() {
  /**
   * Invalidar cache de un recurso específico
   * ej: 'products', 'lots', 'movements'
   */
  const invalidateResource = useCallback((resource: string) => {
    apiCache.invalidateResource(resource);
  }, []);

  /**
   * Invalidar una ruta específica
   */
  const invalidate = useCallback((endpoint: string) => {
    apiCache.invalidate(endpoint);
  }, []);

  /**
   * Limpiar todo el cache
   */
  const clearCache = useCallback(() => {
    apiCache.clear();
  }, []);

  /**
   * Forzar refresh de un endpoint específico
   */
  const refresh = useCallback((endpoint: string) => {
    apiCache.invalidate(endpoint);
  }, []);

  return {
    invalidateResource,
    invalidate,
    clearCache,
    refresh
  };
}

// Exportar funciones directas también (sin hook)
export { apiCache as cache };

export default apiCache;