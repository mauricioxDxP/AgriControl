import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlantings, useFields } from '../hooks/useData';

export default function PlantingsPage() {
  const [searchParams] = useSearchParams();
  const fieldId = searchParams.get('fieldId');
  
  const { plantings, loading, addPlanting, deletePlanting, endPlanting } = usePlantings(fieldId || undefined);
  const { fields } = useFields();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Get field name if we have a fieldId
  const fieldName = useMemo(() => {
    if (!fieldId) return null;
    return fields.find(f => f.id === fieldId)?.name || null;
  }, [fieldId, fields]);

  const resetForm = () => {
    setFormData({
      productId: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      fieldId: fieldId || '',
      productId: formData.productId,
      startDate: formData.startDate,
      notes: formData.notes || undefined
    };

    await addPlanting(data);
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this planting?')) {
      await deletePlanting(id);
    }
  };

  const handleEnd = async (id: string) => {
    if (confirm('Do you want to end this planting?')) {
      await endPlanting(id);
    }
  };

  // Separate active and completed plantings
  const activePlantings = plantings.filter(p => !p.endDate);
  const completedPlantings = plantings.filter(p => p.endDate);

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
        <div>
          <h2>Siembras</h2>
          {fieldName && <p style={{ color: 'var(--gray-600)', margin: 0 }}>Campo: {fieldName}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} disabled={!fieldId}>
          + Nueva Siembra
        </button>
      </div>

      {/* Active Plantings */}
      <div className="mb-3">
        <h3 style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>Activas ({activePlantings.length})</h3>
        {activePlantings.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--gray-500)', textAlign: 'center' }}>No hay siembras activas</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {activePlantings.map(p => (
              <div key={p.id} className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="card-header">
                    <h3 className="card-title">{p.product?.name || 'Producto'}</h3>
                  <div className="flex gap-1">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEnd(p.id)}
                    >
                      Finalizar
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>📅</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Inicio</div>
                      <div>{new Date(p.startDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {p.notes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>📝</span>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Notas</div>
                        <div>{p.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Plantings */}
      <div>
        <h3 style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>Finalizadas ({completedPlantings.length})</h3>
        {completedPlantings.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--gray-500)', textAlign: 'center' }}>No hay siembras finalizadas</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {completedPlantings.map(p => (
              <div key={p.id} className="card" style={{ borderLeft: '4px solid var(--gray-400)', opacity: 0.8 }}>
                <div className="card-header">
                  <h3 className="card-title">{p.product?.name || 'Producto'}</h3>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>📅</span>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--gray-600)' }}>Inicio</div>
                        <div style={{ fontSize: '0.85rem' }}>{new Date(p.startDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>🏁</span>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--gray-600)' }}>Fin</div>
                        <div style={{ fontSize: '0.85rem' }}>{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</div>
                      </div>
                    </div>
                  </div>
                  {p.notes && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                      {p.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Siembra</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Producto (Semilla) *</label>
                  <select
                    className="form-select"
                    value={formData.productId}
                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {/* Products would be loaded from useProducts - simplified for now */}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Inicio *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-input"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
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
                  Crear Siembra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}