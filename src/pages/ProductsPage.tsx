import { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useData';
import { Product, BaseUnit } from '../types';
import { settingsApi } from '../services/api';

interface SettingItem {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Settings data
  const [productTypes, setProductTypes] = useState<SettingItem[]>([]);
  const [productStates, setProductStates] = useState<SettingItem[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    typeId: '',
    stateId: '',
    baseUnit: 'KG' as BaseUnit,
    dosePerHectareMin: '',
    dosePerHectareMax: '',
    concentration: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const [types, states] = await Promise.all([
        settingsApi.getProductTypes(),
        settingsApi.getProductStates()
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
      typeId: productTypes[0]?.id || '',
      stateId: productStates[0]?.id || '',
      baseUnit: 'KG',
      dosePerHectareMin: '',
      dosePerHectareMax: '',
      concentration: ''
    });
    setEditingProduct(null);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        typeId: (product as any).type?.id || product.typeId || '',
        stateId: (product as any).state?.id || product.stateId || '',
        baseUnit: product.baseUnit,
        dosePerHectareMin: product.dosePerHectareMin?.toString() || '',
        dosePerHectareMax: product.dosePerHectareMax?.toString() || '',
        concentration: product.concentration?.toString() || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const getTypeName = (product: Product) => {
    return (product as any).type?.name || product.type || '-';
  };

  const getStateName = (product: Product) => {
    return (product as any).state?.name || product.state || '-';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      typeId: formData.typeId,
      stateId: formData.stateId,
      baseUnit: formData.baseUnit,
      dosePerHectareMin: formData.dosePerHectareMin ? parseFloat(formData.dosePerHectareMin) : undefined,
      dosePerHectareMax: formData.dosePerHectareMax ? parseFloat(formData.dosePerHectareMax) : undefined,
      concentration: formData.concentration ? parseFloat(formData.concentration) : undefined
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await addProduct(data);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteProduct(id);
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
          + Nuevo Producto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>📦</div>
            <h3>No hay productos</h3>
            <p>Registrá tu primer producto para comenzar</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Crear Producto
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Vista móvil - Cards */}
          <div className="mobile-cards">
            {products.map(product => (
              <div key={product.id} className="card-mobile">
                <div className="card-mobile-header">
                  <span className="card-mobile-date">{product.name}</span>
                  <span className={`card-mobile-badge ${getTypeBadge(product)}`}>
                    {getTypeName(product)}
                  </span>
                </div>
                
                <div className="card-mobile-content">
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
                      <span>{product.dosePerHectareMin}-{product.dosePerHectareMax}</span>
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
              </div>
            ))}
          </div>

          {/* Vista desktop - Tabla */}
          <div className="table-container hide-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Unidad</th>
                  <th>Dosis/ha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td>
                      <span className={`badge ${getTypeBadge(product)}`}>
                        {getTypeName(product)}
                      </span>
                    </td>
                    <td>{getStateName(product)}</td>
                    <td>{product.baseUnit}</td>
                    <td>
                      {product.dosePerHectareMin && product.dosePerHectareMax 
                        ? `${product.dosePerHectareMin}-${product.dosePerHectareMax}` 
                        : '-'}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(product)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product.id)}
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

      {/* Modal de Producto */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                  />
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
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Dosis mínima (kg/L por ha)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.dosePerHectareMin}
                      onChange={e => setFormData({ ...formData, dosePerHectareMin: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dosis máxima (kg/L por ha)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.dosePerHectareMax}
                      onChange={e => setFormData({ ...formData, dosePerHectareMax: e.target.value })}
                    />
                  </div>
                </div>

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
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
