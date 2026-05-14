import { useState } from 'react';
import { useTerrains } from '../hooks/useData';
import { useFields, usePlantings } from '../hooks/useData';
import { useProducts, usePlantedProductTypes } from '../hooks/useData';
import MapPicker from '../components/MapPicker';
import { Planting } from '../types';

export default function TerrainsPage() {
  const { terrains, loading, addTerrain, updateTerrain, deleteTerrain, refresh: refreshTerrains } = useTerrains();
  const [showTerrainModal, setShowTerrainModal] = useState(false);
  const [editingTerrain, setEditingTerrain] = useState<{ id: string; name: string; location?: string; latitude?: number | null; longitude?: number | null } | null>(null);
  const [terrainFormData, setTerrainFormData] = useState({
    name: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  const [expandedTerrainId, setExpandedTerrainId] = useState<string | null>(null);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  // Field CRUD state
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<{ id: string; name: string; area: number } | null>(null);
  const [fieldFormData, setFieldFormData] = useState({ name: '', area: 0 });
  const [fieldTerrainId, setFieldTerrainId] = useState<string>('');

  // Planting CRUD state
  const [showPlantingModal, setShowPlantingModal] = useState(false);
  const [editingPlanting, setEditingPlanting] = useState<Planting | null>(null);
  const [plantingFormData, setPlantingFormData] = useState({ productId: '', startDate: '', notes: '' });
  const [plantingFieldId, setPlantingFieldId] = useState<string>('');

  // Load plantings for expanded field
  const plantingsHook = usePlantings(expandedFieldId || undefined);
  const { plantings, addPlanting, updatePlanting, deletePlanting, endPlanting } = plantingsHook;

  // Load all plantings to show summaries
  const allPlantingsHook = usePlantings();
  const { plantings: allPlantings, refresh: refreshAllPlantings } = allPlantingsHook;

  // Load products for planting form (filtered by planted product types)
  const { products } = useProducts();
  const { plantedTypes, isPlanted } = usePlantedProductTypes();

  // Filter products by planted types
  const filteredProducts = plantedTypes.length > 0
    ? products.filter(p => isPlanted(p.typeId))
    : products;

  // Calculate total area for a terrain
  const getTotalArea = (terrain: any) => {
    if (!terrain.fields || terrain.fields.length === 0) return 0;
    return terrain.fields.reduce((sum: number, field: any) => sum + (field.area || 0), 0);
  };

  // Get active planting for a field
  const getActivePlanting = (fieldId: string) => {
    return allPlantings.find(p => p.fieldId === fieldId && !p.endDate);
  };

  // Get completed plantings for a field
  const getFieldCompletedPlantings = (fieldId: string) => {
    return allPlantings.filter(p => p.fieldId === fieldId && p.endDate);
  };

  // Terrain methods
  const resetTerrainForm = () => {
    setTerrainFormData({ name: '', location: '', latitude: null, longitude: null });
    setEditingTerrain(null);
  };

  const openTerrainModal = (terrain?: { id: string; name: string; location?: string; latitude?: number | null; longitude?: number | null }) => {
    if (terrain) {
      setEditingTerrain(terrain);
      setTerrainFormData({
        name: terrain.name,
        location: terrain.location || '',
        latitude: terrain.latitude ?? null,
        longitude: terrain.longitude ?? null
      });
    } else {
      resetTerrainForm();
    }
    setShowTerrainModal(true);
  };

  const handleTerrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: terrainFormData.name,
      location: terrainFormData.location || undefined,
      latitude: terrainFormData.latitude,
      longitude: terrainFormData.longitude
    };

    if (editingTerrain) {
      await updateTerrain(editingTerrain.id, data);
    } else {
      await addTerrain(data);
    }

    setShowTerrainModal(false);
    resetTerrainForm();
  };

  const handleTerrainDelete = async (id: string) => {
    const terrain = terrains.find(t => t.id === id);
    if (terrain && terrain.fields && terrain.fields.length > 0) {
      alert('No se puede eliminar un terreno con campos asociados.');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este terreno?')) {
      await deleteTerrain(id);
    }
  };

  const handleTerrainMapChange = (lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) {
      setTerrainFormData(prev => ({ ...prev, latitude: null, longitude: null }));
    } else {
      setTerrainFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    }
  };

  const toggleTerrain = (terrainId: string) => {
    setExpandedTerrainId(prev => prev === terrainId ? null : terrainId);
    setExpandedFieldId(null);
  };

  const toggleField = (fieldId: string) => {
    setExpandedFieldId(prev => prev === fieldId ? null : fieldId);
  };

  // Field CRUD methods
  const openFieldModal = (terrainId: string, field?: { id: string; name: string; area: number }) => {
    setFieldTerrainId(terrainId);
    if (field) {
      setEditingField(field);
      setFieldFormData({ name: field.name, area: field.area });
    } else {
      setEditingField(null);
      setFieldFormData({ name: '', area: 0 });
    }
    setShowFieldModal(true);
  };

  const handleFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: fieldFormData.name,
      area: fieldFormData.area,
      terrainId: fieldTerrainId
    };

    if (editingField) {
      await updateField(editingField.id, data);
    } else {
      await addField(data);
    }

    setShowFieldModal(false);
    setEditingField(null);
    setFieldFormData({ name: '', area: 0 });
    refreshTerrains();
  };

  const handleFieldDelete = async (fieldId: string) => {
    if (confirm('¿Estás seguro de eliminar este campo?')) {
      await deleteField(fieldId);
      refreshTerrains();
    }
  };

  // Planting CRUD methods
  const openPlantingModal = (fieldId: string, planting?: Planting) => {
    setPlantingFieldId(fieldId);
    if (planting) {
      setEditingPlanting(planting);
      // Handle date display correctly for timezone
      const plantingDate = new Date(planting.startDate);
      const dateStr = plantingDate.toISOString().split('T')[0];
      setPlantingFormData({
        productId: planting.productId,
        startDate: dateStr,
        notes: planting.notes || ''
      });
    } else {
      setEditingPlanting(null);
      // Create date at noon to avoid timezone issues
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      setPlantingFormData({ productId: '', startDate: today.toISOString().split('T')[0], notes: '' });
    }
    setShowPlantingModal(true);
  };

  const handlePlantingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create date at noon local time to avoid timezone offset issues
    const [year, month, day] = plantingFormData.startDate.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    const data = {
      fieldId: plantingFieldId,
      productId: plantingFormData.productId,
      startDate: localDate.toISOString(),
      notes: plantingFormData.notes || undefined
    };

    if (editingPlanting) {
      await updatePlanting(editingPlanting.id, data);
    } else {
      await addPlanting(data);
    }

    setShowPlantingModal(false);
    setEditingPlanting(null);
    setPlantingFormData({ productId: '', startDate: '', notes: '' });
    refreshTerrains();
    refreshAllPlantings();
  };

  const handlePlantingDelete = async (plantingId: string) => {
    if (confirm('¿Estás seguro de eliminar esta siembra?')) {
      await deletePlanting(plantingId);
      refreshTerrains();
      refreshAllPlantings();
    }
  };

  const handleEndPlanting = async (plantingId: string) => {
    if (confirm('¿Quieres finalizar esta siembra?')) {
      await endPlanting(plantingId);
      refreshTerrains();
      refreshAllPlantings();
    }
  };

  const getActivePlantings = (fieldId: string, allPlantings: Planting[]) => {
    return allPlantings.filter(p => p.fieldId === fieldId && !p.endDate);
  };

  const getCompletedPlantings = (fieldId: string, allPlantings: Planting[]) => {
    return allPlantings.filter(p => p.fieldId === fieldId && p.endDate);
  };

  // Helpers for field operations
  const { addField, updateField, deleteField } = useFields();

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
        <h2>Terrenos</h2>
        <button className="btn btn-primary" onClick={() => openTerrainModal()}>
          + Nuevo Terreno
        </button>
      </div>

      {terrains.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🗺️</div>
            <h3>No hay terrenos registrados</h3>
            <p>Registrá tu primer terreno para comenzar</p>
            <button className="btn btn-primary mt-1" onClick={() => openTerrainModal()}>
              + Nuevo
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {terrains.map(terrain => {
            const isExpanded = expandedTerrainId === terrain.id;
            return (
              <div 
                key={terrain.id} 
                className="card"
                style={{
                  cursor: 'pointer',
                  border: isExpanded ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                  position: 'relative',
                  padding: '0.5rem',
                  gridColumn: isExpanded ? '1 / -1' : 'unset'
                }}
                onClick={() => toggleTerrain(terrain.id)}
              >
                {/* Botones de accion */}
                <div 
                  className="flex gap-1" 
                  style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', zIndex: 1 }}
                  onClick={e => e.stopPropagation()}
                >
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                    onClick={() => openTerrainModal(terrain)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                    onClick={() => handleTerrainDelete(terrain.id)}
                  >
                    ✕
                  </button>
                </div>

                {/* Info terreno */}
                <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>🗺️</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.25rem' }}>{terrain.name}</div>
                
                {terrain.location && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', textAlign: 'center', marginBottom: '0.25rem' }}>
                    📍 {terrain.location}
                  </div>
                )}
                
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', textAlign: 'center', marginBottom: '0.5rem' }}>
                  {terrain.fields?.length || 0} campos ({getTotalArea(terrain).toFixed(2)} has)
                </div>
                
                {/* Indicador expandido */}
                {isExpanded ? (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--primary)', 
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    ▼ Ocultar
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    ▶ Ver campos
                  </div>
                )}

                {/* Expanded Content - Fields */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                    {/* Header con boton nuevo campo */}
                    <div className="flex flex-between mb-1" style={{ padding: '0 0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        📊 {terrain.fields?.length || 0} campos
                      </span>
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openFieldModal(terrain.id);
                        }}
                      >
                        + Nuevo
                      </button>
                    </div>

                    {/* Grid de campos */}
                    {(!terrain.fields || terrain.fields.length === 0) ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.8rem' }}>
                        Sin campos
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '0.5rem'
                      }}>
                        {terrain.fields?.map(field => {
                          const active = getActivePlanting(field.id);
                          const completed = getFieldCompletedPlantings(field.id);
                          const isFieldExpanded = expandedFieldId === field.id;
                          
                          return (
                            <div 
                              key={field.id} 
                              style={{
                                padding: '0.5rem',
                                border: isFieldExpanded ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.15rem',
                                position: 'relative'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleField(field.id);
                              }}
                            >
                              {/* Botones de accion */}
                              <div 
                                className="flex gap-1" 
                                style={{ position: 'absolute', top: '0.15rem', right: '0.15rem' }}
                                onClick={e => e.stopPropagation()}
                              >
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.05rem 0.2rem', fontSize: '0.6rem' }}
                                  onClick={() => openFieldModal(terrain.id, field)}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '0.05rem 0.2rem', fontSize: '0.6rem' }}
                                  onClick={() => handleFieldDelete(field.id)}
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div style={{ fontSize: '1rem' }}>🌾</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>{field.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>{field.area} has</div>
                              
                              {active && (
                                <div style={{
                                  background: 'var(--success)',
                                  color: 'white',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '2px',
                                  fontSize: '0.6rem',
                                  fontWeight: 500,
                                  textAlign: 'center'
                                }}>
                                  🌱 {active.product?.name?.substring(0, 8)}
                                </div>
                              )}
                              {completed.length > 0 && !active && (
                                <div style={{
                                  background: 'var(--gray-400)',
                                  color: 'white',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '2px',
                                  fontSize: '0.6rem',
                                  textAlign: 'center'
                                }}>
                                  ✅ {completed.length}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Siembras del campo seleccionado */}
                    {expandedFieldId && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                        <div className="flex flex-between mb-1">
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            Siembras
                          </span>
                          <button 
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openPlantingModal(expandedFieldId);
                            }}
                          >
                            + Nueva
                          </button>
                        </div>

                        {/* Active Plantings */}
                        {getActivePlantings(expandedFieldId, plantings).length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            {getActivePlantings(expandedFieldId, plantings).map(p => (
                              <div key={p.id} style={{ 
                                padding: '0.25rem 0.4rem', 
                                background: 'var(--white)', 
                                borderLeft: '2px solid var(--success)',
                                marginBottom: '0.25rem',
                                borderRadius: '2px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{p.product?.name}</span>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--gray-600)' }}>
                                    {new Date(p.startDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.05rem 0.2rem', fontSize: '0.6rem' }}
                                    onClick={() => handleEndPlanting(p.id)}
                                  >
                                    ✓
                                  </button>
                                  <button 
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '0.05rem 0.2rem', fontSize: '0.6rem' }}
                                    onClick={() => handlePlantingDelete(p.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Completed Plantings */}
                        {getCompletedPlantings(expandedFieldId, plantings).length > 0 && (
                          <div>
                            {getCompletedPlantings(expandedFieldId, plantings).map(p => (
                              <div key={p.id} style={{ 
                                padding: '0.25rem 0.4rem', 
                                background: 'var(--white)', 
                                borderLeft: '2px solid var(--gray-400)',
                                opacity: 0.8,
                                marginBottom: '0.25rem',
                                borderRadius: '2px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{p.product?.name}</span>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--gray-600)' }}>
                                    {new Date(p.startDate).toLocaleDateString()} → {p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}
                                  </div>
                                </div>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '0.05rem 0.2rem', fontSize: '0.6rem' }}
                                  onClick={() => handlePlantingDelete(p.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {getActivePlantings(expandedFieldId, plantings).length === 0 && getCompletedPlantings(expandedFieldId, plantings).length === 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                            Sin siembras
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Terrain Modal */}
      {showTerrainModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTerrain ? 'Editar Terreno' : 'Nuevo Terreno'}
              </h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowTerrainModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleTerrainSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={terrainFormData.name}
                    onChange={e => setTerrainFormData({ ...terrainFormData, name: e.target.value })}
                    required
                    placeholder="ej: Terreno Norte"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ubicación (descripción)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={terrainFormData.location}
                    onChange={e => setTerrainFormData({ ...terrainFormData, location: e.target.value })}
                    placeholder="ej: Ruta 5, Km 12"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ubicación en Mapa</label>
                  <MapPicker
                    latitude={terrainFormData.latitude}
                    longitude={terrainFormData.longitude}
                    onChange={handleTerrainMapChange}
                    height="250px"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTerrainModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTerrain ? 'Guardar Cambios' : 'Crear Terreno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingField ? 'Editar Campo' : 'Nuevo Campo'}
              </h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowFieldModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFieldSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fieldFormData.name}
                    onChange={e => setFieldFormData({ ...fieldFormData, name: e.target.value })}
                    required
                    placeholder="ej: Lote Norte"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Área (hectáreas) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={fieldFormData.area}
                    onChange={e => setFieldFormData({ ...fieldFormData, area: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFieldModal(false)}>
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

      {/* Planting Modal */}
      {showPlantingModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPlanting ? 'Editar Siembra' : 'Nueva Siembra'}
              </h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowPlantingModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePlantingSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Producto (Semilla) *</label>
                  <select
                    className="form-select"
                    value={plantingFormData.productId}
                    onChange={e => setPlantingFormData({ ...plantingFormData, productId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={plantingFormData.startDate}
                    onChange={e => setPlantingFormData({ ...plantingFormData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-input"
                    value={plantingFormData.notes}
                    onChange={e => setPlantingFormData({ ...plantingFormData, notes: e.target.value })}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlantingModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlanting ? 'Guardar Cambios' : 'Crear Siembra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
