import { useState, useMemo, useEffect } from 'react';
import { Field, Product, Lot, ApplicationType, CreateApplicationInput } from '../../../types';
import { convertDoseToBaseUnit } from '../../../shared/utils/unitConversions';
import ProductSelector from '../../../components/ProductSelector';

type WizardStep = 'type-date' | 'field-water' | 'add-product' | 'products-list' | 'notes' | 'confirm';

interface WizardState {
  step: WizardStep;
  type: ApplicationType;
  date: string;
  fieldId: string;
  waterAmount: string;
  products: { productId: string; concentration?: string; quantityUsed: string; dosePerHectare?: string; concentrationPerLiter?: string; doseType?: string; lots: { lotId: string; quantityUsed: number }[] }[];
  notes: string;
  // Para agregar producto individual
  selectedProductId: string;
  currentConcentration: string;
  currentDosePerHectare: string;
  currentConcentrationPerLiter: string;
  currentQuantityUsed: string;
  currentLots: { lotId: string; quantityUsed: number }[];
  autoDosage: boolean;
}

interface ApplicationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApplicationInput) => Promise<void>;
  products: Product[];
  fields: Field[];
  lots: Lot[];
  editApplication?: Record<string, unknown> | null;
}

export default function ApplicationWizard({ isOpen, onClose, onSubmit, products, fields, lots, editApplication }: ApplicationWizardProps) {
  const initialState: WizardState = {
    step: 'type-date',
    type: 'FUMIGACION',
    date: new Date().toISOString().split('T')[0],
    fieldId: '',
    waterAmount: '',
    products: [],
    notes: '',
    selectedProductId: '',
    currentConcentration: '',
    currentDosePerHectare: '',
    currentConcentrationPerLiter: '',
    currentQuantityUsed: '',
    currentLots: [],
    autoDosage: (() => {
      const saved = localStorage.getItem('auto-dosage');
      return saved !== null ? saved === 'true' : false;
    })()
  };

  const [wizardState, setWizardState] = useState<WizardState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      if (editApplication) {
        // Load edit data
        const app = editApplication as {
          type: ApplicationType;
          date: string;
          fieldId: string;
          waterAmount?: number;
          notes?: string;
          applicationProducts?: { productId: string; concentration?: number; quantity: number; dosePerHectare?: number; lotsUsed?: string }[];
        };
        
        const dateObj = new Date(app.date);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        const wizardProducts = (app.applicationProducts || []).map(p => {
          let lotsData: { lotId: string; quantityUsed: number }[] = [];
          if (p.lotsUsed) {
            try {
              lotsData = JSON.parse(p.lotsUsed);
            } catch (e) {
              lotsData = [];
            }
          }
          return {
            productId: p.productId,
            concentration: p.concentration?.toString(),
            quantityUsed: (p as any).quantityUsed || (p as any).quantity?.toString() || '0',
            dosePerHectare: p.dosePerHectare?.toString(),
            concentrationPerLiter: (p as any).concentrationPerLiter?.toString(),
            lots: lotsData
          };
        });
        
        setWizardState({
          step: 'type-date',
          type: app.type,
          date: dateStr,
          fieldId: app.fieldId,
          waterAmount: app.waterAmount?.toString() || '',
          products: wizardProducts,
          notes: app.notes || '',
          selectedProductId: '',
          currentConcentration: '',
          currentDosePerHectare: '',
          currentConcentrationPerLiter: '',
          currentQuantityUsed: '',
          currentLots: [],
          autoDosage: (() => {
            const saved = localStorage.getItem('auto-dosage');
            return saved !== null ? saved === 'true' : false;
          })()
        });
      } else {
        setWizardState(initialState);
      }
    }
  }, [isOpen, editApplication]);

  // Get selected field for dosage calculation
  const selectedField = useMemo(() => {
    return fields.find(f => f.id === wizardState.fieldId);
  }, [fields, wizardState.fieldId]);

  // Get selected product
  const getSelectedProduct = () => products.find(p => p.id === wizardState.selectedProductId);

  // Available products (not yet added)
  const availableProducts = useMemo(() => {
    const addedIds = wizardState.products.map(p => p.productId);
    return products.filter(p => !addedIds.includes(p.id));
  }, [products, wizardState.products]);

  // Products for dropdown (includes currently selected)
  const selectProducts = useMemo(() => {
    const currentInList = products.find(p => p.id === wizardState.selectedProductId && !availableProducts.find(ap => ap.id === p.id));
    const currentInAvailable = products.find(p => p.id === wizardState.selectedProductId);
    if (currentInList && !currentInAvailable) {
      return [currentInList, ...availableProducts];
    }
    return availableProducts;
  }, [products, availableProducts, wizardState.selectedProductId]);

  // Get lots for selected product
  const productLots = useMemo(() => {
    if (!wizardState.selectedProductId) return [];
    return lots.filter(l => l.productId === wizardState.selectedProductId);
  }, [lots, wizardState.selectedProductId]);

  // Get selected field hectares
  const fieldHectares = useMemo(() => {
    return selectedField?.area?.toString() || '0';
  }, [selectedField]);

  // Auto-calculate quantity when dose changes
  const handleDoseChange = (dose: string) => {
    const doseNum = parseFloat(dose) || 0;
    const totalHa = parseFloat(fieldHectares) || 0;
    const selectedProduct = getSelectedProduct();
    const doseType = selectedProduct?.doseType || 'PER_HECTARE';
    
    let quantity = '';
    
    if (doseType === 'CONCENTRATION') {
      // Para concentración: concentrationPerLiter * waterAmount / 1000
      const waterAmount = parseFloat(wizardState.waterAmount) || 0;
      const concPerLiter = parseFloat(wizardState.currentConcentrationPerLiter) || selectedProduct?.concentrationPerLiter || 0;
      if (waterAmount > 0 && concPerLiter > 0) {
        quantity = ((concPerLiter * waterAmount) / 1000).toFixed(2);
      }
    } else {
      // Para dosis por hectárea: dose * hectáreas
      if (totalHa > 0 && doseNum > 0) {
        // Convertir dosis a unidad base
        const convertedDose = convertDoseToBaseUnit(
          doseNum,
          selectedProduct?.doseUnit,
          selectedProduct?.baseUnit || 'L'
        );
        quantity = (totalHa * convertedDose).toFixed(2);
      }
    }
    
    setWizardState({
      ...wizardState,
      currentDosePerHectare: dose,
      currentQuantityUsed: quantity
    });
  };

  // Auto-calculate quantity when concentration per liter changes
  const handleConcentrationPerLiterChange = (concPerLiter: string) => {
    const selectedProduct = getSelectedProduct();
    const waterAmount = parseFloat(wizardState.waterAmount) || 0;
    const concNum = parseFloat(concPerLiter) || selectedProduct?.concentrationPerLiter || 0;
    
    let quantity = '';
    if (waterAmount > 0 && concNum > 0) {
      quantity = ((concNum * waterAmount) / 1000).toFixed(2);
    }
    
    setWizardState({
      ...wizardState,
      currentConcentrationPerLiter: concPerLiter,
      currentQuantityUsed: quantity
    });
  };

  // Add product to list
  const handleAddProduct = () => {
    if (!wizardState.selectedProductId || !wizardState.currentQuantityUsed) return;
    
    const selectedProduct = getSelectedProduct();
    const doseType = selectedProduct?.doseType || 'PER_HECTARE';
    
    const newProduct = {
      productId: wizardState.selectedProductId,
      concentration: wizardState.currentConcentration || undefined,
      quantityUsed: wizardState.currentQuantityUsed,
      dosePerHectare: doseType === 'PER_HECTARE' ? wizardState.currentDosePerHectare || undefined : undefined,
      concentrationPerLiter: doseType === 'CONCENTRATION' ? wizardState.currentConcentrationPerLiter || undefined : undefined,
      doseType: doseType,
      lots: wizardState.currentLots
    };
    
    setWizardState({
      ...wizardState,
      products: [...wizardState.products, newProduct],
      step: 'add-product',
      selectedProductId: '',
      currentConcentration: '',
      currentDosePerHectare: '',
      currentConcentrationPerLiter: '',
      currentQuantityUsed: '',
      currentLots: []
    });
  };

  // Add another product (go back to add-product)
  const addAnotherProduct = () => {
    handleAddProduct();
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const totalHa = parseFloat(fieldHectares) || 0;
    const waterAmount = parseFloat(wizardState.waterAmount) || 0;
    const doseType = product?.doseType || 'PER_HECTARE';
    
    let suggestedQuantity = '';
    
    if (wizardState.autoDosage) {
      if (doseType === 'CONCENTRATION') {
        const concPerLiter = product?.concentrationPerLiter || 0;
        if (waterAmount > 0 && concPerLiter > 0) {
          suggestedQuantity = ((concPerLiter * waterAmount) / 1000).toFixed(2);
        }
      } else {
        const dose = product?.dosePerHectareMin || 0;
        if (totalHa > 0 && dose > 0) {
          const convertedDose = convertDoseToBaseUnit(
            dose,
            product?.doseUnit,
            product?.baseUnit || 'L'
          );
          suggestedQuantity = (totalHa * convertedDose).toFixed(2);
        }
      }
    }
    
    setWizardState({ 
      ...wizardState, 
      selectedProductId: productId,
      currentConcentration: product?.concentration?.toString() || '',
      currentDosePerHectare: wizardState.autoDosage ? (product?.dosePerHectareMin?.toString() || '') : '',
      currentConcentrationPerLiter: wizardState.autoDosage ? (product?.concentrationPerLiter?.toString() || '') : '',
      currentQuantityUsed: suggestedQuantity
    });
  };

  // Start adding new product
  const startAddProduct = () => {
    setWizardState({
      ...wizardState,
      step: 'add-product',
      selectedProductId: '',
      currentConcentration: '',
      currentDosePerHectare: '',
      currentConcentrationPerLiter: '',
      currentQuantityUsed: '',
      currentLots: []
    });
  };

  // Edit existing product
  const editProduct = (index: number) => {
    const product = wizardState.products[index];
    setWizardState({
      ...wizardState,
      step: 'add-product',
      selectedProductId: product.productId,
      currentConcentration: product.concentration || '',
      currentDosePerHectare: product.dosePerHectare || '',
      currentConcentrationPerLiter: product.concentrationPerLiter || '',
      currentQuantityUsed: product.quantityUsed,
      currentLots: product.lots || []
    });
  };

  // Remove a product
  const removeProduct = (index: number) => {
    const updated = wizardState.products.filter((_, i) => i !== index);
    setWizardState({ ...wizardState, products: updated });
  };

  const submitWizardApplication = async () => {
    // Validar que cada producto tenha lote asignado
    const productsWithoutLot = wizardState.products.filter(p => !p.lots || p.lots.length === 0 || p.lots.every(l => l.quantityUsed <= 0));
    if (productsWithoutLot.length > 0) {
      alert(`⚠️ Os seguintes produtos não têm lote atribuído:\n\n${productsWithoutLot.map(p => {
        const product = availableProducts.find(prod => prod.id === p.productId);
        return `- ${product?.name || p.productId}`;
      }).join('\n')}\n\nSem lote, não será descontado do stock. Continuar mesmo assim?`);
    }
    
    const applicationData = {
      type: wizardState.type,
      date: new Date(wizardState.date).toISOString(),
      fieldId: wizardState.fieldId,
      waterAmount: wizardState.waterAmount ? parseFloat(wizardState.waterAmount) : undefined,
      notes: wizardState.notes || undefined,
      products: wizardState.products.map(p => ({
        productId: p.productId,
        concentration: p.concentration ? parseFloat(p.concentration) : undefined,
        quantityUsed: parseFloat(p.quantityUsed),
        dosePerHectare: p.dosePerHectare ? parseFloat(p.dosePerHectare) : undefined,
        lots: p.lots?.filter(l => l.quantityUsed > 0).map(l => ({
          lotId: l.lotId,
          quantityUsed: l.quantityUsed
        })) || []
      }))
    };
    
    setIsSubmitting(true);
    try {
      await onSubmit(applicationData);
      setWizardState(initialState);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const goNext = () => {
    const steps: WizardStep[] = ['type-date', 'field-water', 'add-product', 'products-list', 'notes', 'confirm'];
    const currentIdx = steps.indexOf(wizardState.step);
    if (currentIdx < steps.length - 1) {
      setWizardState({ ...wizardState, step: steps[currentIdx + 1] });
    }
  };

  const goBack = () => {
    const steps: WizardStep[] = ['type-date', 'field-water', 'add-product', 'products-list', 'notes', 'confirm'];
    const currentIdx = steps.indexOf(wizardState.step);
    if (currentIdx > 0) {
      setWizardState({ ...wizardState, step: steps[currentIdx - 1] });
    }
  };

  if (!isOpen) return null;

  const getStepTitle = () => {
    const titles: Record<WizardStep, string> = {
      'type-date': '1. Tipo y Fecha',
      'field-water': '2. Campo y Agua',
      'add-product': '3. Agregar Producto',
      'products-list': '3b. Productos Agregados',
      'notes': '4. Notas',
      'confirm': '5. Confirmar'
    };
    return titles[wizardState.step];
  };

  const canGoNext = () => {
    switch (wizardState.step) {
      case 'type-date':
        return wizardState.type && wizardState.date;
      case 'field-water':
        return wizardState.fieldId;
      case 'add-product':
        return wizardState.selectedProductId && wizardState.currentQuantityUsed;
      case 'products-list':
        return wizardState.products.length > 0;
      case 'notes':
        return true;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const getFieldName = (id: string) => fields.find(f => f.id === id)?.name || '-';

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', margin: '0.5rem' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editApplication ? 'Editar Aplicación' : 'Nueva Aplicación'}</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        
        {/* Progress indicator */}
        <div style={{ padding: '0.5rem 1rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
            {getStepTitle()}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
            {['type-date', 'field-water', 'add-product', 'products-list', 'notes', 'confirm'].map((step, idx) => (
              <div key={step} style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: wizardState.step === step ? 'var(--primary)' : 
                  (['type-date', 'field-water', 'add-product', 'products-list', 'notes', 'confirm'].indexOf(wizardState.step) > idx ? 'var(--primary)' : 'var(--gray-200)')
              }} />
            ))}
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1rem' }}>
          {/* Step 1: Tipo y Fecha */}
          {wizardState.step === 'type-date' && (
            <div>
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select
                  className="form-select"
                  value={wizardState.type}
                  onChange={e => setWizardState({ ...wizardState, type: e.target.value as ApplicationType })}
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
                  value={wizardState.date}
                  onChange={e => setWizardState({ ...wizardState, date: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Campo y Agua */}
          {wizardState.step === 'field-water' && (
            <div>
              <div className="form-group">
                <label className="form-label">Campo *</label>
                <select
                  className="form-select"
                  value={wizardState.fieldId}
                  onChange={e => setWizardState({ ...wizardState, fieldId: e.target.value })}
                >
                  <option value="">Seleccionar campo...</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.area} ha)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Agua Total (L)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={wizardState.waterAmount}
                  onChange={e => setWizardState({ ...wizardState, waterAmount: e.target.value })}
                  placeholder="Cantidad de agua total"
                />
              </div>

              {selectedField && (
                <div style={{ 
                  background: 'var(--info-light)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem'
                }}>
                  📍 <strong>Campo seleccionado:</strong> {selectedField.name}<br/>
                  📏 <strong>Área:</strong> {selectedField.area} hectáreas
                </div>
              )}
            </div>
          )}

          {/* Step 3: Agregar Producto */}
          {wizardState.step === 'add-product' && (
            <div>
              {/* Selector de producto con buscador */}
              <div className="form-group">
                <label className="form-label">Producto *</label>
                <ProductSelector
                  products={selectProducts}
                  selectedProductId={wizardState.selectedProductId}
                  onSelect={handleProductSelect}
                  excludedProductIds={wizardState.products.map(p => p.productId)}
                />
              </div>

              {wizardState.selectedProductId && (() => {
                const selectedProduct = products.find(p => p.id === wizardState.selectedProductId);
                const doseType = selectedProduct?.doseType || 'PER_HECTARE';
                
                return (
                <>
                  {/* Concentración (%) - opcional para todos */}
                  <div className="form-group">
                    <label className="form-label">Concentración (%) - Opcional</label>
                    <input type="number" step="0.1" className="form-input" value={wizardState.currentConcentration} onChange={e => setWizardState({ ...wizardState, currentConcentration: e.target.value })} placeholder="Ej: 5" />
                  </div>

                  {wizardState.autoDosage && (
                    <>
                      {doseType === 'PER_HECTARE' ? (
                        // Campos para dosificación por hectárea
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Dosis/Ha ({selectedProduct?.doseUnit === 'BASE_UNIT' || !selectedProduct?.doseUnit ? selectedProduct?.baseUnit : selectedProduct?.doseUnit}/ha)</label>
                            <input type="number" step="0.01" className="form-input" value={wizardState.currentDosePerHectare} onChange={e => handleDoseChange(e.target.value)} placeholder={`Min: ${selectedProduct?.dosePerHectareMin || '-'} - Max: ${selectedProduct?.dosePerHectareMax || '-'}`} />
                            {selectedProduct?.dosePerHectareMin && selectedProduct?.dosePerHectareMax && (
                              <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: '#666', display: 'block' }}>
                                Rango: {selectedProduct?.dosePerHectareMin} - {selectedProduct?.dosePerHectareMax} {selectedProduct?.doseUnit === 'BASE_UNIT' || !selectedProduct?.doseUnit ? selectedProduct?.baseUnit : selectedProduct?.doseUnit}/ha
                              </span>
                            )}
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Cantidad ({selectedProduct?.baseUnit})</label>
                            <input type="number" step="0.01" className="form-input" value={wizardState.currentQuantityUsed} onChange={e => setWizardState({ ...wizardState, currentQuantityUsed: e.target.value })} placeholder="Total" />
                          </div>
                        </div>
                      ) : (
                        // Campos para dosificación por concentración (cc/L)
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Concentración (cc/L)</label>
                            <input type="number" step="0.1" className="form-input" value={wizardState.currentConcentrationPerLiter} onChange={e => handleConcentrationPerLiterChange(e.target.value)} placeholder={`Default: ${selectedProduct?.concentrationPerLiter || '-'}`} />
                            {selectedProduct?.concentrationPerLiter && (
                              <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: '#666', display: 'block' }}>
                                Producto: {selectedProduct?.concentrationPerLiter} cc/L
                              </span>
                            )}
                            <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>
                              Formula: cc/L × L agua ÷ 1000 = L producto
                            </span>
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Cantidad ({selectedProduct?.baseUnit})</label>
                            <input type="number" step="0.01" className="form-input" value={wizardState.currentQuantityUsed} onChange={e => setWizardState({ ...wizardState, currentQuantityUsed: e.target.value })} placeholder="Total" />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Cuando autoDosage está apagado, solo mostrar campo de cantidad */}
                  {!wizardState.autoDosage && (
                    <div className="form-group">
                      <label className="form-label">Cantidad ({selectedProduct?.baseUnit})</label>
                      <input type="number" step="0.01" className="form-input" value={wizardState.currentQuantityUsed} onChange={e => setWizardState({ ...wizardState, currentQuantityUsed: e.target.value })} placeholder="Cantidad total" />
                    </div>
                  )}

                  {/* Lotes */}
                  {productLots.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Lotes a utilizar</label>
                      {wizardState.currentLots.map((lotEntry, idx) => {
                        const lot = lots.find(l => l.id === lotEntry.lotId);
                        return (
                          <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <select 
                              className="form-select" 
                              value={lotEntry.lotId}
                              onChange={e => {
                                const newLots = [...wizardState.currentLots];
                                newLots[idx].lotId = e.target.value;
                                setWizardState({ ...wizardState, currentLots: newLots });
                              }}
                              style={{ flex: 2 }}
                            >
                              {productLots.map(l => (
                                <option key={l.id} value={l.id}>
                                  {l.lotCode || `Lote ${l.id.slice(0,8)}`} - Stock: {l.initialStock} {selectedProduct?.baseUnit}
                                  {l.expiryDate ? ` (Vence: ${new Date(l.expiryDate).toLocaleDateString('es-AR')})` : ''}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input"
                              value={lotEntry.quantityUsed}
                              onChange={e => {
                                const newLots = [...wizardState.currentLots];
                                newLots[idx].quantityUsed = parseFloat(e.target.value) || 0;
                                setWizardState({ ...wizardState, currentLots: newLots });
                              }}
                              placeholder="Cant"
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                const newLots = wizardState.currentLots.filter((_, i) => i !== idx);
                                setWizardState({ ...wizardState, currentLots: newLots });
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const newLots = [...wizardState.currentLots, { lotId: productLots[0]?.id || '', quantityUsed: 0 }];
                          setWizardState({ ...wizardState, currentLots: newLots });
                        }}
                      >
                        + Agregar Lote
                      </button>
                    </div>
                  )}
                </>
                );
              })()}

              {/* Botón agregar */}
              {wizardState.selectedProductId && wizardState.currentQuantityUsed && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      handleAddProduct();
                      if (availableProducts.length > 1) {
                        // Stay on add-product for another product
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    ✓ Agregar y Listo
                  </button>
                  {availableProducts.length > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={addAnotherProduct}
                      disabled={!wizardState.selectedProductId || !wizardState.currentQuantityUsed || availableProducts.length === 0}
                      style={{ flex: 1 }}
                    >
                      + Agregar Otro
                    </button>
                  )}
                </div>
              )}
              {wizardState.products.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setWizardState({ ...wizardState, step: 'products-list' })}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Ver productos agregados ({wizardState.products.length})
                </button>
              )}
            </div>
          )}

          {/* Step 3b: Lista de productos */}
          {wizardState.step === 'products-list' && (
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>Productos Agregados ({wizardState.products.length})</h4>
              
              {wizardState.products.map((p, idx) => {
                const product = products.find(prod => prod.id === p.productId);
                return (
                  <div key={idx} style={{ 
                    background: 'var(--gray-50)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong>{product?.name}</strong>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {p.dosePerHectare && `${p.dosePerHectare} ${product?.baseUnit}/ha | `}
                          {p.quantityUsed} {product?.baseUnit}
                          {p.concentration && ` | Conc: ${p.concentration}%`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => editProduct(idx)}>✏️</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeProduct(idx)}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableProducts.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={startAddProduct}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  + Agregar Producto
                </button>
              )}
            </div>
          )}

          {/* Step 4: Notas */}
          {wizardState.step === 'notes' && (
            <div>
              <div className="form-group">
                <label className="form-label">Notas - Opcional</label>
                <textarea
                  className="form-textarea"
                  value={wizardState.notes}
                  onChange={e => setWizardState({ ...wizardState, notes: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 5: Confirmar */}
          {wizardState.step === 'confirm' && (
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Confirmar Aplicación</h4>
              
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Tipo:</strong> {wizardState.type === 'FUMIGACION' ? 'Fumigación' : 'Siembra'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Fecha:</strong> {new Date(wizardState.date).toLocaleDateString('es-AR')}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Campo:</strong> {getFieldName(wizardState.fieldId)}
                </div>
                {wizardState.waterAmount && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Agua:</strong> {wizardState.waterAmount} L
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Productos:</strong>
                {wizardState.products.map((p, idx) => {
                  const product = products.find(prod => prod.id === p.productId);
                  return (
                    <div key={idx} style={{ 
                      background: 'var(--white)', 
                      padding: '0.5rem', 
                      borderRadius: 'var(--radius-sm)',
                      marginTop: '0.5rem',
                      border: '1px solid var(--gray-200)'
                    }}>
                      {product?.name} - {p.quantityUsed} {product?.baseUnit}
                      {p.dosePerHectare && <span style={{ color: 'var(--gray-600)' }}> ({p.dosePerHectare} {product?.baseUnit}/ha)</span>}
                    </div>
                  );
                })}
              </div>

              {wizardState.notes && (
                <div>
                  <strong>Notas:</strong>
                  <div style={{ 
                    background: 'var(--white)', 
                    padding: '0.5rem', 
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    {wizardState.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="modal-footer" style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '0.5rem' }}>
          {wizardState.step !== 'type-date' && (
            <button type="button" className="btn btn-secondary" onClick={goBack} style={{ flex: 1 }}>
              ← Atrás
            </button>
          )}
          
          {wizardState.step !== 'confirm' && wizardState.step !== 'add-product' && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={goNext} 
              disabled={!canGoNext()}
              style={{ flex: 1 }}
            >
              Siguiente →
            </button>
          )}
          
          {wizardState.step === 'confirm' && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={submitWizardApplication}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? 'Guardando...' : '✓ Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
