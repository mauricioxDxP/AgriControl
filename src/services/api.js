"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsApi = exports.healthApi = exports.syncApi = exports.tanksApi = exports.tancadasApi = exports.containersApi = exports.movementsApi = exports.applicationsApi = exports.fieldsApi = exports.lotsApi = exports.productsApi = void 0;
// Use environment variable or detect from current location for mobile access
var getApiBase = function () {
    // If explicitly set, use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Otherwise, construct from current window location for mobile
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Running on mobile/remote device, use current host
        return "".concat(window.location.protocol, "//").concat(window.location.host, "/api");
    }
    // Default to relative path for local development
    return '/api';
};
var API_BASE = getApiBase();
// Debug log in development
if (import.meta.env.DEV) {
    console.log('API Base URL:', API_BASE);
}
// Helper para hacer requests
function request(endpoint, options) {
    return __awaiter(this, void 0, void 0, function () {
        var url, response, errorText, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "".concat(API_BASE).concat(endpoint);
                    if (import.meta.env.DEV) {
                        console.log("API Request: ".concat((options === null || options === void 0 ? void 0 : options.method) || 'GET', " ").concat(url));
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { headers: __assign({ 'Content-Type': 'application/json' }, options === null || options === void 0 ? void 0 : options.headers) }))];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    errorText = _a.sent();
                    throw new Error("API Error ".concat(response.status, ": ").concat(response.statusText, " - ").concat(errorText));
                case 4: return [2 /*return*/, response.json()];
                case 5:
                    error_1 = _a.sent();
                    if (error_1 instanceof TypeError && error_1.message === 'Failed to fetch') {
                        throw new Error("No se pudo conectar al servidor. Verifica que el backend est\u00E9 corriendo en ".concat(API_BASE));
                    }
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
// API de Productos
exports.productsApi = {
    getAll: function () { return request('/products'); },
    getById: function (id) { return request("/products/".concat(id)); },
    create: function (data) { return request('/products', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    update: function (id, data) { return request("/products/".concat(id), {
        method: 'PUT',
        body: JSON.stringify(data)
    }); },
    delete: function (id) { return request("/products/".concat(id), { method: 'DELETE' }); }
};
// API de Lotes
exports.lotsApi = {
    getAll: function () { return request('/lots'); },
    getById: function (id) { return request("/lots/".concat(id)); },
    getByProduct: function (productId) { return request("/lots/product/".concat(productId)); },
    create: function (data) { return request('/lots', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    update: function (id, data) { return request("/lots/".concat(id), {
        method: 'PUT',
        body: JSON.stringify(data)
    }); },
    delete: function (id) { return request("/lots/".concat(id), { method: 'DELETE' }); }
};
// API de Campos
exports.fieldsApi = {
    getAll: function () { return request('/fields'); },
    getById: function (id) { return request("/fields/".concat(id)); },
    create: function (data) { return request('/fields', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    update: function (id, data) { return request("/fields/".concat(id), {
        method: 'PUT',
        body: JSON.stringify(data)
    }); },
    delete: function (id) { return request("/fields/".concat(id), { method: 'DELETE' }); }
};
// API de Aplicaciones
exports.applicationsApi = {
    getAll: function () { return request('/applications'); },
    getById: function (id) { return request("/applications/".concat(id)); },
    getByField: function (fieldId) { return request("/applications/field/".concat(fieldId)); },
    create: function (data) { return request('/applications', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    update: function (id, data) { return request("/applications/".concat(id), {
        method: 'PUT',
        body: JSON.stringify(data)
    }); },
    delete: function (id) { return request("/applications/".concat(id), { method: 'DELETE' }); }
};
// API de Movimientos
exports.movementsApi = {
    getAll: function () { return request('/movements'); },
    getByProduct: function (productId) { return request("/movements/product/".concat(productId)); },
    getByLot: function (lotId) { return request("/movements/lot/".concat(lotId)); },
    getStock: function (productId) { return request("/movements/stock/".concat(productId)); },
    getLotStock: function (lotId) { return request("/movements/stock/lot/".concat(lotId)); },
    create: function (data) { return request('/movements', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    delete: function (id) { return request("/movements/".concat(id), { method: 'DELETE' }); }
};
// API de Contenedores
exports.containersApi = {
    getAll: function () { return request('/containers'); },
    getById: function (id) { return request("/containers/".concat(id)); },
    getByLot: function (lotId) { return request("/containers/lot/".concat(lotId)); },
    create: function (data) { return request('/containers', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    update: function (id, data) { return request("/containers/".concat(id), {
        method: 'PUT',
        body: JSON.stringify(data)
    }); },
    consume: function (id, quantity) { return request("/containers/".concat(id, "/consume"), {
        method: 'PUT',
        body: JSON.stringify({ quantity: quantity })
    }); },
    delete: function (id) { return request("/containers/".concat(id), { method: 'DELETE' }); },
    getMovements: function (containerId) { return request("/containers/".concat(containerId, "/movements")); },
    getAllMovements: function () { return request('/containers/movements/all'); }
};
// API de Tancadas
exports.tancadasApi = {
    getAll: function () { return request('/tancadas'); },
    getById: function (id) { return request("/tancadas/".concat(id)); },
    create: function (data) { return request('/tancadas', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    update: function (id, data) { return request("/tancadas/".concat(id), {
        method: 'PUT',
        body: JSON.stringify(data)
    }); },
    delete: function (id) { return request("/tancadas/".concat(id), { method: 'DELETE' }); }
};
// API de Tanques
exports.tanksApi = {
    getAll: function () { return request('/tanks'); },
    getById: function (id) { return request("/tanks/".concat(id)); },
    create: function (data) { return request('/tanks', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    update: function (id, data) { return request("/tanks/".concat(id), {
        method: 'PUT',
        body: JSON.stringify(data)
    }); },
    delete: function (id) { return request("/tanks/".concat(id), { method: 'DELETE' }); }
};
// API de Sincronización
exports.syncApi = {
    sync: function (data) { return request('/sync', {
        method: 'POST',
        body: JSON.stringify(data)
    }); },
    getUnsynced: function () { return request('/sync'); }
};
// Health check
exports.healthApi = {
    check: function () { return request('/health'); }
};
// Settings API
exports.settingsApi = {
    // Product Types
    getProductTypes: function () { return request('/settings/product-types'); },
    createProductType: function (name) { return request('/settings/product-types', {
        method: 'POST',
        body: JSON.stringify({ name: name })
    }); },
    deleteProductType: function (id) { return request("/settings/product-types/".concat(id), { method: 'DELETE' }); },
    // Product States
    getProductStates: function () { return request('/settings/product-states'); },
    createProductState: function (name) { return request('/settings/product-states', {
        method: 'POST',
        body: JSON.stringify({ name: name })
    }); },
    deleteProductState: function (id) { return request("/settings/product-states/".concat(id), { method: 'DELETE' }); },
    // Container Types
    getContainerTypes: function () { return request('/settings/container-types'); },
    createContainerType: function (name) { return request('/settings/container-types', {
        method: 'POST',
        body: JSON.stringify({ name: name })
    }); },
    deleteContainerType: function (id) { return request("/settings/container-types/".concat(id), { method: 'DELETE' }); },
};
