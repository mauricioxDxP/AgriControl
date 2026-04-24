import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useOnlineStatus, useSync } from './hooks/useData';
import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy loading pages - loaded only when needed
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const LotsPage = lazy(() => import('./pages/LotsPage'));
const TerrainsPage = lazy(() => import('./pages/TerrainsPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const TanksPage = lazy(() => import('./pages/TanksPage'));
const TancadasPage = lazy(() => import('./pages/TancadasPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProductSettingsPage = lazy(() => import('./pages/ProductSettingsPage'));
const OperationSettingsPage = lazy(() => import('./pages/OperationSettingsPage'));
const FieldSettingsPage = lazy(() => import('./pages/FieldSettingsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

// Loading component for lazy loading
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: 'var(--text-color)'
    }}>
      <span>Loading...</span>
    </div>
  );
}

// Font sizes
const fontSizes = [
  { id: 'small', size: '14px' },
  { id: 'medium', size: '16px' },
  { id: 'large', size: '18px' },
  { id: 'xlarge', size: '20px' },
];

function App() {
  const isOnline = useOnlineStatus();
  const { syncing, lastSync, sync } = useSync();
  const [menuOpen, setMenuOpen] = useState(false);

  // Load theme and font size on init
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const savedFontSize = localStorage.getItem('app-font-size') || 'medium';
    const size = fontSizes.find(f => f.id === savedFontSize)?.size || '16px';
    document.documentElement.style.fontSize = size;
  }, []);

  const [activeGroup, setActiveGroup] = useState('inventario');

  const navItems = [
    // Inventory
    { path: '/products', label: 'Products', icon: '📦', group: 'inventario' },
    { path: '/lots', label: 'Lotes', icon: '🔖', group: 'inventario' },
    { path: '/stock', label: 'Stock', icon: '📈', group: 'inventario' },
    { path: '/reports', label: 'Reportes', icon: '📊', group: 'inventario' },
    { path: '/settings/products', label: 'Config. Productos', icon: '⚙️', group: 'inventario' },
    // Operations - Terrains/Fields hierarchy (all nested in /terrains)
    { path: '/terrains', label: 'Terrenos', icon: '🗺️', group: 'operaciones' },
    { path: '/tanks', label: 'Tanques', icon: '🛢️', group: 'operaciones' },
    { path: '/tancadas', label: 'Tancadas', icon: '🚿', group: 'operaciones' },
    { path: '/applications', label: 'Aplicaciones', icon: '🚁', group: 'operaciones' },
    { path: '/settings/operations', label: 'Config. Operaciones', icon: '⚙️', group: 'operaciones' },
    { path: '/settings/fields', label: 'Config. Siembras', icon: '🌱', group: 'operaciones' },
    // System
    { path: '/', label: 'Dashboard', icon: '📊', group: 'sistema' },
    { path: '/settings', label: 'Configuración', icon: '⚙️', group: 'sistema' },
  ];

  const groupLabels: Record<string, { label: string, icon: string }> = {
    inventario: { label: 'Inventario', icon: '📦' },
    operaciones: { label: 'Operaciones', icon: '🚜' },
    sistema: { label: 'Sistema', icon: '⚙️' },
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌱 AgroControl</h1>
      </header>

      <div className="status-bar">
        <div className="status-indicator">
          <span className={`status-dot ${isOnline ? 'online' : ''}`}></span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="status-indicator">
          {syncing && <span>🔄 Syncing...</span>}
          {!syncing && isOnline && (
            <button 
              onClick={sync} 
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              🔄 Sync
            </button>
          )}
          {lastSync && (
            <span>Last sync: {new Date(lastSync).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Hamburger button for mobile - OUTSIDE nav */}
      <button 
        className="hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <nav className={`nav-bar ${menuOpen ? 'open' : ''}`}>
        {/* Mobile: show all groups expanded */}
        <div className="nav-mobile-sections hide-desktop">
          {Object.entries(groupLabels).map(([groupKey, { label, icon }]) => (
            <div key={groupKey} className="nav-mobile-group">
              <div className="nav-mobile-header">
                {icon} {label}
              </div>
              {navItems
                .filter(item => item.group === groupKey)
                .map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    end={item.path === '/'}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.icon} {item.label}
                  </NavLink>
                ))}
            </div>
          ))}
        </div>

        {/* Desktop: tabs + items */}
        <div className="nav-desktop hide-mobile">
          <div className="nav-tabs">
            {Object.entries(groupLabels).map(([groupKey, { label, icon }]) => (
              <button
                key={groupKey}
                className={`nav-tab ${activeGroup === groupKey ? 'active' : ''}`}
                onClick={() => setActiveGroup(groupKey)}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          
          <div className="nav-items">
            {navItems
              .filter(item => item.group === activeGroup)
              .map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end={item.path === '/'}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.icon} {item.label}
                </NavLink>
              ))}
          </div>
        </div>
      </nav>

      {/* Overlay to close menu */}
      {menuOpen && (
        <div 
          className="nav-overlay hide-desktop" 
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="app-main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/lots" element={<LotsPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/terrains" element={<TerrainsPage />} />
            <Route path="/tanks" element={<TanksPage />} />
            <Route path="/tancadas" element={<TancadasPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/products" element={<ProductSettingsPage />} />
            <Route path="/settings/operations" element={<OperationSettingsPage />} />
            <Route path="/settings/fields" element={<FieldSettingsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="app-footer">
        AgroControl v1.0.0 - Offline Agricultural Inventory System
      </footer>
    </div>
  );
}

export default App;