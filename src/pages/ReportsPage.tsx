import { useState, useMemo } from 'react';
import { useProducts, useLots, useMovements } from '../hooks/useData';
import { getFullApiUrl } from '../shared/services/request';

type ReportType = 'productos' | 'vencimientos' | 'stock';

interface ReportOption {
  id: ReportType;
  label: string;
  icon: string;
  description: string;
}

const reportOptions: ReportOption[] = [
  { 
    id: 'productos', 
    label: 'Reporte Productos', 
    icon: '📦',
    description: 'Listado agrupado por producto genérico'
  },
  { 
    id: 'vencimientos', 
    label: 'Productos por Vencer', 
    icon: '⏰',
    description: 'Lotes próximos a vencer'
  },
  { 
    id: 'stock', 
    label: 'Resumen Stock', 
    icon: '📊',
    description: 'Stock total por producto'
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('productos');
  const productsHook = useProducts();
  const lotsHook = useLots();
  const movementsHook = useMovements();
  
  const products = productsHook.products;
  const lots = lotsHook.lots;
  const movements = movementsHook.movements;

  // Calcular stock disponible por lote
  const lotsWithStock = useMemo(() => {
    return lots.map(lot => {
      // Buscar salidas de este lote específico
      const salidasDelLote = movements
        .filter(m => m.lotId === lot.id && m.type === 'SALIDA')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      return {
        ...lot,
        salidas: salidasDelLote,
        stockDisponible: lot.initialStock - salidasDelLote
      };
    });
  }, [lots, movements]);

  // ========== REPORTE PRODUCTOS ==========
  const productosReporte = useMemo(() => {
    // Filtrar lotes que tienen producto asociado
    const lotsWithProduct = lotsWithStock.filter(l => l.productId);
    
    // Agrupar por producto genérico
    const groupedByGeneric: Record<string, typeof lotsWithProduct> = {};
    
    lotsWithProduct.forEach(lot => {
      const product = products.find(p => p.id === lot.productId);
      if (!product) return;
      
      // Usar producto genérico como clave, si está vacío usar "Sin género"
      const genericKey = product.genericName?.trim() || 'SIN_GÉNERO';
      
      if (!groupedByGeneric[genericKey]) {
        groupedByGeneric[genericKey] = [];
      }
      groupedByGeneric[genericKey].push(lot);
    });
    
    // Convertir a formato para mostrar
    return Object.entries(groupedByGeneric).map(([genericName, lotsList]) => {
      // Ordenar lotes por nombre de producto
      const sortedLots = lotsList.sort((a, b) => {
        const prodA = products.find(p => p.id === a.productId)?.name || '';
        const prodB = products.find(p => p.id === b.productId)?.name || '';
        return prodA.localeCompare(prodB);
      });
      
      // Calcular stock total por género
      const stockTotal = lotsList.reduce((sum, l) => sum + l.stockDisponible, 0);
      
      // Obtener unidad del primer producto
      const firstProduct = products.find(p => p.id === lotsList[0]?.productId);
      
      return {
        genericName: genericName === 'SIN_GÉNERO' ? null : genericName,
        lots: sortedLots,
        stockTotal,
        unit: firstProduct?.baseUnit
      };
    }).sort((a, b) => {
      // Ordenar: los que tienen género primero, luego los que no
      if (a.genericName && !b.genericName) return -1;
      if (!a.genericName && b.genericName) return 1;
      return (a.genericName || '').localeCompare(b.genericName || '');
    });
  }, [lotsWithStock, products]);

  // ========== PRODUCTOS POR VENCER ==========
  const porVencerReporte = useMemo(() => {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return lotsWithStock
      .filter(lot => {
        if (!lot.expiryDate) return false;
        const expiry = new Date(lot.expiryDate);
        return expiry >= today && expiry <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  }, [lotsWithStock]);

  // ========== RESUMEN STOCK ==========
  const stockResumen = useMemo(() => {
    return products.map(product => {
      const productLots = lotsWithStock.filter(l => l.productId === product.id);
      const stockTotal = productLots.reduce((sum, l) => sum + l.stockDisponible, 0);
      
      return {
        product,
        stockTotal,
        lotsCount: productLots.length
      };
    }).filter(s => s.stockTotal > 0).sort((a, b) => b.stockTotal - a.stockTotal);
  }, [products, lotsWithStock]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  
  const formatContainer = (lot: any) => {
    // containerType puede ser string o objeto { name: string }
    const type = lot.containerType?.name || lot.containerType || 'OTRO';
    const capacity = lot.containerCapacity || '-';
    return `${type} ${capacity !== '-' ? `(${capacity})` : ''}`;
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'productos':
        return (
          <div className="report-content">
            <h3 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>📦 Reporte de Productos</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              Agrupado por producto genérico. Los productos sin género se muestran al final.
            </p>
            
            {productosReporte.length === 0 ? (
              <div className="empty-state">
                <p>No hay lotes para mostrar</p>
              </div>
            ) : (
              productosReporte.map((grupo, idx) => (
                <div key={idx} className="report-group" style={{ marginBottom: '1.5rem' }}>
                  {grupo.genericName && (
                    <h4 className="report-group-title" style={{ 
                      background: 'var(--gray-100)', 
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius)',
                      marginBottom: '0.75rem',
                      color: 'var(--gray-900)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>📋 {grupo.genericName}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Stock: {grupo.stockTotal.toFixed(2)} {grupo.unit}
                      </span>
                    </h4>
                  )}
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Lote</th>
                          <th>Tipo Envase</th>
                          <th>Stock Disp.</th>
                          <th>Fecha Vencimiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.lots.map(lot => {
                          const product = products.find(p => p.id === lot.productId);
                          return (
                            <tr key={lot.id}>
                              <td><strong>{product?.name || '-'}</strong></td>
                              <td>
                                {lot.lotCode ? (
                                  <span className="badge badge-info">{lot.lotCode}</span>
                                ) : (
                                  <code>{lot.id.slice(0, 8)}</code>
                                )}
                              </td>
                              <td>{formatContainer(lot)}</td>
                              <td>
                                <strong style={{ 
                                  color: lot.stockDisponible <= 0 ? 'var(--danger)' : 
                                         lot.stockDisponible < (lot.initialStock * 0.3) ? 'orange' : 'var(--primary)'
                                }}>
                                  {lot.stockDisponible.toFixed(2)} {product?.baseUnit}
                                </strong>
                              </td>
                              <td>
                                {lot.expiryDate ? (
                                  <span style={{ 
                                    color: new Date(lot.expiryDate) < new Date() ? 'var(--danger)' : 'inherit'
                                  }}>
                                    {formatDate(lot.expiryDate)}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'vencimientos':
        return (
          <div className="report-content">
            <h3 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>⏰ Productos por Vencer</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              Lotes que vencen en los próximos 30 días
            </p>
            
            {porVencerReporte.length === 0 ? (
              <div className="empty-state">
                <p>No hay productos por vencer en los próximos 30 días</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Lote</th>
                      <th>Stock</th>
                      <th>Fecha Vencimiento</th>
                      <th>Días Restantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porVencerReporte.map(lot => {
                      const product = products.find(p => p.id === lot.productId);
                      const daysLeft = Math.ceil(
                        (new Date(lot.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <tr key={lot.id}>
                          <td><strong>{product?.name || '-'}</strong></td>
                          <td>
                            {lot.lotCode ? (
                              <span className="badge badge-info">{lot.lotCode}</span>
                            ) : (
                              <code>{lot.id.slice(0, 8)}</code>
                            )}
                          </td>
                          <td>
                                <strong style={{ 
                                  color: lot.stockDisponible <= 0 ? 'var(--danger)' : 'var(--primary)'
                                }}>
                                  {lot.stockDisponible.toFixed(2)} {product?.baseUnit}
                                </strong>
                              </td>
                          <td>{formatDate(lot.expiryDate!)}</td>
                          <td>
                            <span style={{ 
                              color: daysLeft <= 7 ? 'var(--danger)' : daysLeft <= 14 ? 'orange' : 'var(--primary)',
                              fontWeight: 'bold'
                            }}>
                              {daysLeft} días
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'stock':
        return (
          <div className="report-content">
            <h3 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>📊 Resumen de Stock</h3>
            <div className="flex flex-between" style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--gray-600)', margin: 0 }}>
                Stock total por producto
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => window.open(getFullApiUrl('/reports/stock-verification'), '_blank')}
              >
                📥 Descargar PDF
              </button>
            </div>
            
            {stockResumen.length === 0 ? (
              <div className="empty-state">
                <p>No hay stock disponible</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Lotes</th>
                      <th>Stock Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockResumen.map(item => {
                      const typeName = item.product.type?.name || String(item.product.typeId || 'OTRO');
                      return (
                        <tr key={item.product.id}>
                          <td><strong>{item.product.name}</strong></td>
                          <td>
                            <span className={`badge ${
                              typeName === 'SEMILLA' ? 'badge-primary' : 
                              typeName === 'FERTILIZANTE' ? 'badge-secondary' : 'badge-danger'
                            }`}>
                              {typeName}
                            </span>
                          </td>
                          <td>{item.lotsCount}</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>
                              {item.stockTotal.toFixed(2)} {item.product.baseUnit}
                            </strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default:
        return <div>Selecciona un reporte</div>;
    }
  };

  return (
    <div className="reports-page">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--gray-900)' }}>📊 Reportes</h2>
      
      <div className="reports-layout">
        {/* Sidebar de reportes */}
        <aside className="reports-sidebar">
          <h3 style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Seleccionar Reporte
          </h3>
          
          <div className="reports-list">
            {reportOptions.map(option => (
              <button
                key={option.id}
                className={`report-option ${selectedReport === option.id ? 'active' : ''}`}
                onClick={() => setSelectedReport(option.id)}
              >
                <span className="report-option-icon">{option.icon}</span>
                <div className="report-option-content">
                  <span className="report-option-label">{option.label}</span>
                  <span className="report-option-desc">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
        
        {/* Contenido del reporte */}
        <main className="reports-main">
          {renderReportContent()}
        </main>
      </div>

      <style>{`
        .reports-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.5rem;
        }

        .reports-sidebar {
          background: var(--gray-100);
          padding: 1rem;
          border-radius: var(--radius);
          height: fit-content;
        }

        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .report-option {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .report-option:hover {
          border-color: var(--primary);
          background: var(--gray-50);
        }

        .report-option.active {
          border-color: var(--primary);
          background: rgba(56, 142, 60, 0.15);
        }

        .report-option-icon {
          font-size: 1.25rem;
        }

        .report-option-content {
          display: flex;
          flex-direction: column;
        }

        .report-option-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--gray-900);
        }

        .report-option-desc {
          font-size: 0.75rem;
          color: var(--gray-600);
        }

        .reports-main {
          background: var(--white);
          border-radius: var(--radius);
          padding: 1.5rem;
          border: 1px solid var(--gray-200);
        }

        .report-group-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--gray-900);
        }

        .report-content h3 {
          color: var(--gray-900);
        }

        .report-content p {
          color: var(--gray-600);
        }

        @media (max-width: 768px) {
          .reports-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
