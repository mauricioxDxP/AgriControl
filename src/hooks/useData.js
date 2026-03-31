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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOnlineStatus = useOnlineStatus;
exports.useProducts = useProducts;
exports.useLots = useLots;
exports.useFields = useFields;
exports.useApplications = useApplications;
exports.useSync = useSync;
exports.useDosageCalculation = useDosageCalculation;
exports.useContainers = useContainers;
exports.useMovements = useMovements;
exports.useTancadas = useTancadas;
exports.useTanks = useTanks;
var react_1 = require("react");
var uuid_1 = require("uuid");
var database_1 = require("../db/database");
var api_1 = require("../services/api");
// Hook para detectar estado online/offline
function useOnlineStatus() {
    var _a = (0, react_1.useState)(navigator.onLine), isOnline = _a[0], setIsOnline = _a[1];
    (0, react_1.useEffect)(function () {
        var handleOnline = function () { return setIsOnline(true); };
        var handleOffline = function () { return setIsOnline(false); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return function () {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return isOnline;
}
// Hook para productos
function useProducts() {
    var _this = this;
    var _a = (0, react_1.useState)([]), products = _a[0], setProducts = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var isOnline = useOnlineStatus();
    var loadProducts = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, _i, data_1, product, localData, err_1, localData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 11, 13, 14]);
                    if (!isOnline) return [3 /*break*/, 8];
                    return [4 /*yield*/, api_1.productsApi.getAll()];
                case 2:
                    data = _a.sent();
                    setProducts(data);
                    // Guardar en IndexedDB
                    return [4 /*yield*/, database_1.dbHelpers.clearAllData()];
                case 3:
                    // Guardar en IndexedDB
                    _a.sent();
                    _i = 0, data_1 = data;
                    _a.label = 4;
                case 4:
                    if (!(_i < data_1.length)) return [3 /*break*/, 7];
                    product = data_1[_i];
                    return [4 /*yield*/, database_1.dbHelpers.addProduct(product)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, database_1.dbHelpers.getAllProducts()];
                case 9:
                    localData = _a.sent();
                    setProducts(localData);
                    _a.label = 10;
                case 10: return [3 /*break*/, 14];
                case 11:
                    err_1 = _a.sent();
                    return [4 /*yield*/, database_1.dbHelpers.getAllProducts()];
                case 12:
                    localData = _a.sent();
                    setProducts(localData);
                    if (localData.length === 0) {
                        setError('No hay conexión y no hay datos locales');
                    }
                    return [3 /*break*/, 14];
                case 13:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    }); }, [isOnline]);
    (0, react_1.useEffect)(function () {
        loadProducts();
    }, [loadProducts]);
    var addProduct = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newProduct, created_1, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newProduct = {
                        id: (0, uuid_1.v4)(),
                        name: data.name || '',
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
                    if (!isOnline) return [3 /*break*/, 7];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.productsApi.create(newProduct)];
                case 2:
                    created_1 = _a.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addProduct(created_1)];
                case 3:
                    _a.sent();
                    setProducts(function (prev) { return __spreadArray([created_1], prev, true); });
                    return [2 /*return*/, created_1];
                case 4:
                    err_2 = _a.sent();
                    // Guardar offline
                    return [4 /*yield*/, database_1.dbHelpers.addProduct(newProduct)];
                case 5:
                    // Guardar offline
                    _a.sent();
                    setProducts(function (prev) { return __spreadArray([newProduct], prev, true); });
                    return [2 /*return*/, newProduct];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.addProduct(newProduct)];
                case 8:
                    _a.sent();
                    setProducts(function (prev) { return __spreadArray([newProduct], prev, true); });
                    return [2 /*return*/, newProduct];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var updateProduct = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updated, result_1, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updated = __assign(__assign({}, data), { updatedAt: new Date().toISOString(), synced: false });
                    if (!isOnline) return [3 /*break*/, 7];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.productsApi.update(id, updated)];
                case 2:
                    result_1 = _a.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateProduct(id, result_1)];
                case 3:
                    _a.sent();
                    setProducts(function (prev) { return prev.map(function (p) { return p.id === id ? result_1 : p; }); });
                    return [2 /*return*/, result_1];
                case 4:
                    err_3 = _a.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateProduct(id, updated)];
                case 5:
                    _a.sent();
                    setProducts(function (prev) { return prev.map(function (p) { return p.id === id ? __assign(__assign({}, p), updated) : p; }); });
                    return [2 /*return*/, __assign(__assign({}, products.find(function (p) { return p.id === id; })), updated)];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.updateProduct(id, updated)];
                case 8:
                    _a.sent();
                    setProducts(function (prev) { return prev.map(function (p) { return p.id === id ? __assign(__assign({}, p), updated) : p; }); });
                    return [2 /*return*/, __assign(__assign({}, products.find(function (p) { return p.id === id; })), updated)];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var deleteProduct = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isOnline) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.productsApi.delete(id)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, database_1.dbHelpers.deleteProduct(id)];
                case 5:
                    _a.sent();
                    setProducts(function (prev) { return prev.filter(function (p) { return p.id !== id; }); });
                    return [2 /*return*/];
            }
        });
    }); };
    return { products: products, loading: loading, error: error, addProduct: addProduct, updateProduct: updateProduct, deleteProduct: deleteProduct, refresh: loadProducts };
}
// Hook para lotes
function useLots(productId) {
    var _this = this;
    var _a = (0, react_1.useState)([]), lots = _a[0], setLots = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var isOnline = useOnlineStatus();
    var loadLots = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, _a, localData, _b, _c, localData, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    setLoading(true);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 12, 17, 18]);
                    if (!isOnline) return [3 /*break*/, 6];
                    if (!productId) return [3 /*break*/, 3];
                    return [4 /*yield*/, api_1.lotsApi.getByProduct(productId)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, api_1.lotsApi.getAll()];
                case 4:
                    _a = _e.sent();
                    _e.label = 5;
                case 5:
                    data = _a;
                    setLots(data);
                    return [3 /*break*/, 11];
                case 6:
                    if (!productId) return [3 /*break*/, 8];
                    return [4 /*yield*/, database_1.dbHelpers.getLotsByProduct(productId)];
                case 7:
                    _b = _e.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, database_1.dbHelpers.getAllLots()];
                case 9:
                    _b = _e.sent();
                    _e.label = 10;
                case 10:
                    localData = _b;
                    setLots(localData);
                    _e.label = 11;
                case 11: return [3 /*break*/, 18];
                case 12:
                    _c = _e.sent();
                    if (!productId) return [3 /*break*/, 14];
                    return [4 /*yield*/, database_1.dbHelpers.getLotsByProduct(productId)];
                case 13:
                    _d = _e.sent();
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, database_1.dbHelpers.getAllLots()];
                case 15:
                    _d = _e.sent();
                    _e.label = 16;
                case 16:
                    localData = _d;
                    setLots(localData);
                    return [3 /*break*/, 18];
                case 17:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 18: return [2 /*return*/];
            }
        });
    }); }, [isOnline, productId]);
    (0, react_1.useEffect)(function () {
        loadLots();
    }, [loadLots]);
    var addLot = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newLot, created_2, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    newLot = {
                        id: (0, uuid_1.v4)(),
                        productId: data.productId || '',
                        entryDate: data.entryDate || new Date().toISOString(),
                        expiryDate: data.expiryDate,
                        supplier: data.supplier,
                        lotCode: data.lotCode,
                        initialStock: data.initialStock || 0,
                        containerType: data.containerType,
                        containerCapacity: data.containerCapacity,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false
                    };
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.lotsApi.create(newLot)];
                case 2:
                    created_2 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addLot(created_2)];
                case 3:
                    _b.sent();
                    setLots(function (prev) { return __spreadArray([created_2], prev, true); });
                    return [2 /*return*/, created_2];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addLot(newLot)];
                case 5:
                    _b.sent();
                    setLots(function (prev) { return __spreadArray([newLot], prev, true); });
                    return [2 /*return*/, newLot];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.addLot(newLot)];
                case 8:
                    _b.sent();
                    setLots(function (prev) { return __spreadArray([newLot], prev, true); });
                    return [2 /*return*/, newLot];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var updateLot = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updated, result_2, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    updated = __assign(__assign({}, data), { updatedAt: new Date().toISOString(), synced: false });
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.lotsApi.update(id, updated)];
                case 2:
                    result_2 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateLot(id, result_2)];
                case 3:
                    _b.sent();
                    setLots(function (prev) { return prev.map(function (l) { return l.id === id ? result_2 : l; }); });
                    return [2 /*return*/, result_2];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateLot(id, updated)];
                case 5:
                    _b.sent();
                    setLots(function (prev) { return prev.map(function (l) { return l.id === id ? __assign(__assign({}, l), updated) : l; }); });
                    return [2 /*return*/, __assign(__assign({}, lots.find(function (l) { return l.id === id; })), updated)];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.updateLot(id, updated)];
                case 8:
                    _b.sent();
                    setLots(function (prev) { return prev.map(function (l) { return l.id === id ? __assign(__assign({}, l), updated) : l; }); });
                    return [2 /*return*/, __assign(__assign({}, lots.find(function (l) { return l.id === id; })), updated)];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var deleteLot = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isOnline) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.lotsApi.delete(id)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, database_1.dbHelpers.deleteLot(id)];
                case 5:
                    _b.sent();
                    setLots(function (prev) { return prev.filter(function (l) { return l.id !== id; }); });
                    return [2 /*return*/];
            }
        });
    }); };
    return { lots: lots, loading: loading, addLot: addLot, updateLot: updateLot, deleteLot: deleteLot, refresh: loadLots };
}
// Hook para campos
function useFields() {
    var _this = this;
    var _a = (0, react_1.useState)([]), fields = _a[0], setFields = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var isOnline = useOnlineStatus();
    var loadFields = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setLoading(true);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, 8, 9]);
                    if (!isOnline) return [3 /*break*/, 3];
                    return [4 /*yield*/, api_1.fieldsApi.getAll()];
                case 2:
                    data = _d.sent();
                    setFields(data);
                    return [3 /*break*/, 5];
                case 3:
                    _a = setFields;
                    return [4 /*yield*/, database_1.dbHelpers.getAllFields()];
                case 4:
                    _a.apply(void 0, [_d.sent()]);
                    _d.label = 5;
                case 5: return [3 /*break*/, 9];
                case 6:
                    _b = _d.sent();
                    _c = setFields;
                    return [4 /*yield*/, database_1.dbHelpers.getAllFields()];
                case 7:
                    _c.apply(void 0, [_d.sent()]);
                    return [3 /*break*/, 9];
                case 8:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); }, [isOnline]);
    (0, react_1.useEffect)(function () {
        loadFields();
    }, [loadFields]);
    var addField = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newField, created_3, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    newField = {
                        id: (0, uuid_1.v4)(),
                        name: data.name || '',
                        area: data.area || 0,
                        location: data.location,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false
                    };
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.fieldsApi.create(newField)];
                case 2:
                    created_3 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addField(created_3)];
                case 3:
                    _b.sent();
                    setFields(function (prev) { return __spreadArray([created_3], prev, true); });
                    return [2 /*return*/, created_3];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addField(newField)];
                case 5:
                    _b.sent();
                    setFields(function (prev) { return __spreadArray([newField], prev, true); });
                    return [2 /*return*/, newField];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.addField(newField)];
                case 8:
                    _b.sent();
                    setFields(function (prev) { return __spreadArray([newField], prev, true); });
                    return [2 /*return*/, newField];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var updateField = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updated, result_3, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    updated = __assign(__assign({}, data), { updatedAt: new Date().toISOString(), synced: false });
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.fieldsApi.update(id, updated)];
                case 2:
                    result_3 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateField(id, result_3)];
                case 3:
                    _b.sent();
                    setFields(function (prev) { return prev.map(function (f) { return f.id === id ? result_3 : f; }); });
                    return [2 /*return*/, result_3];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateField(id, updated)];
                case 5:
                    _b.sent();
                    setFields(function (prev) { return prev.map(function (f) { return f.id === id ? __assign(__assign({}, f), updated) : f; }); });
                    return [2 /*return*/, __assign(__assign({}, fields.find(function (f) { return f.id === id; })), updated)];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.updateField(id, updated)];
                case 8:
                    _b.sent();
                    setFields(function (prev) { return prev.map(function (f) { return f.id === id ? __assign(__assign({}, f), updated) : f; }); });
                    return [2 /*return*/, __assign(__assign({}, fields.find(function (f) { return f.id === id; })), updated)];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var deleteField = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isOnline) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.fieldsApi.delete(id)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, database_1.dbHelpers.deleteField(id)];
                case 5:
                    _b.sent();
                    setFields(function (prev) { return prev.filter(function (f) { return f.id !== id; }); });
                    return [2 /*return*/];
            }
        });
    }); };
    return { fields: fields, loading: loading, addField: addField, updateField: updateField, deleteField: deleteField, refresh: loadFields };
}
// Hook para aplicaciones
function useApplications(fieldId) {
    var _this = this;
    var _a = (0, react_1.useState)([]), applications = _a[0], setApplications = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var isOnline = useOnlineStatus();
    var loadApplications = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, _a, localData, _b, _c, localData, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    setLoading(true);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 12, 17, 18]);
                    if (!isOnline) return [3 /*break*/, 6];
                    if (!fieldId) return [3 /*break*/, 3];
                    return [4 /*yield*/, api_1.applicationsApi.getByField(fieldId)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, api_1.applicationsApi.getAll()];
                case 4:
                    _a = _e.sent();
                    _e.label = 5;
                case 5:
                    data = _a;
                    setApplications(data);
                    return [3 /*break*/, 11];
                case 6:
                    if (!fieldId) return [3 /*break*/, 8];
                    return [4 /*yield*/, database_1.dbHelpers.getApplicationsByField(fieldId)];
                case 7:
                    _b = _e.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, database_1.dbHelpers.getAllApplications()];
                case 9:
                    _b = _e.sent();
                    _e.label = 10;
                case 10:
                    localData = _b;
                    setApplications(localData);
                    _e.label = 11;
                case 11: return [3 /*break*/, 18];
                case 12:
                    _c = _e.sent();
                    if (!fieldId) return [3 /*break*/, 14];
                    return [4 /*yield*/, database_1.dbHelpers.getApplicationsByField(fieldId)];
                case 13:
                    _d = _e.sent();
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, database_1.dbHelpers.getAllApplications()];
                case 15:
                    _d = _e.sent();
                    _e.label = 16;
                case 16:
                    localData = _d;
                    setApplications(localData);
                    return [3 /*break*/, 18];
                case 17:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 18: return [2 /*return*/];
            }
        });
    }); }, [isOnline, fieldId]);
    (0, react_1.useEffect)(function () {
        loadApplications();
    }, [loadApplications]);
    var addApplication = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var lots, products, appData, newApplication, created_4, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    lots = data.lots, products = data.products, appData = __rest(data, ["lots", "products"]);
                    newApplication = {
                        id: (0, uuid_1.v4)(),
                        fieldId: appData.fieldId || '',
                        type: appData.type || 'FUMIGACION',
                        date: appData.date || new Date().toISOString(),
                        waterAmount: appData.waterAmount,
                        notes: appData.notes,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false,
                        applicationProducts: products === null || products === void 0 ? void 0 : products.map(function (p) { return ({
                            id: (0, uuid_1.v4)(),
                            applicationId: '',
                            productId: p.productId,
                            dosePerHectare: p.dosePerHectare,
                            concentration: p.concentration,
                            quantityUsed: p.quantityUsed,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); }),
                        applicationLots: lots === null || lots === void 0 ? void 0 : lots.map(function (l) { return ({
                            id: (0, uuid_1.v4)(),
                            applicationId: '',
                            lotId: l.lotId,
                            quantityUsed: l.quantityUsed,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); })
                    };
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.applicationsApi.create(__assign(__assign({}, appData), { products: products, lots: lots }))];
                case 2:
                    created_4 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addApplication(created_4)];
                case 3:
                    _b.sent();
                    setApplications(function (prev) { return __spreadArray([created_4], prev, true); });
                    return [2 /*return*/, created_4];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addApplication(newApplication)];
                case 5:
                    _b.sent();
                    setApplications(function (prev) { return __spreadArray([newApplication], prev, true); });
                    return [2 /*return*/, newApplication];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.addApplication(newApplication)];
                case 8:
                    _b.sent();
                    setApplications(function (prev) { return __spreadArray([newApplication], prev, true); });
                    return [2 /*return*/, newApplication];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var deleteApplication = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isOnline) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.applicationsApi.delete(id)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, database_1.dbHelpers.deleteApplication(id)];
                case 5:
                    _b.sent();
                    setApplications(function (prev) { return prev.filter(function (a) { return a.id !== id; }); });
                    return [2 /*return*/];
            }
        });
    }); };
    return { applications: applications, loading: loading, addApplication: addApplication, deleteApplication: deleteApplication, refresh: loadApplications };
}
// Hook para sincronización
function useSync() {
    var _this = this;
    var _a = (0, react_1.useState)(false), syncing = _a[0], setSyncing = _a[1];
    var _b = (0, react_1.useState)(null), lastSync = _b[0], setLastSync = _b[1];
    var isOnline = useOnlineStatus();
    var sync = function () { return __awaiter(_this, void 0, void 0, function () {
        var unsyncedData, result, _i, _a, p, _b, _c, l, _d, _e, f, _f, _g, a, _h, _j, m, err_5;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    if (!isOnline || syncing)
                        return [2 /*return*/];
                    setSyncing(true);
                    _k.label = 1;
                case 1:
                    _k.trys.push([1, 24, 25, 26]);
                    return [4 /*yield*/, database_1.dbHelpers.getUnsyncedData()];
                case 2:
                    unsyncedData = _k.sent();
                    return [4 /*yield*/, api_1.syncApi.sync(unsyncedData)];
                case 3:
                    result = _k.sent();
                    if (!result.serverData.products) return [3 /*break*/, 7];
                    _i = 0, _a = result.serverData.products;
                    _k.label = 4;
                case 4:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    p = _a[_i];
                    return [4 /*yield*/, database_1.dbHelpers.addProduct(p)];
                case 5:
                    _k.sent();
                    _k.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    if (!result.serverData.lots) return [3 /*break*/, 11];
                    _b = 0, _c = result.serverData.lots;
                    _k.label = 8;
                case 8:
                    if (!(_b < _c.length)) return [3 /*break*/, 11];
                    l = _c[_b];
                    return [4 /*yield*/, database_1.dbHelpers.addLot(l)];
                case 9:
                    _k.sent();
                    _k.label = 10;
                case 10:
                    _b++;
                    return [3 /*break*/, 8];
                case 11:
                    if (!result.serverData.fields) return [3 /*break*/, 15];
                    _d = 0, _e = result.serverData.fields;
                    _k.label = 12;
                case 12:
                    if (!(_d < _e.length)) return [3 /*break*/, 15];
                    f = _e[_d];
                    return [4 /*yield*/, database_1.dbHelpers.addField(f)];
                case 13:
                    _k.sent();
                    _k.label = 14;
                case 14:
                    _d++;
                    return [3 /*break*/, 12];
                case 15:
                    if (!result.serverData.applications) return [3 /*break*/, 19];
                    _f = 0, _g = result.serverData.applications;
                    _k.label = 16;
                case 16:
                    if (!(_f < _g.length)) return [3 /*break*/, 19];
                    a = _g[_f];
                    return [4 /*yield*/, database_1.dbHelpers.addApplication(a)];
                case 17:
                    _k.sent();
                    _k.label = 18;
                case 18:
                    _f++;
                    return [3 /*break*/, 16];
                case 19:
                    if (!result.serverData.movements) return [3 /*break*/, 23];
                    _h = 0, _j = result.serverData.movements;
                    _k.label = 20;
                case 20:
                    if (!(_h < _j.length)) return [3 /*break*/, 23];
                    m = _j[_h];
                    return [4 /*yield*/, database_1.dbHelpers.addMovement(m)];
                case 21:
                    _k.sent();
                    _k.label = 22;
                case 22:
                    _h++;
                    return [3 /*break*/, 20];
                case 23:
                    setLastSync(new Date().toISOString());
                    return [3 /*break*/, 26];
                case 24:
                    err_5 = _k.sent();
                    console.error('Sync error:', err_5);
                    return [3 /*break*/, 26];
                case 25:
                    setSyncing(false);
                    return [7 /*endfinally*/];
                case 26: return [2 /*return*/];
            }
        });
    }); };
    // Auto-sync cuando se recupera la conexión
    (0, react_1.useEffect)(function () {
        if (isOnline) {
            sync();
        }
    }, [isOnline]);
    return { syncing: syncing, lastSync: lastSync, sync: sync };
}
// Hook para calcular dosificación
function useDosageCalculation() {
    var calculate = function (fieldArea, dosePerHectare, concentration, productState) {
        var productUsed = fieldArea * dosePerHectare;
        var waterNeeded = 0;
        // Para productos líquidos, calcular agua necesaria
        if (productState === 'LIQUIDO' && concentration > 0) {
            // Concentración = (producto / agua) * 100
            // agua = (producto * 100) / concentración
            waterNeeded = (productUsed * 100) / concentration;
        }
        return {
            fieldArea: fieldArea,
            dosePerHectare: dosePerHectare,
            productUsed: productUsed,
            concentration: concentration,
            waterNeeded: waterNeeded
        };
    };
    return { calculate: calculate };
}
// Hook para contenedores
function useContainers(lotId) {
    var _this = this;
    var _a = (0, react_1.useState)([]), containers = _a[0], setContainers = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var isOnline = useOnlineStatus();
    var loadContainers = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, _a, localData, _b, _c, localData, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    setLoading(true);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 12, 17, 18]);
                    if (!isOnline) return [3 /*break*/, 6];
                    if (!lotId) return [3 /*break*/, 3];
                    return [4 /*yield*/, api_1.containersApi.getByLot(lotId)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, api_1.containersApi.getAll()];
                case 4:
                    _a = _e.sent();
                    _e.label = 5;
                case 5:
                    data = _a;
                    setContainers(data);
                    return [3 /*break*/, 11];
                case 6:
                    if (!lotId) return [3 /*break*/, 8];
                    return [4 /*yield*/, database_1.dbHelpers.getContainersByLot(lotId)];
                case 7:
                    _b = _e.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, database_1.dbHelpers.getAllContainers()];
                case 9:
                    _b = _e.sent();
                    _e.label = 10;
                case 10:
                    localData = _b;
                    setContainers(localData);
                    _e.label = 11;
                case 11: return [3 /*break*/, 18];
                case 12:
                    _c = _e.sent();
                    if (!lotId) return [3 /*break*/, 14];
                    return [4 /*yield*/, database_1.dbHelpers.getContainersByLot(lotId)];
                case 13:
                    _d = _e.sent();
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, database_1.dbHelpers.getAllContainers()];
                case 15:
                    _d = _e.sent();
                    _e.label = 16;
                case 16:
                    localData = _d;
                    setContainers(localData);
                    return [3 /*break*/, 18];
                case 17:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 18: return [2 /*return*/];
            }
        });
    }); }, [isOnline, lotId]);
    (0, react_1.useEffect)(function () {
        loadContainers();
    }, [loadContainers]);
    var addContainer = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newContainer, created_5, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    newContainer = {
                        id: (0, uuid_1.v4)(),
                        lotId: data.lotId || '',
                        type: data.type || 'BIDON',
                        capacity: data.capacity || 0,
                        unit: data.unit || 'L',
                        status: data.status || 'DISPONIBLE',
                        name: data.name,
                        notes: data.notes,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false
                    };
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.containersApi.create(newContainer)];
                case 2:
                    created_5 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addContainer(created_5)];
                case 3:
                    _b.sent();
                    setContainers(function (prev) { return __spreadArray([created_5], prev, true); });
                    return [2 /*return*/, created_5];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addContainer(newContainer)];
                case 5:
                    _b.sent();
                    setContainers(function (prev) { return __spreadArray([newContainer], prev, true); });
                    return [2 /*return*/, newContainer];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.addContainer(newContainer)];
                case 8:
                    _b.sent();
                    setContainers(function (prev) { return __spreadArray([newContainer], prev, true); });
                    return [2 /*return*/, newContainer];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var updateContainer = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updated, result_4, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    updated = __assign(__assign({}, data), { updatedAt: new Date().toISOString(), synced: false });
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.containersApi.update(id, updated)];
                case 2:
                    result_4 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateContainer(id, result_4)];
                case 3:
                    _b.sent();
                    setContainers(function (prev) { return prev.map(function (c) { return c.id === id ? result_4 : c; }); });
                    return [2 /*return*/, result_4];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateContainer(id, updated)];
                case 5:
                    _b.sent();
                    setContainers(function (prev) { return prev.map(function (c) { return c.id === id ? __assign(__assign({}, c), updated) : c; }); });
                    return [2 /*return*/, __assign(__assign({}, containers.find(function (c) { return c.id === id; })), updated)];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.updateContainer(id, updated)];
                case 8:
                    _b.sent();
                    setContainers(function (prev) { return prev.map(function (c) { return c.id === id ? __assign(__assign({}, c), updated) : c; }); });
                    return [2 /*return*/, __assign(__assign({}, containers.find(function (c) { return c.id === id; })), updated)];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var consumeContainer = function (id, quantity) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Consume is handled by the API - just refresh the list
                return [4 /*yield*/, api_1.containersApi.consume(id, quantity)];
                case 1:
                    // Consume is handled by the API - just refresh the list
                    _a.sent();
                    return [4 /*yield*/, loadContainers()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var deleteContainer = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isOnline) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.containersApi.delete(id)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, database_1.dbHelpers.deleteContainer(id)];
                case 5:
                    _b.sent();
                    setContainers(function (prev) { return prev.filter(function (c) { return c.id !== id; }); });
                    return [2 /*return*/];
            }
        });
    }); };
    return { containers: containers, loading: loading, addContainer: addContainer, updateContainer: updateContainer, consumeContainer: consumeContainer, deleteContainer: deleteContainer, refresh: loadContainers };
}
// Hook para movimientos
function useMovements(productId) {
    var _this = this;
    var _a = (0, react_1.useState)([]), movements = _a[0], setMovements = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var isOnline = useOnlineStatus();
    var loadMovements = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, _a, localData, _b, _c, localData, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    setLoading(true);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 12, 17, 18]);
                    if (!isOnline) return [3 /*break*/, 6];
                    if (!productId) return [3 /*break*/, 3];
                    return [4 /*yield*/, api_1.movementsApi.getByProduct(productId)];
                case 2:
                    _a = _e.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, api_1.movementsApi.getAll()];
                case 4:
                    _a = _e.sent();
                    _e.label = 5;
                case 5:
                    data = _a;
                    setMovements(data);
                    return [3 /*break*/, 11];
                case 6:
                    if (!productId) return [3 /*break*/, 8];
                    return [4 /*yield*/, database_1.dbHelpers.getMovementsByProduct(productId)];
                case 7:
                    _b = _e.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, database_1.dbHelpers.getAllMovements()];
                case 9:
                    _b = _e.sent();
                    _e.label = 10;
                case 10:
                    localData = _b;
                    setMovements(localData);
                    _e.label = 11;
                case 11: return [3 /*break*/, 18];
                case 12:
                    _c = _e.sent();
                    if (!productId) return [3 /*break*/, 14];
                    return [4 /*yield*/, database_1.dbHelpers.getMovementsByProduct(productId)];
                case 13:
                    _d = _e.sent();
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, database_1.dbHelpers.getAllMovements()];
                case 15:
                    _d = _e.sent();
                    _e.label = 16;
                case 16:
                    localData = _d;
                    setMovements(localData);
                    return [3 /*break*/, 18];
                case 17:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 18: return [2 /*return*/];
            }
        });
    }); }, [isOnline, productId]);
    (0, react_1.useEffect)(function () {
        loadMovements();
    }, [loadMovements]);
    return { movements: movements, loading: loading, refresh: loadMovements };
}
// Hook para Tancadas
function useTancadas() {
    var _this = this;
    var _a = (0, react_1.useState)([]), tancadas = _a[0], setTancadas = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var isOnline = useOnlineStatus();
    var loadTancadas = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, localData, _a, localData;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 8, 9]);
                    if (!isOnline) return [3 /*break*/, 3];
                    return [4 /*yield*/, api_1.tancadasApi.getAll()];
                case 2:
                    data = _b.sent();
                    setTancadas(data);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, database_1.dbHelpers.getAllTancadas()];
                case 4:
                    localData = _b.sent();
                    setTancadas(localData);
                    _b.label = 5;
                case 5: return [3 /*break*/, 9];
                case 6:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.getAllTancadas()];
                case 7:
                    localData = _b.sent();
                    setTancadas(localData);
                    return [3 /*break*/, 9];
                case 8:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); }, [isOnline]);
    (0, react_1.useEffect)(function () {
        loadTancadas();
    }, [loadTancadas]);
    var addTancada = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newTancada, created_6, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    newTancada = {
                        id: (0, uuid_1.v4)(),
                        date: data.date || new Date().toISOString(),
                        tankCapacity: data.tankCapacity,
                        waterAmount: data.waterAmount,
                        notes: data.notes,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false,
                        tancadaProducts: (_b = data.products) === null || _b === void 0 ? void 0 : _b.map(function (p) { return ({
                            id: (0, uuid_1.v4)(),
                            tancadaId: '',
                            productId: p.productId,
                            concentration: p.concentration,
                            quantity: p.quantity,
                            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); }),
                        tancadaFields: (_c = data.fields) === null || _c === void 0 ? void 0 : _c.map(function (f) { return ({
                            id: (0, uuid_1.v4)(),
                            tancadaId: '',
                            fieldId: f.fieldId,
                            hectaresTreated: f.hectaresTreated,
                            productUsed: f.productUsed,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); })
                    };
                    if (!isOnline) return [3 /*break*/, 7];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.tancadasApi.create(data)];
                case 2:
                    created_6 = _d.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addTancada(created_6)];
                case 3:
                    _d.sent();
                    setTancadas(function (prev) { return __spreadArray([created_6], prev, true); });
                    return [2 /*return*/, created_6];
                case 4:
                    _a = _d.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addTancada(newTancada)];
                case 5:
                    _d.sent();
                    setTancadas(function (prev) { return __spreadArray([newTancada], prev, true); });
                    return [2 /*return*/, newTancada];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.addTancada(newTancada)];
                case 8:
                    _d.sent();
                    setTancadas(function (prev) { return __spreadArray([newTancada], prev, true); });
                    return [2 /*return*/, newTancada];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var deleteTancada = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Optimistic delete - remove from UI immediately
                    setTancadas(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    if (!isOnline) return [3 /*break*/, 3];
                    // Try to delete from API
                    return [4 /*yield*/, api_1.tancadasApi.delete(id)];
                case 2:
                    // Try to delete from API
                    _a.sent();
                    _a.label = 3;
                case 3: 
                // Also delete from local DB
                return [4 /*yield*/, database_1.dbHelpers.deleteTancada(id)];
                case 4:
                    // Also delete from local DB
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Error deleting tancada:', error_1);
                    // Reload to sync state if error
                    loadTancadas();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var updateTancada = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var result_5, _a, localTancada_1, localTancada_2;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!isOnline) return [3 /*break*/, 7];
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.tancadasApi.update(id, data)];
                case 2:
                    result_5 = _f.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addTancada(result_5)];
                case 3:
                    _f.sent();
                    setTancadas(function (prev) { return prev.map(function (t) { return t.id === id ? result_5 : t; }); });
                    return [2 /*return*/, result_5];
                case 4:
                    _a = _f.sent();
                    localTancada_1 = {
                        id: id,
                        date: data.date || new Date().toISOString(),
                        tankCapacity: data.tankCapacity,
                        waterAmount: data.waterAmount,
                        notes: data.notes,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false,
                        tancadaProducts: (_b = data.products) === null || _b === void 0 ? void 0 : _b.map(function (p) { return ({
                            id: (0, uuid_1.v4)(),
                            tancadaId: id,
                            productId: p.productId,
                            concentration: p.concentration,
                            quantity: p.quantity,
                            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); }),
                        tancadaFields: (_c = data.fields) === null || _c === void 0 ? void 0 : _c.map(function (f) { return ({
                            id: (0, uuid_1.v4)(),
                            tancadaId: id,
                            fieldId: f.fieldId,
                            hectaresTreated: f.hectaresTreated,
                            productUsed: f.productUsed,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); })
                    };
                    return [4 /*yield*/, database_1.dbHelpers.addTancada(localTancada_1)];
                case 5:
                    _f.sent();
                    setTancadas(function (prev) { return prev.map(function (t) { return t.id === id ? localTancada_1 : t; }); });
                    return [2 /*return*/, localTancada_1];
                case 6: return [3 /*break*/, 9];
                case 7:
                    localTancada_2 = {
                        id: id,
                        date: data.date || new Date().toISOString(),
                        tankCapacity: data.tankCapacity,
                        waterAmount: data.waterAmount,
                        notes: data.notes,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false,
                        tancadaProducts: (_d = data.products) === null || _d === void 0 ? void 0 : _d.map(function (p) { return ({
                            id: (0, uuid_1.v4)(),
                            tancadaId: id,
                            productId: p.productId,
                            concentration: p.concentration,
                            quantity: p.quantity,
                            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); }),
                        tancadaFields: (_e = data.fields) === null || _e === void 0 ? void 0 : _e.map(function (f) { return ({
                            id: (0, uuid_1.v4)(),
                            tancadaId: id,
                            fieldId: f.fieldId,
                            hectaresTreated: f.hectaresTreated,
                            productUsed: f.productUsed,
                            createdAt: new Date().toISOString(),
                            synced: false
                        }); })
                    };
                    return [4 /*yield*/, database_1.dbHelpers.addTancada(localTancada_2)];
                case 8:
                    _f.sent();
                    setTancadas(function (prev) { return prev.map(function (t) { return t.id === id ? localTancada_2 : t; }); });
                    return [2 /*return*/, localTancada_2];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    return { tancadas: tancadas, loading: loading, addTancada: addTancada, updateTancada: updateTancada, deleteTancada: deleteTancada, refresh: loadTancadas };
}
// Hook para Tanques
function useTanks() {
    var _this = this;
    var _a = (0, react_1.useState)([]), tanks = _a[0], setTanks = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var isOnline = useOnlineStatus();
    var loadTanks = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, localData, _a, localData;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 8, 9]);
                    if (!isOnline) return [3 /*break*/, 3];
                    return [4 /*yield*/, api_1.tanksApi.getAll()];
                case 2:
                    data = _b.sent();
                    setTanks(data);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, database_1.dbHelpers.getAllTanks()];
                case 4:
                    localData = _b.sent();
                    setTanks(localData);
                    _b.label = 5;
                case 5: return [3 /*break*/, 9];
                case 6:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.getAllTanks()];
                case 7:
                    localData = _b.sent();
                    setTanks(localData);
                    return [3 /*break*/, 9];
                case 8:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); }, [isOnline]);
    (0, react_1.useEffect)(function () {
        loadTanks();
    }, [loadTanks]);
    var addTank = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newTank, created_7, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    newTank = {
                        id: (0, uuid_1.v4)(),
                        name: data.name,
                        capacity: data.capacity,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        synced: false
                    };
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.tanksApi.create(newTank)];
                case 2:
                    created_7 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addTank(created_7)];
                case 3:
                    _b.sent();
                    setTanks(function (prev) { return __spreadArray([created_7], prev, true); });
                    return [2 /*return*/, created_7];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.addTank(newTank)];
                case 5:
                    _b.sent();
                    setTanks(function (prev) { return __spreadArray([newTank], prev, true); });
                    return [2 /*return*/, newTank];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.addTank(newTank)];
                case 8:
                    _b.sent();
                    setTanks(function (prev) { return __spreadArray([newTank], prev, true); });
                    return [2 /*return*/, newTank];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var updateTank = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updated, result_6, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    updated = __assign(__assign({}, data), { updatedAt: new Date().toISOString(), synced: false });
                    if (!isOnline) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, api_1.tanksApi.update(id, updated)];
                case 2:
                    result_6 = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateTank(id, result_6)];
                case 3:
                    _b.sent();
                    setTanks(function (prev) { return prev.map(function (t) { return t.id === id ? result_6 : t; }); });
                    return [2 /*return*/, result_6];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, database_1.dbHelpers.updateTank(id, updated)];
                case 5:
                    _b.sent();
                    setTanks(function (prev) { return prev.map(function (t) { return t.id === id ? __assign(__assign({}, t), updated) : t; }); });
                    return [2 /*return*/, __assign(__assign({}, tanks.find(function (t) { return t.id === id; })), updated)];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, database_1.dbHelpers.updateTank(id, updated)];
                case 8:
                    _b.sent();
                    setTanks(function (prev) { return prev.map(function (t) { return t.id === id ? __assign(__assign({}, t), updated) : t; }); });
                    return [2 /*return*/, __assign(__assign({}, tanks.find(function (t) { return t.id === id; })), updated)];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var deleteTank = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isOnline) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.tanksApi.delete(id)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, database_1.dbHelpers.deleteTank(id)];
                case 5:
                    _b.sent();
                    setTanks(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
                    return [2 /*return*/];
            }
        });
    }); };
    return { tanks: tanks, loading: loading, addTank: addTank, updateTank: updateTank, deleteTank: deleteTank, refresh: loadTanks };
}
