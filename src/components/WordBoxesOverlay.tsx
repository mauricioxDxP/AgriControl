import { useRef, useEffect, useState } from 'react';
import { WordBlock } from '../services/OCRService';

interface WordBoxesOverlayProps {
  words: WordBlock[];
  ocrWidth: number;
  ocrHeight: number;
  onWordClick: (text: string) => void;
}

export default function WordBoxesOverlay({ words, ocrWidth, ocrHeight, onWordClick }: WordBoxesOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Obtener el tamaño del contenedor
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // Obtener tamaño inicial
    updateSize();

    // Escuchar cambios de tamaño
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Calcular escala basada en las dimensiones reales OCR vs contenedor
  const scaleX = containerSize.width / ocrWidth;
  const scaleY = containerSize.height / ocrHeight;
  const hasSize = containerSize.width > 0 && containerSize.height > 0;
  const hasWords = words && words.length > 0;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {hasSize && hasWords && words.map((word, index) => (
        <div
          key={index}
          title={word.text}
          onClick={(e) => {
            e.stopPropagation();
            onWordClick(word.text);
          }}
          style={{
            position: 'absolute',
            left: `${word.bbox.x0 * scaleX}px`,
            top: `${word.bbox.y0 * scaleY}px`,
            width: `${(word.bbox.x1 - word.bbox.x0) * scaleX}px`,
            height: `${(word.bbox.y1 - word.bbox.y0) * scaleY}px`,
            border: '2px solid #22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
          }}
        />
      ))}
    </div>
  );
}