import { useState, useMemo } from 'react';
import { useProducts, useLots, useMovements } from '../hooks/useData';

export default function StockPage() {
  const productsHook = useProducts();
  const lotsHook = useLots();
  const movementsHook = useMovements();
  
  const products = productsHook.products;
  const lots = lotsHook.lots;
  const movements = movementsHook.movements;
  
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const productLots = lots.filter(l => l.productId === selectedProductId);
  const productMovements = movements.filter(m => m.productId === selectedProductId);

  // Calcular stock por lote (stock inicial - salidas de ese lote)
  const lotsWithStock = useMemo(() => {
    return productLots.map(lot => {
      // Buscar salidas que usaron este lote específico
      const salidasDelLote = productMovements
        .filter(m => m.lotId === lot.id && m.type === 'SALIDA')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      return {
        ...lot,
        salidas: salidasDelLote,
        stockActual: lot.initialStock - salidasDelLote
      };
    });
  }, [productLots, productMovements]);

  // Calcular stock real: entradas - salidas
  const stockInfo = useMemo(() => {
    if (!selectedProductId) return null;

    let entradas = 0;
    let salidas = 0;

    productMovements.forEach(m => {
      if (m.type === 'ENTRADA') {
        entradas += m.quantity;
      } else {
        salidas += m.quantity;
      }
    });

    const stockActual = entradas - salidas;
    const stockLotes = productLots.reduce((sum, l) => sum + l.initialStock, 0);

    return {
      entradas,
      salidas,
      stockActual,
      stockLotes
    };
  }, [selectedProductId, productMovements, productLots]);

  // Stock por producto (todos)
  const stockByProduct = useMemo(() => {
    return products.map(product => {
      const productMovementList = movements.filter(m => m.productId === product.id);
      const productLotsList = lots.filter(l => l.productId === product.id);

      let entradas = 0;
      let salidas = 0;

      productMovementList.forEach(m => {
        if (m.type === 'ENTRADA') {
          entradas += m.quantity;
        } else {
          salidas += m.quantity;
        }
      });

      const stock = entradas - salidas;
      const stockEnLotes = productLotsList.reduce((sum, l) => sum + l.initialStock, 0);

      return {
        product,
        entradas,
        salidas,
        stock,
        stockEnLotes,
        lotesCount: productLotsList.length
      };
    }).filter(s => s.stockEnLotes > 0 || s.stock > 0);
  }, [products, movements, lots]);

  const formatNumber = (num: number) => num.toFixed(2);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Stock de Productos</h2>

      {products.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>No hay productos registrados</p>
          </div>
        </div>
      )}

      {/* Stock por producto */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Stock por Producto</h3>
        </div>
        
        {/* Vista móvil - Cards */}
        {stockByProduct.length > 0 && (
          <div className="mobile-cards">
            {stockByProduct.map((item) => {
              const typeName = item.product.type?.name || String(item.product.type || 'OTRO');
              return (
                <div 
                  key={item.product.id} 
                  className="card-mobile"
                  onClick={() => setSelectedProductId(item.product.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-mobile-header">
                    <span className="card-mobile-date">{item.product.name}</span>
                    <span className={`card-mobile-badge ${
                      typeName === 'SEMILLA' ? 'badge-primary' : 
                      typeName === 'FERTILIZANTE' ? 'badge-secondary' : 'badge-danger'
                    }`}>
                      {typeName}
                    </span>
                  </div>
                  
                  <div className="card-mobile-content">
                    <div className="card-mobile-row">
                      <div>
                        <span className="card-mobile-label">Lotes:</span>
                        <span>{item.lotesCount}</span>
                      </div>
                      <div>
                        <span className="card-mobile-label">Stock:</span>
                        <strong style={{ 
                          color: item.stock < 0 ? 'var(--danger)' : item.stock === 0 ? 'var(--gray-500)' : 'var(--primary)'
                        }}>
                          {formatNumber(item.stock)} {item.product.baseUnit}
                        </strong>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-mobile-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductId(item.product.id);
                      }}
                      style={{ width: '100%' }}
                    >
                      📋 Ver Detalle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista desktop - Tabla */}
        {stockByProduct.length > 0 ? (
          <div className="table-container hide-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Lotes</th>
                  <th className="hide-mobile">Entradas</th>
                  <th className="hide-mobile">Salidas</th>
                  <th>Stock</th>
                  <th className="hide-mobile">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stockByProduct.map((item) => {
                  const typeName = item.product.type?.name || String(item.product.type || 'OTRO');
                  return (
                  <tr 
                    key={item.product.id}
                    style={{ 
                      background: selectedProductId === item.product.id ? 'var(--gray-100)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedProductId(item.product.id)}
                  >
                    <td><strong>{item.product.name}</strong></td>
                    <td>
                      <span className={`badge ${
                        typeName === 'SEMILLA' ? 'badge-primary' : 
                        typeName === 'FERTILIZANTE' ? 'badge-secondary' : 'badge-danger'
                      }`}>
                        {typeName}
                      </span>
                    </td>
                    <td>{item.lotesCount}</td>
                    <td className="hide-mobile" style={{ color: 'var(--success)' }}>{formatNumber(item.entradas)}</td>
                    <td className="hide-mobile" style={{ color: 'var(--danger)' }}>{formatNumber(item.salidas)}</td>
                    <td>
                      <strong style={{ 
                        color: item.stock < 0 ? 'var(--danger)' : item.stock === 0 ? 'var(--gray-500)' : 'var(--primary)'
                      }}>
                        {formatNumber(item.stock)}
                      </strong>
                    </td>
                    <td className="hide-mobile">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductId(item.product.id);
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay productos con stock</p>
          </div>
        )}
      </div>

      {/* Detalle del producto seleccionado */}
      {selectedProduct && stockInfo && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              Detalle de Stock: {selectedProduct.name}
            </h3>
          </div>

          {/* Resumen */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              padding: '1rem', 
              background: 'var(--gray-50)', 
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Stock en Lotes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatNumber(stockInfo.stockLotes)} {selectedProduct.baseUnit}
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(56, 142, 60, 0.1)', 
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Entradas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                +{formatNumber(stockInfo.entradas)} {selectedProduct.baseUnit}
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(211, 47, 47, 0.1)', 
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Salidas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                -{formatNumber(stockInfo.salidas)} {selectedProduct.baseUnit}
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              background: stockInfo.stockActual < 0 ? 'rgba(211, 47, 47, 0.1)' : 'var(--primary)',
              color: stockInfo.stockActual < 0 ? 'var(--danger)' : 'white',
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Stock Real</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatNumber(stockInfo.stockActual)} {selectedProduct.baseUnit}
              </div>
            </div>
          </div>

          {/* Lotes del producto */}
          <h4 style={{ marginBottom: '0.75rem' }}>Lotes ({lotsWithStock.length})</h4>
          
          {/* Cards móvil */}
          <div className="mobile-cards">
            {lotsWithStock.map(lot => (
              <div key={lot.id} className="card-mobile">
                <div className="card-mobile-header">
                  <span className="card-mobile-date">
                    {lot.lotCode ? lot.lotCode : lot.id.slice(0, 8)}
                  </span>
                  <span className={`card-mobile-badge ${
                    lot.stockActual <= 0 ? 'badge-danger' : 'badge-primary'
                  }`}>
                    {lot.stockActual <= 0 ? 'Vacío' : 'Activo'}
                  </span>
                </div>
                <div className="card-mobile-content">
                  <div className="card-mobile-row">
                    <div>
                      <span className="card-mobile-label">Stock:</span>
                      <strong style={{ 
                        color: lot.stockActual < 0 ? 'var(--danger)' : 
                               lot.stockActual === 0 ? 'var(--gray-500)' : 'var(--primary)'
                      }}>
                        {formatNumber(lot.stockActual)} {selectedProduct.baseUnit}
                      </strong>
                    </div>
                    <div>
                      <span className="card-mobile-label">Inicial:</span>
                      <span>{lot.initialStock}</span>
                    </div>
                  </div>
                  {lot.expiryDate && (
                    <div className="card-mobile-section">
                      <span className="card-mobile-label">Vence:</span>
                      <span style={{ color: new Date(lot.expiryDate) < new Date() ? 'var(--danger)' : 'inherit' }}>
                        {new Date(lot.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Tabla desktop */}
          {lotsWithStock.length > 0 ? (
            <div className="table-container hide-mobile">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Fecha Ingreso</th>
                    <th>Vencimiento</th>
                    <th>Proveedor</th>
                    <th>Stock Inicial</th>
                    <th>Salidas</th>
                    <th>Stock Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {lotsWithStock.map(lot => (
                    <tr key={lot.id}>
                      <td>
                        {lot.lotCode ? (
                          <span className="badge badge-info">{lot.lotCode}</span>
                        ) : (
                          <code>{lot.id.slice(0, 8)}</code>
                        )}
                      </td>
                      <td>{new Date(lot.entryDate).toLocaleDateString()}</td>
                      <td>
                        {lot.expiryDate ? (
                          <span style={{ 
                            color: new Date(lot.expiryDate) < new Date() ? 'var(--danger)' : 'inherit' 
                          }}>
                            {new Date(lot.expiryDate).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{lot.supplier || '-'}</td>
                      <td>{lot.initialStock} {selectedProduct.baseUnit}</td>
                      <td style={{ color: 'var(--danger)' }}>
                        -{formatNumber(lot.salidas)} {selectedProduct.baseUnit}
                      </td>
                      <td>
                        <strong style={{ 
                          color: lot.stockActual < 0 ? 'var(--danger)' : 
                                 lot.stockActual === 0 ? 'var(--gray-500)' : 'var(--primary)',
                          fontSize: '1.1rem'
                        }}>
                          {formatNumber(lot.stockActual)} {selectedProduct.baseUnit}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--gray-500)' }}>No hay lotes para este producto</p>
          )}

          {/* Historial de movimientos */}
          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
            Historial de Movimientos ({productMovements.length})
          </h4>
          
          {/* Cards móvil */}
          <div className="mobile-cards">
            {productMovements.map(movement => (
              <div key={movement.id} className="card-mobile">
                <div className="card-mobile-header">
                  <span className="card-mobile-date">{new Date(movement.createdAt).toLocaleDateString()}</span>
                  <span className={`card-mobile-badge ${
                    movement.type === 'ENTRADA' ? 'badge-primary' : 'badge-danger'
                  }`}>
                    {movement.type}
                  </span>
                </div>
                <div className="card-mobile-content">
                  <div className="card-mobile-row">
                    <div>
                      <span className="card-mobile-label">Cantidad:</span>
                      <strong style={{ 
                        color: movement.type === 'ENTRADA' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {movement.type === 'ENTRADA' ? '+' : '-'}{movement.quantity} {selectedProduct.baseUnit}
                      </strong>
                    </div>
                  </div>
                  {movement.notes && (
                    <div className="card-mobile-section">
                      <span className="card-mobile-label">Notas:</span>
                      <span>{movement.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Tabla desktop */}
          {productMovements.length > 0 ? (
            <div className="table-container hide-mobile">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {productMovements.map(movement => (
                    <tr key={movement.id}>
                      <td>{new Date(movement.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${movement.type === 'ENTRADA' ? 'badge-primary' : 'badge-danger'}`}>
                          {movement.type}
                        </span>
                      </td>
                      <td style={{ 
                        fontWeight: 'bold',
                        color: movement.type === 'ENTRADA' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {movement.type === 'ENTRADA' ? '+' : '-'}{movement.quantity} {selectedProduct.baseUnit}
                      </td>
                      <td>{movement.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--gray-500)' }}>No hay movimientos para este producto</p>
          )}
        </div>
      )}
    </div>
  );
}
