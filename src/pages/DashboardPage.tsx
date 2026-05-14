import { useProducts, useFields, useTancadas, useLots } from '../hooks/useData';

export default function DashboardPage() {
  const { products } = useProducts();
  const { fields } = useFields();
  const { tancadas } = useTancadas();
  const { lots } = useLots();

  const stats = [
    {
      label: 'Productos',
      value: products.length,
      icon: '📦',
      color: 'var(--primary)'
    },
    {
      label: 'Lotes Activos',
      value: lots.length,
      icon: '🔖',
      color: 'var(--secondary)'
    },
    {
      label: 'Campos',
      value: fields.length,
      icon: '🌾',
      color: 'var(--info)'
    },
    {
      label: 'Tancadas',
      value: tancadas.length,
      icon: '🚿',
      color: 'var(--success)'
    }
  ];

  // Calcular stock total por tipo de producto
  const stockByType: Record<string, number> = {};
  products.forEach(product => {
    const productLots = lots.filter(l => l.productId === product.id);
    const totalStock = productLots.reduce((sum, lot) => sum + lot.initialStock, 0);
    const typeName = String(product.type?.name || product.type || 'OTRO');
    stockByType[typeName] = (stockByType[typeName] || 0) + totalStock;
  });

  // Tancadas recientes
  const recentTancadas = tancadas.slice(0, 5);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Dashboard</h2>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ color: 'var(--gray-600)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Stock by Type */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Stock por Tipo</h3>
        </div>
        {Object.keys(stockByType).length > 0 ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(stockByType).map(([type, stock]) => (
              <div key={type} style={{ 
                padding: '0.75rem 1rem', 
                background: 'var(--gray-100)', 
                borderRadius: 'var(--radius)',
                minWidth: '120px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{type}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stock.toFixed(2)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay stock registrado</p>
          </div>
        )}
      </div>

      {/* Recent Tancadas */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tancadas Recientes</h3>
        </div>
        {recentTancadas.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Capacidad Tanque</th>
                  <th>Agua</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {recentTancadas.map(tancada => (
                  <tr key={tancada.id}>
                    <td>{(() => {
                        const [y, m, d] = tancada.date.split('T')[0].split('-');
                        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('es-AR');
                      })()}</td>
                    <td>{tancada.tankCapacity} L</td>
                    <td>{tancada.waterAmount} L</td>
                    <td>{tancada.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay tancadas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
