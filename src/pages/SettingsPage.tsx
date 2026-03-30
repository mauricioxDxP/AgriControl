import { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';

interface SettingItem {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  
  // Product Types
  const [productTypes, setProductTypes] = useState<SettingItem[]>([]);
  const [newProductType, setNewProductType] = useState('');
  
  // Product States  
  const [productStates, setProductStates] = useState<SettingItem[]>([]);
  const [newProductState, setNewProductState] = useState('');
  
  // Container Types
  const [containerTypes, setContainerTypes] = useState<SettingItem[]>([]);
  const [newContainerType, setNewContainerType] = useState('');

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
