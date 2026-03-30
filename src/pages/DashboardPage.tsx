import { useProducts, useFields, useApplications, useLots } from '../hooks/useData';

export default function DashboardPage() {
  const { products } = useProducts();
  const { fields } = useFields();
  const { applications } = useApplications();
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
      label: 'Aplicaciones',
      value: applications.length,
      icon: '🚜',
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

  // Aplicaciones recientes
  const recentApplications = applications.slice(0, 5);

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

      {/* Recent Applications */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Aplicaciones Recientes</h3>
        </div>
        {recentApplications.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Campo</th>
                  <th>Dosis/Ha</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map(app => (
                  <tr key={app.id}>
                    <td>{new Date(app.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${app.type === 'FUMIGACION' ? 'badge-primary' : 'badge-secondary'}`}>
                        {app.type}
                      </span>
                    </td>
                    <td>{app.field?.name || 'Sin campo'}</td>
                    <td>
                      {app.applicationProducts?.map((ap, idx) => (
                        <div key={idx}>
                          {ap.product?.name}: {ap.quantityUsed} {ap.product?.baseUnit}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay aplicaciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
