import { useState, useEffect, Fragment } from 'react';
import { useApplications, useFields, useLots, useProducts, useDosageCalculation } from '../hooks/useData';
import { movementsService } from '../services';
import { ApplicationType, Application } from '../types';
import ApplicationWizard from '../features/applications/components/ApplicationWizard';
import { convertDoseToBaseUnit } from '../utils/unitConversions';
import { getBaseUnitAbbr } from '../utils/units';
import { getFullApiUrl } from '../shared/services/request';
import ProductSelector from '../components/ProductSelector';
import MultiSelect from '../components/MultiSelect';

export default function ApplicationsPage() {
  const { applications, loading, addApplication, updateApplication, deleteApplication } = useApplications();
  const { fields } = useFields();
  const { products } = useProducts();
  const { lots } = useLots();
  const { calculate } = useDosageCalculation();
  
  // Helper para obtener unidad abreviada
  const getUnit = (baseUnit: string | undefined) => baseUnit ? getBaseUnitAbbr(baseUnit) : '';
  
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

  // Wizard for mobile
  const [showWizard, setShowWizard] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [autoDosage] = useState<boolean>(() => {
    const saved = localStorage.getItem('auto-dosage');
    return saved !== null ? saved === 'true' : false;
  });

  // Dropdown de movimientos por aplicación
  const [openMovementsDropdown, setOpenMovementsDropdown] = useState<string | null>(null);
  const [applicationMovements, setApplicationMovements] = useState<Record<string, any[]>>({});
  
  // Batch selection for printing
  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  
  // Resumen modal
  const [showResumen, setShowResumen] = useState(false);
  const [resumenApplication, setResumenApplication] = useState<Application | null>(null);
  
  // Filtros
  const [filterFieldIds, setFilterFieldIds] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Stock per lot (real stock calculated from movements)
  const [lotStocks, setLotStocks] = useState<Record<string, number>>({});

  // Function to fetch lot stocks
  const fetchLotStocks = async () => {
    const stocks: Record<string, number> = {};
    for (const lot of lots) {
      try {
        const result = await movementsService.getLotStock(lot.id);
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

  // Fetch movements when dropdown is opened
  useEffect(() => {
    if (openMovementsDropdown && !applicationMovements[openMovementsDropdown]) {
      movementsService.getByApplication(openMovementsDropdown).then(movements => {
        setApplicationMovements(prev => ({ ...prev, [openMovementsDropdown]: movements }));
      }).catch(() => {
        setApplicationMovements(prev => ({ ...prev, [openMovementsDropdown]: [] }));
      });
    }
  }, [openMovementsDropdown]);

  // Get selected field
  const selectedField = fields.find(f => f.id === formData.fieldId);
  
  // Aplicaciones filtradas
  const filteredApplications = applications.filter(app => {
    if (filterFieldIds.length > 0 && !filterFieldIds.includes(app.fieldId)) return false;
    if (filterDateFrom) {
      const appDate = new Date(app.date.split('T')[0]);
      const fromDate = new Date(filterDateFrom);
      if (appDate < fromDate) return false;
    }
    if (filterDateTo) {
      const appDate = new Date(app.date.split('T')[0]);
      const toDate = new Date(filterDateTo);
      if (appDate > toDate) return false;
    }
    return true;
  });

  // Calculate dosage for each product
  const calculateProductDosage = (productId: string, dosePerHectare: string, concentration: string) => {
    if (!selectedField || !dosePerHectare) return null;
    
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    
    return calculate(
      selectedField.area,
      parseFloat(dosePerHectare),
      parseFloat(concentration) || 0,
      (product.state?.name || product.state) as string
    );
  };

  const handleAddProduct = () => {
    if (products.length > 0) {
      const usedProductIds = selectedProducts.map(p => p.productId);
      const availableProduct = products.find(p => !usedProductIds.includes(p.id));
      if (availableProduct) {
        const totalHa = selectedField?.area || 0;
        let quantityUsed = '';
        
        if (availableProduct.doseType === 'CONCENTRATION') {
          // Para concentración: cc/L * litros de agua / 1000 = litros de producto
          const waterAmount = parseFloat(formData.waterAmount) || 0;
          const concPerLiter = availableProduct.concentrationPerLiter || 0;
          if (waterAmount > 0 && concPerLiter > 0) {
            quantityUsed = ((concPerLiter * waterAmount) / 1000).toFixed(2);
          }
        } else {
          // Para dosis por hectárea - con conversión
          const dose = availableProduct.dosePerHectareMin || 0;
          if (totalHa > 0 && dose > 0) {
            const convertedDose = convertDoseToBaseUnit(dose, availableProduct.doseUnit, availableProduct.baseUnit);
            quantityUsed = (totalHa * convertedDose).toFixed(2);
          }
        }
        
        setSelectedProducts([...selectedProducts, { 
          productId: availableProduct.id, 
          dosePerHectare: availableProduct.doseType !== 'CONCENTRATION' ? (availableProduct.dosePerHectareMin?.toString() || '') : '',
          concentration: availableProduct.doseType === 'CONCENTRATION' ? (availableProduct.concentrationPerLiter?.toString() || '') : (availableProduct.concentration?.toString() || ''),
          quantityUsed: quantityUsed,
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
    
    // Auto-calculate when product is selected
    if (field === 'productId' && selectedField) {
      const product = products.find(p => p.id === value);
      const totalHa = selectedField.area || 0;
      const waterAmount = parseFloat(formData.waterAmount) || 0;
      
      if (product) {
        if (product.doseType === 'CONCENTRATION') {
          // Para concentración: cc/L * litros de agua / 1000 = litros de producto
          const concPerLiter = product.concentrationPerLiter || 0;
          if (waterAmount > 0 && concPerLiter > 0) {
            updated[index].concentration = concPerLiter.toString();
            updated[index].quantityUsed = ((concPerLiter * waterAmount) / 1000).toFixed(2);
          }
          updated[index].dosePerHectare = '';
        } else if (product.dosePerHectareMin) {
          updated[index].dosePerHectare = product.dosePerHectareMin.toString();
          const convertedDose = convertDoseToBaseUnit(product.dosePerHectareMin, product.doseUnit, product.baseUnit);
          updated[index].quantityUsed = (totalHa * convertedDose).toFixed(2);
          updated[index].concentration = product.concentration?.toString() || '';
        }
      }
    }
    
    // Auto-calculate quantity when dosePerHectare changes (solo para PER_HECTARE)
    if (field === 'dosePerHectare' && selectedField) {
      const dose = parseFloat(value) || 0;
      const product = products.find(p => p.id === updated[index].productId);
      if (product && product.doseType !== 'CONCENTRATION' && selectedField.area > 0 && dose > 0) {
        // Convertir la dosis a la unidad base del producto
        const convertedDose = convertDoseToBaseUnit(dose, product.doseUnit, product.baseUnit);
        updated[index].quantityUsed = (selectedField.area * convertedDose).toFixed(2);
      }
    }
    
    // Auto-calculate quantity when concentration changes (para CONCENTRATION)
    if (field === 'concentration' && selectedField) {
      const product = products.find(p => p.id === updated[index].productId);
      if (product && product.doseType === 'CONCENTRATION') {
        const waterAmount = parseFloat(formData.waterAmount) || 0;
        const concPerLiter = parseFloat(value) || 0;
        if (waterAmount > 0 && concPerLiter > 0) {
          updated[index].quantityUsed = ((concPerLiter * waterAmount) / 1000).toFixed(2);
        }
      }
    }
    
    setSelectedProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Recolectar todos los lotes usados en los productos
    const allLots: { lotId: string; quantityUsed: number }[] = [];
    selectedProducts.forEach(p => {
      const productLots = p.lots?.filter(l => l.quantityUsed > 0).map(l => ({
        lotId: l.lotId,
        quantityUsed: l.quantityUsed
      }));
      if (productLots) {
        allLots.push(...productLots);
      }
    });
    
    console.log('[handleSubmit] selectedProducts:', JSON.stringify(selectedProducts, null, 2));
    console.log('[handleSubmit] allLots collected:', JSON.stringify(allLots, null, 2));
    
    const appData = {
      fieldId: formData.fieldId,
      type: formData.type,
      date: formData.date || new Date().toISOString().split('T')[0],
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
      })),
      lots: allLots
    };
    
    console.log('[handleSubmit] appData:', JSON.stringify(appData, null, 2));

    if (editingApplication) {
      await updateApplication(editingApplication.id, appData);
      // Refrescar movimientos de la aplicación editada
      const updatedMovements = await movementsService.getByApplication(editingApplication.id);
      setApplicationMovements(prev => ({ ...prev, [editingApplication.id]: updatedMovements }));
    } else {
      await addApplication(appData);
    }

    // Notificar a StockPage que actualice
    window.dispatchEvent(new Event('stock-needs-refresh'));

    setShowModal(false);
    setEditingApplication(null);
    resetForm();
    
    // Refresh lot stocks after creating
    const fetchLotStocks = async () => {
      const stocks: Record<string, number> = {};
      for (const lot of lots) {
        try {
          const result = await movementsService.getLotStock(lot.id);
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
      // Notificar a StockPage que actualice
      window.dispatchEvent(new Event('stock-needs-refresh'));
    }
  };

  // Handle edit - use modal on desktop, wizard on mobile
  const handleEdit = (app: Application) => {
    if (window.innerWidth < 768) {
      setEditingApplication(app);
      setShowWizard(true);
    } else {
      // Desktop - use modal
      setEditingApplication(app);
      setFormData({
        fieldId: app.fieldId,
        type: app.type,
        date: app.date.split('T')[0],
        waterAmount: app.waterAmount?.toString() || '',
        notes: app.notes || ''
      });
      
      // Cargar los productos con sus lotes
      const productsWithLots = app.applicationProducts?.map(p => {
        // Cargar lots del lotsUsed si existe
        let lots: { lotId: string; quantityUsed: number }[] = [];
        if (p.lotsUsed) {
          try {
            lots = typeof p.lotsUsed === 'string' ? JSON.parse(p.lotsUsed) : p.lotsUsed;
          } catch (e) {
            console.error('Error parsing lotsUsed:', e);
          }
        }
        
        return {
          productId: p.productId,
          dosePerHectare: p.dosePerHectare?.toString() || '',
          concentration: p.concentration?.toString() || '',
          quantityUsed: p.quantityUsed?.toString() || '',
          lots: lots
        };
      }) || [];
      
      setSelectedProducts(productsWithLots);
      fetchLotStocks();
      setShowModal(true);
    }
  };

  const formatDate = (dateStr: string) => {
    // Parse date as local time to avoid timezone issues
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-AR');
  };

  // Generar texto de resumen para una aplicación
  const generarResumenTexto = (app: Application): string => {
    let texto = `FECHA: ${formatDate(app.date)}\n`;
    texto += `TIPO: ${app.type}\n`;
    texto += `CAMPO: ${fields.find(f => f.id === app.fieldId)?.name || '-'}\n`;
    
    if (app.waterAmount) {
      texto += `AGUA: ${app.waterAmount} ${getUnit('L')}\n`;
    }
    
    if (app.notes) {
      texto += `NOTAS: ${app.notes}\n`;
    }
    
    texto += `\nPRODUCTOS:\n`;
    
    const maxProductLen = 35;
    const formatProductLine = (code: string, name: string, total: number, unit: string) => {
      const productStr = `${code} ${name}`.substring(0, maxProductLen);
      const padded = productStr.padEnd(maxProductLen);
      return `${padded}Total: ${total.toFixed(2)} ${unit}`;
    };
    
    app.applicationProducts?.forEach((ap) => {
      const productCode = (ap.product as any)?.productCode || products.find(p => p.id === ap.productId)?.productCode || '';
      const producto = ap.product?.name || 'Sin nombre';
      const unidad = getUnit(ap.product?.baseUnit) || 'L';
      
      texto += formatProductLine(productCode, producto, ap.quantityUsed, unidad) + '\n';
    });
    
    return texto;
  };

  const abrirResumen = (app: Application) => {
    setResumenApplication(app);
    setShowResumen(true);
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
          onClick={() => window.innerWidth < 768 ? setShowWizard(true) : (resetForm(), fetchLotStocks(), setShowModal(true))}
          disabled={fields.length === 0 || products.length === 0}
        >
          + Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-2" style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <MultiSelect
            options={fields.map(f => ({ id: f.id, label: f.name }))}
            selected={filterFieldIds}
            onChange={setFilterFieldIds}
            placeholder="Filtrar por campo"
          />
          
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto' }}
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            placeholder="Desde"
          />
          
          <span style={{ color: 'var(--gray-500)' }}>a</span>
          
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto' }}
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            placeholder="Hasta"
          />
          
          {(filterFieldIds.length > 0 || filterDateFrom || filterDateTo) && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setFilterFieldIds([]); setFilterDateFrom(''); setFilterDateTo(''); }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {fields.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero creá un terreno y un campo en la sección Terrenos</p>
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
            <button className="btn btn-primary mt-1" onClick={() => window.innerWidth < 768 ? setShowWizard(true) : (resetForm(), fetchLotStocks(), setShowModal(true))}>
              + Nuevo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Vista móvil - Cards */}
          <div className="mobile-cards">
            {filteredApplications.map(app => (
              <div key={app.id} className="card-mobile">
                <div className="card-mobile-header">
                  <span className="card-mobile-date">{formatDate(app.date)}</span>
                  <span className={`card-mobile-badge ${app.type === 'FUMIGACION' ? 'badge-primary' : 'badge-secondary'}`}>
                    {app.type}
                  </span>
                </div>
                
                <div className="card-mobile-content">
                  <div className="card-mobile-section">
                    <span className="card-mobile-label">Campo:</span>
                    <span>{fields.find(f => f.id === app.fieldId)?.name || '-'}</span>
                  </div>
                  
                  <div className="card-mobile-section">
                    <span className="card-mobile-label">Productos:</span>
                    {app.applicationProducts?.map((ap, idx) => (
                      <span key={idx} className="badge badge-primary" style={{ marginRight: '0.25rem', marginBottom: '0.25rem', display: 'inline-block' }}>
                        {ap.product?.name}: {ap.quantityUsed}{getUnit(ap.product?.baseUnit)}
                      </span>
                    ))}
                  </div>
                  
                  {app.waterAmount && (
                    <div className="card-mobile-row">
                      <div>
                        <span className="card-mobile-label">Agua:</span>
                        <span>{app.waterAmount}L</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="card-mobile-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setOpenMovementsDropdown(openMovementsDropdown === app.id ? null : app.id)}
                  >
                    📜 Ver Movimientos
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => abrirResumen(app)}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  >
                    📋 Resumen
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEditingApplication(app); setShowWizard(true); }}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(app.id)}
                    style={{ width: '100%' }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
                
                {/* Dropdown de movimientos para móvil */}
                {openMovementsDropdown === app.id && (
                  <div style={{ 
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Movimientos:</div>
                    {applicationMovements[app.id] ? (
                      applicationMovements[app.id].length > 0 ? (
                        applicationMovements[app.id].map((mov, idx) => (
                          <div key={idx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: idx < applicationMovements[app.id].length - 1 ? '1px solid var(--gray-200)' : 'none' }}>
                            <div style={{ fontWeight: 'bold' }}>
                              {mov.type === 'ENTRADA' ? '📥' : '📤'} {mov.product?.name || 'Producto'}
                            </div>
                            <div style={{ color: 'var(--gray-600)', fontSize: '0.75rem' }}>
                              Cantidad: <strong>{mov.quantity}</strong> {mov.product?.baseUnit ? getUnit(mov.product.baseUnit) : ''}
                            </div>
                            {mov.lot?.lotCode && (
                              <div style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>
                                Lote: {mov.lot.lotCode}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--gray-500)' }}>Sin movimientos</div>
                      )
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div className="spinner-small"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Vista desktop - Tabla */}
          <div className="table-container hide-mobile">
            {/* Batch print button bar */}
            {selectedForPrint.length > 0 && (
              <div style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius)', 
                marginBottom: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{selectedForPrint.length} aplicación(ones) seleccionada(s) para imprimir</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedForPrint([])}
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    ✕ Cancelar
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ background: 'white', color: 'var(--primary)' }}
                    onClick={() => {
                      const url = getFullApiUrl(`/reports/applications/batch?ids=${selectedForPrint.join(',')}&t=${Date.now()}`);
                      window.open(url, '_blank');
                      setSelectedForPrint([]);
                    }}
                  >
                    🖨️ Imprimir {selectedForPrint.length} PDF
                  </button>
                </div>
              </div>
            )}
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox"
                      checked={selectedForPrint.length === filteredApplications.length && filteredApplications.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForPrint(filteredApplications.slice(0, 2).map(a => a.id));
                        } else {
                          setSelectedForPrint([]);
                        }
                      }}
                      title={selectedForPrint.length >= 2 ? 'Máximo 2 para imprimir' : 'Seleccionar hasta 2'}
                      disabled={selectedForPrint.length >= 2 && selectedForPrint.length !== filteredApplications.length}
                    />
                  </th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Campo</th>
                  <th>Productos</th>
                  <th className="hide-mobile">Agua</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map(app => (
                  <Fragment key={app.id}>
                    <tr style={{ background: selectedForPrint.includes(app.id) ? 'rgba(25, 135, 84, 0.1)' : undefined }}>
                      <td>
                        <input 
                          type="checkbox"
                          checked={selectedForPrint.includes(app.id)}
                          onChange={() => {
                            if (selectedForPrint.includes(app.id)) {
                              setSelectedForPrint(selectedForPrint.filter(id => id !== app.id));
                            } else if (selectedForPrint.length < 2) {
                              setSelectedForPrint([...selectedForPrint, app.id]);
                            }
                          }}
                          disabled={!selectedForPrint.includes(app.id) && selectedForPrint.length >= 2}
                        />
                      </td>
                      <td>{formatDate(app.date)}</td>
                      <td>
                        <span className={`badge ${app.type === 'FUMIGACION' ? 'badge-primary' : 'badge-secondary'}`}>
                          {app.type}
                        </span>
                      </td>
                      <td>{fields.find(f => f.id === app.fieldId)?.name || '-'}</td>
                      <td>
                        {app.applicationProducts?.map((ap, idx) => {
                          const doseUnitLabel = ap.product?.doseUnit && ap.product.doseUnit !== 'BASE_UNIT' ? ap.product.doseUnit : getUnit(ap.product?.baseUnit);
                          return (
                          <div key={idx} style={{ marginBottom: '0.25rem' }}>
                            <span className="badge badge-primary">
                              {ap.product?.name || '-'}
                              {ap.dosePerHectare ? ` ${ap.dosePerHectare}${doseUnitLabel}/ha` : ''}
                              : {ap.quantityUsed} {getUnit(ap.product?.baseUnit)}
                            </span>
                          </div>
                        )})}
                      </td>
                      <td className="hide-mobile">{app.waterAmount ? `${app.waterAmount}L` : '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className={`btn btn-sm ${openMovementsDropdown === app.id ? 'btn-primary' : 'btn-info'}`}
                            onClick={() => setOpenMovementsDropdown(openMovementsDropdown === app.id ? null : app.id)}
                            title="Ver Movimientos"
                          >
                            {openMovementsDropdown === app.id ? '▲' : '📜'}
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => abrirResumen(app)}
                            title="Resumen"
                          >
                            📋
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEdit(app)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(app.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                    {openMovementsDropdown === app.id && (
                      <tr>
                        <td colSpan={6} style={{ background: 'var(--gray-50)', padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>📜 Movimientos de la Aplicación</div>
                          {applicationMovements[app.id] ? (
                            applicationMovements[app.id].length > 0 ? (
                              <table className="table" style={{ background: 'var(--white)' }}>
                                <thead>
                                  <tr>
                                    <th>Tipo</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Lote</th>
                                    <th>Fecha</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {applicationMovements[app.id].map((mov, idx) => (
                                    <tr key={idx}>
                                      <td>
                                        <span className={`badge ${mov.type === 'ENTRADA' ? 'badge-success' : 'badge-warning'}`}>
                                          {mov.type === 'ENTRADA' ? '📥 Entrada' : '📤 Salida'}
                                        </span>
                                      </td>
                                      <td>{mov.product?.name || '-'}</td>
                                      <td><strong>{mov.quantity}</strong> {mov.product?.baseUnit ? getUnit(mov.product.baseUnit) : ''}</td>
                                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{mov.lot?.lotCode || '-'}</td>
                                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{mov.createdAt ? new Date(mov.createdAt).toLocaleString() : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>Sin movimientos</div>
                            )
                          ) : (
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                              <div className="spinner-small"></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingApplication ? 'Editar Aplicación' : 'Nueva Aplicación'}</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => { setShowModal(false); setEditingApplication(null); }}
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
                    const dosageResult = autoDosage ? calculateProductDosage(sp.productId, sp.dosePerHectare, sp.concentration) : null;
                    
                    return (
                      <div key={index} style={{ 
                        background: 'var(--gray-50)', 
                        padding: '0.75rem', 
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                          <div style={{ flex: 2 }}>
                            <ProductSelector
                              products={products}
                              selectedProductId={sp.productId}
                              onSelect={(productId) => handleProductChange(index, 'productId', productId)}
                              excludedProductIds={selectedProducts.slice(0, index).map(p => p.productId)}
                            />
                          </div>
                          
                          {autoDosage && (
                            <>
                              {product?.doseType === 'CONCENTRATION' ? (
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.25rem' }}>
                                    Concentración (cc/L)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="form-input"
                                    value={sp.concentration || ''}
                                    onChange={e => handleProductChange(index, 'concentration', e.target.value)}
                                    placeholder={product.concentrationPerLiter?.toString() || 'cc/L'}
                                  />
                                </div>
                              ) : (
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.25rem' }}>
                                    Dosis ({product?.doseUnit && product.doseUnit !== 'BASE_UNIT' ? product.doseUnit : getUnit(product?.baseUnit)}/ha)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={sp.dosePerHectare}
                                    onChange={e => handleProductChange(index, 'dosePerHectare', e.target.value)}
                                    placeholder={`Min: ${product?.dosePerHectareMin || '-'} - Máx: ${product?.dosePerHectareMax || '-'}`}
                                  />
                                </div>
                              )}
                              {(product?.state?.name || product?.state) === 'LIQUIDO' && product?.doseType !== 'CONCENTRATION' && (
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
                            </>
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
                        {autoDosage && product && selectedField && (
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
                              Dosis: <strong>{product.dosePerHectareMin || '-'} - {product.dosePerHectareMax || '-'} {product.doseUnit && product.doseUnit !== 'BASE_UNIT' ? product.doseUnit : getUnit(product.baseUnit)}/ha</strong>
                            </div>
                            <div style={{ marginTop: '0.25rem' }}>
                              Cantidad recomendada: <strong>
                                {(() => {
                                  const doseMin = convertDoseToBaseUnit(product.dosePerHectareMin || 0, product.doseUnit, product.baseUnit);
                                  const doseMax = convertDoseToBaseUnit(product.dosePerHectareMax || 0, product.doseUnit, product.baseUnit);
                                  return `${(selectedField.area * doseMin).toFixed(2)} - ${(selectedField.area * doseMax).toFixed(2)}`;
                                })()} {product.baseUnit}</strong>
                            </div>
                          </div>
                        )}
                        
                        {/* Calculated result */}
                        {autoDosage && dosageResult && selectedField && (
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
                                              {l.lotCode ? `Código: ${l.lotCode}` : `Lote ${l.id.slice(0, 8)}`}
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
                  onClick={() => { setShowModal(false); }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={selectedProducts.length === 0}>
                  {editingApplication ? 'Guardar Cambios' : 'Registrar Aplicación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wizard para móvil */}
      {/* Modal de Resumen */}
      {showResumen && resumenApplication && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Resumen de Aplicación</h3>
              <button 
                className="btn btn-icon btn-secondary"
                onClick={() => setShowResumen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                background: 'var(--gray-100)',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                {generarResumenTexto(resumenApplication)}
              </pre>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={async () => {
                  const text = generarResumenTexto(resumenApplication);
                  
                  if (navigator.clipboard && window.isSecureContext) {
                    try {
                      await navigator.clipboard.writeText(text);
                      alert('Resumen copiado al portapapeles');
                      return;
                    } catch (e) {
                      console.log('Clipboard API failed, trying fallback');
                    }
                  }
                  
                  try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Resumen copiado al portapapeles');
                  } catch (e) {
                    alert('No se pudo copiar. Seleccioná el texto y copialo manualmente.');
                  }
                }}
              >
                📋 Copiar al Portapapeles
              </button>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowResumen(false)}
              >
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => window.open(`${getFullApiUrl(`/reports/application/${resumenApplication.id}?t=${Date.now()}`)}`, '_blank')}
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      <ApplicationWizard
        isOpen={showWizard}
        onClose={() => { setShowWizard(false); setEditingApplication(null); }}
        onSubmit={async (data) => {
          if (editingApplication) {
            await updateApplication(editingApplication.id, data);
            // Refrescar movimientos de la aplicación editada
            const updatedMovements = await movementsService.getByApplication(editingApplication.id);
            setApplicationMovements(prev => ({ ...prev, [editingApplication.id]: updatedMovements }));
          } else {
            await addApplication(data);
          }
          fetchLotStocks();
          // Notificar a StockPage que actualice
          window.dispatchEvent(new Event('stock-needs-refresh'));
          setEditingApplication(null);
        }}
        products={products}
        fields={fields}
        lots={lots}
        editApplication={editingApplication as Record<string, unknown> | null | undefined}
      />
    </div>
  );
}
