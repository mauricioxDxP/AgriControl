import { useState, useEffect } from 'react';
import { ProductTypeModel, PlantedProductType } from '../types';
import { settingsService } from '../services';

export default function FieldSettingsPage() {
  const [productTypes, setProductTypes] = useState<ProductTypeModel[]>([]);
  const [plantedTypes, setPlantedTypes] = useState<PlantedProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [types, planted] = await Promise.all([
        settingsService.getProductTypes(),
        settingsService.getPlantedProductTypes()
      ]);
      setProductTypes(types);
      setPlantedTypes(planted);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (productTypeId: string) => {
    const existing = plantedTypes.find(p => p.productTypeId === productTypeId);
    
    setSaving(true);
    try {
      if (existing) {
        // Remove from planted
        await settingsService.deletePlantedProductType(existing.id);
        setPlantedTypes(prev => prev.filter(p => p.id !== existing.id));
      } else {
        // Add to planted
        const newPlanted = await settingsService.addPlantedProductType(productTypeId);
        setPlantedTypes(prev => [...prev, newPlanted]);
      }
    } catch (err: any) {
      console.error('Error toggling planted type:', err);
      alert(err?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const isPlanted = (productTypeId: string) => {
    return plantedTypes.some(p => p.productTypeId === productTypeId);
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
      <div className="flex flex-between mb-2">
        <div>
          <h2>Tipos Plantados</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
            Seleccioná los tipos de producto que están plantados. Esto filtra los productos disponibles al asignar un producto a un campo.
          </p>
        </div>
      </div>

      {productTypes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🌱</div>
            <h3>No hay tipos de producto</h3>
            <p>Creá tipos de producto primero en Configuración → Productos</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {productTypes.map(pt => {
              const planted = isPlanted(pt.id);
              return (
                <label
                  key={pt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${planted ? 'var(--primary)' : 'var(--gray-200)'}`,
                    background: planted ? 'var(--primary-light)' : 'transparent',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={planted}
                    onChange={() => handleToggle(pt.id)}
                    disabled={saving}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--primary)',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  />
                  <span style={{ fontWeight: planted ? '600' : '400', fontSize: '1rem' }}>
                    {pt.name}
                  </span>
                  {planted && (
                    <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
                      Plantado
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'var(--info-light)', 
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem'
          }}>
            ℹ️ <strong>¿Qué hace esto?</strong> Los tipos marcados como "Plantados" se usan para filtrar 
            los productos disponibles al asignar un producto a un campo. Si no hay tipos marcados, 
            se muestran todos los productos.
          </div>
        </div>
      )}
    </div>
  );
}
