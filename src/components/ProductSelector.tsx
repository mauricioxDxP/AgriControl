import { useState, useRef, useEffect } from 'react';
import { Product } from '../../types';

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  onSelect: (productId: string) => void;
  excludedProductIds?: string[];
  placeholder?: string;
}

export default function ProductSelector({ 
  products, 
  selectedProductId, 
  onSelect, 
  excludedProductIds = [],
  placeholder = '🔍 Buscar producto...'
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Available products (not excluded and not already selected)
  const availableProducts = products.filter(p => 
    !excludedProductIds.includes(p.id) &&
    (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.productCode?.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 10);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (productId: string) => {
    onSelect(productId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Area clickeable - muestra selección o placeholder */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.5rem 0.75rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--gray-300)',
          borderRadius: 'var(--radius-sm)',
          background: selectedProductId ? 'var(--primary-light)' : 'var(--gray-50)',
          fontWeight: selectedProductId ? '500' : 'normal'
        }}
      >
        <span>
          {selectedProductId 
            ? selectedProduct?.name 
            : placeholder}
        </span>
        <span style={{ color: 'var(--gray-400)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>
      
      {/* Dropdown con buscador y lista */}
      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          zIndex: 100,
          background: 'var(--white)',
          border: '1px solid var(--gray-300)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow)',
          marginTop: '0.25rem'
        }}>
          {/* Input buscador DENTRO del dropdown */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          {/* Lista de productos */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {availableProducts.length > 0 ? (
              availableProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--gray-100)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: p.id === selectedProductId ? 'var(--gray-100)' : 'transparent'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = p.id === selectedProductId ? 'var(--gray-100)' : 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {p.baseUnit} | {p.doseType === 'CONCENTRATION' ? 'cc/L' : 'ha'}
                    </div>
                  </div>
                  {p.id === selectedProductId && (
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
              ))
            ) : searchQuery ? (
              <div style={{ padding: '1rem', color: 'var(--gray-500)', textAlign: 'center', fontSize: '0.875rem' }}>
                No hay productos para "{searchQuery}"
              </div>
            ) : (
              <div style={{ padding: '1rem', color: 'var(--gray-500)', textAlign: 'center', fontSize: '0.875rem' }}>
                No hay productos disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
