// ============================================
// Utilidades de conversión de unidades
// ============================================

export type WeightUnit = 'KG' | 'G';
export type VolumeUnit = 'L' | 'ML' | 'CC';

// Factores de conversión a base (kg para peso, L para volumen)
export const CONVERSION_FACTORS = {
  // Volumen -> Litros
  L: 1,
  ML: 0.001,  // 1 ml = 0.001 L
  CC: 0.001, // 1 cc = 0.001 L (cc = ml)
  
  // Peso -> Kilogramos
  KG: 1,
  G: 0.001   // 1 g = 0.001 kg
};

// Convertir una cantidad de una unidad a otra
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  // Misma unidad, no conversion needed
  if (fromUnit === toUnit) return value;
  
  // Intentar conversion usando factores conocidos
  const fromFactor = CONVERSION_FACTORS[fromUnit as keyof typeof CONVERSION_FACTORS];
  const toFactor = CONVERSION_FACTORS[toUnit as keyof typeof CONVERSION_FACTORS];
  
  if (fromFactor !== undefined && toFactor !== undefined) {
    // Convertir a base y luego a la unidad objetivo
    const baseValue = value * fromFactor;
    return baseValue / toFactor;
  }
  
  // No se puede convertir, devolver el valor original
  console.warn(`No se puede convertir de ${fromUnit} a ${toUnit}`);
  return value;
}

// Obtener la unidad base del producto
export function getBaseUnitType(unit: string): 'weight' | 'volume' | 'unknown' {
  const volumeUnits = ['L', 'ML', 'CC'];
  const weightUnits = ['KG', 'G'];
  
  if (volumeUnits.includes(unit)) return 'volume';
  if (weightUnits.includes(unit)) return 'weight';
  return 'unknown';
}

// Convertir dosis según la unidad del producto
// Si doseUnit es BASE_UNIT, usar la baseUnit del producto
// Sino, convertir la dosis a la unidad base del producto
export function convertDoseToBaseUnit(
  dose: number,
  doseUnit: string | undefined,
  productBaseUnit: string
): number {
  if (!doseUnit || doseUnit === 'BASE_UNIT') {
    // La dosis ya está en la unidad base
    return dose;
  }
  
  // Convertir de doseUnit a productBaseUnit
  return convertUnit(dose, doseUnit, productBaseUnit);
}