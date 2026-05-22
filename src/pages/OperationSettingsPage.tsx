import { useState, useEffect } from 'react';
import { useMachinery } from '../features/machinery/hooks';
import { useOperator } from '../features/operator/hooks';
import { settingsService } from '../services';

interface SettingItem {
  id: string;
  name: string;
}

type TabType = 'container-types' | 'planted-types' | 'machinery' | 'operators';

export default function OperationSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('container-types');
  const [loading, setLoading] = useState(true);
  
  // Container Types
  const [containerTypes, setContainerTypes] = useState<SettingItem[]>([]);
  const [newContainerType, setNewContainerType] = useState('');

  // Planted Types
  const [plantedTypes, setPlantedTypes] = useState<any[]>([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<any[]>([]);
  const [selectedProductType, setSelectedProductType] = useState('');

  const { machineries, addMachinery, updateMachinery, deleteMachinery } = useMachinery();
  const { operators, addOperator, updateOperator, deleteOperator } = useOperator();
  const [newMachinery, setNewMachinery] = useState('');
  const [editingMachinery, setEditingMachinery] = useState<{ id: string; name: string } | null>(null);
  const [newOperator, setNewOperator] = useState('');
  const [editingOperator, setEditingOperator] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [containers, planted, productTypes] = await Promise.all([
        settingsService.getContainerTypes(),
        settingsService.getPlantedProductTypes(),
        settingsService.getProductTypes()
      ]);
      setContainerTypes(containers);
      setPlantedTypes(planted);
      setAvailableProductTypes(productTypes);
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

  // Planted Types
  const addPlantedType = async () => {
    if (selectedProductType) {
      try {
        await settingsService.addPlantedProductType(selectedProductType);
        await loadData();
        setSelectedProductType('');
      } catch (error) {
        console.error('Error adding planted type:', error);
      }
    }
  };

  const removePlantedType = async (id: string) => {
    if (confirm('¿Eliminar este tipo plantado?')) {
      try {
        await settingsService.deletePlantedProductType(id);
        await loadData();
      } catch (error) {
        console.error('Error removing planted type:', error);
      }
    }
  };

  // Machinery
  const handleAddMachinery = async () => {
    if (newMachinery) {
      await addMachinery({ name: newMachinery });
      setNewMachinery('');
    }
  };

  const handleUpdateMachinery = async () => {
    if (editingMachinery && newMachinery) {
      await updateMachinery(editingMachinery.id, { name: newMachinery });
      setEditingMachinery(null);
      setNewMachinery('');
    }
  };

  const handleDeleteMachinery = async (id: string) => {
    if (confirm('¿Eliminar esta maquinaria?')) {
      await deleteMachinery(id);
    }
  };

  // Operators
  const handleAddOperator = async () => {
    if (newOperator) {
      await addOperator({ name: newOperator });
      setNewOperator('');
    }
  };

  const handleUpdateOperator = async () => {
    if (editingOperator && newOperator) {
      await updateOperator(editingOperator.id, { name: newOperator });
      setEditingOperator(null);
      setNewOperator('');
    }
  };

  const handleDeleteOperator = async (id: string) => {
    if (confirm('¿Eliminar este operador?')) {
      await deleteOperator(id);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'container-types', label: '🫙 Contenedores' },
    { id: 'planted-types', label: '🌱 Plantado' },
    { id: 'machinery', label: '🚜 Maquinaria' },
    { id: 'operators', label: '👷 Operadores' }
  ];

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
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Tipos de Contenedor */}
        {activeTab === 'container-types' && (
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
        )}

        {/* Tipos Plantados */}
        {activeTab === 'planted-types' && (
          <div className="card">
            <h3>🌱 Tipos de Producto Plantado</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
              Filtra productos por tipo en la configuración de campos.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {plantedTypes.map(type => (
                <span key={type.id} className="badge badge-success" style={{ padding: '0.5rem' }}>
                  {type.productType?.name || type.name}
                  <button 
                    onClick={() => removePlantedType(type.id)}
                    style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-select"
                value={selectedProductType}
                onChange={e => setSelectedProductType(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Seleccionar tipo...</option>
                {availableProductTypes
                  .filter(pt => !plantedTypes.some(pt2 => pt2.productTypeId === pt.id))
                  .map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))
                }
              </select>
              <button className="btn btn-primary" onClick={addPlantedType} disabled={!selectedProductType}>Agregar</button>
            </div>
          </div>
        )}

        {/* Maquinaria */}
        {activeTab === 'machinery' && (
          <div className="card">
            <h3>🚜 Maquinaria</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
              Maquinaria usada en las tancadas.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {machineries.map(m => (
                <span key={m.id} className="badge badge-info" style={{ padding: '0.5rem' }}>
                  {m.name}
                  <button 
                    onClick={() => { setEditingMachinery(m); setNewMachinery(m.name); }}
                    style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteMachinery(m.id)}
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
                value={newMachinery}
                onChange={e => setNewMachinery(e.target.value)}
                placeholder={editingMachinery ? 'Editar nombre...' : 'Nueva maquinaria...'}
              />
              {editingMachinery ? (
                <>
                  <button className="btn btn-secondary" onClick={() => { setEditingMachinery(null); setNewMachinery(''); }}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleUpdateMachinery}>Guardar</button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={handleAddMachinery}>Agregar</button>
              )}
            </div>
          </div>
        )}

        {/* Operadores */}
        {activeTab === 'operators' && (
          <div className="card">
            <h3>👷 Operadores</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
              Operadores que realizan las tancadas.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {operators.map(o => (
                <span key={o.id} className="badge badge-warning" style={{ padding: '0.5rem' }}>
                  {o.name}
                  <button 
                    onClick={() => { setEditingOperator(o); setNewOperator(o.name); }}
                    style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteOperator(o.id)}
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
                value={newOperator}
                onChange={e => setNewOperator(e.target.value)}
                placeholder={editingOperator ? 'Editar nombre...' : 'Nuevo operador...'}
              />
              {editingOperator ? (
                <>
                  <button className="btn btn-secondary" onClick={() => { setEditingOperator(null); setNewOperator(''); }}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleUpdateOperator}>Guardar</button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={handleAddOperator}>Agregar</button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}