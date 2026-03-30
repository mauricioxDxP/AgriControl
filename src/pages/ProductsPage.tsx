import { useState } from 'react';
import { useProducts } from '../hooks/useData';
import { Product, ProductType, ProductState, BaseUnit } from '../types';

export default function ProductsPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SEMILLA' as ProductType,
    state: 'SOLIDO' as ProductState,
    baseUnit: 'KG' as BaseUnit,
    dosePerHectareMin: '',
    dosePerHectareMax: '',
    concentration: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'SEMILLA',
      state: 'SOLIDO',
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
        type: product.type,
        state: product.state,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      type: formData.type,
      state: formData.state,
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

  const getTypeBadge = (type: ProductType) => {
    const colors: Record<ProductType, string> = {
      SEMILLA: 'badge-primary',
      FERTILIZANTE: 'badge-secondary',
      PESTICIDA: 'badge-danger'
    };
    return colors[type];
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
            <p>Creá tu primer producto para comenzar</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Crear Producto
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Unidad</th>
                <th>Dosis Mín/Ha</th>
                <th>Dosis Máx/Ha</th>
                <th>Conc. %</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
                  <td>
                    <span className={`badge ${getTypeBadge(product.type)}`}>
                      {product.type}
                    </span>
                  </td>
                  <td>{product.state}</td>
                  <td>{product.baseUnit}</td>
                  <td>{product.dosePerHectareMin || '-'}</td>
                  <td>{product.dosePerHectareMax || '-'}</td>
                  <td>{product.concentration || '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => openModal(product)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
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
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as ProductType })}
                    >
                      <option value="SEMILLA">Semilla</option>
                      <option value="FERTILIZANTE">Fertilizante</option>
                      <option value="PESTICIDA">Pesticida</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value as ProductState })}
                    >
                      <option value="SOLIDO">Sólido</option>
                      <option value="LIQUIDO">Líquido</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unidad Base</label>
                  <select
                    className="form-select"
                    value={formData.baseUnit}
                    onChange={e => setFormData({ ...formData, baseUnit: e.target.value as BaseUnit })}
                  >
                    <option value="KG">Kilogramos (kg)</option>
                    <option value="G">Gramos (g)</option>
                    <option value="L">Litros (L)</option>
                    <option value="ML">Mililitros (ml)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Dosis Mínima por Há</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.dosePerHectareMin}
                      onChange={e => setFormData({ ...formData, dosePerHectareMin: e.target.value })}
                      placeholder="Ej: 3"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dosis Máxima por Há</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.dosePerHectareMax}
                      onChange={e => setFormData({ ...formData, dosePerHectareMax: e.target.value })}
                      placeholder="Ej: 5"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Concentración %</label>
                  <input
                    type="number"
                    step="0.1"
                    max="100"
                    className="form-input"
                    value={formData.concentration}
                    onChange={e => setFormData({ ...formData, concentration: e.target.value })}
                    placeholder="Ej: 2.5"
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
