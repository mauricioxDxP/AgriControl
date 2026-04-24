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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {terrains.map(terrain => (
            <div key={terrain.id} className="card">
              {/* Terrain Header */}
              <div 
                className="card-header" 
                style={{ cursor: 'pointer' }}
                onClick={() => toggleTerrain(terrain.id)}
              >
                <div className="flex align-center gap-1">
                  <span style={{ fontSize: '1.2rem' }}>{expandedTerrainId === terrain.id ? '▼' : '▶'}</span>
                  <h3 className="card-title">{terrain.name}</h3>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => openTerrainModal(terrain)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleTerrainDelete(terrain.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Terrain Info & Summary */}
              <div style={{ padding: '0 1rem' }}>
                {/* Location */}
                {terrain.location && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    📍 {terrain.location}
                  </div>
                )}
                {terrain.latitude && terrain.longitude && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    🗺️ {terrain.latitude.toFixed(4)}, {terrain.longitude.toFixed(4)}
                  </div>
                )}

                {/* Summary - visible before expanding */}
                {terrain.fields && terrain.fields.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    background: 'var(--gray-100)', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                      📊 Resumen ({terrain.fields.length} campo{terrain.fields.length !== 1 ? 's' : ''} - {getTotalArea(terrain).toFixed(2)} has)
                    </div>
                    
                    {/* Single field - show as a larger card */}
                    {terrain.fields.length === 1 && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '1rem',
                        background: 'var(--white)',
                        border: '2px solid var(--gray-200)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <div style={{ fontSize: '1.5rem' }}>🌾</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{terrain.fields[0].name}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>{terrain.fields[0].area} has</div>
                        {getActivePlanting(terrain.fields[0].id) && (
                          <div style={{
                            marginTop: '0.25rem',
                            background: 'var(--success)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius)',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            textAlign: 'center'
                          }}>
                            <div>🌱 {getActivePlanting(terrain.fields[0].id)?.product?.name || 'Activa'}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                              {new Date(getActivePlanting(terrain.fields[0].id)!.startDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Multiple fields - show as grid of cards */}
                    {terrain.fields.length > 1 && (
                      <div style={{
                        marginTop: '0.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '0.5rem'
                      }}>
                        {terrain.fields.slice(0, 4).map((field: any) => {
                          const active = getActivePlanting(field.id);
                          const completed = getFieldCompletedPlantings(field.id);
                          return (
                            <div key={field.id} style={{
                              padding: '0.75rem',
                              background: 'var(--white)',
                              border: '1px solid var(--gray-200)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.15rem'
                            }}>
                              <div style={{ fontSize: '1.25rem' }}>🌾</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>{field.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{field.area} has</div>
                              {active && (
                                <div style={{
                                  marginTop: '0.15rem',
                                  background: 'var(--success)',
                                  color: 'white',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  textAlign: 'center'
                                }}>
                                  <div>🌱 {active.product?.name?.substring(0, 8) || 'Activa'}</div>
                                  <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>
                                    {new Date(active.startDate).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                              {completed.length > 0 && !active && (
                                <div style={{
                                  marginTop: '0.15rem',
                                  background: 'var(--gray-400)',
                                  color: 'white',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem'
                                }}>
                                  ✅ {completed.length}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {terrain.fields.length > 4 && (
                          <div style={{
                            padding: '0.75rem',
                            background: 'var(--gray-100)',
                            border: '1px dashed var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--gray-500)',
                            fontSize: '0.85rem'
                          }}>
                            +{terrain.fields.length - 4} más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded Content - Fields */}
              {expandedTerrainId === terrain.id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem' }}>
                  <div className="flex flex-between mb-2" style={{ padding: '0 0.5rem' }}>
                    <h4 style={{ margin: 0 }}>Campos ({terrain.fields?.length || 0})</h4>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFieldModal(terrain.id);
                      }}
                    >
                      + Nuevo Campo
                    </button>
                  </div>

                  {(!terrain.fields || terrain.fields.length === 0) ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                      No hay campos en este terreno
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {terrain.fields?.map(field => (
                        <div key={field.id} className="card" style={{ background: 'var(--gray-100)' }}>
                          {/* Field Header */}
                          <div 
                            className="flex flex-between"
                            style={{ cursor: 'pointer', padding: '0.5rem' }}
                            onClick={() => toggleField(field.id)}
                          >
                            <div className="flex align-center gap-1">
                              <span style={{ fontSize: '0.9rem' }}>{expandedFieldId === field.id ? '▼' : '▶'}</span>
                              <span>🌾 <strong>{field.name}</strong></span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                ({field.area} has)
                              </span>
                            </div>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => openFieldModal(terrain.id, field)}
                              >
                                Editar
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleFieldDelete(field.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content - Plantings */}
                          {expandedFieldId === field.id && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                              {/* Add Planting Button */}
                              <div style={{ marginBottom: '1rem' }}>
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPlantingModal(field.id);
                                  }}
                                >
                                  + Nueva Siembra
                                </button>
                              </div>

                              {/* Active Plantings */}
                              <div style={{ marginBottom: '1rem' }}>
                                <h5 style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                                  Siembras Activas
                                </h5>
                                {getActivePlantings(field.id, plantings).length === 0 ? (
                                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                    No hay siembras activas
                                  </div>
                                ) : (
                                  getActivePlantings(field.id, plantings).map(p => (
                                    <div key={p.id} className="card" style={{ padding: '0.5rem', background: 'var(--white)', borderLeft: '3px solid var(--success)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                          <span style={{ fontWeight: 500 }}>{p.product?.name || 'Producto'}</span>
                                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                                            Inicio: {new Date(p.startDate).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleEndPlanting(p.id)}
                                          >
                                            Finalizar
                                          </button>
                                          <button 
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handlePlantingDelete(p.id)}
                                          >
                                            Eliminar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Completed Plantings */}
                              <div>
                                <h5 style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                                  Siembras Finalizadas
                                </h5>
                                {getCompletedPlantings(field.id, plantings).length === 0 ? (
                                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                    No hay siembras finalizadas
                                  </div>
                                ) : (
                                  getCompletedPlantings(field.id, plantings).map(p => (
                                    <div key={p.id} className="card" style={{ padding: '0.5rem', background: 'var(--white)', borderLeft: '3px solid var(--gray-400)', opacity: 0.8 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                          <span style={{ fontWeight: 500 }}>{p.product?.name || 'Producto'}</span>
                                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                                            {new Date(p.startDate).toLocaleDateString()} → {p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}
                                          </div>
                                        </div>
                                        <button 
                                          className="btn btn-danger btn-sm"
                                          onClick={() => handlePlantingDelete(p.id)}
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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
