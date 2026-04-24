import React, { useState, useMemo, useEffect } from 'react';
import { useLots, useProducts, useMovements } from '../hooks/useData';
import { ContainerType, Lot } from '../types';
import { settingsService } from '../services';
import { getBaseUnitAbbr } from '../utils/units';

type FilterType = 'all' | 'active' | 'empty' | 'expired';

interface SettingItem {
  id: string;
  name: string;
}

interface ContainerSummary {
  qtyFull: number;
  qtyEmpty: number;
  remainingQuantity: number;
  remainingStock: number;
  consumed: number;
}

export default function LotsPage() {
  const { lots, loading, addLot, updateLot, deleteLot } = useLots();
  const { products } = useProducts();
  const { movements } = useMovements();
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  
  // Filtro por tipo de producto
  const [productTypes, setProductTypes] = useState<SettingItem[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  
  // Buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    entryDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    supplier: '',
    lotCode: '',
    initialStock: '',
    containerType: 'BIDON' as ContainerType,
    containerCapacity: ''
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
      containerCapacity: ''
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
    
    await addLot({
      productId: formData.productId,
      entryDate: new Date(formData.entryDate).toISOString(),
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
      supplier: formData.supplier || undefined,
      lotCode: formData.lotCode || undefined,
      initialStock: stock,
      containerType: formData.containerType as any,
      containerCapacity: containerCapacity > 0 ? containerCapacity : undefined
    });

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este lote?')) {
      await deleteLot(id);
    }
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Calculate container summary from movements
  const calculateContainers = (lot: Lot): ContainerSummary => {
    const lotMovements = movements.filter(m => m.lotId === lot.id);
    const consumed = lotMovements
      .filter(m => m.type === 'SALIDA')
      .reduce((sum, m) => sum + m.quantity, 0);
    const remainingStock = lot.initialStock - consumed;
    const capacity = lot.containerCapacity || 1;
    const qtyFull = Math.floor(Math.max(0, remainingStock) / capacity);
    const remainingQuantity = Math.max(0, remainingStock) % capacity;
    const qtyEmpty = Math.floor(consumed / capacity);
    return { qtyFull, qtyEmpty, remainingQuantity, remainingStock, consumed };
  };

  // Get product name helper
  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Sin producto';
  };

  // Get product code helper
  const getProductCode = (productId: string) => {
    return (products.find(p => p.id === productId) as any)?.productCode || null;
  };

  // Get product type helper
  const getProductType = (productId: string) => {
    return (products.find(p => p.id === productId) as any)?.type?.name || products.find(p => p.id === productId)?.type || 'OTRO';
  };

  // Get product base unit helper
  const getProductUnit = (productId: string) => {
    const baseUnit = products.find(p => p.id === productId)?.baseUnit || 'L';
    return getBaseUnitAbbr(baseUnit);
  };

  const lotsByProduct = useMemo(() => {
    const grouped: Record<string, Lot[]> = {};
    lots.forEach(lot => {
      if (!grouped[lot.productId]) {
        grouped[lot.productId] = [];
      }
      grouped[lot.productId].push(lot);
    });
    // Sort each group by entryDate descending
    Object.keys(grouped).forEach(productId => {
      grouped[productId].sort((a, b) => 
        new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      );
    });
    return grouped;
  }, [lots]);

  // Apply filters - grouped by type then by product
  const groupedLots = useMemo(() => {
    const byType = new Map<string, Map<string, Lot[]>>();
    
    Object.keys(lotsByProduct).forEach(productId => {
      const product = products.find(p => p.id === productId);
      const productType = (product as any)?.type?.name || product?.type || '';
      
      // Filtro por tipo de producto
      if (filterTypes.length > 0 && !filterTypes.includes(productType)) {
        return;
      }
      
      // Filtro por texto (busca en nombre, código, proveedor, lotCode)
      const query = searchQuery.toLowerCase().trim();
      
      const filteredForProduct = lotsByProduct[productId].filter(lot => {
        const productName = getProductName(productId).toLowerCase();
        const productCode = (product as any)?.productCode?.toLowerCase() || '';
        const supplier = lot.supplier?.toLowerCase() || '';
        const lotCode = lot.lotCode?.toLowerCase() || '';
        
        // Si hay búsqueda, filtrar por texto
        if (query && !productName.includes(query) && !productCode.includes(query) && 
            !supplier.includes(query) && !lotCode.includes(query)) {
          return false;
        }
        
        const summary = calculateContainers(lot);
        const expired = isExpired(lot.expiryDate);
        
        switch (filter) {
          case 'active':
            return !expired && lot.initialStock > 0;
          case 'empty':
            return summary.remainingStock <= 0;
          case 'expired':
            return expired;
          default:
            return true;
        }
      });
      
      if (filteredForProduct.length === 0) return;
      
      const typeName = productType || 'OTRO';
      if (!byType.has(typeName)) byType.set(typeName, new Map());
      byType.get(typeName)!.set(productId, filteredForProduct);
    });
    
    // Sort product IDs within each type
    byType.forEach(byProduct => {
      // Already sorted by entryDate descending from lotsByProduct
    });
    
    return { byType, sortedTypes: Array.from(byType.keys()).sort() };
  }, [lotsByProduct, filter, filterTypes, searchQuery, products, movements]);

  // Toggle expanded lot
  const toggleExpand = (lotId: string) => {
    setExpandedLots(prev => {
      const next = new Set(prev);
      if (next.has(lotId)) {
        next.delete(lotId);
      } else {
        next.add(lotId);
      }
      return next;
    });
  };

  // Check if lot is empty
  const isEmpty = (lot: Lot) => {
    const summary = calculateContainers(lot);
    return summary.remainingStock <= 0;
  };

  // Get selected product's unit
  const selectedProduct = products.find(p => p.id === formData.productId);

  // Cargar tipos de producto
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const types = await settingsService.getProductTypes();
        setProductTypes(types);
      } catch (error) {
        console.error('Error loading product types:', error);
      }
    };
    loadTypes();
  }, []);

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

      {/* Filtros */}
      <div className="mb-2">
        {/* Buscador */}
        <div className="search-bar">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por producto, código, lote o proveedor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>
        
        {/* Filtro por tipo */}
        <div className="filter-bar mb-2">
          <select 
            className="form-select" 
            value={filter} 
            onChange={e => setFilter(e.target.value as FilterType)}
            style={{ maxWidth: '150px' }}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="empty">Vacíos</option>
            <option value="expired">Vencidos</option>
          </select>
          
          <div className="filter-chips">
            {productTypes.map(type => {
              const isSelected = filterTypes.includes(type.name);
              return (
                <button
                  key={type.id}
                  className={`chip ${isSelected ? 'chip-active' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      setFilterTypes(filterTypes.filter(t => t !== type.name));
                    } else {
                      setFilterTypes([...filterTypes, type.name]);
                    }
                  }}
                >
                  {isSelected && '✓ '}{type.name}
                </button>
              );
            })}
          </div>
          {filterTypes.length > 0 && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setFilterTypes([])}
            >
              ✕
            </button>
          )}
        </div>
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
          {/* Vista móvil - Cards agrupados por tipo y producto */}
          <div className="mobile-cards">
            {groupedLots.sortedTypes.map(typeName => {
              const byProduct = groupedLots.byType.get(typeName)!;
              const totalLots = Array.from(byProduct.values()).reduce((sum, lots) => sum + lots.length, 0);
              
              return (
                <div key={typeName}>
                  {/* Header del tipo */}
                  <div className="section-header">{typeName} ({totalLots})</div>
                  
                  {Array.from(byProduct.entries())
                    .sort((a, b) => getProductName(a[0]).localeCompare(getProductName(b[0])))
                    .map(([productId, productLots]) => {
                      if (productLots.length === 0) return null;
                      const productName = getProductName(productId);
                      const productUnit = getProductUnit(productId);
                      
                      return (
                        <div key={productId} style={{ marginBottom: '1rem' }}>
                          {/* Header del producto */}
                          <div className="subsection-header">{productName} ({productLots.length})</div>
                          
                          {/* Lotes del producto */}
                        {productLots.map(lot => {
                          const summary = calculateContainers(lot);
                          const expanded = expandedLots.has(lot.id);
                          const unit = productUnit;
                          
                          return (
                            <div key={lot.id} className="card-mobile" style={{ margin: 0, borderRadius: 0 }}>
                              <div className="card-mobile-header">
                                <span className="card-mobile-date">{formatDate(lot.entryDate)}</span>
                                {isExpired(lot.expiryDate) ? (
                                  <span className="card-mobile-badge badge-danger">Vencido</span>
                                ) : isEmpty(lot) ? (
                                  <span className="card-mobile-badge badge-warning">Vacío</span>
                                ) : (
                                  <span className="card-mobile-badge badge-primary">Activo</span>
                                )}
                              </div>
                              
                              <div className="card-mobile-content">
                                {lot.lotCode && (
                                  <div className="card-mobile-section">
                                    <span className="card-mobile-label">Código:</span>
                                    <span className="badge badge-info">
                                      {getProductCode(lot.productId)}-{lot.lotCode}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="card-mobile-row">
                                  <div>
                                    <span className="card-mobile-label">Stock:</span>
                                    <span>
                                      {lot.containerCapacity 
                                        ? `${summary.remainingStock.toFixed(1)} / ${lot.initialStock} ${unit}`
                                        : `${lot.initialStock} ${unit}`
                                      }
                                    </span>
                                  </div>
                                  {lot.containerCapacity && (
                                    <div>
                                      <span className="card-mobile-label">Contenedor:</span>
                                      <span>{(lot.containerType as any)?.name || lot.containerType} {lot.containerCapacity}{unit}</span>
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
                              
                              {/* Dropdown de contenedores */}
                              {lot.containerCapacity && expanded && (
                                <div style={{ 
                                  padding: '0.75rem',
                                  background: 'var(--gray-100)',
                                  borderTop: '1px solid var(--gray-200)'
                                }}>
                                  {/* Contenedores llenos */}
                                  {summary.qtyFull > 0 && (
                                    <div style={{ 
                                      padding: '0.5rem',
                                      background: 'var(--success-light)',
                                      marginBottom: '0.5rem',
                                      borderRadius: 'var(--radius)'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>✓</span>
                                        <span><strong>Llenos:</strong> {summary.qtyFull}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                                          ({lot.containerCapacity}{unit} c/u)
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Contenedor en uso (parcial) */}
                                  {summary.remainingQuantity > 0 && (
                                    <div style={{ 
                                      padding: '0.5rem',
                                      background: 'var(--warning-light)',
                                      marginBottom: '0.5rem',
                                      borderRadius: 'var(--radius)'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>⚠</span>
                                        <span><strong>En uso:</strong> {summary.remainingQuantity.toFixed(1)}{unit}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                                          (de {lot.containerCapacity}{unit})
                                        </span>
                                      </div>
                                      <div style={{ 
                                        marginTop: '0.5rem', 
                                        height: '8px', 
                                        background: 'var(--gray-200)', 
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                      }}>
                                        <div style={{ 
                                          width: `${(summary.remainingQuantity / (lot.containerCapacity || 1)) * 100}%`,
                                          height: '100%',
                                          background: 'var(--warning)',
                                          transition: 'width 0.3s'
                                        }}></div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Contenedores vacíos */}
                                  {summary.qtyEmpty > 0 && (
                                    <div style={{ 
                                      padding: '0.5rem',
                                      background: 'var(--gray-200)',
                                      borderRadius: 'var(--radius)'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>✕</span>
                                        <span><strong>Vacíos:</strong> {summary.qtyEmpty}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                                          ({lot.containerCapacity}{unit} c/u)
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Stock agotado */}
                                  {summary.remainingStock <= 0 && summary.qtyFull === 0 && summary.remainingQuantity === 0 && (
                                    <div style={{ 
                                      padding: '0.5rem',
                                      background: 'var(--danger-light)',
                                      borderRadius: 'var(--radius)'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>⚠</span>
                                        <span><strong>Stock agotado</strong></span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {summary.consumed > 0 && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                      Consumido: {summary.consumed.toFixed(1)} {unit}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="card-mobile-actions">
                                {lot.containerCapacity && (
                                  <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => toggleExpand(lot.id)}
                                    style={{ flex: 1 }}
                                  >
                                    {expanded ? '▼ Ocultar' : '▶ Contenedores'}
                                  </button>
                                )}
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
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Vista desktop - Tabla agrupada por tipo y producto */}
          <div className="table-container hide-mobile">
            {groupedLots.sortedTypes.map(typeName => {
              const byProduct = groupedLots.byType.get(typeName)!;
              const totalLots = Array.from(byProduct.values()).reduce((sum, lots) => sum + lots.length, 0);
              
              return (
                <div key={typeName} style={{ marginBottom: '1.5rem' }}>
                  {/* Header del tipo */}
                  <div style={{ 
                    background: 'var(--primary)', 
                    color: 'var(--white)', 
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius) var(--radius) 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <strong>{typeName}</strong>
                    <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                      {totalLots} lote{totalLots !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {Array.from(byProduct.entries())
                    .sort((a, b) => getProductName(a[0]).localeCompare(getProductName(b[0])))
                    .map(([productId, productLots]) => {
                      if (productLots.length === 0) return null;
                      const productName = getProductName(productId);
                      const productUnit = getProductUnit(productId);
                      
                      return (
                        <div key={productId}>
                          {/* Header del producto */}
                        <div style={{ 
                          background: 'var(--gray-200)', 
                          color: 'var(--gray-800)', 
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <strong>{productName}</strong>
                          <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                            {productLots.length} lote{productLots.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Código</th>
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
                            {productLots.map(lot => {
                              const summary = calculateContainers(lot);
                              const expanded = expandedLots.has(lot.id);
                              
                              return (
                                <React.Fragment key={lot.id}>
                                  <tr>
                                    <td>
                                      {lot.lotCode ? (
                                        <span className="badge badge-info">
                                          {getProductCode(lot.productId)}-{lot.lotCode}
                                        </span>
                                      ) : (
                                        <span style={{ color: 'var(--gray-400)' }}>-</span>
                                      )}
                                    </td>
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
                                    <td>
                                      {lot.containerCapacity 
                                        ? `${summary.remainingStock.toFixed(1)} / ${lot.initialStock} ${productUnit}`
                                        : `${lot.initialStock} ${productUnit}`
                                      }
                                    </td>
                                    <td>
                                      {lot.containerCapacity && (
                                        <>
                                          <span 
                                            className="btn btn-secondary btn-sm" 
                                            onClick={() => toggleExpand(lot.id)}
                                            style={{ cursor: 'pointer', marginRight: '0.5rem' }}
                                          >
                                            {expanded ? '▼' : '▶'} {(lot.containerType as any)?.name || lot.containerType} {lot.containerCapacity}{productUnit}
                                          </span>
                                          <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                            ({summary.qtyFull}L + {summary.qtyEmpty}V)
                                          </span>
                                        </>
                                      )}
                                    </td>
                                    <td>
                                      {isExpired(lot.expiryDate) ? (
                                        <span className="badge badge-danger">Vencido</span>
                                      ) : isEmpty(lot) ? (
                                        <span className="badge badge-warning">Vacío</span>
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
                                  
                                  {/* Fila expandida de contenedores */}
                                  {expanded && lot.containerCapacity && (
                                    <tr>
                                      <td colSpan={8} style={{ padding: '0.75rem', background: 'var(--gray-100)' }}>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                          {summary.qtyFull > 0 && (
                                            <div style={{ padding: '0.5rem', background: 'var(--success-light)', borderRadius: 'var(--radius)' }}>
                                              ✓ Llenos: {summary.qtyFull} ({lot.containerCapacity}{productUnit} c/u)
                                            </div>
                                          )}
                                          {summary.remainingQuantity > 0 && (
                                            <div style={{ padding: '0.5rem', background: 'var(--warning-light)', borderRadius: 'var(--radius)' }}>
                                              ⚠ En uso: {summary.remainingQuantity.toFixed(1)}{productUnit}
                                              <div style={{ width: `${(summary.remainingQuantity / (lot.containerCapacity || 1)) * 100}px`, height: '4px', background: 'var(--warning)', marginTop: '4px' }}></div>
                                            </div>
                                          )}
                                          {summary.qtyEmpty > 0 && (
                                            <div style={{ padding: '0.5rem', background: 'var(--gray-200)', borderRadius: 'var(--radius)' }}>
                                              ✕ Vacíos: {summary.qtyEmpty}
                                            </div>
                                          )}
                                          {summary.remainingStock <= 0 && summary.qtyFull === 0 && summary.remainingQuantity === 0 && (
                                            <div style={{ padding: '0.5rem', background: 'var(--danger-light)', borderRadius: 'var(--radius)' }}>
                                              ⚠ Stock agotado
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              );
            })}
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

                <div className="form-row">
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
                      onChange={e => setFormData({ ...formData, containerCapacity: e.target.value })}
                      placeholder="Capacidad de cada contenedor"
                    />
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
