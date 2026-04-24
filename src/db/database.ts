import Dexie, { Table } from 'dexie';
import { Product, Lot, Field, Application, Movement, ApplicationLot, Container, Tancada, TancadaField, Tank, Terrain, Planting } from '../types';

// Use any for tables with circular references
type AnyTable = Table<any>;

export class AgroControlDB extends Dexie {
  products!: Table<Product>;
  lots!: Table<Lot>;
  fields!: AnyTable;
  applications!: Table<Application>;
  movements!: Table<Movement>;
  applicationLots!: Table<ApplicationLot>;
  containers!: Table<Container>;
  tancadas!: Table<Tancada>;
  tancadaFields!: Table<TancadaField>;
  tanks!: Table<Tank>;
  terrains!: AnyTable;
  plantings!: AnyTable;

  constructor() {
    super('AgroControlDB');
    
    this.version(9).stores({
      products: 'id, name, type, synced, updatedAt',
      lots: 'id, productId, synced, updatedAt',
      fields: 'id, name, synced, updatedAt',
      applications: 'id, fieldId, type, synced, updatedAt',
      movements: 'id, productId, lotId, type, synced, updatedAt',
      applicationLots: 'id, applicationId, lotId, synced',
      containers: 'id, lotId, type, status, synced, updatedAt',
      tancadas: 'id, productId, date, synced, updatedAt',
      tancadaFields: 'id, tancadaId, fieldId, synced',
      tanks: 'id, name, synced, updatedAt',
      terrains: 'id, name, synced, updatedAt',
      plantings: 'id, fieldId, productId, startDate, synced, updatedAt'
    });
  }
}

