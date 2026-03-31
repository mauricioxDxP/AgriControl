import { useState, useMemo, useEffect } from 'react';
import { Field, Product, Tank, Lot } from '../types';

type WizardStep = 'date-tank' | 'fields-hectares' | 'add-product' | 'products-list' | 'notes' | 'confirm';

interface WizardState {
  step: WizardStep;
  date: string;
  tankId: string;
  tankCapacity: string;
  waterAmount: string;
  totalHectares: string;
  fields: { fieldId: string; hectares: string }[];
  products: { productId: string; concentration?: string; quantity: string; dosePerHectare?: string; lots: { lotId: string; quantityUsed: number }[] }[];
  notes: string;
  // Para agregar producto individual
  selectedProductId: string;
  currentConcentration: string;
  currentDosePerHectare: string;
  currentQuantity: string;
  currentLotId: string;
  currentLotQuantity: string;
}

interface TancadaWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    tankCapacity: number;
    waterAmount: number;
    notes?: string;
    products: { productId: string; concentration?: number; quantity: number; lots: { lotId: string; quantityUsed: number }[] }[];
    fields: { fieldId: string; hectaresTreated: number; productUsed: number }[];
  }) => Promise<void>;
  products: Product[];
  fields: Field[];
  tanks: Tank[];
  lots: Lot[];
  editTancada?: Record<string, unknown> | null;
}

