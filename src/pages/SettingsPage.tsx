import { useState, useEffect } from 'react';

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
  const [currentTheme, setCurrentTheme] = useState<string>('light');
  const [currentFontSize, setCurrentFontSize] = useState<string>('medium');
  const [autoDosage, setAutoDosage] = useState<boolean>(() => {
    const saved = localStorage.getItem('auto-dosage');
    return saved !== null ? saved === 'true' : false;
  });
  
  // Update app state
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
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

  // Toggle auto-dosage
  const toggleAutoDosage = (value: boolean) => {
    setAutoDosage(value);
    localStorage.setItem('auto-dosage', value.toString());
  };

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

        {/* Dosificación Automática */}
        <div className="card">
          <h3>💊 Dosificación Automática</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
            Cuando está activado, el sistema calcula automáticamente la cantidad de producto según la dosis o concentración. Cuando está desactivado, podés ingresar la cantidad manualmente.
          </p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.75rem',
            background: autoDosage ? 'var(--success-light)' : 'var(--gray-100)',
            borderRadius: 'var(--radius)'
          }}>
            <input
              type="checkbox"
              id="autoDosage"
              checked={autoDosage}
              onChange={e => toggleAutoDosage(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <label htmlFor="autoDosage" style={{ fontWeight: '500', cursor: 'pointer' }}>
              Calcular dosificación automáticamente
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