export const db = new AgroControlDB();
(window as any).db = db;
// Funciones helper para IndexedDB
export const dbHelpers = {
  // Productos
  async getAllProducts(): Promise<Product[]> {
    return await db.products.toArray();
  },
  
  async getProduct(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  },
  
  async addProduct(product: Product): Promise<string> {
    return await db.products.put(product);
  },
  
  async updateProduct(id: string, changes: Partial<Product>): Promise<number> {
    return await db.products.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },
  
  async deleteProduct(id: string): Promise<void> {
    try {
      // First delete related lots
      await db.lots.where('productId').equals(id).delete();
      // Then delete the product
      await db.products.delete(id);
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  },

  // Lotes
  async getAllLots(): Promise<Lot[]> {
    return await db.lots.toArray();
  },
  
  async getLotsByProduct(productId: string): Promise<Lot[]> {
    return await db.lots.where('productId').equals(productId).toArray();
  },
  
  async addLot(lot: Lot): Promise<string> {
    return await db.lots.put(lot);
  },
  
  async updateLot(id: string, changes: Partial<Lot>): Promise<number> {
    return await db.lots.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },
  
  async deleteLot(id: string): Promise<void> {
    await db.lots.delete(id);
  },

  // Aplicaciones
  async getAllApplications(): Promise<Application[]> {
    return await db.applications.toArray();
  },
  
  async getApplicationsByField(fieldId: string): Promise<Application[]> {
    return await db.applications.where('fieldId').equals(fieldId).toArray();
  },
  
  async addApplication(application: Application): Promise<string> {
    return await db.applications.put(application);
  },
  
  async updateApplication(id: string, changes: Partial<Application>): Promise<number> {
    return await db.applications.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },
  
  async deleteApplication(id: string): Promise<void> {
    await db.applications.delete(id);
  },

  // Fields
  async getAllFields(): Promise<Field[]> {
    return await db.fields.toArray();
  },

  async getField(id: string): Promise<Field | undefined> {
    return await db.fields.get(id);
  },

  async getFieldsByTerrain(terrainId: string): Promise<Field[]> {
    return await db.fields.where('terrainId').equals(terrainId).toArray();
  },

  async addField(field: Field): Promise<string> {
    return await db.fields.put(field);
  },

  async updateField(id: string, changes: Partial<Field>): Promise<number> {
    return await db.fields.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteField(id: string): Promise<void> {
    await db.fields.delete(id);
  },

  async clearFields(): Promise<void> {
    await db.fields.clear();
  },

  // Movimientos
  async getAllMovements(): Promise<Movement[]> {
    return await db.movements.toArray();
  },
  
  async getMovementsByProduct(productId: string): Promise<Movement[]> {
    return await db.movements.where('productId').equals(productId).toArray();
  },
  
  async getMovementsByLot(lotId: string): Promise<Movement[]> {
    return await db.movements.where('lotId').equals(lotId).toArray();
  },
  
  async addMovement(movement: Movement): Promise<string> {
    return await db.movements.put(movement);
  },
  
  async deleteMovement(id: string): Promise<void> {
    await db.movements.delete(id);
  },

  // ApplicationLots
  async getApplicationLotsByApplication(applicationId: string): Promise<ApplicationLot[]> {
    return await db.applicationLots.where('applicationId').equals(applicationId).toArray();
  },
  
  async addApplicationLot(applicationLot: ApplicationLot): Promise<string> {
    return await db.applicationLots.put(applicationLot);
  },

  // Contenedores
  async getAllContainers(): Promise<Container[]> {
    return await db.containers.toArray();
  },

  async getContainersByLot(lotId: string): Promise<Container[]> {
    return await db.containers.where('lotId').equals(lotId).toArray();
  },

  async addContainer(container: Container): Promise<string> {
    return await db.containers.put(container);
  },

  async updateContainer(id: string, changes: Partial<Container>): Promise<number> {
    return await db.containers.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteContainer(id: string): Promise<void> {
    await db.containers.delete(id);
  },

  // Utilidades
  async getUnsyncedData() {
    const [products, lots, fields, applications, movements, applicationLots, containers, tancadas, tancadaFields] = await Promise.all([
      db.products.where('synced').equals(0).toArray(),
      db.lots.where('synced').equals(0).toArray(),
      db.fields.where('synced').equals(0).toArray(),
      db.applications.where('synced').equals(0).toArray(),
      db.movements.where('synced').equals(0).toArray(),
      db.applicationLots.where('synced').equals(0).toArray(),
      db.containers.where('synced').equals(0).toArray(),
      db.tancadas.where('synced').equals(0).toArray(),
      db.tancadaFields.where('synced').equals(0).toArray()
    ]);
    
    return { products, lots, fields, applications, movements, applicationLots, containers, tancadas, tancadaFields };
  },

  async clearAllData() {
    await Promise.all([
      db.products.clear(),
      db.lots.clear(),
      db.fields.clear(),
      db.applications.clear(),
      db.movements.clear(),
      db.applicationLots.clear(),
      db.containers.clear(),
      db.tancadas.clear(),
      db.tancadaFields.clear()
    ]);
  },

  // Tancadas
  async getAllTancadas(): Promise<Tancada[]> {
    return await db.tancadas.toArray();
  },

  async addTancada(tancada: Tancada): Promise<string> {
    return await db.tancadas.put(tancada);
  },

  async updateTancada(id: string, changes: Partial<Tancada>): Promise<number> {
    return await db.tancadas.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteTancada(id: string): Promise<void> {
    await db.tancadas.delete(id);
    await db.tancadaFields.where('tancadaId').equals(id).delete();
  },

  // TancadaFields
  async getTancadaFieldsByTancada(tancadaId: string): Promise<TancadaField[]> {
    return await db.tancadaFields.where('tancadaId').equals(tancadaId).toArray();
  },

  async addTancadaField(tancadaField: TancadaField): Promise<string> {
    return await db.tancadaFields.put(tancadaField);
  },

  // Tanques
  async getAllTanks(): Promise<Tank[]> {
    return await db.tanks.toArray();
  },

  async addTank(tank: Tank): Promise<string> {
    return await db.tanks.put(tank);
  },

  async updateTank(id: string, changes: Partial<Tank>): Promise<number> {
    return await db.tanks.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteTank(id: string): Promise<void> {
    await db.tanks.delete(id);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Terrain helpers
  // ═══════════════════════════════════════════════════════════════════════════

  async getAllTerrains(): Promise<Terrain[]> {
    return await db.terrains.toArray();
  },

  async getTerrain(id: string): Promise<Terrain | undefined> {
    return await db.terrains.get(id);
  },

  async addTerrain(terrain: Terrain): Promise<string> {
    return await db.terrains.put(terrain);
  },

  async updateTerrain(id: string, changes: Partial<Terrain>): Promise<number> {
    return await db.terrains.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteTerrain(id: string): Promise<void> {
    await db.terrains.delete(id);
  },

  async clearTerrains(): Promise<void> {
    await db.terrains.clear();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Planting helpers
  // ═══════════════════════════════════════════════════════════════════════════

  async getAllPlantings(): Promise<Planting[]> {
    return await db.plantings.toArray();
  },

  async getPlanting(id: string): Promise<Planting | undefined> {
    return await db.plantings.get(id);
  },

  async getPlantingsByField(fieldId: string): Promise<Planting[]> {
    return await db.plantings.where('fieldId').equals(fieldId).toArray();
  },

  async addPlanting(planting: Planting): Promise<string> {
    return await db.plantings.put(planting);
  },

  async updatePlanting(id: string, changes: Partial<Planting>): Promise<number> {
    return await db.plantings.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deletePlanting(id: string): Promise<void> {
    await db.plantings.delete(id);
  },

  async clearPlantings(): Promise<void> {
    await db.plantings.clear();
  }
};