export default function TancadaWizard({ isOpen, onClose, onSubmit, products, fields, tanks, lots, editTancada }: TancadaWizardProps) {
  const initialState: WizardState = {
    step: 'date-tank',
    date: new Date().toISOString().split('T')[0],
    tankId: '',
    tankCapacity: '',
    waterAmount: '',
    totalHectares: '',
    fields: [],
    products: [],
    notes: '',
    selectedProductId: '',
    currentConcentration: '',
    currentDosePerHectare: '',
    currentQuantity: '',
    currentLotId: '',
    currentLotQuantity: ''
  };

  const [wizardState, setWizardState] = useState<WizardState>(initialState);

  // Obtener productos disponibles (no usados aún)
  const availableProducts = useMemo(() => {
    const usedProductIds = wizardState.products.map(p => p.productId);
    return products.filter(p => !usedProductIds.includes(p.id));
  }, [products, wizardState.products]);

  // Productos disponibles para mostrar en el select (incluye el actual si estamos editando)
  const selectProducts = useMemo(() => {
    if (!wizardState.selectedProductId) return availableProducts;
    const currentInList = products.find(p => p.id === wizardState.selectedProductId);
    const currentInAvailable = availableProducts.find(p => p.id === wizardState.selectedProductId);
    if (currentInList && !currentInAvailable) {
      return [currentInList, ...availableProducts];
    }
    return availableProducts;
  }, [products, availableProducts, wizardState.selectedProductId]);

  // Cargar datos de edición cuando cambia editTancada
  useEffect(() => {
    if (editTancada && typeof editTancada === 'object') {
      const tancada = editTancada as {
        date: string;
        tankCapacity: number;
        waterAmount: number;
        notes?: string;
        tancadaFields?: { fieldId: string; hectaresTreated: number }[];
        tancadaProducts?: { productId: string; concentration?: number; quantity: number; lotsUsed?: string }[];
      };
      
      // Convertir la fecha al formato YYYY-MM-DD para el input date
      const dateObj = new Date(tancada.date);
      const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      // Convertir tancadaFields al formato del wizard
      const wizardFields = (tancada.tancadaFields || []).map(f => ({
        fieldId: f.fieldId,
        hectares: f.hectaresTreated.toString()
      }));
      
      // Convertir tancadaProducts al formato del wizard
      const wizardProducts = (tancada.tancadaProducts || []).map(p => {
        let lots: { lotId: string; quantityUsed: number }[] = [];
        if (p.lotsUsed) {
          try {
            lots = JSON.parse(p.lotsUsed);
          } catch (e) {
            lots = [];
          }
        }
        return {
          productId: p.productId,
          concentration: p.concentration?.toString(),
          quantity: p.quantity.toString(),
          lots: lots
        };
      });
      
      setWizardState({
        step: 'date-tank',
        date: dateStr,
        tankId: '',
        tankCapacity: tancada.tankCapacity.toString(),
        waterAmount: tancada.waterAmount.toString(),
        totalHectares: (tancada.tancadaFields || []).reduce((sum, f) => sum + f.hectaresTreated, 0).toString(),
        fields: wizardFields,
        products: wizardProducts,
        notes: tancada.notes || '',
        selectedProductId: '',
        currentConcentration: '',
        currentDosePerHectare: '',
        currentQuantity: '',
        currentLotId: '',
        currentLotQuantity: ''
      });
    } else {
      setWizardState(initialState);
    }
  }, [editTancada]);

  // Obtener lotes para el producto seleccionado
  const productLots = useMemo(() => {
    if (!wizardState.selectedProductId) return [];
    return lots.filter(l => l.productId === wizardState.selectedProductId);
  }, [lots, wizardState.selectedProductId]);

  const nextStep = () => {
    const steps: WizardStep[] = ['date-tank', 'fields-hectares', 'add-product', 'products-list', 'notes', 'confirm'];
    const currentIdx = steps.indexOf(wizardState.step);
    if (currentIdx < steps.length - 1) {
      setWizardState({ ...wizardState, step: steps[currentIdx + 1] });
    }
  };

  const goToStep = (step: WizardStep) => {
    setWizardState({ ...wizardState, step });
  };

  const prevStep = () => {
    const steps: WizardStep[] = ['date-tank', 'fields-hectares', 'add-product', 'products-list', 'notes', 'confirm'];
    const currentIdx = steps.indexOf(wizardState.step);
    if (currentIdx > 0) {
      setWizardState({ ...wizardState, step: steps[currentIdx - 1] });
    }
  };

  // Agregar un nuevo producto - mostrar formulario completo
  const startAddProduct = () => {
    setWizardState({
      ...wizardState,
      step: 'add-product',
      selectedProductId: availableProducts.length > 0 ? availableProducts[0].id : '',
      currentConcentration: '',
      currentDosePerHectare: '',
      currentQuantity: '',
      currentLotId: '',
      currentLotQuantity: ''
    });
  };

  // Agregar otro producto - primero guarda el actual
  const addAnotherProduct = () => {
    // Primero guardar el producto actual
    const totalHa = parseFloat(wizardState.totalHectares) || 0;
    const dose = parseFloat(wizardState.currentDosePerHectare) || 0;
    const quantity = totalHa * dose || parseFloat(wizardState.currentQuantity) || 0;

    const newLots = wizardState.currentLotId ? [{
      lotId: wizardState.currentLotId,
      quantityUsed: parseFloat(wizardState.currentLotQuantity) || quantity
    }] : [];

    const newProduct = {
      productId: wizardState.selectedProductId,
      concentration: wizardState.currentConcentration,
      quantity: quantity > 0 ? quantity.toString() : '',
      dosePerHectare: wizardState.currentDosePerHectare,
      lots: newLots
    };

    const updatedProducts = [...wizardState.products, newProduct];

    // Luego abrir para agregar otro
    if (availableProducts.length > 1) {
      const nextProduct = availableProducts.find(p => p.id !== wizardState.selectedProductId);
      setWizardState({
        ...wizardState,
        step: 'add-product',
        products: updatedProducts,
        selectedProductId: nextProduct?.id || '',
        currentConcentration: '',
        currentDosePerHectare: '',
        currentQuantity: '',
        currentLotId: '',
        currentLotQuantity: ''
      });
    } else {
      goToStep('products-list');
    }
  };

  const handleWizardAddField = () => {
    if (fields.length > 0) {
      const usedFieldIds = wizardState.fields.map(f => f.fieldId);
      const availableField = fields.find(f => !usedFieldIds.includes(f.id));
      if (availableField) {
        const totalTarget = parseFloat(wizardState.totalHectares) || 0;
        const alreadyDistributed = wizardState.fields.reduce((sum, f) => sum + (parseFloat(f.hectares) || 0), 0);
        const remaining = Math.max(0, totalTarget - alreadyDistributed);
        const suggestedHectares = Math.min(availableField.area, remaining);
        setWizardState({
          ...wizardState,
          fields: [...wizardState.fields, { fieldId: availableField.id, hectares: suggestedHectares > 0 ? suggestedHectares.toString() : '' }]
        });
      }
    }
  };

  const handleWizardRemoveField = (index: number) => {
    const updated = wizardState.fields.filter((_, i) => i !== index);
    setWizardState({ ...wizardState, fields: updated });
  };

  const handleWizardFieldChange = (index: number, hectares: string) => {
    const updated = [...wizardState.fields];
    updated[index].hectares = hectares;
    setWizardState({ ...wizardState, fields: updated });
  };

  // Editar un producto existente
  const editProduct = (index: number) => {
    const product = wizardState.products[index];
    setWizardState({
      ...wizardState,
      step: 'add-product',
      selectedProductId: product.productId,
      currentConcentration: product.concentration || '',
      currentDosePerHectare: product.dosePerHectare || '',
      currentQuantity: product.quantity,
      currentLotId: product.lots && product.lots.length > 0 ? product.lots[0].lotId : '',
      currentLotQuantity: product.lots && product.lots.length > 0 ? product.lots[0].quantityUsed.toString() : ''
    });
  };

  // Eliminar un producto
  const removeProduct = (index: number) => {
    const updated = wizardState.products.filter((_, i) => i !== index);
    setWizardState({ ...wizardState, products: updated });
  };

  const submitWizardTancada = async () => {
    const tancadaData = {
      date: new Date(wizardState.date).toISOString(),
      tankCapacity: parseFloat(wizardState.tankCapacity),
      waterAmount: parseFloat(wizardState.waterAmount),
      notes: wizardState.notes || undefined,
      products: wizardState.products.map(p => ({
        productId: p.productId,
        concentration: p.concentration ? parseFloat(p.concentration) : undefined,
        quantity: parseFloat(p.quantity),
        lots: p.lots?.filter(l => l.quantityUsed > 0).map(l => ({
          lotId: l.lotId,
          quantityUsed: l.quantityUsed
        }))
      })),
      fields: wizardState.fields.map(f => ({
        fieldId: f.fieldId,
        hectaresTreated: parseFloat(f.hectares),
        productUsed: wizardState.products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0)
      }))
    };
    await onSubmit(tancadaData);
    setWizardState(initialState);
    onClose();
  };

  const distributedHectaresWizard = useMemo(() => {
    return wizardState.fields.reduce((sum, f) => sum + (parseFloat(f.hectares) || 0), 0);
  }, [wizardState.fields]);

  if (!isOpen) return null;

  const stepTitle: Record<WizardStep, string> = {
    'date-tank': '1. Fecha y Tanque',
    'fields-hectares': '2. Campos y Hectáreas',
    'add-product': '3. Agregar Producto',
    'products-list': '3. Productos',
    'notes': '4. Notas',
    'confirm': '5. Confirmar'
  };

  const canGoNext = (): boolean => {
    if (wizardState.step === 'date-tank') return !!wizardState.tankCapacity && !!wizardState.waterAmount;
    if (wizardState.step === 'fields-hectares') return !!wizardState.totalHectares && wizardState.fields.length > 0;
    if (wizardState.step === 'add-product') return !!wizardState.selectedProductId && !!wizardState.currentQuantity;
    if (wizardState.step === 'products-list') return wizardState.products.length > 0;
    return true;
  };

  const getSelectedProduct = () => products.find(p => p.id === wizardState.selectedProductId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', margin: '0.5rem', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h3 className="modal-title">{stepTitle[wizardState.step]}</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        
        {/* Progress indicator */}
        <div style={{ padding: '0.5rem 1rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
            {stepTitle[wizardState.step]}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
            {['date-tank', 'fields-hectares', 'add-product', 'products-list', 'notes', 'confirm'].map((step, idx) => (
              <div key={step} style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: wizardState.step === step ? 'var(--primary)' : 
                  (['date-tank', 'fields-hectares', 'add-product', 'products-list', 'notes', 'confirm'].indexOf(wizardState.step) > idx ? 'var(--primary)' : 'var(--gray-200)')
              }} />
            ))}
          </div>
        </div>
        
        <div className="modal-body" style={{ overflowY: 'auto' }}>
          {/* Paso 1: Fecha y Tanque */}
          {wizardState.step === 'date-tank' && (
            <div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" className="form-input" value={wizardState.date} onChange={e => setWizardState({ ...wizardState, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tanque Fijo (opcional)</label>
                <select className="form-select" value={wizardState.tankId} onChange={e => { const tank = tanks.find(t => t.id === e.target.value); setWizardState({ ...wizardState, tankId: e.target.value, tankCapacity: tank ? tank.capacity.toString() : '' }); }}>
                  <option value="">Sin tanque fijo</option>
                  {tanks.map(tank => (<option key={tank.id} value={tank.id}>{tank.name} ({tank.capacity}L)</option>))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Capacidad Tanque (L) *</label>
                <input type="number" step="0.01" className="form-input" value={wizardState.tankCapacity} onChange={e => setWizardState({ ...wizardState, tankCapacity: e.target.value })} placeholder="Ej: 500" />
              </div>
              <div className="form-group">
                <label className="form-label">Agua Total (L) *</label>
                <input type="number" step="0.01" className="form-input" value={wizardState.waterAmount} onChange={e => setWizardState({ ...wizardState, waterAmount: e.target.value })} placeholder="Ej: 500" />
              </div>
            </div>
          )}

          {/* Paso 2: Campos y Hectáreas - JUNTOS */}
          {wizardState.step === 'fields-hectares' && (
            <div>
              {/* Total de hectáreas */}
              <div className="form-group">
                <label className="form-label">Total Hectáreas a Tratar *</label>
                <input type="number" step="0.01" className="form-input" value={wizardState.totalHectares} onChange={e => setWizardState({ ...wizardState, totalHectares: e.target.value })} placeholder="Ej: 50" />
              </div>

              {/* Distribución de hectáreas por campo */}
              {wizardState.fields.length > 0 && (
                <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                  <label className="form-label">Distribución por campo</label>
                  {wizardState.fields.map((fd, index) => { 
                    const field = fields.find(f => f.id === fd.fieldId); 
                    return (
                      <div key={index} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ flex: 1, fontWeight: 'bold' }}>{field?.name}</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="form-input" 
                          value={fd.hectares} 
                          onChange={e => handleWizardFieldChange(index, e.target.value)} 
                          placeholder="ha"
                          style={{ width: '80px' }}
                        />
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>/ {field?.area} ha</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleWizardRemoveField(index)}>✕</button>
                      </div>
                    ); 
                  })}
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: distributedHectaresWizard === parseFloat(wizardState.totalHectares) ? 'green' : 'red' }}>
                    Distribuido: {distributedHectaresWizard.toFixed(2)} / {wizardState.totalHectares || 0} ha
                  </div>
                </div>
              )}
              
              {wizardState.fields.length < fields.length && (
                <button type="button" className="btn btn-secondary" onClick={handleWizardAddField}>+ Agregar Campo</button>
              )}
            </div>
          )}

          {/* Paso 3: Agregar Producto */}
          {wizardState.step === 'add-product' && (
            <div>
              {/* Selector de producto */}
              <div className="form-group">
                <label className="form-label">Producto *</label>
                <select className="form-select" value={wizardState.selectedProductId} onChange={e => {
                  const productId = e.target.value;
                  const product = products.find(p => p.id === productId);
                  const dose = product?.dosePerHectareMin || 0;
                  const totalHa = parseFloat(wizardState.totalHectares) || 0;
                  setWizardState({ 
                    ...wizardState, 
                    selectedProductId: productId,
                    currentConcentration: product?.concentration?.toString() || '',
                    currentDosePerHectare: product?.dosePerHectareMin?.toString() || '',
                    currentQuantity: totalHa > 0 && dose > 0 ? (totalHa * dose).toFixed(2) : ''
                  });
                }}>
                  <option value="">Elegir producto...</option>
                  {selectProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.baseUnit})</option>
                  ))}
                </select>
              </div>

              {wizardState.selectedProductId && (
                <>
                  {/* Concentración */}
                  <div className="form-group">
                    <label className="form-label">Concentración (%) - Opcional</label>
                    <input type="number" step="0.1" className="form-input" value={wizardState.currentConcentration} onChange={e => setWizardState({ ...wizardState, currentConcentration: e.target.value })} placeholder="Ej: 5" />
                  </div>

                  {/* Dosis y cantidad */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Dosis/Ha ({getSelectedProduct()?.baseUnit}/ha)</label>
                      <input type="number" step="0.01" className="form-input" value={wizardState.currentDosePerHectare} onChange={e => {
                        const dose = parseFloat(e.target.value) || 0;
                        const totalHa = parseFloat(wizardState.totalHectares) || 0;
                        setWizardState({ 
                          ...wizardState, 
                          currentDosePerHectare: e.target.value,
                          currentQuantity: totalHa > 0 && dose > 0 ? (totalHa * dose).toFixed(2) : ''
                        });
                      }} placeholder={`Min: ${getSelectedProduct()?.dosePerHectareMin || '-'} - Max: ${getSelectedProduct()?.dosePerHectareMax || '-'}`} />
                      {getSelectedProduct()?.dosePerHectareMin && getSelectedProduct()?.dosePerHectareMax && (
                        <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: '#666', display: 'block' }}>
                          Rango recomendado: {getSelectedProduct()?.dosePerHectareMin} - {getSelectedProduct()?.dosePerHectareMax} {getSelectedProduct()?.baseUnit}/ha
                        </span>
                      )}
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Cantidad ({getSelectedProduct()?.baseUnit}) *</label>
                      <input type="number" step="0.01" className="form-input" value={wizardState.currentQuantity} onChange={e => setWizardState({ ...wizardState, currentQuantity: e.target.value })} placeholder="Total" />
                    </div>
                  </div>

                  {/* Selector de lote */}
                  {productLots.length > 0 ? (
                    <div className="form-group">
                      <label className="form-label">Lote (opcional)</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select 
                          className="form-select" 
                          value={wizardState.currentLotId} 
                          onChange={e => {
                            const lotId = e.target.value;
                            if (lotId) {
                              const lot = productLots.find(l => l.id === lotId);
                              setWizardState({ 
                                ...wizardState, 
                                currentLotId: lotId,
                                currentLotQuantity: wizardState.currentQuantity || lot?.initialStock?.toString() || ''
                              });
                            } else {
                              setWizardState({ ...wizardState, currentLotId: '', currentLotQuantity: '' });
                            }
                          }}
                          style={{ flex: 1 }}
                        >
                          <option value="">Sin lote específico</option>
                          {productLots.map(lot => (
                            <option key={lot.id} value={lot.id}>
                              {lot.lotCode || `Lote ${lot.id.slice(0,8)}`} - Stock: {lot.initialStock} {getSelectedProduct()?.baseUnit}
                              {lot.expiryDate ? ` (Vence: ${new Date(lot.expiryDate).toLocaleDateString('es-AR')})` : ''}
                            </option>
                          ))}
                        </select>
                        {wizardState.currentLotId && (
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm"
                            onClick={() => setWizardState({ ...wizardState, currentLotId: '', currentLotQuantity: '' })}
                            title="Eliminar lote"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {wizardState.currentLotId && (
                        <input 
                          type="number" 
                          step="0.01" 
                          className="form-input" 
                          style={{ marginTop: '0.5rem' }}
                          value={wizardState.currentLotQuantity} 
                          onChange={e => setWizardState({ ...wizardState, currentLotQuantity: e.target.value })} 
                          placeholder="Cantidad del lote" 
                        />
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem', background: '#fff3cd', borderRadius: '4px', fontSize: '0.8rem', color: '#856404' }}>
                      No hay lotes disponibles para este producto
                    </div>
                  )}
                </>
              )}

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => goToStep('fields-hectares')}
                  style={{ flex: 1 }}
                >
                  ← Atrás
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={addAnotherProduct}
                  disabled={!wizardState.selectedProductId || !wizardState.currentQuantity || availableProducts.length <= 1}
                  style={{ flex: 1 }}
                >
                  + Agregar Otro
                </button>
              </div>
              {wizardState.products.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => goToStep('products-list')}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Ver productos agregados →
                </button>
              )}
            </div>
          )}

          {/* Paso 3b: Lista de Productos */}
          {wizardState.step === 'products-list' && (
            <div>
              {wizardState.products.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>No hay productos agregados</p>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  {wizardState.products.map((sp, index) => { 
                    const product = products.find(p => p.id === sp.productId); 
                    const lot = sp.lots && sp.lots.length > 0 ? lots.find(l => l.id === sp.lots[0].lotId) : null;
                    return (
                      <div key={index} onClick={() => editProduct(index)} className="card" style={{ cursor: 'pointer', padding: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{product?.name}</strong>
                          <button type="button" className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); removeProduct(index); }}>✕</button>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                          {sp.concentration && <span>Conc: {sp.concentration}% | </span>}
                          <span>Cant: {sp.quantity} {product?.baseUnit}</span>
                          {lot && <span> | Lote: {lot.lotCode || lot.id.slice(0,8)}</span>}
                        </div>
                      </div>
                    ); 
                  })}
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                {availableProducts.length > 0 ? (
                  <button type="button" className="btn btn-primary" onClick={startAddProduct}>+ Agregar Producto</button>
                ) : null}
                {wizardState.products.length > 0 && (
                  <button type="button" className="btn btn-secondary" onClick={nextStep} style={{ marginLeft: '0.5rem' }}>Siguiente →</button>
                )}
              </div>
            </div>
          )}

          {/* Paso 4: Notas */}
          {wizardState.step === 'notes' && (
            <div>
              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <textarea className="form-textarea" value={wizardState.notes} onChange={e => setWizardState({ ...wizardState, notes: e.target.value })} placeholder="Observaciones..." rows={4} />
              </div>
            </div>
          )}

          {/* Paso 5: Confirmar */}
          {wizardState.step === 'confirm' && (
            <div>
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--gray-900)' }}>Resumen de la Tancada</h4>
                <p style={{ color: 'var(--gray-800)' }}><strong>Fecha:</strong> {new Date(wizardState.date).toLocaleDateString('es-AR')}</p>
                <p style={{ color: 'var(--gray-800)' }}><strong>Agua:</strong> {wizardState.waterAmount}L</p>
                <p style={{ color: 'var(--gray-800)' }}><strong>Tanque:</strong> {wizardState.tankCapacity}L</p>
                <p style={{ color: 'var(--gray-800)' }}><strong>Hectáreas:</strong> {wizardState.totalHectares} ha</p>
                <p style={{ color: 'var(--gray-800)' }}><strong>Campos:</strong> {wizardState.fields.map(f => fields.find(field => field.id === f.fieldId)?.name).join(', ')}</p>
                <p style={{ color: 'var(--gray-800)' }}><strong>Productos:</strong></p>
                <ul style={{ marginLeft: '1rem', color: 'var(--gray-800)' }}>
                  {wizardState.products.map((p, i) => {
                    const prod = products.find(pr => pr.id === p.productId);
                    const lot = p.lots && p.lots.length > 0 ? lots.find(l => l.id === p.lots[0].lotId) : null;
                    return (
                      <li key={i} style={{ color: 'var(--gray-800)' }}>
                        {prod?.name}: {p.quantity} {prod?.baseUnit}
                        {lot && <span> (Lote: {lot.lotCode || lot.id.slice(0,8)})</span>}
                      </li>
                    );
                  })}
                </ul>
                {wizardState.notes && <p style={{ color: 'var(--gray-800)' }}><strong>Notas:</strong> {wizardState.notes}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {/* Botón atrás */}
          {wizardState.step !== 'date-tank' && wizardState.step !== 'add-product' && (
            <button type="button" className="btn btn-secondary" onClick={prevStep} style={{ flex: '1 1 auto' }}>← Atrás</button>
          )}
          
          {/* Botón siguiente para pasos normales */}
          {!['add-product', 'products-list', 'confirm'].includes(wizardState.step) && (
            <button type="button" className="btn btn-primary" onClick={nextStep} style={{ flex: '1 1 auto' }} disabled={!canGoNext()}>Siguiente →</button>
          )}

          {wizardState.step === 'confirm' && (
            <button type="button" className="btn btn-primary" onClick={submitWizardTancada} style={{ flex: '1 1 auto', width: '100%' }}>✓ Confirmar Tancada</button>
          )}
        </div>
      </div>
    </div>
  );
}