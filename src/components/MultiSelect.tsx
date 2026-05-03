// ============================================
// MultiSelect Component
// Select multiple con búsqueda
// ============================================

import { useState } from 'react';

interface Option {
  id: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({ options, selected, onChange, placeholder = 'Seleccionar...' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        className="btn btn-secondary"
        style={{ minWidth: '150px', textAlign: 'left' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span style={{ color: 'var(--gray-500)' }}>{placeholder}</span>
        ) : (
          <span>{selected.length} seleccionado{selected.length > 1 ? 's' : ''}</span>
        )}
        <span style={{ float: 'right' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            zIndex: 1000,
            background: 'var(--white)',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            minWidth: '200px',
            maxHeight: '300px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search input */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', margin: 0 }}
              autoFocus
            />
          </div>

          {/* Options list */}
          <div style={{ overflow: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                Sin opciones
              </div>
            ) : (
              filteredOptions.map(option => (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    background: selected.includes(option.id) ? 'var(--primary-light, #e0e7ff)' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                  />
                  {option.label}
                </label>
              ))
            )}
          </div>

          {/* Footer with clear */}
          {selected.length > 0 && (
            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
              <button
                type="button"
                className="btn btn-link"
                style={{ width: '100%', color: 'var(--danger)' }}
                onClick={() => onChange([])}
              >
                ✕ Limpiar selección
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}