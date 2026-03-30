import { useState, useMemo } from 'react';
import { useProducts, useLots, useMovements } from '../hooks/useData';

export default function StockPage() {
  const { products } = useProducts();
  const { lots } = useLots();
  const { movements } = useMovements();
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

      {/* Stock por producto */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Stock por Producto</h3>
        </div>
        {stockByProduct.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Lotes</th>
                  <th>Entradas</th>
                  <th>Salidas</th>
                  <th>Stock Actual</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stockByProduct.map(({ product, entradas, salidas, stock, lotesCount }) => (
                  <tr 
                    key={product.id}
                    style={{ 
                      background: selectedProductId === product.id ? 'var(--gray-100)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <td><strong>{product.name}</strong></td>
                    <td>
                      <span className={`badge ${
                        product.type === 'SEMILLA' ? 'badge-primary' : 
                        product.type === 'FERTILIZANTE' ? 'badge-secondary' : 'badge-danger'
                      }`}>
                        {product.type}
                      </span>
                    </td>
                    <td>{lotesCount}</td>
                    <td style={{ color: 'var(--success)' }}>{formatNumber(entradas)} {product.baseUnit}</td>
                    <td style={{ color: 'var(--danger)' }}>{formatNumber(salidas)} {product.baseUnit}</td>
                    <td>
                      <strong style={{ 
                        color: stock < 0 ? 'var(--danger)' : stock === 0 ? 'var(--gray-500)' : 'var(--primary)',
                        fontSize: '1.1rem'
                      }}>
                        {formatNumber(stock)} {product.baseUnit}
                      </strong>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductId(product.id);
                        }}
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
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
          {lotsWithStock.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lote ID</th>
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
                      <td><code>{lot.id.slice(0, 8)}</code></td>
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
          {productMovements.length > 0 ? (
            <div className="table-container">
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
