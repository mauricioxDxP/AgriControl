import { useState } from 'react';
import { useContainers, useLots, useProducts } from '../hooks/useData';
import { Container, ContainerType, ContainerStatus, BaseUnit, ContainerMovement } from '../types';
import { containersApi } from '../services/api';

export default function ContainersPage() {
  const { containers, loading, addContainer, updateContainer, deleteContainer, consumeContainer } = useContainers();
  const { lots } = useLots();
  const { products } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [containerHistory, setContainerHistory] = useState<ContainerMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);
  const [containerToConsume, setContainerToConsume] = useState<Container | null>(null);
  const [consumeQuantity, setConsumeQuantity] = useState('');
  
  const [formData, setFormData] = useState({
    lotId: '',
    type: 'BIDON' as ContainerType,
    capacity: '',
    unit: 'L' as BaseUnit,
    status: 'DISPONIBLE' as ContainerStatus,
    name: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      lotId: '',
      type: 'BIDON',
      capacity: '',
      unit: 'L',
      status: 'DISPONIBLE',
      name: '',
      notes: ''
    });
    setEditingContainer(null);
  };

  const openModal = (container?: Container) => {
    if (container) {
      setEditingContainer(container);
      setFormData({
        lotId: container.lotId,
        type: container.type,
        capacity: container.capacity.toString(),
        unit: container.unit,
        status: container.status,
        name: container.name || '',
        notes: container.notes || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      lotId: formData.lotId,
      type: formData.type,
      capacity: parseFloat(formData.capacity),
      unit: formData.unit,
      status: formData.status,
      name: formData.name || undefined,
      notes: formData.notes || undefined
    };

    if (editingContainer) {
      await updateContainer(editingContainer.id, data);
    } else {
      await addContainer(data);
    }

    setShowModal(false);
    resetForm();
  };

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (containerToConsume && consumeQuantity) {
      await consumeContainer(containerToConsume.id, parseFloat(consumeQuantity));
      setShowConsumeModal(false);
      setContainerToConsume(null);
      setConsumeQuantity('');
    }
  };

  const openConsumeModal = (container: Container) => {
    setContainerToConsume(container);
    setConsumeQuantity('');
    setShowConsumeModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este contenedor?')) {
      await deleteContainer(id);
    }
  };

  const viewContainerHistory = async (container: Container) => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const movements = await containersApi.getMovements(container.id);
      setContainerHistory(movements);
    } catch (error) {
      console.error('Error loading history:', error);
      setContainerHistory([]);
    }
    setLoadingHistory(false);
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
        <h2>Contenedores</h2>
        <button className="btn btn-primary" onClick={() => openModal()} disabled={lots.length === 0}>
          + Nuevo Contenedor
        </button>
      </div>

      {lots.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero debés crear lotes para poder registrar contenedores</p>
          </div>
        </div>
      )}

      {/* Vista de contenedores por lote */}
      {containers.length === 0 && lots.length > 0 && (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>📦</div>
            <h3>No hay contenedores</h3>
            <p>Registrá tu primer contenedor para gestionar el inventario físico</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Crear Contenedor
            </button>
          </div>
        </div>
      )}

      {lots.length > 0 && containers.length > 0 && (
        <div>
          {/* Contenedores por lote */}
          {lots.filter(lot => containers.some(c => c.lotId === lot.id)).map(lot => {
            const lotContainers = containers.filter(c => c.lotId === lot.id);
            const product = products.find(p => p.id === lot.productId);
            const fullContainers = lotContainers.filter(c => c.status === 'DISPONIBLE');
            const partialContainers = lotContainers.filter(c => c.status === 'EN_USO' || c.status === 'VACIO');
            const totalCurrent = lotContainers.reduce((sum, c) => sum + (c.currentQuantity || 0), 0);
            const totalCapacity = lotContainers.reduce((sum, c) => sum + c.capacity, 0);
            
            return (
              <div key={lot.id} style={{ marginBottom: '1.5rem' }}>
                {/* Header del lote */}
                <div style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius) var(--radius) 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{product?.name || 'Sin producto'}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    Total: <strong>{totalCurrent} / {totalCapacity} {product?.baseUnit}</strong>
                  </div>
                </div>
                
                {/* Contenedores completos */}
                {fullContainers.length > 0 && (
                  <div style={{ 
                    padding: '0.5rem',
                    background: '#e8f5e9',
                    borderBottom: '1px solid var(--gray-200)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      ✅ Completos: {fullContainers.length}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {fullContainers.map(c => (
                        <span key={c.id} className="badge badge-primary" style={{ margin: '0.1rem' }}>
                          {c.name} ({c.capacity}{product?.baseUnit})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Contenedores parciales */}
                {partialContainers.length > 0 && (
                  <div style={{ 
                    padding: '0.5rem',
                    background: '#fff3e0',
                    borderRadius: '0 0 var(--radius) var(--radius)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      ⚠️ Parciales/Vacíos: {partialContainers.length}
                    </div>
                    <div className="table-container" style={{ marginTop: '0.25rem' }}>
                      <table className="table" style={{ fontSize: '0.8rem' }}>
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Capacidad</th>
                            <th>Actual</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partialContainers.map(c => (
                            <tr key={c.id}>
                              <td>{c.name}</td>
                              <td>{c.capacity}{product?.baseUnit}</td>
                              <td><strong>{c.currentQuantity || 0}</strong></td>
                              <td>
                                <span className={`badge ${c.status === 'EN_USO' ? 'badge-secondary' : 'badge-danger'}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td>
                                <div className="flex gap-1">
                                  <button 
                                    className="btn btn-info btn-sm"
                                    onClick={() => viewContainerHistory(c)}
                                    title="Historial"
                                  >
                                    📋
                                  </button>
                                  {c.status === 'EN_USO' && (
                                    <button 
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => openConsumeModal(c)}
                                    >
                                      Consumir
                                    </button>
                                  )}
                                  <button 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(c.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingContainer ? 'Editar Contenedor' : 'Nuevo Contenedor'}
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
                  <label className="form-label">Lote *</label>
                  <select
                    className="form-select"
                    value={formData.lotId}
                    onChange={e => setFormData({ ...formData, lotId: e.target.value })}
                    required
                    disabled={!!editingContainer}
                  >
                    <option value="">Seleccionar lote...</option>
                    {lots.map(lot => {
                      const product = products.find(p => p.id === lot.productId);
                      const lotLabel = lot.lotCode ? lot.lotCode : `Lote ${lot.id.slice(0, 8)}`;
                      return (
                        <option key={lot.id} value={lot.id}>
                          {lotLabel} [{product?.name || 'Sin producto'}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as ContainerType })}
                    >
                      <option value="BIDON">Bidón</option>
                      <option value="SACO">Saco</option>
                      <option value="BOLSA">Bolsa</option>
                      <option value="TAMBOR">Tambor</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nombre (opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Bidón A1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacidad *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unidad</label>
                    <select
                      className="form-select"
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value as BaseUnit })}
                    >
                      <option value="L">Litros (L)</option>
                      <option value="ML">Mililitros (ml)</option>
                      <option value="KG">Kilogramos (kg)</option>
                      <option value="G">Gramos (g)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observaciones..."
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
                  {editingContainer ? 'Guardar Cambios' : 'Crear Contenedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Consumo */}
      {showConsumeModal && containerToConsume && (
        <div className="modal-overlay" onClick={() => setShowConsumeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Consumir del Contenedor</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowConsumeModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConsume}>
              <div className="modal-body">
                <p style={{ marginBottom: '1rem' }}>
                  <strong>Disponible:</strong> {containerToConsume.currentQuantity || 0} {containerToConsume.unit}
                </p>
                <div className="form-group">
                  <label className="form-label">Cantidad a consumir</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={containerToConsume.currentQuantity || 0}
                    className="form-input"
                    value={consumeQuantity}
                    onChange={e => setConsumeQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowConsumeModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Consumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">Historial del Contenedor</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowHistoryModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {loadingHistory ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : containerHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-600)' }}>
                  No hay movimientos registrados
                </p>
              ) : (
                <div style={{ fontSize: '0.85rem' }}>
                  {containerHistory.map(movement => (
                    <div 
                      key={movement.id} 
                      style={{ 
                        padding: '0.75rem', 
                        borderBottom: '1px solid var(--gray-200)',
                        background: movement.type === 'CONSUMO' ? '#ffebee' : '#e8f5e9'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong>
                          {movement.type === 'CONSUMO' ? '🔴 Consumo' : movement.type === 'RECARGA' ? '🟢 Recarga' : '🔵 Ajuste'}
                        </strong>
                        <span style={{ color: 'var(--gray-600)' }}>
                          {new Date(movement.createdAt).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div>
                        Cantidad: <strong>{movement.quantity}</strong> | Anterior: {movement.previousQuantity}
                      </div>
                      {movement.notes && (
                        <div style={{ color: 'var(--gray-600)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {movement.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
