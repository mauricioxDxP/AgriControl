import { useState } from 'react';
import { useLotLines, useLots, useProducts } from '../hooks/useData';
import { LotLine, BaseUnit, Lot } from '../types';

export default function ContainersPage() {
  const { lotLines, loading, addLotLine, updateLotLine, consumeLotLine, rechargeLotLine } = useLotLines();
  const { lots } = useLots();
  const { products } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [editingLotLine, setEditingLotLine] = useState<LotLine | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [selectedLotLines, setSelectedLotLines] = useState<LotLine[]>([]);
  const [quantity, setQuantity] = useState('');
  
  const [formData, setFormData] = useState({
    lotId: '',
    productId: '',
    type: 'FULL' as 'FULL' | 'PARTIAL' | 'EMPTY',
    units: '1',
    capacity: '',
    unit: 'L' as BaseUnit
  });

  const resetForm = () => {
    setFormData({
      lotId: '',
      productId: '',
      type: 'FULL',
      units: '1',
      capacity: '',
      unit: 'L'
    });
    setEditingLotLine(null);
  };

  const openModal = (lotLine?: LotLine) => {
    if (lotLine) {
      setEditingLotLine(lotLine);
      setFormData({
        lotId: lotLine.lotId,
        productId: lotLine.productId,
        type: lotLine.type,
        units: lotLine.units.toString(),
        capacity: lotLine.capacity.toString(),
        unit: lotLine.unit
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
      productId: formData.productId,
      type: formData.type,
      units: parseInt(formData.units),
      capacity: parseFloat(formData.capacity),
      unit: formData.unit,
      remainingVolume: formData.type === 'FULL' ? parseFloat(formData.capacity) : undefined
    };

    if (editingLotLine) {
      await updateLotLine(editingLotLine.id, data);
    } else {
      await addLotLine(data);
    }

    setShowModal(false);
    resetForm();
  };

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLot && selectedLotLines && quantity) {
      const qty = parseFloat(quantity);
      
      // Consumir de cada línea del lote (igual lógica que tancada)
      for (const line of selectedLotLines) {
        if (qty <= 0) break;
        
        const lineVolume = line.type === 'FULL' 
          ? line.capacity 
          : (line.remainingVolume || line.capacity);
        
        if (lineVolume <= 0) continue;
        
        const consumeAmount = Math.min(qty, lineVolume);
        await consumeLotLine(line.id, consumeAmount);
      }
      
      setShowConsumeModal(false);
      setSelectedLot(null);
      setSelectedLotLines([]);
      setQuantity('');
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLot && selectedLotLines && quantity) {
      const qty = parseFloat(quantity);
      
      // Recargar cada línea del lote
      for (const line of selectedLotLines) {
        if (qty <= 0) break;
        
        const lineCapacity = line.capacity;
        const rechargeAmount = Math.min(qty, lineCapacity);
        
        await rechargeLotLine(line.id, rechargeAmount);
      }
      
      setShowRechargeModal(false);
      setSelectedLot(null);
      setSelectedLotLines([]);
      setQuantity('');
    }
  };

  const openConsumeModal = (lot: Lot, lotLineItems: LotLine[]) => {
    setSelectedLot(lot);
    setSelectedLotLines(lotLineItems);
    setQuantity('');
    setShowConsumeModal(true);
  };

  const openRechargeModal = (lot: Lot, lotLineItems: LotLine[]) => {
    setSelectedLot(lot);
    setSelectedLotLines(lotLineItems);
    setQuantity('');
    setShowRechargeModal(true);
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
      {lots.length > 0 && lotLines.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>📦</div>
            <h3>No hay contenedores</h3>
            <p>Registrá tu primer contenedor para gestionar el inventario</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Nuevo Contenedor
            </button>
          </div>
        </div>
      )}

      {lots.length > 0 && lotLines.length > 0 && (
        <div>
          {/* Contenedores por lote */}
          {lots.filter(lot => lotLines.some(l => l.lotId === lot.id)).map(lot => {
            const lotLineItems = lotLines
              .filter(l => l.lotId === lot.id)
              .sort((a, b) => {
                // Ordenar: FULL (1) -> PARTIAL (2) -> EMPTY (3)
                const order: Record<string, number> = { 'FULL': 1, 'PARTIAL': 2, 'EMPTY': 3 };
                return (order[a.type] || 4) - (order[b.type] || 4);
              });
            const product = products.find(p => p.id === lot.productId);
            
            // Solo calcular el total del lote
            const totalUnits = lotLineItems.reduce((sum, l) => sum + (l.units || 0), 0);
            const totalVolume = lotLineItems.reduce((sum, l) => {
              if (l.type === 'FULL') return sum + ((l.capacity || 0) * (l.units || 0));
              if (l.type === 'PARTIAL') return sum + (l.remainingVolume || 0);
              return sum; // EMPTY = 0
            }, 0);
            const maxVolume = lotLineItems.reduce((sum, l) => sum + ((l.capacity || 0) * (l.units || 0)), 0);
            return (
              <div key={lot.id} style={{ marginBottom: '1.5rem' }}>
                {/* Header del lote con total */}
                <div style={{ 
                  background: 'var(--primary)', 
                  color: 'var(--white)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius) var(--radius) 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <strong>{product?.name || 'Sin producto'}</strong>
                    {lot.lotCode && <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>{lot.lotCode}</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span>{totalUnits} <span style={{ opacity: 0.7 }}>contenedores</span></span>
                    <span><strong>{totalVolume.toFixed(1)} / {maxVolume.toFixed(1)} {product?.baseUnit}</strong></span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
                        onClick={() => openConsumeModal(lot, lotLineItems)}
                      >
                        Consumir
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
                        onClick={() => openRechargeModal(lot, lotLineItems)}
                      >
                        Recargar
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Mostrar cada línea directamente */}
                {lotLineItems.map(l => {
                  const isFull = l.type === 'FULL';
                  const isPartial = l.type === 'PARTIAL';
                  const isEmpty = l.type === 'EMPTY';
                  
                  let bgColor = 'var(--gray-100)';
                  let borderColor = 'var(--gray-300)';
                  let label = '';
                  let icon = '';
                  
                  if (isFull) {
                    bgColor = 'var(--success-light)';
                    borderColor = 'var(--success)';
                    label = `Llenos: ${l.units}`;
                    icon = '✓';
                  } else if (isPartial) {
                    bgColor = 'var(--warning-light)';
                    borderColor = 'var(--warning)';
                    label = `En uso: ${l.units} (${l.remainingVolume?.toFixed(1) || 0}${product?.baseUnit} restante)`;
                    icon = '⚠';
                  } else if (isEmpty) {
                    bgColor = 'var(--gray-100)';
                    borderColor = 'var(--gray-300)';
                    label = `Vacíos: ${l.units}`;
                    icon = '✕';
                  }
                  
                  return (
                    <div key={l.id} style={{ 
                      padding: '0.75rem',
                      background: bgColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{icon}</span>
                          <span>{label}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                            ({l.capacity}{product?.baseUnit} c/u)
                          </span>
                        </div>
                      </div>
                      
                      {/* Barra de progreso solo para partial */}
                      {isPartial && l.remainingVolume !== undefined && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          height: '8px', 
                          background: 'var(--gray-200)', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${((l.remainingVolume || 0) / l.capacity) * 100}%`,
                            height: '100%',
                            background: 'var(--warning)',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                                {editingLotLine ? 'Editar Contenedor' : 'Nuevo Contenedor'}
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
                    onChange={e => {
                      const lot = lots.find(l => l.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        lotId: e.target.value,
                        productId: lot?.productId || ''
                      });
                    }}
                    required
                    disabled={!!editingLotLine}
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
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'FULL' | 'PARTIAL' | 'EMPTY' })}
                    >
                      <option value="FULL">Lleno</option>
                      <option value="PARTIAL">Parcial</option>
                      <option value="EMPTY">Vacío</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unidades *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.units}
                      onChange={e => setFormData({ ...formData, units: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacidad por contenedor *</label>
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
                  {editingLotLine ? 'Guardar Cambios' : 'Crear Contenedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Consumo */}
      {showConsumeModal && selectedLot && (
        <div className="modal-overlay" onClick={() => setShowConsumeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Consumir del Lote</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowConsumeModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConsume}>
              <div className="modal-body">
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Lote:</strong> {selectedLot.lotCode || selectedLot.id.slice(0, 8)}
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  <strong>Disponible:</strong> {selectedLotLines.reduce((sum, l) => {
                    if (l.type === 'FULL') return sum + (l.capacity * l.units);
                    if (l.type === 'PARTIAL') return sum + (l.remainingVolume || 0);
                    return sum;
                  }, 0).toFixed(1)} {selectedLotLines[0]?.unit}
                </p>
                <div className="form-group">
                  <label className="form-label">Cantidad a consumir</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
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

      {/* Modal de Recarga */}
      {showRechargeModal && selectedLot && (
        <div className="modal-overlay" onClick={() => setShowRechargeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Recargar Lote</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowRechargeModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRecharge}>
              <div className="modal-body">
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Lote:</strong> {selectedLot.lotCode || selectedLot.id.slice(0, 8)}
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  <strong>Stock actual:</strong> {selectedLotLines.reduce((sum, l) => {
                    if (l.type === 'FULL') return sum + (l.capacity * l.units);
                    if (l.type === 'PARTIAL') return sum + (l.remainingVolume || 0);
                    return sum;
                  }, 0).toFixed(1)} {selectedLotLines[0]?.unit}
                </p>
                <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  Capacidad máxima total: {selectedLotLines.reduce((sum, l) => sum + (l.capacity * l.units), 0)} {selectedLotLines[0]?.unit}
                </p>
                <div className="form-group">
                  <label className="form-label">Cantidad a agregar</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="Cantidad a agregar"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowRechargeModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Recargar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
