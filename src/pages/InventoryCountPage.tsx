import { useState, useEffect } from 'react';
import { useProducts, useLots } from '../hooks/useData';
import { inventoryCountService } from '../features/inventory-count/services';
import { InventoryCount, InventoryCountLine } from '../features/inventory-count/services';
import { useInventoryCounts, usePendingAdjustments } from '../features/inventory-count/hooks';
import { getBaseUnitAbbr } from '../utils/units';
import { lotsService } from '../features/lots/services';

export default function InventoryCountPage() {
  const { counts, loading: countsLoading, refresh: refreshCounts } = useInventoryCounts();
  const { adjustments, loading: adjustmentsLoading, refresh: refreshAdjustments } = usePendingAdjustments();
  const productsHook = useProducts();
  const lotsHook = useLots();
  const products = productsHook.products || [];
  const lots = lotsHook.lots || [];

  const [selectedCountId, setSelectedCountId] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPendientesModal, setShowPendientesModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingLine, setAdjustingLine] = useState<InventoryCountLine | null>(null);

  // Form state for new count
  const [newCountDate, setNewCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCountNotes, setNewCountNotes] = useState('');
  // Products selected for the new count
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Form state for adjust
  const [adjustType, setAdjustType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [selectedLots, setSelectedLots] = useState<{ lotId: string; quantity: number }[]>([]);
  const [createNewLotMode, setCreateNewLotMode] = useState(false);
  const [newLotData, setNewLotData] = useState({
    lotCode: '',
    expiryDate: '',
    supplier: '',
    quantity: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load selected count details
  useEffect(() => {
    if (selectedCountId) {
      inventoryCountService.getById(selectedCountId).then(setSelectedCount).catch(console.error);
    } else {
      setSelectedCount(null);
    }
  }, [selectedCountId]);

  const pendingCount = adjustments.length;

  const handleCreateCount = async () => {
    if (!newCountDate) {
      setError('Debe ingresar fecha');
      return;
    }

    if (selectedProductIds.length === 0) {
      setError('Debe seleccionar al menos un producto');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lines = selectedProductIds.map(productId => ({
        productId,
        stockManual: 0
      }));
      const newCount = await inventoryCountService.create({
        date: newCountDate,
        notes: newCountNotes,
        lines
      });
      setShowNewModal(false);
      setNewCountNotes('');
      setSelectedProductIds([]);
      refreshCounts();
      // Select the newly created count
      setSelectedCountId(newCount.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear conteo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCount = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este conteo?')) return;

    setLoading(true);
    setError(null);
    try {
      await inventoryCountService.delete(id);
      if (selectedCountId === id) {
        setSelectedCountId(null);
        setSelectedCount(null);
      }
      refreshCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar conteo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStockManual = async (lineId: string, stockManual: number) => {
    if (!selectedCountId || !selectedCount) return;

    // Optimistic update - update local state immediately
    const updatedLines = selectedCount.lines.map(line =>
      line.id === lineId ? { ...line, stockManual } : line
    );
    setSelectedCount({ ...selectedCount, lines: updatedLines });

    // Send to server in background
    try {
      await inventoryCountService.updateLine(selectedCountId, lineId, { stockManual });
    } catch (err) {
      // On error, revert and show error
      setSelectedCount(selectedCount);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleRequestAdjustment = async () => {
    if (!adjustingLine || selectedLots.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      await inventoryCountService.requestAdjustment({
        lineId: adjustingLine.id,
        type: adjustType,
        lots: selectedLots
      });
      setShowAdjustModal(false);
      setAdjustingLine(null);
      setSelectedLots([]);
      setCreateNewLotMode(false);
      refreshCounts();
      refreshAdjustments();
      if (selectedCountId) {
        const updated = await inventoryCountService.getById(selectedCountId);
        setSelectedCount(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar ajuste');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewLotAndAdjust = async () => {
    if (!adjustingLine || !newLotData.lotCode) {
      setError('El código del lote es requerido');
      return;
    }

    if (newLotData.quantity <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the new lot
      const newLot = await lotsService.create({
        productId: adjustingLine.productId,
        lotCode: newLotData.lotCode,
        expiryDate: newLotData.expiryDate || undefined,
        supplier: newLotData.supplier || undefined,
        initialStock: newLotData.quantity,
        entryDate: new Date().toISOString()
      });

      // Add the new lot to selected lots
      setSelectedLots(prev => [...prev, { lotId: newLot.id, quantity: newLotData.quantity }]);

      // Clear the form but stay in create mode to add more lots if needed
      setNewLotData({ lotCode: '', expiryDate: '', supplier: '', quantity: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear lote');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (adjustmentId: string) => {
    setLoading(true);
    try {
      await inventoryCountService.authorizeAdjustment(adjustmentId);
      refreshAdjustments();
      refreshCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al autorizar');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (adjustmentId: string) => {
    setLoading(true);
    try {
      await inventoryCountService.rejectAdjustment(adjustmentId);
      refreshAdjustments();
      refreshCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (line: InventoryCountLine, type: 'INCREASE' | 'DECREASE') => {
    setAdjustingLine(line);
    setAdjustType(type);
    setSelectedLots([]);
    setCreateNewLotMode(false);
    setNewLotData({ lotCode: '', expiryDate: '', supplier: '', quantity: 0 });
    setShowAdjustModal(true);
  };

  const getProductLots = (productId: string) => {
    return lots.filter(l => l.productId === productId);
  };

  const getDiferencia = (line: InventoryCountLine) => {
    return adjustType === 'INCREASE'
      ? line.stockManual - line.stockActual
      : line.stockActual - line.stockManual;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  return (
    <div>
      <div className="page-header">
        <h2>📋 Conteo de Inventario</h2>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowPendientesModal(true)}>
            ⏳ Pendientes ({pendingCount})
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            + Nuevo Conteo
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {countsLoading || adjustmentsLoading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          {/* Lista de Conteos */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Historial de Conteos</h3>
            </div>

            {counts.length === 0 ? (
              <div className="empty-state">
                <p>No hay conteos registrados</p>
                <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                  Crear primer conteo
                </button>
              </div>
            ) : (
              <div className="list">
                {counts.map(count => (
                  <div
                    key={count.id}
                    className={`list-item ${selectedCountId === count.id ? 'list-item-selected' : ''}`}
                    onClick={() => setSelectedCountId(count.id)}
                  >
                    <div className="list-item-content">
                      <div className="list-item-title">
                        📅 {formatDate(count.date)}
                        {count.notes && <span className="list-item-subtitle"> - {count.notes}</span>}
                      </div>
                      <div className="list-item-meta">
                        {count.lines.length} productos
                        {count.lines.filter(l => l.adjustmentPending).length > 0 && (
                          <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
                            {count.lines.filter(l => l.adjustmentPending).length} pendientes
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCount(count.id);
                      }}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detalle del Conteo Seleccionado */}
          {selectedCount && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h3 className="card-title">Detalle del Conteo - {formatDate(selectedCount.date)}</h3>
                {selectedCount.notes && <p style={{ margin: 0 }}>{selectedCount.notes}</p>}
              </div>

              {selectedCount.lines.length === 0 ? (
                <div className="empty-state">
                  <p>Este conteo no tiene productos. Volvé a crear otro conteo con productos seleccionados.</p>
                </div>
              ) : (
                Object.entries(
                  selectedCount.lines.reduce((acc: Record<string, typeof selectedCount.lines>, line) => {
                    const typeName = (line as any).product?.type?.name || (line as any).product?.type || 'Sin tipo';
                    if (!acc[typeName]) acc[typeName] = [];
                    acc[typeName].push(line);
                    return acc;
                  }, {})
                )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([typeName, lines]) => (
                    <div key={typeName} className="inventory-count-type-group">
                      <div className="type-group-header">
                        <span className="type-group-name">{typeName}</span>
                        <span className="type-group-count">({lines.length})</span>
                      </div>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Producto</th>
                              <th>Stock Sistema</th>
                              <th>Stock Manual</th>
                              <th>Diferencia</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lines.map(line => {
                              const diferencia = line.stockActual - line.stockManual;
                              const hasDiferencia = line.stockManual > 0 && diferencia !== 0;
                              const unitAbbr = getBaseUnitAbbr((line as any).product?.baseUnit || '');
                              return (
                                <tr key={line.id}>
                                  <td>{line.productCode || '-'}</td>
                                  <td><strong>{line.productName}</strong></td>
                                  <td>{line.stockActual.toFixed(2)} {unitAbbr}</td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-input"
                                      value={line.stockManual === 0 ? '' : line.stockManual}
                                      placeholder="0"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                          handleUpdateStockManual(line.id, 0);
                                        } else {
                                          const num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            handleUpdateStockManual(line.id, num);
                                          }
                                        }
                                      }}
                                      disabled={line.adjustmentPending}
                                      style={{ width: '100px' }}
                                    />
                                  </td>
                                  <td style={{
                                    color: !hasDiferencia ? 'var(--gray-500)' : diferencia > 0 ? 'var(--danger)' : 'var(--success)'
                                  }}>
                                    {!hasDiferencia ? '-' : diferencia > 0 ? '-' : '+'}{Math.abs(diferencia).toFixed(2)} {unitAbbr}
                                  </td>
                                  <td>
                                    {line.adjustmentPending ? (
                                      <span className="badge badge-warning">⏳ Pendiente</span>
                                    ) : hasDiferencia && line.stockManual > line.stockActual ? (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => openAdjustModal(line, 'INCREASE')}
                                      >
                                        + Aumentar
                                      </button>
                                    ) : hasDiferencia && line.stockManual < line.stockActual ? (
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => openAdjustModal(line, 'DECREASE')}
                                      >
                                        - Reducir
                                      </button>
                                    ) : (
                                      <span className="text-muted">✓</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
              )}
          </div>
        )}
      </>
      )}

      {/* Modal Nuevo Conteo */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo Conteo de Inventario</h3>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={newCountDate}
                  onChange={(e) => setNewCountDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notas (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCountNotes}
                  onChange={(e) => setNewCountNotes(e.target.value)}
                  placeholder="Ej: Conteo mensual"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>Productos a contar</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (selectedProductIds.length === products.length) {
                        setSelectedProductIds([]);
                      } else {
                        setSelectedProductIds(products.map(p => p.id));
                      }
                    }}
                  >
                    {selectedProductIds.length === products.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
                <div className="products-select-list">
                  {Object.entries(
                    products.reduce((acc: Record<string, typeof products>, product) => {
                      const typeName = (product as any).type?.name || (product as any).type || 'Sin tipo';
                      if (!acc[typeName]) acc[typeName] = [];
                      acc[typeName].push(product);
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([typeName, typeProducts]) => (
                      <div key={typeName} className="product-type-group">
                        <div
                          className="product-type-header"
                          onClick={() => {
                            const typeIds = (typeProducts as any[]).map((p: any) => p.id);
                            const allSelected = typeIds.every(id => selectedProductIds.includes(id));
                            if (allSelected) {
                              setSelectedProductIds(selectedProductIds.filter(id => !typeIds.includes(id)));
                            } else {
                              setSelectedProductIds([...new Set([...selectedProductIds, ...typeIds])]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={typeProducts.every((p: any) => selectedProductIds.includes(p.id))}
                            onChange={() => {}}
                          />
                          <span className="product-type-name">{typeName}</span>
                          <span className="product-type-count">({typeProducts.length})</span>
                        </div>
                        {(typeProducts as any[]).map(product => (
                          <div
                            key={product.id}
                            className={`product-select-item ${selectedProductIds.includes(product.id) ? 'selected' : ''}`}
                            onClick={() => {
                              if (selectedProductIds.includes(product.id)) {
                                setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                              } else {
                                setSelectedProductIds([...selectedProductIds, product.id]);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={() => {}}
                            />
                            <div className="product-info">
                              <strong>{product.name}</strong>
                              <span className="text-muted">{product.productCode}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                  {selectedProductIds.length} producto{selectedProductIds.length !== 1 ? 's' : ''} seleccionado{selectedProductIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCount}
                disabled={loading || !newCountDate || selectedProductIds.length === 0}
              >
                {loading ? 'Creando...' : 'Crear Conteo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pendientes de Autorización */}
      {showPendientesModal && (
        <div className="modal-overlay" onClick={() => setShowPendientesModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⏳ Ajustes Pendientes de Autorización</h3>
              <button className="modal-close" onClick={() => setShowPendientesModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {adjustments.length === 0 ? (
                <div className="empty-state">
                  <p>No hay ajustes pendientes</p>
                </div>
              ) : (
                <div className="pending-list">
                  {adjustments.map(adj => (
                    <div key={adj.id} className="pending-item">
                      <div className="pending-header">
                        <span className={`badge ${adj.type === 'INCREASE' ? 'badge-success' : 'badge-danger'}`}>
                          {adj.type === 'INCREASE' ? '+' : '-'} {adj.totalQuantity.toFixed(2)}
                        </span>
                        <span className="text-muted">
                          Solicitado el {formatDate(adj.createdAt)}
                        </span>
                      </div>
                      <div className="pending-lots">
                        {adj.lots.map(lot => (
                          <span key={lot.id} className="lot-badge">
                            {lot.lot?.lotCode || lot.lotId}: {lot.quantity.toFixed(2)}
                          </span>
                        ))}
                      </div>
                      <div className="pending-actions">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAuthorize(adj.id)}
                          disabled={loading}
                        >
                          ✓ Autorizar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(adj.id)}
                          disabled={loading}
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste por Lotes */}
      {showAdjustModal && adjustingLine && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{adjustType === 'INCREASE' ? '+ Aumentar' : '- Reducir'} Stock</h3>
              <button className="modal-close" onClick={() => setShowAdjustModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="adjust-info">
                <p>
                  <strong>{adjustingLine.productName}</strong>
                </p>
                <p>
                  Stock Sistema: <strong>{adjustingLine.stockActual.toFixed(2)}</strong>
                </p>
                <p>
                  Stock Manual: <strong>{adjustingLine.stockManual.toFixed(2)}</strong>
                </p>
                <p className="diferencia">
                  Diferencia a {adjustType === 'INCREASE' ? 'aumentar' : 'reducir'}:
                  <strong className={adjustType === 'INCREASE' ? 'text-success' : 'text-danger'}>
                    {getDiferencia(adjustingLine).toFixed(2)}
                  </strong>
                </p>
              </div>

              <div className="form-group">
                {createNewLotMode ? (
                  <div className="new-lot-form">
                    <h4>Crear Nuevo Lote</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Código de Lote *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newLotData.lotCode}
                          onChange={(e) => setNewLotData({ ...newLotData, lotCode: e.target.value })}
                          placeholder="Ej: LOTE-001"
                        />
                      </div>
                      <div className="form-group">
                        <label>Fecha Vencimiento</label>
                        <input
                          type="date"
                          className="form-input"
                          value={newLotData.expiryDate}
                          onChange={(e) => setNewLotData({ ...newLotData, expiryDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Proveedor</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newLotData.supplier}
                        onChange={(e) => setNewLotData({ ...newLotData, supplier: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cantidad a Agregar</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newLotData.quantity || ''}
                        placeholder={`0 - ${getDiferencia(adjustingLine).toFixed(2)} disponible`}
                        min="0"
                        step="0.01"
                        onChange={(e) => setNewLotData({ ...newLotData, quantity: parseFloat(e.target.value) || 0 })}
                      />
                      <small className="text-muted">
                        Diferencia total: {getDiferencia(adjustingLine).toFixed(2)} - Ya seleccionado: {selectedLots.reduce((sum, l) => sum + l.quantity, 0).toFixed(2)}
                      </small>
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setCreateNewLotMode(false);
                          setNewLotData({ lotCode: '', expiryDate: '', supplier: '', quantity: 0 });
                        }}
                      >
                        Listo
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCreateNewLotAndAdjust}
                        disabled={loading || !newLotData.lotCode || newLotData.quantity <= 0}
                      >
                        {loading ? 'Creando...' : 'Crear y Agregar Otro'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label>Seleccionar Lotes</label>
                    {getProductLots(adjustingLine.productId).map(lot => (
                      <div key={lot.id} className="lot-select-item">
                        <label>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLots(prev => [...prev, { lotId: lot.id, quantity: 0 }]);
                              } else {
                                setSelectedLots(prev => prev.filter(l => l.lotId !== lot.id));
                              }
                            }}
                          />
                          {' '} {adjustingLine.productCode}-{lot.lotCode || lot.id.substring(0, 8)}
                        </label>
                        {selectedLots.find(l => l.lotId === lot.id) && (
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Cantidad"
                            min="0"
                            step="0.01"
                            onChange={(e) => {
                              const qty = parseFloat(e.target.value) || 0;
                              setSelectedLots(prev =>
                                prev.map(l => l.lotId === lot.id ? { ...l, quantity: qty } : l)
                              );
                            }}
                          />
                        )}
                      </div>
                    ))}
                    {adjustType === 'INCREASE' && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ marginTop: '0.5rem', width: '100%' }}
                        onClick={() => setCreateNewLotMode(true)}
                      >
                        + Crear Nuevo Lote
                      </button>
                    )}
                  </>
                )}
              </div>

              {!createNewLotMode && (
                <div className="selected-summary">
                  <strong>Total seleccionado: {selectedLots.reduce((sum, l) => sum + l.quantity, 0).toFixed(2)}</strong>
                  <span className={selectedLots.reduce((sum, l) => sum + l.quantity, 0) === getDiferencia(adjustingLine) ? 'text-success' : 'text-danger'}>
                    / {getDiferencia(adjustingLine).toFixed(2)} requerido
                  </span>
                </div>
              )}
            </div>

            {!createNewLotMode && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRequestAdjustment}
                  disabled={
                    loading ||
                    selectedLots.reduce((sum, l) => sum + l.quantity, 0) !== getDiferencia(adjustingLine)
                  }
                >
                  {loading ? 'Guardando...' : 'Solicitar Ajuste'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .page-header h2 {
          margin: 0;
        }

        .page-actions {
          display: flex;
          gap: 0.5rem;
        }

        .list-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background 0.2s;
        }

        .list-item:hover {
          background: var(--gray-100);
        }

        .list-item-selected {
          background: var(--gray-100);
          border-left: 3px solid var(--primary);
        }

        .list-item-title {
          font-weight: 500;
        }

        .list-item-subtitle {
          font-weight: normal;
          color: var(--gray-500);
        }

        .list-item-meta {
          font-size: 0.875rem;
          color: var(--gray-500);
          margin-top: 0.25rem;
        }

        .product-line-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .product-info {
          display: flex;
          flex-direction: column;
        }

        .pending-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pending-item {
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .pending-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .pending-lots {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .lot-badge {
          padding: 0.25rem 0.5rem;
          background: var(--gray-100);
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .products-select-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .product-select-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background 0.2s;
        }

        .product-select-item:last-child {
          border-bottom: none;
        }

        .product-select-item:hover {
          background: var(--gray-50);
        }

        .product-select-item.selected {
          background: var(--primary-light);
        }

        .product-select-item .product-info {
          display: flex;
          flex-direction: column;
        }

        .pending-actions {
          display: flex;
          gap: 0.5rem;
        }

        .adjust-info {
          padding: 1rem;
          background: var(--gray-100);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .adjust-info p {
          margin: 0.25rem 0;
        }

        .lot-select-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .selected-summary {
          padding: 1rem;
          background: var(--gray-100);
          border-radius: 8px;
          text-align: right;
        }

        .product-type-group {
          margin-bottom: 0.5rem;
        }

        .product-type-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--gray-100);
          cursor: pointer;
          font-weight: 600;
          border-bottom: 1px solid var(--border-color);
        }

        .product-type-header:hover {
          background: var(--gray-200);
        }

        .product-type-name {
          flex: 1;
        }

        .product-type-count {
          color: var(--gray-500);
          font-size: 0.875rem;
        }

        .inventory-count-type-group {
          margin-bottom: 1.5rem;
        }

        .inventory-count-type-group:last-child {
          margin-bottom: 0;
        }

        .type-group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--primary);
          color: white;
          font-weight: 600;
        }

        .type-group-name {
          flex: 1;
        }

        .type-group-count {
          opacity: 0.8;
          font-size: 0.875rem;
        }

        .new-lot-form {
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 8px;
        }

        .new-lot-form h4 {
          margin: 0 0 1rem 0;
        }

        .new-lot-form .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .text-success { color: var(--success); }
        .text-danger { color: var(--danger); }
      `}</style>
    </div>
  );
}
