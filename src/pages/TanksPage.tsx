import { useState } from 'react';
import { useTanks } from '../hooks/useData';

export default function TanksPage() {
  const { tanks, loading, addTank, updateTank, deleteTank } = useTanks();
  const [showModal, setShowModal] = useState(false);
  const [editingTank, setEditingTank] = useState<{ id: string; name: string; capacity: number } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: ''
  });

  const resetForm = () => {
    setFormData({ name: '', capacity: '' });
    setEditingTank(null);
  };

  const openModal = (tank?: { id: string; name: string; capacity: number }) => {
    if (tank) {
      setEditingTank(tank);
      setFormData({ name: tank.name, capacity: tank.capacity.toString() });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      capacity: parseFloat(formData.capacity)
    };

    if (editingTank) {
      await updateTank(editingTank.id, data);
    } else {
      await addTank(data);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este tanque?')) {
      await deleteTank(id);
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
        <h2>Tanques Fijos</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Nuevo
        </button>
      </div>

      {tanks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🛢️</div>
            <h3>No hay tanques registrados</h3>
            <p>Agregá tanques fijos para usar en las tancadas</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Nuevo
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '1rem' 
        }}>
          {tanks.map(tank => (
            <div key={tank.id} className="card">
              <div className="card-header">
                <h3 className="card-title">{tank.name}</h3>
                <div className="flex gap-1">
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => openModal(tank)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(tank.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>🛢️</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {tank.capacity} L
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Capacidad</div>
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
                {editingTank ? 'Editar Tanque' : 'Nuevo Tanque'}
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
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Tanque Principal"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Capacidad (L) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    placeholder="Ej: 500"
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
                  {editingTank ? 'Guardar Cambios' : 'Crear Tanque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
