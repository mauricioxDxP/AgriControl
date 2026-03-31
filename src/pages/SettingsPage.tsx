import { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';

interface SettingItem {
  id: string;
  name: string;
}

// Lista de temas disponibles
const themes = [
  { id: 'light', name: 'Claro', icon: '☀️', colors: ['#2e7d32', '#f5f5f5', '#ffffff'] },
  { id: 'dark', name: 'Oscuro', icon: '🌙', colors: ['#4caf50', '#1a1a1a', '#121212'] },
  { id: 'blue', name: 'Azul', icon: '🔵', colors: ['#1565c0', '#f5f5f5', '#ffffff'] },
  { id: 'purple', name: 'Morado', icon: '🟣', colors: ['#7b1fa2', '#f5f5f5', '#ffffff'] },
];

// Lista de tamaños de fuente
const fontSizes = [
  { id: 'small', name: 'Pequeño', size: '14px', sample: 'Aa' },
  { id: 'medium', name: 'Normal', size: '16px', sample: 'Aa' },
  { id: 'large', name: 'Grande', size: '18px', sample: 'Aa' },
  { id: 'xlarge', name: 'Extra Grande', size: '20px', sample: 'Aa' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<string>('light');
  const [currentFontSize, setCurrentFontSize] = useState<string>('medium');
  
  // Update app state
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Product Types
  const [productTypes, setProductTypes] = useState<SettingItem[]>([]);
  const [newProductType, setNewProductType] = useState('');
  
  // Product States  
  const [productStates, setProductStates] = useState<SettingItem[]>([]);
  const [newProductState, setNewProductState] = useState('');
  
  // Container Types
  const [containerTypes, setContainerTypes] = useState<SettingItem[]>([]);
  const [newContainerType, setNewContainerType] = useState('');

  // Cargar tema al inicio
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Cargar tamaño de fuente
    const savedFontSize = localStorage.getItem('app-font-size') || 'medium';
    setCurrentFontSize(savedFontSize);
    document.documentElement.style.fontSize = fontSizes.find(f => f.id === savedFontSize)?.size || '16px';
  }, []);

  // Cambiar tema
  const changeTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('app-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  // Cambiar tamaño de fuente
  const changeFontSize = (fontSizeId: string) => {
    setCurrentFontSize(fontSizeId);
    localStorage.setItem('app-font-size', fontSizeId);
    const size = fontSizes.find(f => f.id === fontSizeId)?.size || '16px';
    document.documentElement.style.fontSize = size;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [types, states, containers] = await Promise.all([
        settingsApi.getProductTypes(),
        settingsApi.getProductStates(),
        settingsApi.getContainerTypes()
      ]);
      setProductTypes(types);
      setProductStates(states);
      setContainerTypes(containers);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setLoading(false);
  };

  // Product Types
  const addProductType = async () => {
    if (newProductType) {
      try {
        await settingsApi.createProductType(newProductType);
        await loadData();
        setNewProductType('');
      } catch (error) {
        console.error('Error adding product type:', error);
      }
    }
  };
  
  const removeProductType = async (id: string) => {
    if (confirm('¿Eliminar este tipo de producto?')) {
      try {
        await settingsApi.deleteProductType(id);
        await loadData();
      } catch (error) {
        console.error('Error removing product type:', error);
      }
    }
  };

  // Product States
  const addProductState = async () => {
    if (newProductState) {
      try {
        await settingsApi.createProductState(newProductState);
        await loadData();
        setNewProductState('');
      } catch (error) {
        console.error('Error adding product state:', error);
      }
    }
  };
  
  const removeProductState = async (id: string) => {
    if (confirm('¿Eliminar este estado de producto?')) {
      try {
        await settingsApi.deleteProductState(id);
        await loadData();
      } catch (error) {
        console.error('Error removing product state:', error);
      }
    }
  };

  // Container Types
  const addContainerType = async () => {
    if (newContainerType) {
      try {
        await settingsApi.createContainerType(newContainerType);
        await loadData();
        setNewContainerType('');
      } catch (error) {
        console.error('Error adding container type:', error);
      }
    }
  };
  
  const removeContainerType = async (id: string) => {
    if (confirm('¿Eliminar este tipo de contenedor?')) {
      try {
        await settingsApi.deleteContainerType(id);
        await loadData();
      } catch (error) {
        console.error('Error removing container type:', error);
      }
    }
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
      <h2>Configuración</h2>
      
      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Temas */}
        <div className="card">
          <h3>🎨 Tema</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Elegí el tema que más te guste.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => changeTheme(theme.id)}
                style={{
                  padding: '1rem',
                  border: currentTheme === theme.id ? '3px solid var(--primary)' : '2px solid var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  background: theme.id === 'dark' ? '#1a1a1a' : theme.colors[1],
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{theme.icon}</span>
                <span style={{ fontWeight: 'bold', color: theme.id === 'dark' ? '#fff' : '#333' }}>
                  {theme.name}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {theme.colors.map((color, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: color,
                        border: '1px solid var(--gray-400)',
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Tamaño de Fuente */}
        <div className="card">
          <h3>🔤 Tamaño de Letra</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Elegí el tamaño de letra que más te resulte cómodo.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
            {fontSizes.map(font => (
              <button
                key={font.id}
                onClick={() => changeFontSize(font.id)}
                style={{
                  padding: '1rem',
                  border: currentFontSize === font.id ? '3px solid var(--primary)' : '2px solid var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--gray-900)',
                  color: 'var(--white)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: font.size, fontWeight: 'bold' }}>
                  {font.sample}
                </span>
                <span style={{ fontSize: '0.875rem' }}>
                  {font.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actualizar App */}
        <div className="card">
          <h3>🔄 Actualizar App</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Si hay una nueva versión disponible, actualizá la app para ver los cambios.
          </p>
          <button 
            className="btn btn-primary"
            disabled={updating}
            onClick={() => {
              setUpdating(true);
              setUpdateMessage('Buscando actualización...');
              
              // Manual check - wait and then show message
              setTimeout(async () => {
                try {
                  const registration = await navigator.serviceWorker.getRegistration();
                  if (registration) {
                    await registration.update();
                  }
                  setUpdateMessage('✓ Tenés la última versión.');
                } catch (err) {
                  console.error('Update error:', err);
                  setUpdateMessage('✓ Tenés la última versión.');
                } finally {
                  setUpdating(false);
                }
              }, 1500);
            }}
          >
            {updating ? 'Buscando...' : 'Buscar Actualización'}
          </button>
          {updateMessage && (
            <p style={{ 
              marginTop: '0.5rem', 
              color: updateMessage.includes('✓') ? 'var(--success)' : 
                     updateMessage.includes('✕') ? 'var(--danger)' : 'var(--gray-600)',
              fontWeight: '500'
            }}>
              {updateMessage}
            </p>
          )}
        </div>
        
        {/* Tipos de Producto */}
        <div className="card">
          <h3>📦 Tipos de Producto</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Define los tipos de productos que usás en tu empresa.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {productTypes.map(type => (
              <span key={type.id} className="badge badge-primary" style={{ padding: '0.5rem' }}>
                {type.name}
                <button 
                  onClick={() => removeProductType(type.id)}
                  style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={newProductType}
              onChange={e => setNewProductType(e.target.value.toUpperCase())}
              placeholder="Nuevo tipo..."
              onKeyPress={e => e.key === 'Enter' && addProductType()}
            />
            <button className="btn btn-primary" onClick={addProductType}>Agregar</button>
          </div>
        </div>

        {/* Estados de Producto */}
        <div className="card">
          <h3>💧 Estados de Producto</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Define los estados físicos de los productos.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {productStates.map(state => (
              <span key={state.id} className="badge badge-secondary" style={{ padding: '0.5rem' }}>
                {state.name}
                <button 
                  onClick={() => removeProductState(state.id)}
                  style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={newProductState}
              onChange={e => setNewProductState(e.target.value.toUpperCase())}
              placeholder="Nuevo estado..."
              onKeyPress={e => e.key === 'Enter' && addProductState()}
            />
            <button className="btn btn-primary" onClick={addProductState}>Agregar</button>
          </div>
        </div>

        {/* Tipos de Contenedor */}
        <div className="card">
          <h3>🫙 Tipos de Contenedor</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Define los tipos de contenedores que usás.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {containerTypes.map(type => (
              <span key={type.id} className="badge badge-info" style={{ padding: '0.5rem' }}>
                {type.name}
                <button 
                  onClick={() => removeContainerType(type.id)}
                  style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={newContainerType}
              onChange={e => setNewContainerType(e.target.value.toUpperCase())}
              placeholder="Nuevo tipo..."
              onKeyPress={e => e.key === 'Enter' && addContainerType()}
            />
            <button className="btn btn-primary" onClick={addContainerType}>Agregar</button>
          </div>
        </div>

      </div>
    </div>
  );
}
