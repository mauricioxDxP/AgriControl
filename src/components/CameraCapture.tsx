import { useState, useRef, useEffect, useCallback } from 'react';
import { runOCR, preprocessImage, WordBlock, OCRResult } from '../services/OCRService';
import WordBoxesOverlay from './WordBoxesOverlay';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onTextRecognized?: (text: string) => void;
  isMinimized?: boolean;
  onMinimizeChange?: (isMinimized: boolean) => void;
  mode?: 'modal' | 'inline';
}

export default function CameraCapture({ 
  isOpen, 
  onClose, 
  onTextRecognized: _onTextRecognized, 
  isMinimized: externalMinimized, 
  onMinimizeChange,
  mode: _mode
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Estado para zoom de cámara
  const [cameraZoom, setCameraZoom] = useState(1);
  const MIN_CAMERA_ZOOM = 1;
  const MAX_CAMERA_ZOOM = 3;

  // Ref para zoom por hardware
  const hardwareZoomRef = useRef(false);
  const hardwareMinZoomRef = useRef(1);
  const hardwareMaxZoomRef = useRef(4);

  // Estado para linterna
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [supportsTorch, setSupportsTorch] = useState(false);

  // Refs para tracking inmediato
  const torchSupportedRef = useRef(false);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [words, setWords] = useState<WordBlock[]>([]);
  const [ocrDimensions, setOcrDimensions] = useState({ width: 640, height: 480 });

  const [error, setError] = useState<string | null>(null);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [internalMinimized, setInternalMinimized] = useState(false);

  const isMinimized = externalMinimized !== undefined ? externalMinimized : internalMinimized;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setTorchEnabled(false);
      setCameraZoom(1);
      
      // Crear stream temporal para detectar capabilities
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      
      const videoTrack = tempStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      // Detectar zoom por hardware
      const zoomInfo = capabilities?.zoom;
      if (zoomInfo && typeof zoomInfo === 'object' && zoomInfo.min !== undefined) {
        hardwareZoomRef.current = true;
        hardwareMinZoomRef.current = zoomInfo.min;
        hardwareMaxZoomRef.current = zoomInfo.max;
      } else {
        hardwareZoomRef.current = false;
      }
      
      // Detectar linterna
      const hasTorch = capabilities?.torch === true;
      torchSupportedRef.current = hasTorch || false;
      setSupportsTorch(hasTorch);
      
      // Cerrar stream temporal
      tempStream.getTracks().forEach(track => track.stop());
      
      // Crear stream real con zoom hardware si está disponible
      const streamConfig: MediaStreamConstraints = {
        video: { facingMode: { ideal: 'environment' } }
      };
      
      if (hardwareZoomRef.current) {
        // Aplicar zoom inicial si es hardware
        (streamConfig.video as any).zoom = hardwareMinZoomRef.current;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(streamConfig);
      streamRef.current = mediaStream;
      setStreamReady(true);
      
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      }, 150);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStreamReady(false);
    }
  }, []);

  const handleClose = () => {
    if (isMinimized && onMinimizeChange) {
      onMinimizeChange(false);
    }
    setCapturedImage(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setWords([]);
// Resetear estados
    setCameraZoom(1);
    setTorchEnabled(false);
    setSupportsTorch(false);
    torchSupportedRef.current = false;
    hardwareZoomRef.current = false;
    onClose();
  };

  // Aplicar zoom (hardware si está disponible, si no software)
  const applyCameraZoom = useCallback(async (newZoom: number) => {
    if (!streamRef.current) return;
    
    if (hardwareZoomRef.current) {
      // Zoom por hardware
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ zoom: newZoom } as any]
        });
        setCameraZoom(newZoom);
      } catch (err) {
        console.error('Hardware zoom error:', err);
        // Falls back to software
        hardwareZoomRef.current = false;
        setCameraZoom(newZoom);
      }
    } else {
      // Zoom por software
      setCameraZoom(newZoom);
    }
  }, []);

  // Toggle linterna
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupportedRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    const newTorchState = !torchEnabled;
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState } as any]
      });
      setTorchEnabled(newTorchState);
      showToast(newTorchState ? 'Linterna encendida' : 'Linterna apagada', 'info');
    } catch (err) {
      console.error('Error toggling torch:', err);
      showToast('Linterna no disponible', 'error');
    }
  }, [torchEnabled]);

  const toggleMinimize = () => {
    const newValue = !isMinimized;
    if (onMinimizeChange) {
      onMinimizeChange(newValue);
    } else {
      setInternalMinimized(newValue);
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      startCamera();
    } else if (!isMinimized) {
      stopCamera();
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setStreamReady(false);
      torchSupportedRef.current = false;
    };
  }, [isOpen, isMinimized, startCamera, stopCamera]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Imagen original
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      console.log('Captura: canvas size:', canvas.width, 'x', canvas.height);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setWords([]);
      
      // Preprocesar y hacer OCR con imagen mejorada
      const enhancedUrl = preprocessImage(ctx, canvas.width, canvas.height);
      console.log('Iniciando OCR con imagen preprocesada...');
      setTimeout(() => performOCR(enhancedUrl), 100);
    }
  };

  const performOCR = async (imageDataUrl: string) => {
    setOcrLoading(true);
    setOcrProgress(0);
    
    try {
      const result: OCRResult = await runOCR(imageDataUrl, (progress) => {
        setOcrProgress(progress);
      });
      
      setWords(result.words);
      setOcrDimensions({ width: result.imageWidth, height: result.imageHeight });
      setOcrLoading(false);
      
      if (result.words.length > 0) {
        showToast(`✓ ${result.words.length} palabras detectadas`, 'success');
      } else if (result.text.length > 0) {
        showToast(`⚠️ Texto reconocido: ${result.text.substring(0, 50)}...`, 'info');
      } else {
        showToast('No se detectó texto legible', 'info');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrLoading(false);
      showToast('Error al reconocer texto: ' + (err as Error).message, 'error');
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 1));

  const handlePanStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (zoom <= 1) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setIsPanning(true);
    setLastPanPoint({ x: clientX, y: clientY });
  };

  const handlePanMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPanning || !lastPanPoint || zoom <= 1) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const deltaX = clientX - lastPanPoint.x;
    const deltaY = clientY - lastPanPoint.y;
    setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    setLastPanPoint({ x: clientX, y: clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    setLastPanPoint(null);
  };

  const handlePinchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length !== 2) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    setLastPinchDistance(Math.sqrt(dx * dx + dy * dy));
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length !== 2 || lastPinchDistance === null) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const delta = distance - lastPinchDistance;
    if (Math.abs(delta) > 5) {
      if (!capturedImage) {
        // Zoom en video - usa applyCameraZoom (smart: hardware o software)
        const currentZoom = cameraZoom;
        const newZoom = hardwareZoomRef.current
          ? currentZoom + (delta > 0 ? 0.5 : -0.5)
          : currentZoom + (delta > 0 ? 0.1 : -0.1);
        const clampedZoom = hardwareZoomRef.current
          ? Math.max(hardwareMinZoomRef.current, Math.min(hardwareMaxZoomRef.current, newZoom))
          : Math.max(MIN_CAMERA_ZOOM, Math.min(MAX_CAMERA_ZOOM, newZoom));
        applyCameraZoom(clampedZoom);
      } else {
        setZoom(prev => Math.max(1, Math.min(4, prev + (delta > 0 ? 0.1 : -0.1))));
      }
      setLastPinchDistance(distance);
    }
  };

  const handlePinchEnd = () => setLastPinchDistance(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    if (!capturedImage) {
      const currentZoom = cameraZoom;
      const newZoom = hardwareZoomRef.current
        ? currentZoom + delta * 2
        : currentZoom + delta;
      const clampedZoom = hardwareZoomRef.current
        ? Math.max(hardwareMinZoomRef.current, Math.min(hardwareMaxZoomRef.current, newZoom))
        : Math.max(MIN_CAMERA_ZOOM, Math.min(MAX_CAMERA_ZOOM, newZoom));
      applyCameraZoom(clampedZoom);
    } else {
      setZoom(prev => Math.max(1, Math.min(4, prev + delta)));
    }
  };

  const rescanOCR = async () => {
    if (!capturedImage) return;
    // Re-escanear con preprocesamiento
    await performOCR(capturedImage);
  };

  const backToCamera = () => {
    setCapturedImage(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setWords([]);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setTimeout(() => startCamera(), 100);
  };

  if (!isOpen) return null;

  return (
    <>
      {!isMinimized && (
        <div className="camera-overlay">
          <div className="camera-container" onClick={e => e.stopPropagation()}>
            <div className="camera-header">
              <h3>📷 Cámara OCR</h3>
              <div className="camera-header-actions">
                <button className="btn btn-icon btn-secondary" onClick={toggleMinimize}>▬</button>
                <button className="btn btn-icon btn-secondary" onClick={handleClose}>✕</button>
              </div>
            </div>

            {error && (
              <div className="camera-error">
                <p>{error}</p>
                <button className="btn btn-primary" onClick={startCamera}>Reintentar</button>
              </div>
            )}

            <div ref={containerRef} className="camera-viewport" onTouchStart={handlePinchStart} onTouchMove={handlePinchMove} onTouchEnd={handlePinchEnd} onWheel={handleWheel} style={{ touchAction: 'none' }}>
              {!streamReady && !capturedImage && !error && (
                <div className="camera-loading">
                  <div className="spinner"></div>
                  <span>Activando cámara...</span>
                </div>
              )}
              {streamReady && !capturedImage && (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="camera-video" 
                  style={{ 
                    display: 'block',
                    // Software zoom only - hardware uses native zoom
                    ...(!hardwareZoomRef.current && cameraZoom !== 1 ? {
                      transform: `scale(${cameraZoom})`,
                      transformOrigin: 'center center'
                    } : {})
                  }}
                  onTouchStart={handlePinchStart}
                  onTouchMove={handlePinchMove}
                  onTouchEnd={handlePinchEnd}
                />
              )}
              {capturedImage && (
                <div className="camera-captured" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, cursor: zoom > 1 ? 'grab' : 'default', touchAction: 'none' }} onMouseDown={handlePanStart} onMouseMove={handlePanMove} onMouseUp={handlePanEnd} onMouseLeave={handlePanEnd} onTouchStart={(e) => { if (zoom > 1 && e.touches.length === 1) handlePanStart(e); handlePinchStart(e); }} onTouchMove={(e) => { if (isPanning && e.touches.length === 1) handlePanMove(e); handlePinchMove(e); }} onTouchEnd={() => { if (isPanning) handlePanEnd(); handlePinchEnd(); }}>
                  <img ref={imageRef} src={capturedImage} alt="Capturada" draggable={false} style={{ userSelect: 'none', pointerEvents: 'none', display: 'block' }} />
                  {/* {hocrData && imageDimensions.width > 0 && imageDimensions.height > 0 && (
                    <div 
                      className="hocr-overlay"
                      dangerouslySetInnerHTML={{ __html: hocrData }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${imageDimensions.width}px`,
                        height: `${imageDimensions.height}px`,
                        pointerEvents: 'none',
                        overflow: 'hidden'
                      }}
                    />
                  )} */}
                  {/* Renderizar boxes desde el array words */}
                  {words.length > 0 && capturedImage && (
                    <WordBoxesOverlay 
                      words={words}
                      ocrWidth={ocrDimensions.width}
                      ocrHeight={ocrDimensions.height}
                      onWordClick={(text) => {
                        navigator.clipboard.writeText(text).then(() => {
                          showToast(`"${text}" copiado`, 'success');
                        }).catch(() => {
                          showToast('Error al copiar', 'error');
                        });
                      }}
                    />
                  )}
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {capturedImage && !ocrLoading && words.length === 0 && (
              <div className="camera-selection-hint">👆 Tocá "OCR" para detectar texto</div>
            )}

            {ocrLoading && (
              <div className="camera-ocr-loading">
                <div className="spinner"></div>
                <span>Reconociendo texto... {ocrProgress}%</span>
              </div>
            )}

            {capturedImage && (
              <div className="camera-view-zoom-controls">
                <button className="btn btn-secondary" onClick={handleZoomOut} disabled={zoom <= 1}>➖</button>
                <span className="camera-zoom-level">{Math.round(zoom * 100)}%</span>
                <button className="btn btn-secondary" onClick={handleZoomIn} disabled={zoom >= 4}>➕</button>
              </div>
            )}

            

            <div className="camera-actions">
              {/* Botón de linterna */}
              {streamReady && !capturedImage && supportsTorch && (
                <button 
                  className={`btn ${torchEnabled ? 'btn-warning' : 'btn-secondary'}`}
                  onClick={toggleTorch}
                  title={torchEnabled ? 'Apagar linterna' : 'Encender linterna'}
                >
                  {torchEnabled ? '💡' : '🔦'}
                </button>
              )}
              
              {!capturedImage ? (
                <button className="btn btn-primary btn-lg" onClick={capturePhoto} disabled={!streamReady}>📸 Capturar</button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={backToCamera}>🔄 Nueva Foto</button>
                  <button className="btn btn-primary" onClick={rescanOCR} disabled={ocrLoading}>🔍 {ocrLoading ? 'Procesando...' : 'Re-escanear'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`camera-toast ${toast.type}`}>{toast.message}</div>}

      {isMinimized && (
        <div className="camera-minimized" onClick={toggleMinimize}>
          <div className="camera-minimized-content">
            <span className="camera-minimized-icon">📷</span>
            <span className="camera-minimized-text">{capturedImage ? `✓ ${words.length} palabras` : 'Cámara OCR lista'}</span>
            <button className="btn btn-icon btn-minimized" onClick={(e) => { e.stopPropagation(); handleClose(); }}>✕</button>
          </div>
        </div>
      )}

      <style>{`
        .camera-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .camera-container { background: white; border-radius: 12px; width: 100%; max-width: 500px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .camera-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--gray-50); border-bottom: 1px solid var(--gray-200); }
        .camera-header h3 { margin: 0; font-size: 1.125rem; color: var(--gray-900); }
        .camera-header-actions { display: flex; gap: 0.5rem; align-items: center; }
        .camera-error { padding: 2rem; text-align: center; color: var(--danger); }
        .camera-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--gray-300); }
        .camera-viewport { flex: 1; min-height: 300px; max-height: 60vh; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; touch-action: none; }
        .camera-video { width: 100%; height: 100%; object-fit: cover; }
        .camera-captured { position: relative; transition: transform 0.1s ease-out; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .camera-captured img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
        .word-box { position: absolute; border: none; border-radius: 3px; cursor: pointer; transition: all 0.15s ease; }
        .word-box:hover, .word-box.selected { background: rgba(46,125,50,0.1); }
        .word-tooltip { display: none; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: var(--gray-900); color: var(--gray-100); padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; z-index: 10; }
        .word-box:hover .word-tooltip, .word-box.selected .word-tooltip { display: block; }
        .camera-selection-hint { padding: 0.5rem 1rem; background: var(--warning); color: var(--gray-900); text-align: center; font-size: 0.875rem; }
        .camera-ocr-loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 1rem; background: var(--gray-50); border-top: 1px solid var(--gray-200); color: var(--gray-700); }
        .camera-view-zoom-controls { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem; background: var(--gray-800); }
        .camera-view-zoom-controls .btn { padding: 0.25rem 0.5rem; }
        .camera-view-zoom-controls .camera-zoom-level { font-size: 0.75rem; color: var(--gray-100); min-width: 45px; text-align: center; }
        .camera-live-zoom-controls { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem; background: var(--primary); }
        .camera-live-zoom-controls .btn { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
        .camera-live-zoom-controls .camera-zoom-level { font-size: 0.75rem; color: white; min-width: 45px; text-align: center; }
        .camera-actions { display: flex; gap: 0.75rem; padding: 1rem; background: var(--gray-50); border-top: 1px solid var(--gray-200); justify-content: center; flex-wrap: wrap; }
        .camera-actions .btn-lg { padding: 0.75rem 2rem; font-size: 1.125rem; }
        .btn-secondary { background: var(--gray-200); color: var(--gray-700); }
        .btn-secondary:hover { background: var(--gray-300); }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-warning:hover { background: #d97706; }
        .spinner { border: 3px solid var(--gray-300); border-top-color: var(--primary); }
        .camera-minimized { position: fixed; bottom: 20px; right: 20px; z-index: 9998; cursor: pointer; animation: slideInRight 0.3s ease; }
        .camera-minimized-content { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--gray-900); color: var(--gray-100); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s ease; }
        .camera-minimized-content:hover { background: var(--gray-800); transform: scale(1.02); }
        .camera-minimized-icon { font-size: 1.25rem; }
        .camera-minimized-text { font-size: 0.875rem; font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .btn-minimized { background: transparent; border: none; color: var(--gray-400); cursor: pointer; padding: 0.25rem; font-size: 1rem; line-height: 1; }
        .btn-minimized:hover { color: var(--gray-100); }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        .camera-toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 10000; animation: toastIn 0.3s ease; }
        .camera-toast.success { background: var(--success); color: white; }
        .camera-toast.error { background: var(--danger); color: white; }
        .camera-toast.info { background: var(--info); color: white; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        
        /* Interactive word boxes */
        .word-box-interactive { transition: all 0.15s ease; }
        .word-box-interactive:hover {
          background: rgba(34, 197, 94, 0.4);
          border-color: #16a34a;
        }
        
        /* hOCR overlay styles */
        .hocr-overlay { font-size: 10px; }
        .hocr-overlay .ocr_page { width: 100%; height: 100%; position: relative; }
        .hocr-overlay .ocrx_word {
          position: absolute;
          border: 2px solid #22c55e;
          background: rgba(34, 197, 94, 0.15);
          cursor: pointer;
          pointer-events: auto;
        }
        .hocr-overlay .ocrx_word:hover {
          background: rgba(34, 197, 94, 0.4);
          border-color: #16a34a;
        }
      `}</style>
    </>
  );
}