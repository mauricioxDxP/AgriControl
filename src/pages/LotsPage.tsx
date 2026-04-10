import { useState } from 'react';
import { useLots, useProducts, useLotLines } from '../hooks/useData';
import { ContainerType, Lot } from '../types';

export default function LotsPage() {
  const { lots, loading, addLot, updateLot, deleteLot } = useLots();
  const { products } = useProducts();
  const { addLotLine } = useLotLines();
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    entryDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    supplier: '',
    lotCode: '',
    initialStock: '',
    // Container info
    containerType: 'BIDON' as ContainerType,
    containerCapacity: '',
    fullContainers: '0',
    partialContainers: '0',
    partialQuantity: ''
  });

  const [editFormData, setEditFormData] = useState({
    expiryDate: '',
    supplier: '',
    lotCode: '',
    initialStock: ''
  });

  const resetForm = () => {
    setFormData({
      productId: '',
      entryDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      supplier: '',
      lotCode: '',
      initialStock: '',
      containerType: 'BIDON',
      containerCapacity: '',
      fullContainers: '0',
      partialContainers: '0',
      partialQuantity: ''
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (lot: Lot) => {
    setEditingLot(lot);
    setEditFormData({
      expiryDate: lot.expiryDate ? lot.expiryDate.split('T')[0] : '',
      supplier: lot.supplier || '',
      lotCode: lot.lotCode || '',
      initialStock: lot.initialStock.toString()
    });
    setEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLot) return;

    await updateLot(editingLot.id, {
      expiryDate: editFormData.expiryDate ? new Date(editFormData.expiryDate).toISOString() : undefined,
      supplier: editFormData.supplier || undefined,
      lotCode: editFormData.lotCode || undefined,
      initialStock: parseFloat(editFormData.initialStock) || 0
    });

    setEditModal(false);
    setEditingLot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const stock = parseFloat(formData.initialStock);
    const containerCapacity = parseFloat(formData.containerCapacity);
    
    // Create the lot first
    const lot = await addLot({
      productId: formData.productId,
      entryDate: new Date(formData.entryDate).toISOString(),
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
      supplier: formData.supplier || undefined,
      lotCode: formData.lotCode || undefined,
      initialStock: stock,
      containerType: formData.containerType as any,
      containerCapacity: containerCapacity > 0 ? containerCapacity : undefined
    });

    // If lot was created successfully and containers are specified, create containers
    if (lot && containerCapacity > 0) {
      const product = products.find(p => p.id === formData.productId);
      const unit = product?.baseUnit || 'L';
      
      // Calculate number of full containers
      const numContainers = Math.floor(stock / containerCapacity);
      const remainingStock = stock % containerCapacity;
      
      // Create full containers
      if (numContainers > 0) {
        await addLotLine({
          lotId: lot.id,
          productId: lot.productId,
          type: 'FULL',
          units: numContainers,
          capacity: containerCapacity,
          unit: unit as any,
          remainingVolume: containerCapacity
        });
      }
      
      // Create partially filled container if there's remaining stock
      if (remainingStock > 0) {
        await addLotLine({
          lotId: lot.id,
          productId: lot.productId,
          type: 'PARTIAL',
          units: 1,
          capacity: containerCapacity,
          unit: unit as any,
          remainingVolume: remainingStock
        });
      }
    }
    // await addLotLine({
    //       lotId: lot.id,
    //       productId: lot.productId,
    //       type: 'EMPTY',
    //       units: 0,
    //       capacity: containerCapacity,
    //       remainingVolume: 0
    //     });

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este lote?')) {
      await deleteLot(id);
    }
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Sin producto';
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Get selected product's unit
  const selectedProduct = products.find(p => p.id === formData.productId);

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
        <h2>Lotes</h2>
        <button className="btn btn-primary" onClick={openModal} disabled={products.length === 0}>
          + Nuevo
        </button>
      </div>

      {products.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero debés crear productos para poder registrar lotes</p>
          </div>
        </div>
      )}

      {lots.length === 0 && products.length > 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🔖</div>
            <h3>No hay lotes</h3>
            <p>Registrá tu primer lote para gestionar el stock</p>
            <button className="btn btn-primary mt-1" onClick={openModal}>
              + Nuevo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Vista móvil - Cards */}
          <div className="mobile-cards">
            {lots.map(lot => (
              <div key={lot.id} className="card-mobile">
                <div className="card-mobile-header">
                  <span className="card-mobile-date">{formatDate(lot.entryDate)}</span>
                  {isExpired(lot.expiryDate) ? (
                    <span className="card-mobile-badge badge-danger">Vencido</span>
                  ) : (
                    <span className="card-mobile-badge badge-primary">Activo</span>
                  )}
                </div>
                
                <div className="card-mobile-content">
                  <div className="card-mobile-section">
                    <span className="card-mobile-label">Producto:</span>
                    <span>{getProductName(lot.productId)}</span>
                  </div>
                  
                  {lot.lotCode && (
                    <div className="card-mobile-section">
                      <span className="card-mobile-label">Código:</span>
                      <span className="badge badge-info">{lot.lotCode}</span>
                    </div>
                  )}
                  
                  <div className="card-mobile-row">
                    <div>
                      <span className="card-mobile-label">Stock:</span>
                      <span>{lot.initialStock}</span>
                    </div>
                    {lot.containerCapacity && (
                      <div>
                        <span className="card-mobile-label">Contenedor:</span>
                        <span>{(lot.containerType as any)?.name || lot.containerType} {lot.containerCapacity}</span>
                      </div>
                    )}
                  </div>
                  
                  {lot.expiryDate && (
                    <div className="card-mobile-section">
                      <span className="card-mobile-label">Vencimiento:</span>
                      <span>{formatDate(lot.expiryDate)}</span>
                    </div>
                  )}
                  
                  {lot.supplier && (
                    <div className="card-mobile-section">
                      <span className="card-mobile-label">Proveedor:</span>
                      <span>{lot.supplier}</span>
                    </div>
                  )}
                </div>
                
                <div className="card-mobile-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEditModal(lot)}
                    style={{ flex: 1 }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(lot.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista desktop - Tabla */}
          <div className="table-container hide-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Fecha Ingreso</th>
                  <th>Vencimiento</th>
                  <th>Proveedor</th>
                  <th>Stock</th>
                  <th>Contenedor</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
                <tbody>
                {lots.map(lot => (
                  <tr key={lot.id}>
                    <td>
                      {lot.lotCode ? (
                        <span className="badge badge-info">{lot.lotCode}</span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                    <td><strong>{getProductName(lot.productId)}</strong></td>
                    <td>{formatDate(lot.entryDate)}</td>
                    <td>
                      {lot.expiryDate ? formatDate(lot.expiryDate) : '-'}
                      {isExpired(lot.expiryDate) && (
                        <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>
                          Vencido
                        </span>
                      )}
                    </td>
                    <td>{lot.supplier || '-'}</td>
                    <td>{lot.initialStock}</td>
                    <td>
                      {lot.containerCapacity && (
                        <span className="badge badge-info">
                          {(lot.containerType as any)?.name || lot.containerType} {lot.containerCapacity}{products.find(p => p.id === lot.productId)?.baseUnit || 'L'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isExpired(lot.expiryDate) ? (
                        <span className="badge badge-danger">Vencido</span>
                      ) : (
                        <span className="badge badge-primary">Activo</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(lot)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(lot.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Lote</h3>
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
                  <label className="form-label">Producto *</label>
                  <select
                    className="form-select"
                    value={formData.productId}
                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.baseUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha Ingreso *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.entryDate}
                      onChange={e => setFormData({ ...formData, entryDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha Vencimiento</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expiryDate}
                      onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.supplier}
                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código de Lote</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.lotCode}
                    onChange={e => setFormData({ ...formData, lotCode: e.target.value })}
                    placeholder="Ej: LOTE-2024-001"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Inicial * ({selectedProduct?.baseUnit})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.initialStock}
                    onChange={e => {
                      setFormData({ ...formData, initialStock: e.target.value });
                      // Auto-calculate container count based on capacity
                      if (formData.containerCapacity) {
                        const capacity = parseFloat(formData.containerCapacity);
                        if (capacity > 0) {
                          const stock = parseFloat(e.target.value) || 0;
                          const count = Math.ceil(stock / capacity);
                          setFormData(prev => ({ ...prev, containerCount: count.toString() }));
                        }
                      }
                    }}
                    required
                    placeholder="Cantidad inicial"
                  />
                </div>

                {/* Container creation section */}
                <div style={{ 
                  background: 'var(--gray-50)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius)',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ marginBottom: '0.75rem', color: 'var(--primary)' }}>
                    📦 Crear Contenedores
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                    Especificá los contenedores físicos que componen este lote
                  </p>
                  
                  <div className="form-group">
                    <label className="form-label">Tipo de Contenedor</label>
                    <select
                      className="form-select"
                      value={formData.containerType}
                      onChange={e => setFormData({ ...formData, containerType: e.target.value as ContainerType })}
                    >
                      <option value="BIDON">Bidón</option>
                      <option value="SACO">Saco</option>
                      <option value="BOLSA">Bolsa</option>
                      <option value="TAMBOR">Tambor</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Capacidad por Contenedor ({selectedProduct?.baseUnit})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.containerCapacity}
                      onChange={e => {
                        setFormData({ ...formData, containerCapacity: e.target.value });
                        // Auto-calculate full containers based on stock
                        if (formData.initialStock) {
                          const stock = parseFloat(formData.initialStock) || 0;
                          const capacity = parseFloat(e.target.value) || 0;
                          if (capacity > 0) {
                            const fullCount = Math.floor(stock / capacity);
                            setFormData(prev => ({ ...prev, fullContainers: fullCount.toString() }));
                          }
                        }
                      }}
                      placeholder="Capacidad de cada contenedor"
                    />
                  </div>

                  {/* Full containers */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--success)' }}>
                      ✅ Contenedores LLENOS (sin abrir)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="form-input"
                      value={formData.fullContainers}
                      onChange={e => setFormData({ ...formData, fullContainers: e.target.value })}
                      placeholder="Cantidad de contenedores lleno"
                    />
                    {formData.fullContainers && formData.containerCapacity && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        {formData.fullContainers} {formData.containerType}(s) de {formData.containerCapacity} {selectedProduct?.baseUnit} cada uno
                      </div>
                    )}
                  </div>

                  {/* Partial containers */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--warning)' }}>
                      ⚠️ Contenedores PARCIALMENTE CONSUMIDOS
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="form-input"
                          value={formData.partialContainers}
                          onChange={e => setFormData({ ...formData, partialContainers: e.target.value })}
                          placeholder="Cantidad"
                        />
                      </div>
                      <div style={{ flex: 2 }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          value={formData.partialQuantity}
                          onChange={e => setFormData({ ...formData, partialQuantity: e.target.value })}
                          placeholder={`Restante por contenedor (${selectedProduct?.baseUnit})`}
                        />
                      </div>
                    </div>
                    {formData.partialContainers && formData.partialQuantity && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        {formData.partialContainers} {formData.containerType}(s) con {formData.partialQuantity} {selectedProduct?.baseUnit} restantes cada uno
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {((parseInt(formData.fullContainers) > 0) || (parseInt(formData.partialContainers) > 0)) && formData.containerCapacity && (
                    <div style={{ 
                      background: 'var(--white)', 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--primary)',
                      fontSize: '0.8rem'
                    }}>
                      <strong>Resumen:</strong>
                      <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                        {parseInt(formData.fullContainers) > 0 && (
                          <li>✅ {formData.fullContainers} {formData.containerType}(s) lleno(s): {parseInt(formData.fullContainers) * parseFloat(formData.containerCapacity)} {selectedProduct?.baseUnit}</li>
                        )}
                        {parseInt(formData.partialContainers) > 0 && formData.partialQuantity && (
                          <li>⚠️ {formData.partialContainers} {formData.containerType}(s) parcialmente: {parseInt(formData.partialContainers) * parseFloat(formData.partialQuantity)} {selectedProduct?.baseUnit}</li>
                        )}
                      </ul>
                    </div>
                  )}
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
                  Crear Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && editingLot && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Lote</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setEditModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Producto</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={products.find(p => p.id === editingLot.productId)?.name || ''} 
                    disabled 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha Ingreso</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={new Date(editingLot.entryDate).toLocaleDateString()} 
                      disabled 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha Vencimiento</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editFormData.expiryDate}
                      onChange={e => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.supplier}
                    onChange={e => setEditFormData({ ...editFormData, supplier: e.target.value })}
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código de Lote</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.lotCode}
                    onChange={e => setEditFormData({ ...editFormData, lotCode: e.target.value })}
                    placeholder="Ej: LOTE-2024-001"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock ({products.find(p => p.id === editingLot.productId)?.baseUnit || 'L'})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={editFormData.initialStock}
                    onChange={e => setEditFormData({ ...editFormData, initialStock: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
