// ============================================
// Unidades y abreviaciones
// ============================================

export const BASE_UNIT_ABBR: Record<string, string> = {
  L: 'Lts',
  ML: 'ml',
  KG: 'Kgs',
  G: 'grs',
  CC: 'cc'
};

export const DOSE_UNIT_ABBR: Record<string, string> = {
  BASE_UNIT: 'unidad base',
  L: 'Lts',
  ML: 'ml',
  KG: 'Kgs',
  G: 'grs',
  CC: 'cc'
};

export const CONTAINER_UNIT_ABBR: Record<string, string> = {
  L: 'Lts',
  ML: 'ml',
  KG: 'Kgs',
  G: 'grs',
  CC: 'cc'
};

// Traducir unidad base
export const getBaseUnitAbbr = (unit: string): string => {
  return BASE_UNIT_ABBR[unit] || unit;
};

// Traducir dosis por unidad
export const getDoseUnitAbbr = (unit: string): string => {
  return DOSE_UNIT_ABBR[unit] || unit;
};

// Traducir capacidad del contenedor
export const getContainerUnitAbbr = (unit: string): string => {
  return CONTAINER_UNIT_ABBR[unit] || unit;
};

// ============================================
// Nombres completos (para selects,labels,etc)
// ============================================

export const PRODUCT_TYPE_NAMES: Record<string, string> = {
  SEMILLA: 'Semilla',
  FERTILIZANTE: 'Fertilizante',
  PESTICIDA: 'Pesticida',
  HERBICIDA: 'Herbicida',
  FUNGICIDA: 'Fungicida',
  INSECTICIDA: 'Insecticida',
  OTRO: 'Otro'
};

export const PRODUCT_STATE_NAMES: Record<string, string> = {
  LIQUIDO: 'Líquido',
  SOLIDO: 'Sólido',
  POLVO: 'Polvo',
  GRANULADO: 'Granulado',
  GEL: 'Gel'
};

export const CONTAINER_TYPE_NAMES: Record<string, string> = {
  BIDON: 'Bidón',
  SACO: 'Saco',
  BOLSA: 'Bolsa',
  TAMBOR: 'Tambor',
  TANQUE: 'Tanque',
  OTRO: 'Otro'
};

export const MOVEMENT_TYPE_NAMES: Record<string, string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida'
};