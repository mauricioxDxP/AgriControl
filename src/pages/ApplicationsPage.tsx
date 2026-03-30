import { useState, useEffect } from 'react';
import { useApplications, useFields, useLots, useProducts, useDosageCalculation } from '../hooks/useData';
import { movementsApi } from '../services/api';
import { ApplicationType } from '../types';

export default function ApplicationsPage() {
  const { applications, loading, addApplication, deleteApplication } = useApplications();
  const { fields } = useFields();
  const { products } = useProducts();
  const { lots } = useLots();
  const { calculate } = useDosageCalculation();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fieldId: '',
    type: 'FUMIGACION' as ApplicationType,
    date: new Date().toISOString().split('T')[0],
    waterAmount: '',
    notes: ''
  });
  
  // Multiple products for the application, with lots per product
  const [selectedProducts, setSelectedProducts] = useState<{ 
    productId: string; 
    dosePerHectare: string; 
    concentration: string; 
    quantityUsed: string;
    lots: { lotId: string; quantityUsed: number }[];
  }[]>([]);

  // Stock per lot (real stock calculated from movements)
  const [lotStocks, setLotStocks] = useState<Record<string, number>>({});

  // Function to fetch lot stocks
  const fetchLotStocks = async () => {
    const stocks: Record<string, number> = {};
    for (const lot of lots) {
      try {
        const result = await movementsApi.getLotStock(lot.id);
        stocks[lot.id] = result.stock;
      } catch {
        stocks[lot.id] = lot.initialStock;
      }
    }
    setLotStocks(stocks);
  };

  const resetForm = () => {
    setFormData({
      fieldId: '',
      type: 'FUMIGACION',
      date: new Date().toISOString().split('T')[0],
      waterAmount: '',
      notes: ''
    });
    setSelectedProducts([]);
  };

  // Fetch stocks when lots change
  useEffect(() => {
    if (lots.length > 0) {
      fetchLotStocks();
    }
  }, [lots]);

  // Get selected field
  const selectedField = fields.find(f => f.id === formData.fieldId);

  // Calculate dosage for each product
  const calculateProductDosage = (productId: string, dosePerHectare: string, concentration: string) => {
    if (!selectedField || !dosePerHectare) return null;
    
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    
    return calculate(
      selectedField.area,
      parseFloat(dosePerHectare),
      parseFloat(concentration) || 0,
      product.state
    );
  };

  const handleAddProduct = () => {
    if (products.length > 0) {
      const usedProductIds = selectedProducts.map(p => p.productId);
      const availableProduct = products.find(p => !usedProductIds.includes(p.id));
      if (availableProduct) {
        setSelectedProducts([...selectedProducts, { 
          productId: availableProduct.id, 
          dosePerHectare: '',
          concentration: availableProduct.concentration?.toString() || '',
          quantityUsed: '',
          lots: []
        }]);
      }
    }
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  // Get lots for a specific product
  const getProductLots = (productId: string) => {
    return lots.filter(l => l.productId === productId);
  };

  // Add lot to a product - auto-fill with required quantity
  const handleAddLotToProduct = (productIndex: number) => {
    const productLots = getProductLots(selectedProducts[productIndex].productId);
    if (productLots.length > 0) {
      const productData = selectedProducts[productIndex];
      const requiredQuantity = parseFloat(productData.quantityUsed) || 0;
      
      const updated = [...selectedProducts];
      updated[productIndex].lots.push({ 
        lotId: productLots[0].id, 
        quantityUsed: requiredQuantity
      });
      setSelectedProducts(updated);
    }
  };

  // Remove lot from product
  const handleRemoveLotFromProduct = (productIndex: number, lotIndex: number) => {
    const updated = [...selectedProducts];
    updated[productIndex].lots.splice(lotIndex, 1);
    setSelectedProducts(updated);
  };

  // Update lot quantity
  const handleLotQuantityChange = (productIndex: number, lotIndex: number, quantityUsed: number) => {
    const updated = [...selectedProducts];
    updated[productIndex].lots[lotIndex].quantityUsed = quantityUsed;
    setSelectedProducts(updated);
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    const updated = [...selectedProducts];
    (updated[index] as any)[field] = value;
    
    // Auto-calculate quantity when dosePerHectare changes
    if (field === 'dosePerHectare' && selectedField) {
      const dose = parseFloat(value) || 0;
      if (selectedField.area > 0 && dose > 0) {
        updated[index].quantityUsed = (selectedField.area * dose).toFixed(2);
      }
    }
    
    setSelectedProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addApplication({
      fieldId: formData.fieldId,
      type: formData.type,
      date: new Date(formData.date).toISOString(),
      waterAmount: formData.waterAmount ? parseFloat(formData.waterAmount) : undefined,
      notes: formData.notes || undefined,
      products: selectedProducts.map(p => ({
        productId: p.productId,
        dosePerHectare: p.dosePerHectare ? parseFloat(p.dosePerHectare) : undefined,
        concentration: p.concentration ? parseFloat(p.concentration) : undefined,
        quantityUsed: parseFloat(p.quantityUsed),
        lots: p.lots?.filter(l => l.quantityUsed > 0).map(l => ({
          lotId: l.lotId,
          quantityUsed: l.quantityUsed
        }))
      }))
    });

    setShowModal(false);
    resetForm();
    
    // Refresh lot stocks after creating
    const fetchLotStocks = async () => {
      const stocks: Record<string, number> = {};
      for (const lot of lots) {
        try {
          const result = await movementsApi.getLotStock(lot.id);
          stocks[lot.id] = result.stock;
        } catch {
          stocks[lot.id] = lot.initialStock;
        }
      }
      setLotStocks(stocks);
    };
    fetchLotStocks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta aplicación?')) {
      await deleteApplication(id);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
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
        <h2>Aplicaciones</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => { resetForm(); fetchLotStocks(); setShowModal(true); }}
          disabled={fields.length === 0 || products.length === 0}
        >
          + Nueva Aplicación
        </button>
      </div>

      {fields.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero debés crear campos para registrar aplicaciones</p>
          </div>
        </div>
      )}

      {products.length === 0 && fields.length > 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero debés crear productos para registrar aplicaciones</p>
          </div>
        </div>
      )}

      {applications.length === 0 && fields.length > 0 && products.length > 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🚜</div>
            <h3>No hay aplicaciones</h3>
            <p>Registrá tu primera aplicación de fumigación o siembra</p>
            <button className="btn btn-primary mt-1" onClick={() => { resetForm(); setShowModal(true); }}>
              + Crear Aplicación
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Campo</th>
                <th>Productos</th>
                <th>Agua</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td>{formatDate(app.date)}</td>
                  <td>
                    <span className={`badge ${app.type === 'FUMIGACION' ? 'badge-primary' : 'badge-secondary'}`}>
                      {app.type}
                    </span>
                  </td>
                  <td>{fields.find(f => f.id === app.fieldId)?.name || '-'}</td>
                  <td>
                    {app.applicationProducts?.map((ap, idx) => (
                      <div key={idx} style={{ marginBottom: '0.25rem' }}>
                        <span className="badge badge-primary">
                          {ap.product?.name || '-'}
                          {ap.dosePerHectare ? ` ${ap.dosePerHectare}${ap.product?.baseUnit}/ha` : ''}
                          : {ap.quantityUsed} {ap.product?.baseUnit}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td>{app.waterAmount ? `${app.waterAmount}L` : '-'}</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(app.id)}
                    >
                      Eliminar
                    </button>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Aplicación</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as ApplicationType })}
                    >
                      <option value="FUMIGACION">Fumigación</option>
                      <option value="SIEMBRA">Siembra</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Campo *</label>
                  <select
                    className="form-select"
                    value={formData.fieldId}
                    onChange={e => setFormData({ ...formData, fieldId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar campo...</option>
                    {fields.map(field => (
                      <option key={field.id} value={field.id}>
                        {field.name} ({field.area} ha)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Productos a aplicar */}
                <div className="form-group">
                  <label className="form-label">Productos a Aplicar</label>
                  {selectedProducts.map((sp, index) => {
                    const product = products.find(p => p.id === sp.productId);
                    const dosageResult = calculateProductDosage(sp.productId, sp.dosePerHectare, sp.concentration);
                    
                    return (
                      <div key={index} style={{ 
                        background: 'var(--gray-50)', 
                        padding: '0.75rem', 
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                          <select
                            className="form-select"
                            value={sp.productId}
                            onChange={e => handleProductChange(index, 'productId', e.target.value)}
                            style={{ flex: 2 }}
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={sp.dosePerHectare}
                            onChange={e => handleProductChange(index, 'dosePerHectare', e.target.value)}
                            placeholder={`Min: ${product?.dosePerHectareMin || '-'} - Máx: ${product?.dosePerHectareMax || '-'}`}
                            style={{ flex: 1 }}
                          />
                          {product?.state === 'LIQUIDO' && (
                            <input
                              type="number"
                              step="0.1"
                              className="form-input"
                              value={sp.concentration}
                              onChange={e => handleProductChange(index, 'concentration', e.target.value)}
                              placeholder="Conc %"
                              style={{ flex: 1 }}
                            />
                          )}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Recommended dose range */}
                        {product && selectedField && (
                          <div style={{ 
                            background: 'var(--white)', 
                            padding: '0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--info)',
                            fontSize: '0.75rem',
                            marginBottom: '0.5rem'
                          }}>
                            <div>
                              📋 <strong>Rango recomendado para {product.name}:</strong>
                            </div>
                            <div>
                              Dosis: <strong>{product.dosePerHectareMin || '-'} - {product.dosePerHectareMax || '-'} {product.baseUnit}/ha</strong>
                            </div>
                            <div style={{ marginTop: '0.25rem' }}>
                              Cantidad recomendada: <strong>{(selectedField.area * (product.dosePerHectareMin || 0)).toFixed(2)} - {(selectedField.area * (product.dosePerHectareMax || 0)).toFixed(2)} {product.baseUnit}</strong>
                            </div>
                          </div>
                        )}
                        
                        {/* Calculated result */}
                        {dosageResult && selectedField && (
                          <div style={{ 
                            background: 'var(--white)', 
                            padding: '0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--primary)',
                            fontSize: '0.875rem'
                          }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                              → {dosageResult.productUsed.toFixed(2)} {product?.baseUnit} (para {selectedField.area} ha)
                            </div>
                            {dosageResult.waterNeeded > 0 && (
                              <div style={{ color: 'var(--info)' }}>
                                → {dosageResult.waterNeeded.toFixed(2)} L agua
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Manual quantity override */}
                        <div style={{ marginTop: '0.5rem' }}>
                          <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={sp.quantityUsed}
                            onChange={e => handleProductChange(index, 'quantityUsed', e.target.value)}
                            placeholder={`Cantidad total (${product?.baseUnit})`}
                          />
                        </div>

                        {/* Lot selection for this product */}
                        {product && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--gray-300)' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--gray-700)' }}>
                              📦 Lotes a utilizar
                            </label>
                            
                            {sp.lots && sp.lots.length > 0 && (
                              <div style={{ marginTop: '0.5rem' }}>
                                {sp.lots.map((lot, lotIdx) => {
                                  const selectedLot = lots.find(l => l.id === lot.lotId);
                                  const stock = lotStocks[lot.lotId] ?? selectedLot?.initialStock ?? 0;
                                  const expiryText = selectedLot?.expiryDate 
                                    ? ` | Vence: ${new Date(selectedLot.expiryDate).toLocaleDateString('es-AR')}` 
                                    : '';
                                  
                                  return (
                                    <div key={lotIdx}>
                                      {/* Selected lot info */}
                                      <div style={{ 
                                        background: '#e3f2fd', 
                                        padding: '0.4rem', 
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.7rem',
                                        marginBottom: '0.4rem'
                                      }}>
                                        📦 Stock: <strong>{stock}</strong>{expiryText}
                                      </div>
                                      
                                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <select
                                          className="form-select"
                                          value={lot.lotId}
                                          onChange={e => {
                                            const updated = [...selectedProducts];
                                            updated[index].lots[lotIdx].lotId = e.target.value;
                                            setSelectedProducts(updated);
                                          }}
                                          style={{ flex: 2, fontSize: '0.75rem' }}
                                        >
                                          {getProductLots(product.id).map(l => (
                                            <option key={l.id} value={l.id}>
                                              Lote {l.id.slice(0, 8)}
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="form-input"
                                          value={lot.quantityUsed}
                                          onChange={e => handleLotQuantityChange(index, lotIdx, parseFloat(e.target.value) || 0)}
                                          placeholder="Cant"
                                          style={{ flex: 1, fontSize: '0.75rem' }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-danger btn-sm"
                                          onClick={() => handleRemoveLotFromProduct(index, lotIdx)}
                                          style={{ padding: '0.25rem 0.5rem' }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {getProductLots(product.id).length > 0 && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}
                                onClick={() => handleAddLotToProduct(index)}
                              >
                                + Agregar Lote
                              </button>
                            )}
                            {getProductLots(product.id).length === 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                No hay lotes disponibles para este producto
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {selectedProducts.length < products.length && products.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddProduct}
                    >
                      + Agregar Producto ({selectedProducts.length}/{products.length})
                    </button>
                  )}
                  {products.length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                      No hay productos disponibles. Creá productos primero.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Agua Total (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.waterAmount}
                    onChange={e => setFormData({ ...formData, waterAmount: e.target.value })}
                    placeholder="Cantidad de agua total"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observaciones adicionales..."
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
                <button type="submit" className="btn btn-primary" disabled={selectedProducts.length === 0}>
                  Registrar Aplicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
