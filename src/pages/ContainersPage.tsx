import { useState, useEffect } from 'react';
import { useLots, useProducts } from '../hooks/useData';
import { Movement } from '../types';
import { movementsService } from '../features/movements/services';
import { dbHelpers } from '../db/database';

export default function ContainersPage() {
  const { lots, loading: lotsLoading } = useLots();
  const { products } = useProducts();
  const [movementsByLot, setMovementsByLot] = useState<Record<string, Movement[]>>({});
  const [loadingMovements, setLoadingMovements] = useState(true);

  // Cargar movimientos por cada lote
  useEffect(() => {
    async function loadMovements() {
      if (lots.length === 0) return;
      
      setLoadingMovements(true);
      const movementsMap: Record<string, Movement[]> = {};
      const isOnline = navigator.onLine;
      
      for (const lot of lots) {
        try {
          let movements: Movement[];
          if (isOnline) {
            movements = await movementsService.getByLot(lot.id);
          } else {
            // Offline fallback
            movements = await dbHelpers.getMovementsByLot(lot.id);
          }
          movementsMap[lot.id] = movements;
        } catch {
          movementsMap[lot.id] = [];
        }
      }
      
      setMovementsByLot(movementsMap);
      setLoadingMovements(false);
    }
    
    loadMovements();
  }, [lots]);

  if (lotsLoading || loadingMovements) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Función para calcular contenedores desde movements
  const calculateContainers = (lot: typeof lots[0]) => {
    const movements = movementsByLot[lot.id] || [];
    
    // Calcular total consumido (SALIDA)
    const consumed = movements
      .filter(m => m.type === 'SALIDA')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    // Calcular stock restante
    const remainingStock = lot.initialStock - consumed;
    
    // Calcular contenedores
    const capacity = lot.containerCapacity || 1;
    const qtyFull = Math.floor(Math.max(0, remainingStock) / capacity);
    const remainingQuantity = Math.max(0, remainingStock) % capacity;
    
    // Los contenedores "vacíos" son los que se consumieron completamente
    const qtyEmpty = Math.floor(consumed / capacity);
    
    return { qtyFull, qtyEmpty, remainingQuantity, remainingStock, consumed };
  };

  return (
    <div>
      <div className="flex flex-between mb-2">
        <h2>Contenedores</h2>
      </div>

      {lots.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>Primero debés crear lotes para poder gestionar contenedores</p>
          </div>
        </div>
      )}

      {lots.length > 0 && (
        <div>
          {lots.filter(lot => lot.containerCapacity).map(lot => {
            const { qtyFull, qtyEmpty, remainingQuantity, remainingStock, consumed } = calculateContainers(lot);
            const product = products.find(p => p.id === lot.productId);
            const capacity = lot.containerCapacity || 1;
            const totalContainers = qtyFull + qtyEmpty + (remainingQuantity > 0 ? 1 : 0);
            
            return (
              <div key={lot.id} style={{ marginBottom: '1.5rem' }}>
                {/* Header del lote */}
                <div style={{ 
                  background: 'var(--primary)', 
                  color: 'var(--white)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius) var(--radius) 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <strong>{product?.name || 'Sin producto'}</strong>
                    {lot.lotCode && <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>{lot.lotCode}</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span>{totalContainers} <span style={{ opacity: 0.7 }}>contenedores</span> <span style={{ opacity: 0.5 }}>({capacity}{product?.baseUnit} c/u)</span></span>
                    <span><strong>{remainingStock.toFixed(1)} / {lot.initialStock.toFixed(1)} {product?.baseUnit}</strong></span>
                    <span style={{ opacity: 0.7 }}>consumido: {consumed.toFixed(1)}</span>
                  </div>
                </div>
                
                {/* Contenedores llenos */}
                {qtyFull > 0 && (
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'var(--success-light)',
                    borderBottom: '1px solid var(--success)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>✓</span>
                      <span>Llenos: {qtyFull}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        ({capacity}{product?.baseUnit} c/u)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Contenedor en uso (parcial) */}
                {remainingQuantity > 0 && (
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'var(--warning-light)',
                    borderBottom: '1px solid var(--warning)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>⚠</span>
                      <span>En uso: {remainingQuantity.toFixed(1)}{product?.baseUnit}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        (de {capacity}{product?.baseUnit})
                      </span>
                    </div>
                    {/* Barra de progreso */}
                    <div style={{ 
                      marginTop: '0.5rem', 
                      height: '8px', 
                      background: 'var(--gray-200)', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${(remainingQuantity / capacity) * 100}%`,
                        height: '100%',
                        background: 'var(--warning)',
                        transition: 'width 0.3s'
                      }}></div>
                    </div>
                  </div>
                )}
                
                {/* Contenedores vacíos */}
                {qtyEmpty > 0 && (
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'var(--gray-100)',
                    borderBottom: '1px solid var(--gray-300)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>✕</span>
                      <span>Vacíos: {qtyEmpty}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        ({capacity}{product?.baseUnit} c/u)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Stock agotado */}
                {remainingStock <= 0 && qtyFull === 0 && remainingQuantity === 0 && (
                  <div style={{ 
                    padding: '0.75rem',
                    background: 'var(--danger-light)',
                    borderBottom: '1px solid var(--danger)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>⚠</span>
                      <span>Stock agotado</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}