// Re-export all services from features
export { productsService } from '../features/products/services';
export { lotsService } from '../features/lots/services';
export { fieldsService } from '../features/fields/services';
export { applicationsService } from '../features/applications/services';
export { movementsService } from '../features/movements/services';
export { tancadasService } from '../features/tancadas/services';
export { tanksService } from '../features/tanks/services';
export { syncService } from '../features/sync/services';
export { settingsService } from '../features/settings/services';
export { terrainsService } from '../features/terrains/services';
export { plantingsService } from '../features/plantings/services';
export { inventoryCountService } from '../features/inventory-count/services';

// Export request helper
export { request, API_BASE } from '../shared/services/request';
