// Helper para hacer requests a la API

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

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
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
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as T;
    }
    
    return json as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`No se pudo conectar al servidor. Verifica que el backend esté corriendo en ${API_BASE}`);
    }
    throw error;
  }
}
