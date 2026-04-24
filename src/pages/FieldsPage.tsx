import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFields, useTerrains } from '../hooks/useData';
import { Field } from '../types';

export default function FieldsPage() {
  const [searchParams] = useSearchParams();
  const terrainId = searchParams.get('terrainId');
  const navigate = useNavigate();
  
  const { fields, loading, addField, updateField, deleteField } = useFields(terrainId || undefined);
  const { terrains } = useTerrains();
  
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    area: ''
  });

  // Get terrain name if we have a terrainId
  const terrainName = useMemo(() => {
    if (!terrainId) return null;
    return terrains.find(t => t.id === terrainId)?.name || null;
  }, [terrainId, terrains]);

  const resetForm = () => {
    setFormData({ name: '', area: '' });
    setEditingField(null);
  };

  const openModal = (field?: Field) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name,
        area: field.area.toString()
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
      terrainId: terrainId || ''
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
    if (confirm('Are you sure you want to delete this field?')) {
      await deleteField(id);
    }
  };

  // Navigate to plantings page for this field
  const goToPlantings = (fieldId: string) => {
    navigate(`/plantings?fieldId=${fieldId}`);
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
        <div>
          <h2>Campos</h2>
          {terrainName && <p style={{ color: 'var(--gray-600)', margin: 0 }}>Terreno: {terrainName}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + New
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🌾</div>
            <h3>No hay campos registrados</h3>
            {terrainId ? (
              <p>Register your first field for this terrain</p>
            ) : (
              <p>Select a terrain to view its fields</p>
            )}
            <button className="btn btn-primary mt-1" onClick={() => openModal()} disabled={!terrainId}>
              + New
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1rem' 
        }}>
          {fields.map(field => (
            <div key={field.id} className="card" onClick={() => goToPlantings(field.id)} style={{ cursor: 'pointer' }}>
              <div className="card-header">
                <h3 className="card-title">{field.name}</h3>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => openModal(field)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(field.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📐</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Area</div>
                    <div style={{ fontWeight: 'bold' }}>{field.area} ha</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🌱</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Siembras</div>
                    <div>{field.plantings?.length || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()}>
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
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g.: North Lot"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Area (hectares) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    required
                    placeholder="e.g.: 50.5"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
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