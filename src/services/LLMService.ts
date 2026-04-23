// Servicio para consultar el LLM (LiteLLM)

const getLitellmUrl = (): string => {
  if (import.meta.env.VITE_LITELLM_URL) {
    return import.meta.env.VITE_LITELLM_URL;
  }
  // Default - configurar si no está definido
  console.warn('VITE_LITELLM_URL no está configurado');
  return '';
};

const getLitellmModel = (): string => {
  return import.meta.env.VITE_LITELLM_MODEL || 'gpt-4o-mini';
};

const getLitellmApiKey = (): string => {
  return import.meta.env.VITE_LITELLM_API_KEY || '';
};

export interface LLMResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: string;
}

/**
 * Consulta al LLM sobre un producto agrícola
 * @param productName - Nombre del producto
 * @returns Descripción/respuesta del LLM o null si falla
 */
export async function askAboutProduct(productName: string): Promise<string | null> {
  const litellmUrl = getLitellmUrl();
  
  const apiKey = getLitellmApiKey();
  
  if (!litellmUrl) {
    console.warn('LiteLLM no configurado');
    return null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${litellmUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: getLitellmModel(),
        messages: [
          {
            role: 'user',
            content: `Eres un ingeniero agrónomo experto.

Producto: "Eres un ingeniero agrónomo experto.

Producto: "${productName}"
Nota: CBT significa carburante.

Responde de forma técnica, clara y estructurada.

Incluye:

1. ¿Qué es?
2. ¿Para qué se usa?
3. Tipo de producto (fertilizante, herbicida, combustible, etc.)
4. Estado de la materia

5. DOSIS / CANTIDAD POR HECTÁREA (MUY IMPORTANTE)
   - Proporciona un rango típico usado en agricultura (mínimo y máximo).
   - Incluye unidades (L/ha, kg/ha).
   - Si depende del cultivo o formulación, da un ejemplo representativo.
   - Si no hay una dosis exacta, proporciona una estimación basada en usos comunes.

6. Características principales (3 a 5 puntos)

Reglas:
- Puedes usar valores típicos o aproximados si no hay datos exactos.
- Evita decir solo “no hay información” sin intentar dar una referencia.
- Aclara cuando el valor es aproximado.
- debes buscar en internet
- Responde en español.`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error del LLM:', errorData);
      return null;
    }

    const data: LLMResponse = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    return content || null;
  } catch (error) {
    console.error('Error consultando LLM:', error);
    return null;
  }
}