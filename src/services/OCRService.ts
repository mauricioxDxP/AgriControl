import { createWorker, PSM } from 'tesseract.js';

export interface WordBlock {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface OCRResult {
  text: string;
  words: WordBlock[];
  hocr: string | null;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Preprocesa la imagen para mejorar el reconocimiento de OCR
 * Convierte a escala de grises, ajusta contraste y detecta inversión
 */
export const preprocessImage = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): string => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convertir a escala de grises
  const gray = new Uint8ClampedArray(width * height);
  let min = 255, max = 0;
  let darkPixels = 0;
  let lightPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    // Fórmula de luminancia
    const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i / 4] = v;
    if (v < min) min = v;
    if (v > max) max = v;

    // Contar pixeles oscuros y claros para detectar inversión
    if (v < 64) darkPixels++;
    if (v > 192) lightPixels++;
  }

  // Detectar si el fondo es oscuro (texto claro) o claro (texto oscuro)
  const isDarkBackground = darkPixels > lightPixels * 1.5;

  // Invertir si es texto claro sobre fondo oscuro
  if (isDarkBackground) {
    for (let i = 0; i < gray.length; i++) {
      gray[i] = 255 - gray[i];
    }
    min = 0;
    max = 255;
  }

  // Escalado de contraste para hacer el texto más definido
  const range = max - min || 1;
  for (let i = 0; i < gray.length; i++) {
    const normalized = (gray[i] - min) / range;
    gray[i] = Math.min(255, normalized * 255 * 1.4);
  }

  // Escribir de vuelta
  for (let i = 0; i < data.length; i += 4) {
    const g = gray[i / 4];
    data[i] = g;
    data[i + 1] = g;
    data[i + 2] = g;
  }

  ctx.putImageData(imageData, 0, 0);
  return ctx.canvas.toDataURL('image/jpeg', 0.95);
};

/**
 * Ejecuta OCR sobre una imagen y retorna el texto junto con las palabras detectadas
 */
export const runOCR = async (
  imageDataUrl: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const MIN_CONFIDENCE = 30;

  // Obtener dimensiones de la imagen
  let imageWidth = 640;
  let imageHeight = 480;
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        imageWidth = img.naturalWidth;
        imageHeight = img.naturalHeight;
        resolve();
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  } catch (e) {
    console.warn('No se pudieron obtener dimensiones de imagen:', e);
  }

  // Callback para progreso
  const updateProgress = (m: any) => {
    if (m.status === 'recognizing text' && onProgress) {
      onProgress(Math.round(m.progress * 100));
    }
  };

  // Crear worker con config optimizada
  const worker = await createWorker('spa', 1, { logger: updateProgress });

  try {
    // Configurar parámetros
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO_OSD,
    });

    // Solicitar hOCR que tiene mejor info de posición
    const { data } = await worker.recognize(imageDataUrl, {}, { hocr: true });

    const fullText = data.text?.trim() || '';
    const extractedWords: WordBlock[] = [];

    // Parsear hOCR para obtener palabras con posiciones
    if (data.hocr) {
      const wordRegex = /<span[^>]*class=['"]ocrx_word['"][^>]*title='([^']*)'[^>]*>([^<]*)<\/span>/gi;
      let match;

      while ((match = wordRegex.exec(data.hocr)) !== null) {
        const title = match[1];
        const text = match[2].trim();

        if (!text || text.length < 1) continue;

        // Extraer bbox y confianza del title
        const bboxMatch = title.match(/bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
        const confMatch = title.match(/x_wconf\s+(\d+)/i);

        if (bboxMatch) {
          const x0 = parseInt(bboxMatch[1]);
          const y0 = parseInt(bboxMatch[2]);
          const x1 = parseInt(bboxMatch[3]);
          const y1 = parseInt(bboxMatch[4]);
          const confidence = confMatch ? parseInt(confMatch[1]) : 80;

          // Filtrar palabras muy pequeñas
          if (x1 - x0 >= 3 && y1 - y0 >= 3) {
            extractedWords.push({
              text,
              bbox: { x0, y0, x1, y1 },
              confidence
            });
          }
        }
      }
    }

    // Si hOCR no funcionó, intentar con data.words
    if (extractedWords.length === 0) {
      // Intentar acceder a words si está disponible
      const wordsData = (data as any).words;
      if (wordsData && Array.isArray(wordsData) && wordsData.length > 0) {
        wordsData.forEach((word: any) => {
          const text = word.text?.trim();
          if (!text) return;

          if (text.length < 1 || text.length > 50) return;

          const validChars = text.match(/[a-zA-Z0-9áéíóúñÁÉÍÓÚÑüÜ]/g);
          if (!validChars || validChars.length < text.length * 0.5) return;

          const confidence = word.confidence || 0;
          if (confidence < MIN_CONFIDENCE) return;

          extractedWords.push({
            text,
            bbox: { x0: word.bbox.x0, y0: word.bbox.y0, x1: word.bbox.x1, y1: word.bbox.y1 },
            confidence
          });
        });
      }
    }

    // Si aún no hay nada, usar el texto completo
    if (extractedWords.length === 0 && fullText.length > 0) {
      const wordsFromText = fullText.split(/\s+/).filter((w: string) => w.length > 0);
      for (const word of wordsFromText) {
        if (word.length >= 1 && word.length <= 50) {
          extractedWords.push({
            text: word,
            bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
            confidence: 50
          });
        }
      }
    }

    return {
      text: fullText,
      words: extractedWords,
      hocr: data.hocr || null,
      imageWidth,
      imageHeight
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  } finally {
    await worker.terminate();
  }
};