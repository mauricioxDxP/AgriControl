import React, { useState, useEffect, useMemo } from 'react';
import { useProducts, useLots, useMovements } from '../hooks/useData';
import { Product, BaseUnit, DoseType, DoseUnit, Lot } from '../types';
import { settingsService } from '../services';
import { searchProductsFlowise } from '../services/FlowiseService';
import CameraCapture from '../components/CameraCapture';

interface SettingItem {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { lots } = useLots();
  const { movements } = useMovements();
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraMinimized, setIsCameraMinimized] = useState(false);
  
  // Settings data
  const [productTypes, setProductTypes] = useState<SettingItem[]>([]);
  const [productStates, setProductStates] = useState<SettingItem[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    genericName: '',
    typeId: '',
    stateId: '',
    baseUnit: 'KG' as BaseUnit,
    doseType: 'PER_HECTARE' as DoseType,
    doseUnit: 'BASE_UNIT' as DoseUnit,
    dosePerHectareMin: '',
    dosePerHectareMax: '',
    concentrationPerLiter: '',
    concentration: ''
  });

  // Filtro de tipos de producto (multiselección)
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  
  // Buscador
  const [searchQuery, setSearchQuery] = useState('');
  
  // Flowise states (solo para modal)
  const [flowiseInfo, setFlowiseInfo] = useState<string | null>(null);
  const [flowiseLoading, setFlowiseLoading] = useState(false);

  // Helper para nombre de tipo
  const getTypeName = (product: Product) => {
    return (product as any).type?.name || product.type || '-';
  };

  // Helper para nombre de estado
  const getStateName = (product: Product) => {
    return (product as any).state?.name || product.state || '-';
  };

  // Helper para unidad de dosis
  const getDoseUnit = (product: Product): string => {
    if (product.doseUnit && product.doseUnit !== 'BASE_UNIT') {
      return product.doseUnit;
    }
    return product.baseUnit;
  };

  // Calculate container summary from movements
  const calculateContainers = (lot: Lot) => {
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

  // Get lots with stock for a product
  const getProductLots = (productId: string) => {
    return lots
      .filter(lot => lot.productId === productId)
      .filter(lot => {
        const summary = calculateContainers(lot);
        return summary.remainingStock > 0;
      })
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  };

  // Toggle product dropdown
  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Filtrar productos por tipos seleccionados y búsqueda
  const filteredProducts = useMemo(() => {
    let result = products;

    // Apply type filter
    if (filterTypes.length > 0) {
      result = result.filter(product => filterTypes.includes(getTypeName(product)));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      // Busqueda local simple
      const searchAllFields = ['name', 'genericName', 'type', 'state'];
      result = result.filter(product => {
        return searchAllFields.some(field => {
          switch (field) {
            case 'name':
              return product.name?.toLowerCase().includes(query);
            case 'genericName':
              return (product as any).genericName?.toLowerCase().includes(query);
            case 'type':
              return getTypeName(product).toLowerCase().includes(query);
            case 'state':
              return getStateName(product).toLowerCase().includes(query);
            default:
              return false;
          }
        });
      });
    }

return result;
  }, [products, filterTypes, searchQuery]);

  // Agrupar productos filtrados: tipo → nombre genérico
  const [groupByGeneric, setGroupByGeneric] = useState(false);
  const groupedProducts = useMemo(() => {
    const byType = new Map<string, Map<string, Product[]>>();
    filteredProducts.forEach(product => {
      const typeName = getTypeName(product);
      const genericName = groupByGeneric ? ((product as any).genericName || '__SIN_GENERICO__') : '__ALL__';
      
      if (!byType.has(typeName)) byType.set(typeName, new Map());
      const byGeneric = byType.get(typeName)!;
      if (!byGeneric.has(genericName)) byGeneric.set(genericName, []);
      byGeneric.get(genericName)!.push(product);
    });
    byType.forEach(byGeneric => byGeneric.forEach(list => list.sort((a, b) => a.name.localeCompare(b.name))));
    return { byType, sortedTypes: Array.from(byType.keys()).sort() };
  }, [filteredProducts, groupByGeneric]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const [types, states] = await Promise.all([
        settingsService.getProductTypes(),
        settingsService.getProductStates()
      ]);
      setProductTypes(types);
      setProductStates(states);
      
      // Set default values after loading
      if (types.length > 0 && !formData.typeId) {
        setFormData(prev => ({ ...prev, typeId: types[0].id }));
      }
      if (states.length > 0 && !formData.stateId) {
        setFormData(prev => ({ ...prev, stateId: states[0].id }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setSettingsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      productCode: '',
      genericName: '',
      typeId: productTypes[0]?.id || '',
      stateId: productStates[0]?.id || '',
      baseUnit: 'KG',
      doseType: 'PER_HECTARE',
      doseUnit: 'BASE_UNIT',
      dosePerHectareMin: '',
      dosePerHectareMax: '',
      concentrationPerLiter: '',
      concentration: ''
    });
    setEditingProduct(null);
    setFlowiseInfo(null);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        productCode: (product as any).productCode || '',
        genericName: (product as any).genericName || '',
        typeId: (product as any).type?.id || product.typeId || '',
        stateId: (product as any).state?.id || product.stateId || '',
        baseUnit: product.baseUnit,
        doseType: product.doseType || 'PER_HECTARE',
        doseUnit: product.doseUnit || 'BASE_UNIT',
        dosePerHectareMin: product.dosePerHectareMin?.toString() || '',
        dosePerHectareMax: product.dosePerHectareMax?.toString() || '',
        concentrationPerLiter: product.concentrationPerLiter?.toString() || '',
        concentration: product.concentration?.toString() || ''
      });
    } else {
      resetForm();
    }
    setFlowiseInfo(null);
    setShowModal(true);
  };

  // Consultar info del producto via Flowise (cuando se ingresa el nombre)
  const handleAskLLM = async () => {
    if (!formData.name || formData.name.trim().length < 2) {
      alert('Escribí el nombre del producto primero');
      return;
    }

    setFlowiseLoading(true);
    try {
      // Buscar info via Flowise
      await handleFlowiseSearch(formData.name);
    } catch (error) {
      console.error('Error consultando Flowise:', error);
      setFlowiseInfo('Error al consultar');
    }
    setFlowiseLoading(false);
  };

  // Buscar info via Flowise (para el modal)
  const handleFlowiseSearch = async (query: string) => {
    if (!query.trim()) {
      setFlowiseInfo(null);
      return;
    }

    setFlowiseLoading(true);
    try {
      const results = await searchProductsFlowise(query);
      // Tomar el primer resultado como info
      setFlowiseInfo(results[0] || null);
    } catch (error) {
      console.error('Error en búsqueda Flowise:', error);
      setFlowiseInfo(null);
    }
    setFlowiseLoading(false);
  };

  // Open modal with pre-filled generic name
  const openModalWithGenericName = (genericName: string, typeId: string) => {
    setEditingProduct(null);
    setFormData({
      name: '',
      productCode: '',
      genericName: genericName,
      typeId: typeId || productTypes[0]?.id || '',
      stateId: productStates[0]?.id || '',
      baseUnit: 'KG',
      doseType: 'PER_HECTARE',
      doseUnit: 'BASE_UNIT',
      dosePerHectareMin: '',
      dosePerHectareMax: '',
      concentrationPerLiter: '',
      concentration: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Función para convertir string a número o null si está vacío
    const toNumber = (value: string): number | null => {
      if (!value || value.trim() === '') return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };
    
    const data = {
      name: formData.name,
      productCode: formData.productCode.trim() || null,
      genericName: formData.genericName.trim() || null,
      typeId: formData.typeId,
      stateId: formData.stateId,
      baseUnit: formData.baseUnit,
      doseType: formData.doseType,
      doseUnit: formData.doseUnit,
      dosePerHectareMin: toNumber(formData.dosePerHectareMin),
      dosePerHectareMax: toNumber(formData.dosePerHectareMax),
      concentrationPerLiter: toNumber(formData.concentrationPerLiter),
      concentration: toNumber(formData.concentration)
    };
    
    console.log('[ProductsPage] create data:', JSON.stringify(data));
    try{

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(data);
      }
    }
    catch(e:any)
    {
      console.log(e.message)
      alert(e.message)
    }

    setShowModal(false);
    setShowCamera(false);
    setIsCameraMinimized(false);
    setFlowiseInfo(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteProduct(id);
      } catch (err: any) {
        // Mostrar el mensaje exacto del backend
        const errorMessage = err.message
        // err?.response?.data?.error || 'Error al eliminar producto';
        alert(errorMessage);
      }
    }
  };

  const getTypeBadge = (product: Product) => {
    const typeName = getTypeName(product);
    const colors: Record<string, string> = {
      SEMILLA: 'badge-primary',
      FERTILIZANTE: 'badge-secondary',
      PESTICIDA: 'badge-danger',
      HERBICIDA: 'badge-warning',
      FUNGICIDA: 'badge-info',
      INSECTICIDA: 'badge-danger',
      OTRO: 'badge-secondary'
    };
    return colors[typeName] || 'badge-secondary';
  };

  if (loading || settingsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-between mb-2">
        <h2>Productos</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Nuevo
        </button>
      </div>

      {/* Buscador */}
      <div className="search-bar mb-2">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar en todos los campos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filtro de agrupamiento y tipos (multiselección) */}
      <div className="filter-bar mb-2">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={groupByGeneric}
            onChange={e => setGroupByGeneric(e.target.checked)}
          />
          <span>Agrupar por nombre genérico</span>
        </label>
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

      {filteredProducts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🔍</div>
            <h3>{searchQuery ? 'No se encontraron productos' : (filterTypes.length > 0 ? `No hay productos de tipo ${filterTypes.join(', ')}` : 'No hay productos')}</h3>
            <p>{searchQuery ? `No hay productos que contengan "${searchQuery}"` : (filterTypes.length > 0 ? 'Probá otros tipos o limpiá el filtro' : 'Registrá tu primer producto para comenzar')}</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Nuevo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Vista móvil - Cards con separación por tipo y nombre genérico */}
          <div className="mobile-cards">
            {groupedProducts.sortedTypes.map(typeName => {
              const byGeneric = groupedProducts.byType.get(typeName)!;
              return (
                <React.Fragment key={typeName}>
                  {/* Encabezado de tipo */}
                  <div className="section-header">
                    {typeName} ({Array.from(byGeneric.values()).reduce((s, a) => s + a.length, 0)})
                  </div>
                  
                  {Array.from(byGeneric.keys()).sort().map(genericName => {
                    const list = byGeneric.get(genericName)!;
                    
                    return (
                      <React.Fragment key={genericName}>
                        {/* Encabezado de nombre genérico - hide __ALL__ */}
                        {!genericName.startsWith('__') && (
                          <div className="subsection-header">
                            <span>{genericName} ({list.length})</span>
                            {(
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  const typeItem = productTypes.find(t => t.name === typeName);
                                  openModalWithGenericName(genericName, typeItem?.id || '');
                                }}
                                title={`Crear producto con nombre genérico "${genericName}"`}
                              >
                                + Nuevo
                              </button>
                            )}
                          </div>
                        )}
                        
                        {list.map(product => (
                          <div key={product.id} className="card-mobile">
                            <div className="card-mobile-header">
                              <span className="card-mobile-date">
                                {product.name}
                                {((product as any).genericName ? ` - ${(product as any).genericName}` : '')}
                              </span>
                              <span className={`card-mobile-badge ${getTypeBadge(product)}`}>
                                {getTypeName(product)}
                              </span>
                            </div>
                            
                            <div className="card-mobile-content">
                              {(product as any).productCode && (
                                <div className="card-mobile-row">
                                  <span className="card-mobile-label">Código:</span>
                                  <span>{(product as any).productCode}</span>
                                </div>
                              )}
                              <div className="card-mobile-row">
                                <div>
                                  <span className="card-mobile-label">Estado:</span>
                                  <span>{getStateName(product)}</span>
                                </div>
                                <div>
                                  <span className="card-mobile-label">Unidad:</span>
                                  <span>{product.baseUnit}</span>
                                </div>
                              </div>
                              
                              {product.dosePerHectareMin && product.dosePerHectareMax && (
                                <div className="card-mobile-section">
                                  <span className="card-mobile-label">Dosis/ha:</span>
                                  <span>{product.dosePerHectareMin}-{product.dosePerHectareMax} {getDoseUnit(product)}/ha</span>
                                </div>
                              )}
                              {product.concentrationPerLiter && (
                                <div className="card-mobile-section">
                                  <span className="card-mobile-label">Conc:</span>
                                  <span>{product.concentrationPerLiter} cc/L</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="card-mobile-actions">
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => openModal(product)}
                                style={{ flex: 1 }}
                              >
                                ✏️ Editar
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(product.id)}
                              >
                                🗑️
                              </button>
                            </div>
                            
                            {/* Dropdown de lotes */}
                            {(() => {
                              const productLots = getProductLots(product.id);
                              if (productLots.length === 0) return null;
                              
                              const isExpanded = expandedProducts.has(product.id);
                              return (
                                <div className="lots-dropdown">
                                  <button 
                                    className="lots-dropdown-toggle"
                                    onClick={() => toggleProductExpand(product.id)}
                                  >
                                    📦 Lotes en stock ({productLots.length}) {isExpanded ? '▲' : '▼'}
                                  </button>
                                  
                                  {isExpanded && (
                                    <div className="lots-dropdown-content">
                                      {productLots.map(lot => {
                                        const summary = calculateContainers(lot);
                                        const unit = product.baseUnit;
                                        return (
                                          <div key={lot.id} className="lot-item">
                                            <div className="lot-item-header">
                                              <span className="lot-code">
                                                {lot.lotCode || lot.id.slice(0, 8)}
                                                {lot.containerCapacity && <span className="lot-capacity"> ({lot.containerCapacity} {product.baseUnit})</span>}
                                              </span>
                                              <span className="lot-stock">
                                                Stock: {summary.remainingStock.toFixed(2)} {unit}
                                              </span>
                                            </div>
                                            {lot.expiryDate && (
                                              <span className="lot-expiry">
                                                Vence: {new Date(lot.expiryDate).toLocaleDateString()}
                                              </span>
                                            )}
                                            {lot.containerCapacity && (
                                              <div className="lot-containers">
                                                {[
                                                  summary.qtyFull > 0 && `Llenos: ${summary.qtyFull}`,
                                                  summary.qtyEmpty > 0 && `Vacíos: ${summary.qtyEmpty}`,
                                                  summary.remainingQuantity > 0 && `Parcial: ${summary.remainingQuantity.toFixed(2)} ${unit}`
                                                ].filter(Boolean).join(' | ')}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

          {/* Vista desktop - Tabla */}
          <div className="table-container hide-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Unidad</th>
                  <th>Dosis/ha</th>
                  <th>Lotes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groupedProducts.sortedTypes.map(typeName => {
                  const byGeneric = groupedProducts.byType.get(typeName)!;
                  const total = Array.from(byGeneric.values()).reduce((s, a) => s + a.length, 0);
                  return (
                    <React.Fragment key={typeName}>
                      <tr style={{ background: 'var(--primary)' }}>
                        <td colSpan={7} style={{ color: 'white', fontWeight: 600, padding: '0.5rem', textAlign: 'center' }}>
                          {typeName} ({total})
                        </td>
                      </tr>
{Array.from(byGeneric.keys()).sort().map(genericName => {
                        const list = byGeneric.get(genericName)!;
                        return (
                          <React.Fragment key={genericName}>
                            {!genericName.startsWith('__') && (
                              <tr style={{ background: 'var(--gray-100)' }}>
                                <td colSpan={7} style={{ padding: '0.25rem 0.5rem', fontWeight: 500, borderLeft: '3px solid var(--gray-400)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span>{genericName} ({list.length})</span>
                                  {(
                                    <button 
                                      className="btn btn-primary btn-sm"
                                      onClick={() => {
                                        const typeItem = productTypes.find(t => t.name === typeName);
                                        openModalWithGenericName(genericName, typeItem?.id || '');
                                      }}
                                    >
                                      + Nuevo
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            )}
                            {list.map(product => {
                              const productLots = getProductLots(product.id);
                              return (
                                <React.Fragment key={product.id}>
                                  <tr>
                                    <td>
                                      {(product as any).productCode || '-'}
                                    </td>
                                    <td>
                                      <strong>{product.name}</strong>
                                    </td>
                                    <td><span className={`badge ${getTypeBadge(product)}`}>{getTypeName(product)}</span></td>
                                    <td>{getStateName(product)}</td>
                                    <td>{product.baseUnit}</td>
                                    <td>{product.dosePerHectareMin && product.dosePerHectareMax ? `${product.dosePerHectareMin}-${product.dosePerHectareMax} ${getDoseUnit(product)}/ha` : '-'}</td>
                                    <td>
                                      {productLots.length > 0 ? (
                                        <button 
                                          className="btn btn-secondary btn-sm"
                                          onClick={() => toggleProductExpand(product.id)}
                                        >
                                          {expandedProducts.has(product.id) ? '▼' : '▶'} {productLots.length} lote(s)
                                        </button>
                                      ) : (
                                        <span style={{ color: 'var(--gray-500)' }}>-</span>
                                      )}
                                    </td>
                                    <td>
                                      <button className="btn btn-secondary btn-sm" onClick={() => openModal(product)} style={{ marginRight: '0.5rem' }}>Editar</button>
                                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>Eliminar</button>
                                    </td>
                                  </tr>
                                  {expandedProducts.has(product.id) && productLots.map(lot => {
                                    const summary = calculateContainers(lot);
                                    return (
                                      <tr key={lot.id} className="lot-expanded-row">
                                        <td colSpan={2}>
                                          <div className="lot-expanded-card">
                                            <div className="lot-expanded-header">
                                              <span className="lot-code">
                                                Código: {lot.lotCode || lot.id.slice(0, 8)}
                                                {lot.containerCapacity && <span className="lot-capacity"> ({lot.containerCapacity} {product.baseUnit})</span>}
                                              </span>
                                              <span className="lot-stock-badge">
                                                Stock: {summary.remainingStock.toFixed(2)} {product.baseUnit}
                                              </span>
                                            </div>
                                            <div className="lot-expanded-details">
                                              {lot.expiryDate && (
                                                <span className="lot-detail">📅 Vence: {new Date(lot.expiryDate).toLocaleDateString()}</span>
                                              )}
                                              {lot.containerCapacity && (
                                                <span className="lot-detail">
                                                  📦 {[
                                                    summary.qtyFull > 0 && `Llenos: ${summary.qtyFull}`,
                                                    summary.qtyEmpty > 0 && `Vacíos: ${summary.qtyEmpty}`,
                                                    summary.remainingQuantity > 0 && `Parcial: ${summary.remainingQuantity.toFixed(2)} ${product.baseUnit}`
                                                  ].filter(Boolean).join(' | ')}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td colSpan={5}></td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Producto */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setShowCamera(false);
                  setIsCameraMinimized(false);
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-info"
                      onClick={handleAskLLM}
                      disabled={flowiseLoading || !formData.name.trim()}
                      title="Buscar info del producto con IA"
                    >
                      {flowiseLoading ? '...' : '🤖'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Código</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.productCode}
                    onChange={e => setFormData({ ...formData, productCode: e.target.value })}
                    placeholder="Código interno del producto"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre Genérico</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.genericName}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="Ej: Glifosato, 2,4-D, etc."
                  />
                </div>

                {(flowiseInfo || flowiseLoading) && (
                  <div className="form-group">
                    <div 
                      style={{ 
                        padding: '0.75rem', 
                        background: 'var(--gray-50)', 
                        borderRadius: '4px',
                        border: '1px solid var(--gray-200)',
                        fontSize: '0.875rem'
                      }}
                    >
                      {flowiseLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                          Consultando info...
                        </div>
                      ) : flowiseInfo ? (
                        <div>
                          <strong>🤖 Info:</strong>
                          <p style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>{flowiseInfo}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (showCamera && !isCameraMinimized) {
                        // Si está abierto y no minimizado, minimizar
                        setIsCameraMinimized(true);
                      } else if (showCamera && isCameraMinimized) {
                        // Si está minimizado, restaurar
                        setIsCameraMinimized(false);
                      } else {
                        // Si está cerrado, abrir
                        setShowCamera(true);
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    {showCamera && isCameraMinimized ? '📷 Restaurar cámara' : '📷 Escanear'}
                  </button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select
                      className="form-select"
                      value={formData.typeId}
                      onChange={e => setFormData({ ...formData, typeId: e.target.value })}
                      required
                    >
                      {productTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select
                      className="form-select"
                      value={formData.stateId}
                      onChange={e => setFormData({ ...formData, stateId: e.target.value })}
                      required
                    >
                      {productStates.map(state => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unidad Base *</label>
                  <select
                    className="form-select"
                    value={formData.baseUnit}
                    onChange={e => setFormData({ ...formData, baseUnit: e.target.value as BaseUnit })}
                    required
                  >
                    <option value="KG">Kilogramos (kg)</option>
                    <option value="G">Gramos (g)</option>
                    <option value="L">Litros (L)</option>
                    <option value="ML">Mililitros (ml)</option>
                    <option value="CC">Centímetros cúbicos (cc)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Dosificación *</label>
                  <div className="form-row" style={{ gap: '1rem', marginTop: '0.5rem' }}>
                    <label className="flex items-center gap-1" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="doseType"
                        value="PER_HECTARE"
                        checked={formData.doseType === 'PER_HECTARE'}
                        onChange={e => setFormData({ ...formData, doseType: e.target.value as DoseType })}
                      />
                      Por Hectárea (ha)
                    </label>
                    <label className="flex items-center gap-1" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="doseType"
                        value="CONCENTRATION"
                        checked={formData.doseType === 'CONCENTRATION'}
                        onChange={e => setFormData({ ...formData, doseType: e.target.value as DoseType })}
                      />
                      Concentración (cc/L)
                    </label>
                  </div>
                </div>

                {formData.doseType === 'PER_HECTARE' && (
                  <div className="form-group">
                    <label className="form-label">Unidad de Dosis</label>
                    <select
                      className="form-select"
                      value={formData.doseUnit}
                      onChange={e => setFormData({ ...formData, doseUnit: e.target.value as DoseUnit })}
                    >
                      <option value="BASE_UNIT">Usar unidad base ({formData.baseUnit})</option>
                      <option value="CC">cc (centímetros cúbicos)</option>
                      <option value="ML">ml (mililitros)</option>
                      <option value="L">L (litros)</option>
                      <option value="G">g (gramos)</option>
                      <option value="KG">kg (kilogramos)</option>
                    </select>
                    
                    {/* Tabla de conversiones */}
                    {formData.doseUnit !== 'BASE_UNIT' && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '4px', fontSize: '0.75rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Tabla de conversiones:</strong>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '2px 4px' }}>1 L</td>
                              <td style={{ padding: '2px 4px' }}>= 1000 cc</td>
                              <td style={{ padding: '2px 4px' }}>= 1000 ml</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '2px 4px' }}>1 ml</td>
                              <td style={{ padding: '2px 4px' }}>= 1 cc</td>
                              <td style={{ padding: '2px 4px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ padding: '2px 4px' }}>1 kg</td>
                              <td style={{ padding: '2px 4px' }}>= 1000 g</td>
                              <td style={{ padding: '2px 4px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ padding: '2px 4px' }}>1 g</td>
                              <td style={{ padding: '2px 4px' }}>= 1000 mg</td>
                              <td style={{ padding: '2px 4px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ padding: '2px 4px' }}>1 L agua</td>
                              <td style={{ padding: '2px 4px' }}>= 1 kg</td>
                              <td style={{ padding: '2px 4px' }}></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {formData.doseType === 'PER_HECTARE' ? (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Dosis mínima ({formData.doseUnit === 'BASE_UNIT' ? formData.baseUnit : formData.doseUnit} por ha)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.dosePerHectareMin}
                        onChange={e => setFormData({ ...formData, dosePerHectareMin: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Dosis máxima ({formData.doseUnit === 'BASE_UNIT' ? formData.baseUnit : formData.doseUnit} por ha)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.dosePerHectareMax}
                        onChange={e => setFormData({ ...formData, dosePerHectareMax: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Concentración (cc/L)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.concentrationPerLiter}
                      onChange={e => setFormData({ ...formData, concentrationPerLiter: e.target.value })}
                      placeholder="Ej: 50 cc por litro de agua"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Concentración (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.concentration}
                    onChange={e => setFormData({ ...formData, concentration: e.target.value })}
                    placeholder="Ej: 50 para 50%"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setShowCamera(false);
                    setIsCameraMinimized(false);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cámara OCR - modo modal (abierto o minimizado) */}
      {(showCamera || isCameraMinimized) && (
        <CameraCapture
          isOpen={showCamera || isCameraMinimized}
          mode="modal"
          onClose={() => {
            setShowCamera(false);
            setIsCameraMinimized(false);
          }}
          isMinimized={isCameraMinimized}
          onMinimizeChange={(minimized) => {
            setIsCameraMinimized(minimized);
            if (!minimized) {
              // Si se restaura desde el modal, asegurar showCamera=true
              setShowCamera(true);
            }
          }}
        />
      )}
    </div>
  );
}
