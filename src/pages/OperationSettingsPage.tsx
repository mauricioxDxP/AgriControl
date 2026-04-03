import { useState, useEffect } from 'react';
import { settingsService } from '../services';

interface SettingItem {
  id: string;
  name: string;
}

export default function OperationSettingsPage() {
  const [loading, setLoading] = useState(true);
  
  // Container Types
  const [containerTypes, setContainerTypes] = useState<SettingItem[]>([]);
  const [newContainerType, setNewContainerType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const containers = await settingsService.getContainerTypes();
      setContainerTypes(containers);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setLoading(false);
  };

  // Container Types
  const addContainerType = async () => {
    if (newContainerType) {
      try {
        await settingsService.createContainerType(newContainerType);
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
        await settingsService.deleteContainerType(id);
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
      <h2>Configuración de Operaciones</h2>
      
      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
        
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