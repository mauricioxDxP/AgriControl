import { useState, useEffect } from 'react';
import { settingsService } from '../services';
import { PlantedProductType } from '../../../types';

export function usePlantedProductTypes() {
  const [plantedTypes, setPlantedTypes] = useState<PlantedProductType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlantedTypes = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getPlantedProductTypes();
      setPlantedTypes(data);
    } catch (err) {
      console.error('Error loading planted types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlantedTypes();
  }, []);

  const addPlantedType = async (productTypeId: string) => {
    const newPlanted = await settingsService.addPlantedProductType(productTypeId);
    setPlantedTypes(prev => [...prev, newPlanted]);
    return newPlanted;
  };

  const removePlantedType = async (id: string) => {
    await settingsService.deletePlantedProductType(id);
    setPlantedTypes(prev => prev.filter(p => p.id !== id));
  };

  const isPlanted = (productTypeId: string) => {
    return plantedTypes.some(p => p.productTypeId === productTypeId);
  };

  return { plantedTypes, loading, addPlantedType, removePlantedType, isPlanted, refresh: loadPlantedTypes };
}
