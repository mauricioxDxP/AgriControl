import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useOnlineStatus, useSync } from './hooks/useData';
import { useState } from 'react';
import ProductsPage from './pages/ProductsPage';
import LotsPage from './pages/LotsPage';
import FieldsPage from './pages/FieldsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ContainersPage from './pages/ContainersPage';
import StockPage from './pages/StockPage';
import TanksPage from './pages/TanksPage';
import TancadasPage from './pages/TancadasPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const isOnline = useOnlineStatus();
  const { syncing, lastSync, sync } = useSync();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Productos', icon: '📦' },
    { path: '/lots', label: 'Lotes', icon: '🔖' },
    { path: '/containers', label: 'Contenedores', icon: '🫙' },
    { path: '/stock', label: 'Stock', icon: '📈' },
    { path: '/fields', label: 'Campos', icon: '🌾' },
    { path: '/tanks', label: 'Tanques', icon: '🛢️' },
    { path: '/tancadas', label: 'Tancadas', icon: '🚿' },
    { path: '/applications', label: 'Aplicaciones', icon: '🚁' },
    { path: '/settings', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌱 AgroControl</h1>
      </header>

      <div className="status-bar">
        <div className="status-indicator">
          <span className={`status-dot ${isOnline ? 'online' : ''}`}></span>
          <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
        </div>
        <div className="status-indicator">
          {syncing && <span>🔄 Sincronizando...</span>}
          {!syncing && isOnline && (
            <button 
              onClick={sync} 
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              🔄 Sincronizar
            </button>
          )}
          {lastSync && (
            <span>Última sync: {new Date(lastSync).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Botón hamburguesa para móvil - FUERA del nav */}
      <button 
        className="hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menú"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <nav className={`nav-bar ${menuOpen ? 'open' : ''}`}>
        {navItems.map(item => (
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
      </nav>

      {/* Overlay para cerrar menú */}
      {menuOpen && (
        <div 
          className="nav-overlay hide-desktop" 
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/lots" element={<LotsPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/fields" element={<FieldsPage />} />
          <Route path="/tanks" element={<TanksPage />} />
          <Route path="/tancadas" element={<TancadasPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        AgroControl v1.0.0 - Sistema de Inventario Agrícola Offline
      </footer>
    </div>
  );
}

export default App;
