// Helper para hacer requests a la API con cache

import { apiCache } from './cache';

// Use environment variable or detect from current location for mobile access
const getApiBase = (): string => {
  // If explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Otherwise, construct from current window location for mobile
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Running on mobile/remote device, use current host
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  // Default to relative path for local development
  return '/api';
};

export const API_BASE = getApiBase();

// Debug log in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE);
}

// Opciones para request con cache
export interface RequestOptions extends RequestInit {
  /** Usar cache (default: true para GET) */
  useCache?: boolean;
  /** TTL del cache en ms (default: 5 min) */
  cacheTTL?: number;
  /** Forzar refresh desde API ignorando cache */
  forceRefresh?: boolean;
}

export async function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const method = options?.method || 'GET';
  const useCache = options?.useCache ?? (method === 'GET'); // Por defecto, cache solo para GET
  const forceRefresh = options?.forceRefresh ?? false;
  const cacheTTL = options?.cacheTTL ?? 5 * 60 * 1000; // 5 min default

  // KEY para cache basada en endpoint
  const cacheKey = endpoint;

  // Para GET: intentar cache primero (stale-while-revalidate)
  if (method === 'GET' && useCache && !forceRefresh) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached) {
      // Devolver cache inmediatamente
      // Luego fetchear en background si hay datos stale
      const meta = apiCache.getMetadata(cacheKey);
      const isStale = meta?.ttl && Date.now() - meta.timestamp > meta.ttl;
      
      if (isStale) {
        // Fetch en background para actualizar cache
        fetchAndCache(url, options, cacheKey, cacheTTL).catch(console.error);
      }
      
      return cached;
    }
  }

  // Fetch desde API o cache vacío
  return fetchAndCache(url, options, cacheKey, useCache ? cacheTTL : 0);
}

// Función helper para fetch y guardar en cache
async function fetchAndCache<T>(
  url: string,
  options: RequestOptions | undefined,
  cacheKey: string,
  cacheTTL: number
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw data;
    }

    // Para respuestas sin contenido (204, etc)
    if (response.status === 204) {
      return undefined as T;
    }

    const json = await response.json();

    // Algunos endpoints devuelven { data: T }, otros devuelven T directamente
    // Si la respuesta tiene un campo 'data', usarlo
    let data: T;
    if (json && typeof json === 'object' && 'data' in json) {
      data = json.data as T;
    } else {
      data = json as T;
    }

    // Guardar en cache si hay TTL
    if (cacheTTL > 0) {
      apiCache.set(cacheKey, data, cacheTTL);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`No se pudo conectar al servidor. Verifica que el backend esté corriendo en ${API_BASE}`);
    }
    throw error;
  }
}
