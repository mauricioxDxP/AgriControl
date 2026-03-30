import { useState, useMemo, useEffect } from 'react';
import { useTancadas, useProducts, useFields, useTanks, useLots } from '../hooks/useData';
import { movementsApi } from '../services/api';
import { Tancada } from '../types';

export default function TancadasPage() {
  const { tancadas, loading, addTancada, updateTancada, deleteTancada } = useTancadas();
  const { products } = useProducts();
  const { fields } = useFields();
  const { tanks } = useTanks();
  const { lots } = useLots();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tankCapacity: '',
    tankId: '',
    waterAmount: '',
    notes: '',
    totalHectares: ''  // Total hectares to treat
  });
  
  // Multiple products in the mix, with lots per product
  const [selectedProducts, setSelectedProducts] = useState<{ 
    productId: string; 
    concentration: string; 
    quantity: string; 
    dosePerHectare: string;
    lots: { lotId: string; quantityUsed: number }[];
  }[]>([]);
  
  // Fields distribution - how many hectares of the total for each field
  const [fieldDistribution, setFieldDistribution] = useState<{ fieldId: string; hectares: string }[]>([]);

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

  // Calculate total distributed hectares
  const distributedHectares = useMemo(() => {
    return fieldDistribution.reduce((sum, f) => sum + (parseFloat(f.hectares) || 0), 0);
  }, [fieldDistribution]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      tankCapacity: '',
      tankId: '',
      waterAmount: '',
      notes: '',
      totalHectares: ''
    });
    setSelectedProducts([]);
    setFieldDistribution([]);
    setEditingId(null);
  };

  // Fetch real stock for all lots
  useEffect(() => {
    const fetchLotStocks = async () => {
      const stocks: Record<string, number> = {};
      for (const lot of lots) {
        try {
          const result = await movementsApi.getLotStock(lot.id);
          stocks[lot.id] = result.stock;
        } catch {
          // Fallback to initial stock if API fails
          stocks[lot.id] = lot.initialStock;
        }
      }
      setLotStocks(stocks);
    };
    
    if (lots.length > 0) {
      fetchLotStocks();
    }
  }, [lots]);

  // Open modal and refresh stocks
  const openModal = () => {
    resetForm();
    fetchLotStocks(); // Refresh stocks when opening modal
    setShowModal(true);
  };

  // Edit existing tancada
  const handleEdit = (tancada: Tancada) => {
    setEditingId(tancada.id);
    setFormData({
      date: new Date(tancada.date).toISOString().split('T')[0],
      tankCapacity: tancada.tankCapacity.toString(),
      tankId: '',
      waterAmount: tancada.waterAmount.toString(),
      notes: tancada.notes || '',
      totalHectares: tancada.tancadaFields?.reduce((sum, f) => sum + f.hectaresTreated, 0).toString() || ''
    });
    
    // Load products
    setSelectedProducts(tancada.tancadaProducts?.map(p => ({
      productId: p.productId,
      concentration: p.concentration?.toString() || '',
      quantity: p.quantity.toString(),
      dosePerHectare: '',
      lots: []
    })) || []);
    
    // Load field distribution
    setFieldDistribution(tancada.tancadaFields?.map(f => ({
      fieldId: f.fieldId,
      hectares: f.hectaresTreated.toString()
    })) || []);
    
    // Refresh stocks when editing
    fetchLotStocks();
    setShowModal(true);
  };

  const handleTankSelect = (tankId: string) => {
    const tank = tanks.find(t => t.id === tankId);
    setFormData({
      ...formData,
      tankId,
      tankCapacity: tank ? tank.capacity.toString() : ''
    });
  };

  const handleAddProduct = () => {
    if (products.length > 0) {
      const usedProductIds = selectedProducts.map(p => p.productId);
      const availableProduct = products.find(p => !usedProductIds.includes(p.id));
      if (availableProduct) {
        // Pre-fill with recommended dose based on total hectares
        const totalHa = parseFloat(formData.totalHectares) || 0;
        const dose = availableProduct.dosePerHectareMin || availableProduct.dosePerHectareMax || 0;
        const quantity = totalHa * dose;
        
        setSelectedProducts([...selectedProducts, { 
          productId: availableProduct.id, 
          concentration: '',
          quantity: quantity > 0 ? quantity.toFixed(2) : '',
          dosePerHectare: dose.toString(),
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
      const requiredQuantity = parseFloat(productData.quantity) || 0;
      
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
    if (field === 'dosePerHectare') {
      const totalHa = parseFloat(formData.totalHectares) || 0;
      const dose = parseFloat(value) || 0;
      if (totalHa > 0 && dose > 0) {
        updated[index].quantity = (totalHa * dose).toFixed(2);
      }
    }
    
    setSelectedProducts(updated);
  };

  // Recalculate all product quantities based on total hectares
  const recalculateQuantities = () => {
    const totalHa = parseFloat(formData.totalHectares) || 0;
    if (totalHa === 0) return;
    
    const updated = selectedProducts.map(sp => {
      const product = products.find(p => p.id === sp.productId);
      if (!product) return sp;
      
      const dose = parseFloat(sp.dosePerHectare) || product.dosePerHectareMin || product.dosePerHectareMax || 0;
      if (dose === 0) return sp;
      
      return {
        ...sp,
        quantity: (totalHa * dose).toFixed(2)
      };
    });
    
    setSelectedProducts(updated);
  };

  // Add field to distribution
  const addFieldToDistribution = () => {
    if (fields.length > 0) {
      const usedFieldIds = fieldDistribution.map(f => f.fieldId);
      const availableField = fields.find(f => !usedFieldIds.includes(f.id));
      if (availableField) {
        // Calculate remaining hectares to distribute
        const totalTarget = parseFloat(formData.totalHectares) || 0;
        const alreadyDistributed = fieldDistribution.reduce((sum, f) => sum + (parseFloat(f.hectares) || 0), 0);
        const remaining = Math.max(0, totalTarget - alreadyDistributed);
        
        // Fill with the lesser of: field's total area OR remaining hectares
        const suggestedHectares = Math.min(availableField.area, remaining);
        
        setFieldDistribution([...fieldDistribution, { 
          fieldId: availableField.id, 
          hectares: suggestedHectares > 0 ? suggestedHectares.toString() : ''
        }]);
      }
    }
  };

  const removeField = (index: number) => {
    setFieldDistribution(fieldDistribution.filter((_, i) => i !== index));
  };

  const updateFieldHectares = (index: number, value: string) => {
    const updated = [...fieldDistribution];
    updated[index].hectares = value;
    setFieldDistribution(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tancadaData = {
      date: new Date(formData.date).toISOString(),
      tankCapacity: parseFloat(formData.tankCapacity),
      waterAmount: parseFloat(formData.waterAmount),
      notes: formData.notes || undefined,
      products: selectedProducts.map(p => ({
        productId: p.productId,
        concentration: p.concentration ? parseFloat(p.concentration) : undefined,
        quantity: parseFloat(p.quantity),
        lots: p.lots?.filter(l => l.quantityUsed > 0).map(l => ({
          lotId: l.lotId,
          quantityUsed: l.quantityUsed
        }))
      })),
      fields: fieldDistribution.map(f => ({
        fieldId: f.fieldId,
        hectaresTreated: parseFloat(f.hectares),
        productUsed: selectedProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0)
      }))
    };

    if (editingId) {
      await updateTancada(editingId, tancadaData);
    } else {
      await addTancada(tancadaData);
    }

    setShowModal(false);
    resetForm();
    
    // Refresh lot stocks after creating/updating
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
    if (confirm('¿Estás seguro de eliminar esta tancada?')) {
      await deleteTancada(id);
      
      // Refresh lot stocks after deleting
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
        <h2>Tancadas</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => openModal()}
          disabled={fields.length === 0 || products.length === 0}
        >
          + Nueva Tancada
        </button>
      </div>

      {fields.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero debés crear campos para registrar tancadas</p>
          </div>
        </div>
      )}

      {tancadas.length === 0 && fields.length > 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🚿</div>
            <h3>No hay tancadas</h3>
            <p>Registrá tu primera tancada para fumigar campos</p>
            <button className="btn btn-primary mt-1" onClick={() => openModal()}>
              + Crear Tancada
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tanques</th>
                <th>Productos</th>
                <th>Agua</th>
                <th>Campos Tratados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tancadas.map(tancada => (
                <tr key={tancada.id}>
                  <td>{formatDate(tancada.date)}</td>
                  <td>{tancada.tankCapacity} L</td>
                  <td>
                    {tancada.tancadaProducts?.map((tp, idx) => (
                      <div key={idx}>
                        <span className="badge badge-primary" style={{ marginRight: '0.25rem', marginBottom: '0.25rem' }}>
                          {tp.product?.name || '-'}{tp.concentration ? ` (${tp.concentration}%)` : ''}: {tp.quantity} {tp.product?.baseUnit}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td>
                    {tancada.tancadaFields?.map((tf, idx) => (
                      <div key={idx} style={{ marginBottom: '0.25rem' }}>
                        <span className="badge badge-info" style={{ marginRight: '0.25rem' }}>
                          {tf.field?.name || 'Campo'}
                        </span>
                        <span style={{ fontSize: '0.75rem' }}>
                          {tf.hectaresTreated}/{tf.field?.area || tf.hectaresTreated} ha
                        </span>
                      </div>
                    ))}
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(tancada)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(tancada.id)}
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

      {/* Modal de Tancada */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Tancada' : 'Nueva Tancada'}</h3>
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
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tanque Fijo</label>
                    <select
                      className="form-select"
                      value={formData.tankId}
                      onChange={e => handleTankSelect(e.target.value)}
                    >
                      <option value="">Seleccionar tanque...</option>
                      {tanks.map(tank => (
                        <option key={tank.id} value={tank.id}>
                          {tank.name} ({tank.capacity} L)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacidad Tanque (L) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.tankCapacity}
                      onChange={e => setFormData({ ...formData, tankCapacity: e.target.value })}
                      required
                      placeholder="Ej: 500"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Agua Total (L) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.waterAmount}
                      onChange={e => setFormData({ ...formData, waterAmount: e.target.value })}
                      required
                      placeholder="Ej: 500"
                    />
                  </div>
                </div>

                {/* Total Hectareas - FIRST */}
                <div className="form-group">
                  <label className="form-label">
                    Total Hectáreas a Tratar *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.totalHectares}
                    onChange={e => setFormData({ ...formData, totalHectares: e.target.value })}
                    placeholder="Ej: 50"
                    style={{ maxWidth: '200px' }}
                  />
                  {formData.totalHectares && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                      Total: <strong>{formData.totalHectares} hectáreas</strong> a distribuir entre los campos
                    </div>
                  )}
                </div>

                {/* Distribution by field */}
                <div className="form-group">
                  <label className="form-label">
                    Distribución por Campo
                    {distributedHectares > 0 && parseFloat(formData.totalHectares) > 0 && (
                      <span style={{ 
                        fontWeight: 'normal', 
                        color: distributedHectares === parseFloat(formData.totalHectares) ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {' '}(Distribuido: {distributedHectares.toFixed(2)} / {formData.totalHectares} ha)
                      </span>
                    )}
                  </label>
                  {fieldDistribution.map((fd, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select
                        className="form-select"
                        value={fd.fieldId}
                        onChange={e => {
                          const updated = [...fieldDistribution];
                          const selectedField = fields.find(f => f.id === e.target.value);
                          updated[index].fieldId = e.target.value;
                          
                          // Auto-fill with remaining hectares when changing field
                          if (selectedField) {
                            const totalTarget = parseFloat(formData.totalHectares) || 0;
                            const otherFieldsHa = fieldDistribution
                              .filter((_, i) => i !== index)
                              .reduce((sum, f) => sum + (parseFloat(f.hectares) || 0), 0);
                            const remaining = Math.max(0, totalTarget - otherFieldsHa);
                            const suggested = Math.min(selectedField.area, remaining);
                            updated[index].hectares = suggested > 0 ? suggested.toString() : '';
                          }
                          
                          setFieldDistribution(updated);
                        }}
                        style={{ flex: 2 }}
                      >
                        {fields.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} (total: {f.area} ha)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={fd.hectares}
                        onChange={e => updateFieldHectares(index, e.target.value)}
                        placeholder="Ha tratadas"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeField(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {fieldDistribution.length < fields.length && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={addFieldToDistribution}
                    >
                      + Agregar Campo
                    </button>
                  )}
                  
                  {fieldDistribution.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-info btn-sm"
                      style={{ marginLeft: '0.5rem' }}
                      onClick={recalculateQuantities}
                    >
                      🔄 Recalcular cantidades
                    </button>
                  )}
                </div>

                {/* Productos en la mezcla */}
                <div className="form-group">
                  <label className="form-label">Productos en la Mezcla</label>
                  {selectedProducts.map((sp, index) => {
                    const product = products.find(p => p.id === sp.productId);
                    const totalHa = parseFloat(formData.totalHectares) || 0;
                    
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
                            step="0.1"
                            className="form-input"
                            value={sp.concentration}
                            onChange={e => handleProductChange(index, 'concentration', e.target.value)}
                            placeholder="Conc %"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Dosis por hectárea */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Dosis por Ha</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input"
                              value={sp.dosePerHectare}
                              onChange={e => handleProductChange(index, 'dosePerHectare', e.target.value)}
                              placeholder={`Min: ${product?.dosePerHectareMin || '-'} - Max: ${product?.dosePerHectareMax || '-'}`}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Cantidad Total ({product?.baseUnit})</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input"
                              value={sp.quantity}
                              onChange={e => handleProductChange(index, 'quantity', e.target.value)}
                              placeholder="Cantidad"
                            />
                          </div>
                        </div>
                        
                        {/* Recommended dose range info */}
                        {product && totalHa > 0 && (
                          <div style={{ 
                            background: 'var(--white)', 
                            padding: '0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--info)',
                            fontSize: '0.75rem'
                          }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                              📋 <strong>Rango recomendado para {product.name}:</strong>
                            </div>
                            <div>
                              Dosis: <strong>{product.dosePerHectareMin || '-'} - {product.dosePerHectareMax || '-'} {product.baseUnit}/ha</strong>
                            </div>
                            <div style={{ marginTop: '0.25rem' }}>
                              Cantidad recomendada: <strong>{(totalHa * (product.dosePerHectareMin || 0)).toFixed(2)} - {(totalHa * (product.dosePerHectareMax || 0)).toFixed(2)} {product.baseUnit}</strong>
                            </div>
                            {sp.dosePerHectare && (
                              <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>
                                → Actual: {sp.quantity || '0'} {product.baseUnit} ({totalHa} ha × {sp.dosePerHectare} {product.baseUnit}/ha)
                              </div>
                            )}
                          </div>
                        )}

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
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!formData.totalHectares || selectedProducts.length === 0}
                >
                {editingId ? 'Actualizar Tancada' : 'Registrar Tancada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
