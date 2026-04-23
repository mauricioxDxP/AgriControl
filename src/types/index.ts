// Tipos para AgroControl

export type ProductType = 'SEMILLA' | 'FERTILIZANTE' | 'PESTICIDA' | 'HERBICIDA' | 'FUNGICIDA' | 'INSECTICIDA' | 'OTRO';
export type ProductState = 'LIQUIDO' | 'SOLIDO' | 'POLVO' | 'GRANULADO' | 'GEL';
export type BaseUnit = 'KG' | 'G' | 'L' | 'ML' | 'CC';
export type ApplicationType = 'FUMIGACION' | 'SIEMBRA';
export type MovementType = 'ENTRADA' | 'SALIDA';
export type ContainerType = 'BIDON' | 'SACO' | 'BOLSA' | 'TAMBOR' | 'TANQUE' | 'OTRO';
export type ContainerStatus = 'DISPONIBLE' | 'EN_USO' | 'VACIO';
export type DoseType = 'PER_HECTARE' | 'CONCENTRATION';
export type DoseUnit = 'BASE_UNIT' | 'CC' | 'ML' | 'G' | 'KG' | 'L';

// Interfaces for settings
export interface ProductTypeModel {
  id: string;
  name: string;
}

export interface ProductStateModel {
  id: string;
  name: string;
}

export interface ContainerTypeModel {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  productCode?: string | null; // Código interno del producto
  genericName?: string | null; // Nombre genérico del producto (opcional)
  typeId: string;
  stateId: string;
  type?: ProductTypeModel;
  state?: ProductStateModel;
  baseUnit: BaseUnit;
  doseType?: DoseType;
  doseUnit?: DoseUnit;
  dosePerHectareMin?: number | null;
  dosePerHectareMax?: number | null;
  concentrationPerLiter?: number | null;
  concentration?: number | null;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Lot {
  id: string;
  productId: string;
  product?: Product;
  entryDate: string;
  expiryDate?: string;
  supplier?: string;
  initialStock: number;
  lotCode?: string;
  containerType?: ContainerType;
  containerCapacity?: number;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Field {
  id: string;
  name: string;
  area: number;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  productId?: string | null;
  product?: Product;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

// Configuración global: tipos de producto "plantados" (filtro para campos)
export interface PlantedProductType {
  id: string;
  productTypeId: string;
  productType?: ProductTypeModel;
  createdAt: string;
}

export interface ApplicationLot {
  id: string;
  applicationId: string;
  lotId: string;
  lot?: Lot;
  quantityUsed: number;
  createdAt: string;
  synced: boolean;
}

export interface Application {
  id: string;
  fieldId: string;
  field?: Field;
  type: ApplicationType;
  date: string;
  waterAmount?: number;
  notes?: string;
  applicationProducts?: ApplicationProduct[];
  applicationLots?: ApplicationLot[];
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

// Productos utilizados en una aplicación
export interface ApplicationProduct {
  id: string;
  applicationId: string;
  productId: string;
  product?: Product;
  dosePerHectare?: number;
  concentration?: number;
  quantityUsed: number;
  lotsUsed?: string; // JSON array of lots used: [{lotId, quantityUsed}]
  createdAt: string;
  synced: boolean;
}

export interface Movement {
  id: string;
  productId: string;
  product?: Product;
  lotId?: string;
  lot?: Lot;
  type: MovementType;
  quantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface SyncData {
  products?: Product[];
  lots?: Lot[];
  fields?: Field[];
  applications?: Application[];
  movements?: Movement[];
  applicationLots?: ApplicationLot[];
}

// Cálculos de dosificación
export interface DosageCalculation {
  fieldArea: number;
  dosePerHectare: number;
  productUsed: number;
  concentration: number;
  waterNeeded: number;
}

// UI Types
export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

// Tipos para creación
export interface CreateTancadaInput {
  date?: string;
  tankCapacity: number;
  waterAmount: number;
  notes?: string;
  products: { 
    productId: string; 
    concentration?: number; 
    quantity: number;
    lots?: { lotId: string; quantityUsed: number }[];
  }[];
  fields: { fieldId: string; hectaresTreated: number; productUsed: number }[];
}

export interface CreateApplicationInput {
  fieldId: string;
  type: ApplicationType;
  date?: string;
  waterAmount?: number;
  notes?: string;
  products?: { 
    productId: string; 
    dosePerHectare?: number; 
    concentration?: number;
    concentrationPerLiter?: number;
    quantityUsed: number;
    lots?: { lotId: string; quantityUsed: number }[];
  }[];
  lots?: { lotId: string; quantityUsed: number }[];
}

// Contenedor (bidón, saco, bolsa, tambor)
// @deprecated - Usar LotLine en su lugar
export interface Container {
  id: string;
  lotId: string;
  typeId: string;
  capacity: number;
  unit: BaseUnit;
  status: ContainerStatus;
  name?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  currentQuantity?: number; // Calculated from movements
}

// Movimiento de contenedor (histórico)
export interface ContainerMovement {
  id: string;
  containerId: string;
  type: 'INICIAL' | 'CONSUMO' | 'RECARGA' | 'AJUSTE';
  quantity: number;
  previousQuantity: number;
  notes?: string;
  createdAt: string;
  container?: Container & { lot?: Lot & { product?: Product } };
}

// Tancada (mezcla en tanque para fumigar)
export interface Tancada {
  id: string;
  date: string;
  tankCapacity: number;
  waterAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  tancadaProducts?: TancadaProduct[];
  tancadaFields?: TancadaField[];
}

// Productos en una tancada (mezcla)
export interface TancadaProduct {
  id: string;
  tancadaId: string;
  productId: string;
  product?: Product;
  concentration?: number;
  quantity: number;
  lotsUsed?: string; // JSON array of lots used: [{lotId, quantityUsed}]
  lotsData?: any[]; // Datos de lotes traidos del backend
  createdAt: string;
  synced: boolean;
}

// Campos tratados en una tancada
export interface TancadaField {
  id: string;
  tancadaId: string;
  fieldId: string;
  field?: Field;
  hectaresTreated: number;
  productUsed: number;
  createdAt: string;
  synced: boolean;
}

// Tanque fijo (para usar en tancadas)
export interface Tank {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}
