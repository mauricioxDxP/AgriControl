import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../../../db/database';
import { productsService } from '../services';
import { Product } from '../../../types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = navigator.onLine;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isOnline) {
        const data = await productsService.getAll();
        setProducts(data);
        // Guardar en IndexedDB
        await dbHelpers.clearAllData();
        for (const product of data) {
          await dbHelpers.addProduct(product);
        }
      } else {
        const localData = await dbHelpers.getAllProducts();
        setProducts(localData);
      }
    } catch (err) {
      // Si falla, intentar desde IndexedDB
      const localData = await dbHelpers.getAllProducts();
      setProducts(localData);
      if (localData.length === 0) {
        setError('No hay conexión y no hay datos locales');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = async (data: Partial<Product>) => {
    const newProduct: Product = {
      id: uuidv4(),
      name: data.name || '',
      genericName: data.genericName,
      typeId: data.typeId || '',
      stateId: data.stateId || '',
      baseUnit: data.baseUnit || 'KG',
      dosePerHectareMin: data.dosePerHectareMin,
      dosePerHectareMax: data.dosePerHectareMax,
      concentration: data.concentration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };

    if (isOnline) {
      try {
        const created = await productsService.create(newProduct);
        await dbHelpers.addProduct(created);
        setProducts(prev => [created, ...prev]);
        return created;
      } catch (err) {
        // Guardar offline
        await dbHelpers.addProduct(newProduct);
        setProducts(prev => [newProduct, ...prev]);
        return newProduct;
      }
    } else {
      await dbHelpers.addProduct(newProduct);
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const updated = { ...data, updatedAt: new Date().toISOString(), synced: false };
    
    if (isOnline) {
      try {
        const result = await productsService.update(id, updated);
        await dbHelpers.updateProduct(id, result);
        setProducts(prev => prev.map(p => p.id === id ? result : p));
        return result;
      } catch (err) {
        throw err;
        await dbHelpers.updateProduct(id, updated);
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
        return { ...products.find(p => p.id === id), ...updated };
      }
    } else {
      await dbHelpers.updateProduct(id, updated);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      return { ...products.find(p => p.id === id), ...updated };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (isOnline) {
          await productsService.delete(id);
      }
      await dbHelpers.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refresh: loadProducts };
}