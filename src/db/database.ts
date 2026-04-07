import Dexie, { Table } from 'dexie';
import { Product, Lot, Field, Application, Movement, ApplicationLot, Container, Tancada, TancadaField, Tank, LotLine } from '../types';

export class AgroControlDB extends Dexie {
  products!: Table<Product>;
  lots!: Table<Lot>;
  fields!: Table<Field>;
  applications!: Table<Application>;
  movements!: Table<Movement>;
  applicationLots!: Table<ApplicationLot>;
  containers!: Table<Container>;
  lotLines!: Table<LotLine>;
  tancadas!: Table<Tancada>;
  tancadaFields!: Table<TancadaField>;
  tanks!: Table<Tank>;

  constructor() {
    super('AgroControlDB');
    
    this.version(7).stores({
      products: 'id, name, type, synced, updatedAt',
      lots: 'id, productId, synced, updatedAt',
      fields: 'id, name, synced, updatedAt',
      applications: 'id, fieldId, type, synced, updatedAt',
      movements: 'id, productId, lotId, type, synced, updatedAt',
      applicationLots: 'id, applicationId, lotId, synced',
      containers: 'id, lotId, type, status, synced, updatedAt',
      lotLines: 'id, lotId, productId, type, synced, updatedAt',
      tancadas: 'id, productId, date, synced, updatedAt',
      tancadaFields: 'id, tancadaId, fieldId, synced',
      tanks: 'id, name, synced, updatedAt'
    }).upgrade(async (tx) => {
      // Remove productTypeId from fields (moved to global PlantedProductType config)
      await tx.table('fields').toCollection().modify((field: any) => {
        delete field.productTypeId;
        delete field.productType;
      });
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

  // Campos
  async getAllFields(): Promise<Field[]> {
    return await db.fields.toArray();
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

  // Movimientos
  async getAllMovements(): Promise<Movement[]> {
    return await db.movements.toArray();
  },
  
  async getMovementsByProduct(productId: string): Promise<Movement[]> {
    return await db.movements.where('productId').equals(productId).toArray();
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

  // Líneas de lote
  async getAllLotLines(): Promise<LotLine[]> {
    return await db.lotLines.toArray();
  },

  async getLotLinesByLot(lotId: string): Promise<LotLine[]> {
    return await db.lotLines.where('lotId').equals(lotId).toArray();
  },

  async addLotLine(lotLine: LotLine): Promise<string> {
    // Verificar que tiene id válido
    if (!lotLine.id) {
      console.error('LotLine sin id:', lotLine);
      throw new Error('LotLine debe tener un id');
    }
    return await db.lotLines.put(lotLine);
  },

  async updateLotLine(id: string, changes: Partial<LotLine>): Promise<number> {
    return await db.lotLines.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteLotLine(id: string): Promise<void> {
    await db.lotLines.delete(id);
  },

  // Utilidades
  async getUnsyncedData() {
    const [products, lots, fields, applications, movements, applicationLots, containers, lotLines, tancadas, tancadaFields] = await Promise.all([
      db.products.where('synced').equals(0).toArray(),
      db.lots.where('synced').equals(0).toArray(),
      db.fields.where('synced').equals(0).toArray(),
      db.applications.where('synced').equals(0).toArray(),
      db.movements.where('synced').equals(0).toArray(),
      db.applicationLots.where('synced').equals(0).toArray(),
      db.containers.where('synced').equals(0).toArray(),
      db.lotLines.where('synced').equals(0).toArray(),
      db.tancadas.where('synced').equals(0).toArray(),
      db.tancadaFields.where('synced').equals(0).toArray()
    ]);
    
    return { products, lots, fields, applications, movements, applicationLots, containers, lotLines, tancadas, tancadaFields };
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
      db.lotLines.clear(),
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
  }
};
