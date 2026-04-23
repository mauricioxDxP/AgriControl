// Servicio para buscar productos via Flowise (proxyado por el backend)

const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || '';
};

/**
 * Busca productos via Flowise (el backend hace de proxy para evitar CORS).
 */
export async function searchProductsFlowise(query: string): Promise<string[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl || !query.trim()) return [];

  try {
    const response = await fetch(`${apiUrl}/products/flowise-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error('Flowise search error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.results ?? [];
  } catch (error) {
    console.error('Error en búsqueda Flowise:', error);
    return [];
  }
}