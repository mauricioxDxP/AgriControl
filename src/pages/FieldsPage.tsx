import { useState, useEffect, useMemo } from 'react';
import { useFields } from '../hooks/useData';
import { Field, Product } from '../types';
import MapPicker from '../components/MapPicker';
import { settingsService, productsService } from '../services';

export default function FieldsPage() {
  const { fields, loading, addField, updateField, deleteField } = useFields();
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    productId: ''
  });

  // Tipos plantados (configuración global) y productos
  const [plantedTypes, setPlantedTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productsService.getAll().then(setProducts).catch(() => {});
    // Cargar tipos plantados (configuración global)
    settingsService.getPlantedProductTypes().then(data => {
      setPlantedTypes(data.map((d: any) => d.productTypeId));
    }).catch(() => {});
  }, []);

  // Filtrar productos según tipos plantados (configuración global)
  const filteredProducts = useMemo(() => {
    if (plantedTypes.length === 0) return products; // Sin filtro = mostrar todos
    return products.filter(p => plantedTypes.includes(p.typeId));
  }, [products, plantedTypes]);

  const resetForm = () => {
    setFormData({
      name: '',
      area: '',
      location: '',
      latitude: null,
      longitude: null,
      productId: ''
    });
    setEditingField(null);
  };

  const openModal = (field?: Field) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name,
        area: field.area.toString(),
        location: field.location || '',
        latitude: field.latitude ?? null,
        longitude: field.longitude ?? null,
        productId: field.productId || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      area: parseFloat(formData.area),
      location: formData.location || undefined,
      latitude: formData.latitude,
      longitude: formData.longitude,
      productId: formData.productId || null
    };

    if (editingField) {
      await updateField(editingField.id, data);
    } else {
      await addField(data);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este campo?')) {
      await deleteField(id);
    }
  };

  const handleMapChange = (lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) {
      setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
    } else {
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-between mb-2">
        <h2>Campos / Parcelas</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Nuevo
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🌾</div>
            <h3>No hay campos registrados</h3>
            <p>Registrá tu primer campo para comenzar</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Nuevo
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          {fields.map(field => (
            <div key={field.id} className="card">
              <div className="card-header">
                <h3 className="card-title">{field.name}</h3>
                <div className="flex gap-1">
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => openModal(field)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(field.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📐</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Área</div>
                    <div style={{ fontWeight: 'bold' }}>{field.area} ha</div>
                  </div>
                </div>
                {field.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>📍</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Ubicación</div>
                      <div>{field.location}</div>
                    </div>
                  </div>
                )}
                {field.latitude && field.longitude && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🗺️</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Coordenadas</div>
                      <div style={{ fontSize: '0.8rem' }}>
                        {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}
                {field.product && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🧴</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Producto</div>
                      <div>{field.product.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingField ? 'Editar Campo' : 'Nuevo Campo'}
              </h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Nombre */}
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Lote Norte"
                  />
                </div>

                {/* Área */}
                <div className="form-group">
                  <label className="form-label">Área (hectáreas) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    required
                    placeholder="Ej: 50.5"
                  />
                </div>

                {/* Ubicación descripción */}
                <div className="form-group">
                  <label className="form-label">Ubicación (descripción)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Ruta 5, Km 12"
                  />
                </div>

                {/* Mapa + GPS */}
                <div className="form-group">
                  <label className="form-label">Ubicación en mapa</label>
                  <MapPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onChange={handleMapChange}
                    height="250px"
                  />
                </div>

                {/* Configuración: Producto específico (filtrado por tipos plantados) */}
                <div className="form-group">
                  <label className="form-label">Producto específico (opcional)</label>
                  <select
                    className="form-select"
                    value={formData.productId}
                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
                  >
                    <option value="">— Sin producto específico —</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    {plantedTypes.length > 0
                      ? `Mostrando ${filteredProducts.length} producto(s) de tipos plantados`
                      : `Mostrando todos los productos (${filteredProducts.length}). Configurá tipos plantados en Configuración → Campos`
                    }
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingField ? 'Guardar Cambios' : 'Crear Campo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
