import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 15;

const TILE_SOURCES = {
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  }
};

export default function MapPicker({ latitude, longitude, onChange, height = '300px' }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const sourceAddedRef = useRef<boolean>(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const isRectangleModeRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('MapPicker: Initializing map...');

    const center: [number, number] = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;
    const zoom = latitude && longitude ? DEFAULT_ZOOM : 5;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [TILE_SOURCES.street.url],
            tileSize: 256,
            attribution: TILE_SOURCES.street.attribution
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 18
          }
        ]
      },
      center,
      zoom,
      maxZoom: 18,
      minZoom: 3
    });

    console.log('MapPicker: Map created, waiting for load...');

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        const isVisible = mapRef.current?.offsetParent !== null || 
                         document.visibilityState === 'visible';
        if (isVisible) {
          setTimeout(() => mapInstanceRef.current?.resize(), 100);
        }
      }
    });
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsMapFullscreen(isNowFullscreen);
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current?.resize(), 100);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    map.on('load', () => {
      console.log('MapPicker: Map loaded successfully');
      sourceAddedRef.current = true;

      map.addSource('rectangle', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[]]
          }
        }
      });

      map.addLayer({
        id: 'rectangle-fill',
        type: 'fill',
        source: 'rectangle',
        paint: {
          'fill-color': '#3388ff',
          'fill-opacity': 0.2
        }
      });

      map.addLayer({
        id: 'rectangle-outline',
        type: 'line',
        source: 'rectangle',
        paint: {
          'line-color': '#3388ff',
          'line-width': 2
        }
      });

      setTimeout(() => {
        console.log('MapPicker: Forcing map resize');
        map.resize();
      }, 100);
    });

    map.on('error', (e) => {
      console.error('MapPicker: Map error:', e);
    });

    if (latitude && longitude) {
      const el = document.createElement('div');
      el.className = 'marker-icon';
      el.style.cssText = 'width: 25px; height: 41px; cursor: move;';

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onChange(lngLat.lat, lngLat.lng);
      });

      markerRef.current = marker;
    }

    map.on('click', (e) => {
      if (isRectangleModeRef.current) return;

      const { lng, lat } = e.lngLat;

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'marker-icon';
        el.style.cssText = 'width: 25px; height: 41px; cursor: move;';

        const newMarker = new maplibregl.Marker({
          element: el,
          draggable: true
        })
          .setLngLat([lng, lat])
          .addTo(map);

        newMarker.on('dragend', () => {
          const lngLat = newMarker.getLngLat();
          onChange(lngLat.lat, lngLat.lng);
        });

        markerRef.current = newMarker;
      }

      onChange(lat, lng);
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.resize();
    }, 150);

    return () => {
      console.log('MapPicker: Cleaning up map');
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      resizeObserver.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !sourceAddedRef.current) return;
    const map = mapInstanceRef.current;

    const tiles = mapType === 'street' ? TILE_SOURCES.street.url : TILE_SOURCES.satellite.url;

    if (map.getLayer('osm-layer')) {
      map.removeLayer('osm-layer');
    }
    if (map.getSource('osm')) {
      map.removeSource('osm');
    }

    map.addSource('osm', {
      type: 'raster',
      tiles: [tiles],
      tileSize: 256
    });

    map.addLayer({
      id: 'osm-layer',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 18
    });
  }, [mapType]);

  useEffect(() => {
    if (!mapInstanceRef.current || !latitude || !longitude) return;

    mapInstanceRef.current.flyTo({
      center: [longitude, latitude],
      zoom: DEFAULT_ZOOM,
      duration: 1000
    });

    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
    } else {
      const el = document.createElement('div');
      el.className = 'marker-icon';
      el.style.cssText = 'width: 25px; height: 41px; cursor: move;';

      const newMarker = new maplibregl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([longitude, latitude])
        .addTo(mapInstanceRef.current);

      newMarker.on('dragend', () => {
        const lngLat = newMarker.getLngLat();
        onChange(lngLat.lat, lngLat.lng);
      });

      markerRef.current = newMarker;
    }
  }, [latitude, longitude]);

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [lng, lat],
            zoom: DEFAULT_ZOOM,
            duration: 1000
          });
        }

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else if (mapInstanceRef.current) {
          const el = document.createElement('div');
          el.className = 'marker-icon';
          el.style.cssText = 'width: 25px; height: 41px; cursor: move;';

          const newMarker = new maplibregl.Marker({
            element: el,
            draggable: true
          })
            .setLngLat([lng, lat])
            .addTo(mapInstanceRef.current);

          newMarker.on('dragend', () => {
            const lngLat = newMarker.getLngLat();
            onChange(lngLat.lat, lngLat.lng);
          });

          markerRef.current = newMarker;
        }

        onChange(lat, lng);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error obteniendo GPS:', error);
        alert('No se pudo obtener la ubicación. Verificá los permisos.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleFullscreen = async () => {
    const container = mapRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsMapFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsMapFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  return (
    <div>
      <style>{`
        .marker-icon {
          cursor: move;
        }
        .marker-icon::before {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          background: #3388ff;
          border: 2px solid white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .marker-icon::after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #3388ff;
          top: calc(50% + 6px);
          left: 50%;
          transform: translateX(-50%);
        }
        .maplibregl-map {
          width: 100%;
          height: 100%;
        }
        .maplibregl-canvas {
          outline: none;
        }
        #map-picker-container {
          width: 100% !important;
          min-height: 250px;
        }
        #map-picker-container canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
      `}</style>
      <div style={{ position: 'relative' }}>
        <div
          ref={mapRef}
          id="map-picker-container"
          style={{ height, width: '100%', minHeight: '250px', borderRadius: 'var(--radius)', zIndex: 1, position: 'relative', display: 'block' }}
        >
          {/* Layer switcher control inside map */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setMapType(mapType === 'street' ? 'satellite' : 'street');
            }}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 1000,
              width: '32px',
              height: '32px',
              background: 'white',
              border: 'none',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={mapType === 'street' ? 'Cambiar a satélite' : 'Cambiar a calle'}
          >
            {mapType === 'street' ? '🛰️' : '🗺️'}
          </button>
          {/* GPS location button inside map */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              handleGetGPS();
            }}
            style={{
              position: 'absolute',
              top: '50px',
              left: '10px',
              zIndex: 1000,
              width: '32px',
              height: '32px',
              background: 'white',
              border: 'none',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Usar mi ubicación"
          >
            {isGettingLocation ? '📡' : '📍'}
          </button>
        </div>
      </div>
      {/* Fullscreen exit button - top left corner */}
      {isMapFullscreen && (
        <button
          onClick={handleToggleFullscreen}
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 999999,
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          ✕ Salir de pantalla completa
        </button>
      )}
      {latitude && longitude && (
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
          📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
}