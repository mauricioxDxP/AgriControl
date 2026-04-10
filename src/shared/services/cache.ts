// In-memory cache para API responses
// Implementa stale-while-revalidate strategy

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // tiempo en ms, undefined = sin expiración
}

interface CacheMetadata {
  timestamp: number;
  ttl?: number;
}

// Cache en memoria - persiste durante la sesión
const cache = new Map<string, CacheEntry<unknown>>();

// TTL por defecto: 5 minutos
const DEFAULT_TTL = 5 * 60 * 1000;

export const apiCache = {
  /**
   * Obtener dato del cache
   */
  get<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    // Verificar si expiró
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  },

  /**
   * Obtener metadata del cache (para verificar staleness)
   */
  getMetadata(key: string): CacheMetadata | null {
    const entry = cache.get(key);
    if (!entry) return null;
    return { timestamp: entry.timestamp, ttl: entry.ttl };
  },

  /**
   * Obtener dato del cache SIN verificar expiración
   * Útil para stale-while-revalidate
   */
getUnsafe<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    return entry.data;
  },

  /**
   * Guardar dato en cache
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl > 0 ? ttl : undefined
    });
  },

  /**
   * Invalidar una entrada específica
   */
  invalidate(key: string): void {
    cache.delete(key);
  },

  /**
   * Invalidar entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  },

  /**
   * Invalidar todas las entradas de un recurso específico
   * Ej: 'products', 'lots', 'movements'
   */
  invalidateResource(resource: string): void {
    const prefix = `/${resource}`;
    for (const key of cache.keys()) {
      if (key.startsWith(prefix) || key.includes(`/${resource}`)) {
        cache.delete(key);
      }
    }
  },

  /**
   * Limpiar todo el cache
   */
  clear(): void {
    cache.clear();
  },

  /**
   * Obtener todas las keys del cache (para debugging)
   */
  keys(): string[] {
    return Array.from(cache.keys());
  },

  /**
   * Verificar si existe en cache (sin importar expiración)
   */
  has(key: string): boolean {
    return cache.has(key);
  }
};

export default apiCache;