import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]; // Buenos Aires como fallback
const DEFAULT_ZOOM = 15;

export default function MapPicker({ latitude, longitude, onChange, height = '300px' }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const center: [number, number] = 
      latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;

    const map = L.map(mapRef.current).setView(center, latitude && longitude ? DEFAULT_ZOOM : 5);

    // Street layer
    streetLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    // Satellite layer (ESRI)
    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; ESRI'
    });

    // Add street layer by default
    streetLayerRef.current.addTo(map);

    // Marcador inicial si hay coordenadas
    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      
      markerRef.current.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
      });
    }

    // Click en el mapa para poner marcador
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        
        markerRef.current.on('dragend', (ev) => {
          const m = ev.target;
          const pos = m.getLatLng();
          onChange(pos.lat, pos.lng);
        });
      }
      
      onChange(lat, lng);
    });

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Switch map type
  const handleMapTypeChange = (type: 'street' | 'satellite') => {
    setMapType(type);
    if (!leafletMapRef.current) return;

    if (type === 'street') {
      if (satelliteLayerRef.current) leafletMapRef.current.removeLayer(satelliteLayerRef.current);
      if (streetLayerRef.current) streetLayerRef.current.addTo(leafletMapRef.current);
    } else {
      if (streetLayerRef.current) leafletMapRef.current.removeLayer(streetLayerRef.current);
      if (satelliteLayerRef.current) satelliteLayerRef.current.addTo(leafletMapRef.current);
    }
  };

  // Actualizar marcador cuando cambian las props
  useEffect(() => {
    if (!leafletMapRef.current || !latitude || !longitude) return;

    leafletMapRef.current.setView([latitude, longitude], DEFAULT_ZOOM);

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(leafletMapRef.current);
      
      markerRef.current.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
      });
    }
  }, [latitude, longitude]);

  // Obtener ubicación por GPS
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], DEFAULT_ZOOM);
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else if (leafletMapRef.current) {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(leafletMapRef.current);
          
          markerRef.current.on('dragend', (e) => {
            const marker = e.target;
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
          });
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

  // Limpiar marcador
  const handleClear = () => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    onChange(NaN, NaN);
  };

  return (
    <div>
      <div className="flex gap-1 mb-1">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleGetGPS}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? '📡 Obteniendo...' : '📍 Usar mi ubicación'}
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mapType === 'street' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleMapTypeChange('street')}
        >
          🗺️ Calle
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mapType === 'satellite' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleMapTypeChange('satellite')}
        >
          🛰️ Satelite
        </button>
        {(latitude && longitude) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClear}
          >
            ✕ Limpiar
          </button>
        )}
      </div>
      <div
        ref={mapRef}
        style={{ height, borderRadius: 'var(--radius)', zIndex: 1 }}
        className="map-container"
      />
      {latitude && longitude && (
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
          📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
}
