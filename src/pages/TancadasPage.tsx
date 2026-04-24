import { useState, useMemo, useEffect } from 'react';
import { useTancadas, useProducts, useFields, useTanks, useLots } from '../hooks/useData';
import { movementsService } from '../services';
import { Tancada, CreateTancadaInput } from '../types';
import TancadaWizard from '../features/tancadas/components/TancadaWizard';
import { convertDoseToBaseUnit } from '../utils/unitConversions';
import { getBaseUnitAbbr } from '../utils/units';
import ProductSelector from '../components/ProductSelector';

export default function TancadasPage() {
  const { tancadas, loading, addTancada, updateTancada, deleteTancada } = useTancadas();
  const { products } = useProducts();
  const { fields } = useFields();
  const { tanks } = useTanks();
  const { lots } = useLots();
  
  // Helper para obtener unidad abreviada
  const getUnit = (baseUnit: string | undefined) => baseUnit ? getBaseUnitAbbr(baseUnit) : '';
  
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
  const [originalLotStocks, setOriginalLotStocks] = useState<Record<string, number>>({}); // stock original antes de ajustar

  // Resumen modal
  const [showResumen, setShowResumen] = useState(false);
  const [resumenTancada, setResumenTancada] = useState<Tancada | null>(null);

  // Wizard for mobile
  const [showWizard, setShowWizard] = useState(false);
  const [editingTancada, setEditingTancada] = useState<Tancada | null>(null);
  const [stockAdjustedFor, setStockAdjustedFor] = useState<string | null>(null); // trackear para cual tancada ajustamos el stock
  
  const [autoDosage] = useState<boolean>(() => {
    const saved = localStorage.getItem('auto-dosage');
    return saved !== null ? saved === 'true' : false;
  });

  // Generar texto de resumen para una tancada
  const generarResumenTexto = (tancada: Tancada): string => {
    const totalHectareas = tancada.tancadaFields?.reduce((sum, f) => sum + f.hectaresTreated, 0) || 0;
    
    let texto = `FECHA: ${formatDate(tancada.date)}\n`;
    texto += `HECTÁREAS: ${totalHectareas} ha\n`;
    texto += `AGUA: ${tancada.waterAmount} ${getUnit('L')}\n`;
    texto += `\nPRODUCTOS:\n`;
    
// Los lotes se almacenan en lotsUsed de cada tancadaProduct
    tancada.tancadaProducts?.forEach((tp) => {
      // Buscar código del producto desde la rela o desde la lista local
      const productCode = (tp.product as any)?.productCode || products.find(p => p.id === tp.productId)?.productCode || '';
      const producto = tp.product?.name || 'Sin nombre';
      const unidad = getUnit(tp.product?.baseUnit) || 'L';
      
      // Usar quantity del producto como fallback
      const cantidadProducto = tp.quantity || 0;
      
      // Buscar información de lotes: tp.lotsUsed tiene quantityUsed, lotsData tiene containerCapacity
      let lotsInfo: { lotCode?: string; containerCapacity?: number; quantityUsed?: number }[] = [];
      
      // Primero: procesar lotsUsed que tiene quantityUsed
      if (tp.lotsUsed) {
        try {
          const lotsUsed = typeof tp.lotsUsed === 'string' ? JSON.parse(tp.lotsUsed) : tp.lotsUsed;
          if (Array.isArray(lotsUsed) && lotsUsed.length > 0) {
            // Buscar datos adicionales del lote en la lista local
            lotsInfo = lotsUsed.map((lu: any) => {
              const lotData = lots.find(l => l.id === lu.lotId);
              return {
                lotCode: lotData?.lotCode,
                containerCapacity: lotData?.containerCapacity,
                quantityUsed: lu.quantityUsed ?? lu.cantidad ?? lu.cantidadUsada ?? 0
              };
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Segundo: si hay lotsData del backend, combinar con quantity de lotsUsed
      const lotsData = (tp as any).lotsData;
      if (lotsData && Array.isArray(lotsData) && lotsData.length > 0) {
        // Si lotsInfo tiene datos, mejorar con lotsData del backend
        if (lotsInfo.length > 0) {
          lotsInfo = lotsInfo.map((li, idx) => {
            const backendLot = lotsData[idx];
            return {
              lotCode: li.lotCode || backendLot?.lotCode,
              containerCapacity: li.containerCapacity || backendLot?.containerCapacity,
              quantityUsed: li.quantityUsed // mantener el quantity del frontend
            };
          });
        } else {
          // Solo lotsData: usar quantity del producto si no hay lotsUsed
          lotsInfo = lotsData.map((l: any) => ({
            lotCode: l.lotCode,
            containerCapacity: l.containerCapacity,
            quantityUsed: 0 // sin datos de quantity
          }));
        }
      }
      
      // Calcular total sumando las cantidades de los lotes, o usar quantity del producto
      let totalCantidad = lotsInfo.reduce((sum, lot) => sum + (lot.quantityUsed || 0), 0);
      if (totalCantidad === 0 && cantidadProducto > 0) {
        totalCantidad = cantidadProducto;
      }
      
      // Mostrar cada lote con su contenedor y cantidad usada
      if (lotsInfo.length > 0 && totalCantidad > 0) {
        // Primero mostrar nombre del producto
        texto += `${productCode} ${producto} Total: ${totalCantidad.toFixed(2)}${unidad.toLowerCase()}\n`;
        // lotsInfo.forEach((lot) => {
        //   const lotName = lot.lotCode || `Lote${lot.containerCapacity}L`;
        //   const capacidad = lot.containerCapacity || 0;
        //   const qtyUsed = lot.quantityUsed || 0;
        //   texto += `  • ${productCode}-${lotName}(${capacidad}${unidad.toLowerCase()}): ${qtyUsed.toFixed(2)}${unidad.toLowerCase()}\n`;
        // });
      } else {
        // Sin lotes o amounts 0: usar cantidad del producto directamente
        texto += `${productCode} ${producto}: ${cantidadProducto} ${unidad}\n`;
      }
    });
      
      // Agregar campos tratados
    if (tancada.tancadaFields && tancada.tancadaFields.length > 0) {
      texto += `\nCAMPOS:\n`;
      tancada.tancadaFields.forEach((tf) => {
        const campoNombre = tf.field?.name || 'Sin nombre';
        const hectareas = tf.hectaresTreated;
        const totalCampo = tf.field?.area || hectareas;
        texto += `• ${campoNombre}: ${hectareas}/${totalCampo} ha\n`;
      });
    }
    
    return texto;
  };

  const abrirResumen = (tancada: Tancada) => {
    setResumenTancada(tancada);
    setShowResumen(true);
  };

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
    setStockAdjustedFor(null);
  };

  // Fetch real stock for all lots
  useEffect(() => {
    const fetchLotStocks = async () => {
      const stocks: Record<string, number> = {};
      for (const lot of lots) {
        try {
          const result = await movementsService.getLotStock(lot.id);
          stocks[lot.id] = result.stock;
        } catch {
          // Fallback to initial stock if API fails
          stocks[lot.id] = lot.initialStock;
        }
      }
      setLotStocks(stocks);
      setOriginalLotStocks(stocks); // Guardar copia original
    };
    
    if (lots.length > 0) {
      fetchLotStocks();
    }
  }, [lots]);

  // Open modal for new tancada (restore original stocks)
  const openModal = () => {
    resetForm();
    setLotStocks({ ...originalLotStocks }); // Restore to original stocks
    setShowModal(true);
  };

  // Edit existing tancada
  const handleEdit = (tancada: Tancada) => {
    // Use wizard on mobile, modal on desktop
    if (window.innerWidth < 768) {
      setEditingTancada(tancada);
      setShowWizard(true);
    } else {
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
      setSelectedProducts(tancada.tancadaProducts?.map(p => {
        // Parse lotsUsed if available
        let parsedLots: { lotId: string; quantityUsed: number }[] = [];
        if (p.lotsUsed) {
          try {
            parsedLots = typeof p.lotsUsed === 'string' ? JSON.parse(p.lotsUsed) : p.lotsUsed;
          } catch (e) {
            parsedLots = [];
          }
        }
        return {
          productId: p.productId,
          concentration: p.concentration?.toString() || '',
          quantity: p.quantity.toString(),
          dosePerHectare: '',
          lots: parsedLots
        };
      }) || []);
      
      // Load field distribution
      setFieldDistribution(tancada.tancadaFields?.map(f => ({
        fieldId: f.fieldId,
        hectares: f.hectaresTreated.toString()
      })) || []);
      
      // Solo ajustar stock si es la primera vez que editamos esta tancada
      if (stockAdjustedFor !== tancada.id) {
        // Calcular stock original (sin mouvements de esta tancada) desde el stock original + quantities de esta tancada
        const adjustedStocks = { ...originalLotStocks };
        tancada.tancadaProducts?.forEach(p => {
          try {
            const lotsUsed = typeof p.lotsUsed === 'string' ? JSON.parse(p.lotsUsed) : p.lotsUsed;
            if (Array.isArray(lotsUsed)) {
              lotsUsed.forEach((lu: any) => {
                if (adjustedStocks[lu.lotId] !== undefined) {
                  adjustedStocks[lu.lotId] += lu.quantityUsed || 0;
                }
              });
            }
          } catch (e) {
            // Ignore
          }
        });
        setLotStocks(adjustedStocks);
        setStockAdjustedFor(tancada.id);
      }
      
      setShowModal(true);
    }
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
        const totalHa = parseFloat(formData.totalHectares) || 0;
        const waterAmount = parseFloat(formData.waterAmount) || 0;
        let quantity = 0;
        
        if (availableProduct.doseType === 'CONCENTRATION') {
          // Para concentración: cc/L * litros de agua / 1000 = litros de producto
          const concPerLiter = availableProduct.concentrationPerLiter || 0;
          quantity = (concPerLiter * waterAmount) / 1000;
        } else {
          // Para dosis por hectárea - con conversión
          const dose = availableProduct.dosePerHectareMin || availableProduct.dosePerHectareMax || 0;
          const convertedDose = convertDoseToBaseUnit(dose, availableProduct.doseUnit, availableProduct.baseUnit);
          quantity = totalHa * convertedDose;
        }
        
        setSelectedProducts([...selectedProducts, { 
          productId: availableProduct.id, 
          concentration: availableProduct.doseType === 'CONCENTRATION' ? (availableProduct.concentrationPerLiter?.toString() || '') : '',
          quantity: quantity > 0 ? quantity.toFixed(2) : '',
          dosePerHectare: availableProduct.doseType !== 'CONCENTRATION' ? (availableProduct.dosePerHectareMin || availableProduct.dosePerHectareMax || 0).toString() : '',
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
    
    // Auto-calculate when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      const totalHa = parseFloat(formData.totalHectares) || 0;
      const waterAmount = parseFloat(formData.waterAmount) || 0;
      
      if (product) {
        if (product.doseType === 'CONCENTRATION' && waterAmount > 0) {
          // Para concentración: cc/L * litros de agua / 1000 = litros de producto
          const concPerLiter = product.concentrationPerLiter || 0;
          const quantity = (concPerLiter * waterAmount) / 1000;
          updated[index].concentration = concPerLiter.toString();
          updated[index].quantity = quantity > 0 ? quantity.toFixed(2) : '';
          updated[index].dosePerHectare = '';
        } else if (product.dosePerHectareMin && totalHa > 0) {
          // Para dosis por hectárea - con conversión
          updated[index].dosePerHectare = product.dosePerHectareMin.toString();
          const convertedDose = convertDoseToBaseUnit(product.dosePerHectareMin, product.doseUnit, product.baseUnit);
          updated[index].quantity = (totalHa * convertedDose).toFixed(2);
          updated[index].concentration = '';
        }
      }
    }
    
    // Auto-calculate quantity when dosePerHectare changes (solo para PER_HECTARE)
    if (field === 'dosePerHectare') {
      const totalHa = parseFloat(formData.totalHectares) || 0;
      const dose = parseFloat(value) || 0;
      const product = products.find(p => p.id === updated[index].productId);
      if (product && product.doseType !== 'CONCENTRATION' && totalHa > 0 && dose > 0) {
        // Convertir la dosis a la unidad base del producto
        const convertedDose = convertDoseToBaseUnit(dose, product.doseUnit, product.baseUnit);
        updated[index].quantity = (totalHa * convertedDose).toFixed(2);
      }
    }
    
    // Auto-calculate quantity when concentration changes (para CONCENTRATION)
    if (field === 'concentration') {
      const product = products.find(p => p.id === updated[index].productId);
      if (product && product.doseType === 'CONCENTRATION') {
        const waterAmount = parseFloat(formData.waterAmount) || 0;
        const concPerLiter = parseFloat(value) || 0;
        if (waterAmount > 0 && concPerLiter > 0) {
          updated[index].quantity = ((concPerLiter * waterAmount) / 1000).toFixed(2);
        }
      }
    }
    
    setSelectedProducts(updated);
  };

  // Recalculate all product quantities based on total hectares or water amount
  const recalculateQuantities = () => {
    const totalHa = parseFloat(formData.totalHectares) || 0;
    const waterAmount = parseFloat(formData.waterAmount) || 0;
    if (totalHa === 0 && waterAmount === 0) return;
    
    const updated = selectedProducts.map(sp => {
      const product = products.find(p => p.id === sp.productId);
      if (!product) return sp;
      
      if (product.doseType === 'CONCENTRATION') {
        // Para concentración: cc/L * litros de agua / 1000 = litros de producto
        const concPerLiter = parseFloat(sp.concentration) || product.concentrationPerLiter || 0;
        if (concPerLiter === 0) return sp;
        const quantity = (concPerLiter * waterAmount) / 1000;
        return { ...sp, quantity: quantity > 0 ? quantity.toFixed(2) : '' };
      }
      
      // Para dosis por hectárea
      const dose = parseFloat(sp.dosePerHectare) || product.dosePerHectareMin || product.dosePerHectareMax || 0;
      if (dose === 0) return sp;
      
      // Convertir la dosis a la unidad base del producto
      const convertedDose = convertDoseToBaseUnit(dose, product.doseUnit, product.baseUnit);
      
      return {
        ...sp,
        quantity: (totalHa * convertedDose).toFixed(2)
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
          const result = await movementsService.getLotStock(lot.id);
          stocks[lot.id] = result.stock;
        } catch {
          stocks[lot.id] = lot.initialStock;
        }
      }
      setLotStocks(stocks);
      setOriginalLotStocks(stocks);
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
            const result = await movementsService.getLotStock(lot.id);
            stocks[lot.id] = result.stock;
          } catch {
            stocks[lot.id] = lot.initialStock;
          }
        }
        setLotStocks(stocks);
        setOriginalLotStocks(stocks);
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
          onClick={() => window.innerWidth < 768 ? setShowWizard(true) : openModal()}
          disabled={fields.length === 0 || products.length === 0}
        >
          + Nuevo
        </button>
      </div>

      {fields.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero creá un terreno y un campo en la sección Terrenos</p>
          </div>
        </div>
      )}

      {tancadas.length === 0 && fields.length > 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🚿</div>
            <h3>No hay tancadas</h3>
            <p>Registrá tu primera tancada para fumigar campos</p>
            <button className="btn btn-primary mt-1" onClick={() => window.innerWidth < 768 ? setShowWizard(true) : openModal()}>
              + Nuevo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Vista móvil - Cards */}
          <div className="mobile-cards">
            {tancadas.map(tancada => (
              <div key={tancada.id} className="card-mobile">
                <div className="card-mobile-header">
                  <span className="card-mobile-date">{formatDate(tancada.date)}</span>
                  <span className="card-mobile-badge">{tancada.tankCapacity}L</span>
                </div>
                
                <div className="card-mobile-content">
                  <div className="card-mobile-section">
                    <span className="card-mobile-label">Productos:</span>
                    {tancada.tancadaProducts?.map((tp, idx) => (
                      <span key={idx} className="badge badge-primary" style={{ marginRight: '0.25rem', marginBottom: '0.25rem' }}>
                        {tp.product?.name}: {tp.quantity}{getUnit(tp.product?.baseUnit)}
                      </span>
                    ))}
                  </div>
                  
                  <div className="card-mobile-row">
                    <div>
                      <span className="card-mobile-label">Agua:</span>
                      <span>{tancada.waterAmount} {getUnit('L')}</span>
                    </div>
                    <div>
                      <span className="card-mobile-label">Hás:</span>
                      <span>{tancada.tancadaFields?.reduce((sum, f) => sum + f.hectaresTreated, 0) || 0} ha</span>
                    </div>
                  </div>
                  
                  {tancada.tancadaFields && tancada.tancadaFields.length > 0 && (
                    <div className="card-mobile-section">
                      <span className="card-mobile-label">Campos:</span>
                      {tancada.tancadaFields.map((tf, idx) => (
                        <span key={idx} className="badge badge-info" style={{ marginRight: '0.25rem' }}>
                          {tf.field?.name}: {tf.hectaresTreated}ha
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="card-mobile-actions">
                  <button 
                    className="btn btn-info btn-sm"
                    onClick={() => abrirResumen(tancada)}
                  >
                    📋 Resumen
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEdit(tancada)}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(tancada.id)}
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
                  <th>Fecha</th>
                  <th>Tanques</th>
                  <th>Productos</th>
                  <th className="hide-mobile">Agua</th>
                  <th>Hás</th>
                  <th className="hide-mobile">Campos Tratados</th>
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
                            {tp.product?.name || '-'}{tp.concentration ? ` (${tp.concentration}%)` : ''}: {tp.quantity} {getUnit(tp.product?.baseUnit)}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="hide-mobile">{tancada.waterAmount} {getUnit('L')}</td>
                    <td>
                      <strong>
                        {tancada.tancadaFields?.reduce((sum, f) => sum + f.hectaresTreated, 0) || 0} ha
                      </strong>
                    </td>
                    <td className="hide-mobile">
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
                      <div className="action-buttons">
                        <button 
                          className="btn btn-info btn-sm"
                          onClick={() => abrirResumen(tancada)}
                          title="Resumen"
                        >
                          📋
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(tancada)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(tancada.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Tancada */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Tancada' : 'Nueva Tancada'}</h3>
              <button 
                className="btn btn-icon btn-secondary"
                  onClick={() => { setStockAdjustedFor(null); setShowModal(false); }}
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
                          {/* Selector de producto */}
                          <div style={{ flex: 2 }}>
                            <ProductSelector
                              products={products}
                              selectedProductId={sp.productId}
                              onSelect={(productId) => handleProductChange(index, 'productId', productId)}
                              excludedProductIds={selectedProducts.slice(0, index).map(p => p.productId)}
                            />
                          </div>
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
                        
                        {/* Dosis por hectáreas o Concentración cc/L */}
                        {autoDosage && (
                          <>
                            {product?.doseType === 'CONCENTRATION' ? (
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Concentración (cc/L)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="form-input"
                                    value={sp.concentration || ''}
                                    onChange={e => handleProductChange(index, 'concentration', e.target.value)}
                                    placeholder={product.concentrationPerLiter?.toString() || 'cc/L'}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Cantidad Total ({getUnit(product?.baseUnit)})</label>
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
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Dosis por Ha ({product?.doseUnit && product.doseUnit !== 'BASE_UNIT' ? product.doseUnit : getUnit(product?.baseUnit)})</label>
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
                                  <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Cantidad Total ({getUnit(product?.baseUnit)})</label>
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
                            )}
                          </>
                        )}

                        {/* Cuando autoDosage está desactivado, solo mostrar campo de cantidad */}
                        {!autoDosage && (
                          <div className="form-group">
                            <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Cantidad Total ({getUnit(product?.baseUnit)})</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input"
                              value={sp.quantity}
                              onChange={e => handleProductChange(index, 'quantity', e.target.value)}
                              placeholder="Cantidad total"
                            />
                          </div>
                        )}
                        
                        {/* Recommended dose range info */}
                        {autoDosage && product && totalHa > 0 && (
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
                              Dosis: <strong>{product.dosePerHectareMin || '-'} - {product.dosePerHectareMax || '-'} {product.doseUnit && product.doseUnit !== 'BASE_UNIT' ? product.doseUnit : getUnit(product.baseUnit)}/ha</strong>
                            </div>
                            <div style={{ marginTop: '0.25rem' }}>
                              Cantidad recomendada: <strong>
                                {(() => {
                                  const doseMin = convertDoseToBaseUnit(product.dosePerHectareMin || 0, product.doseUnit, product.baseUnit);
                                  const doseMax = convertDoseToBaseUnit(product.dosePerHectareMax || 0, product.doseUnit, product.baseUnit);
                                  return `${(totalHa * doseMin).toFixed(2)} - ${(totalHa * doseMax).toFixed(2)}`;
                                })()} {getUnit(product.baseUnit)}</strong>
                            </div>
                            {sp.dosePerHectare && (
                              <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>
                                → Actual: {sp.quantity || '0'} {getUnit(product.baseUnit)} ({totalHa} ha × {sp.dosePerHectare} {product.doseUnit && product.doseUnit !== 'BASE_UNIT' ? product.doseUnit : getUnit(product.baseUnit)}/ha)
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
                                        background: 'var(--gray-100)', 
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
                  onClick={() => { setStockAdjustedFor(null); setShowModal(false); }}
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

      {/* Modal de Resumen en Texto */}
      {showResumen && resumenTancada && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Resumen de Tancada</h3>
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
                {generarResumenTexto(resumenTancada)}
              </pre>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={async () => {
                  const text = generarResumenTexto(resumenTancada);
                  
                  // Try clipboard API first (works on HTTPS or localhost)
                  if (navigator.clipboard && window.isSecureContext) {
                    try {
                      await navigator.clipboard.writeText(text);
                      alert('Resumen copiado al portapapeles');
                      return;
                    } catch (e) {
                      console.log('Clipboard API failed, trying fallback');
                    }
                  }
                  
                  // Fallback for HTTP or non-secure contexts
                  try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    if (successful) {
                      alert('Resumen copiado al portapapeles');
                    } else {
                      alert('No se pudo copiar. Podés seleccionar el texto y copiarlo manualmente.');
                    }
                  } catch (err) {
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
              </div>
            </div>
          </div>
        )}

      <TancadaWizard
        isOpen={showWizard}
        onClose={() => { setShowWizard(false); setEditingTancada(null); }}
        onSubmit={async (data: CreateTancadaInput) => {
          if (editingTancada) {
            await updateTancada(editingTancada.id, data);
          } else {
            await addTancada(data);
          }
          fetchLotStocks();
          setEditingTancada(null);
        }}
        products={products}
        fields={fields}
        tanks={tanks}
        lots={lots}
        editTancada={editingTancada as Record<string, unknown> | null | undefined}
      />
    </div>
  );
}
