"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.dbHelpers = exports.db = exports.AgroControlDB = void 0;
var dexie_1 = require("dexie");
var AgroControlDB = /** @class */ (function (_super) {
    __extends(AgroControlDB, _super);
    function AgroControlDB() {
        var _this = _super.call(this, 'AgroControlDB') || this;
        _this.version(4).stores({
            products: 'id, name, type, synced, updatedAt',
            lots: 'id, productId, synced, updatedAt',
            fields: 'id, name, synced, updatedAt',
            applications: 'id, fieldId, type, synced, updatedAt',
            movements: 'id, productId, lotId, type, synced, updatedAt',
            applicationLots: 'id, applicationId, lotId, synced',
            containers: 'id, lotId, type, status, synced, updatedAt',
            tancadas: 'id, productId, date, synced, updatedAt',
            tancadaFields: 'id, tancadaId, fieldId, synced',
            tanks: 'id, name, synced, updatedAt'
        });
        return _this;
    }
    return AgroControlDB;
}(dexie_1.default));
exports.AgroControlDB = AgroControlDB;
exports.db = new AgroControlDB();
window.db = exports.db;
// Funciones helper para IndexedDB
exports.dbHelpers = {
    // Productos
    getAllProducts: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.products.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    getProduct: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.products.get(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addProduct: function (product) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.products.put(product)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    updateProduct: function (id, changes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.products.update(id, __assign(__assign({}, changes), { updatedAt: new Date().toISOString() }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteProduct: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.products.delete(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // Lotes
    getAllLots: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.lots.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    getLotsByProduct: function (productId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.lots.where('productId').equals(productId).toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addLot: function (lot) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.lots.put(lot)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    updateLot: function (id, changes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.lots.update(id, __assign(__assign({}, changes), { updatedAt: new Date().toISOString() }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteLot: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.lots.delete(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // Campos
    getAllFields: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.fields.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addField: function (field) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.fields.put(field)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    updateField: function (id, changes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.fields.update(id, __assign(__assign({}, changes), { updatedAt: new Date().toISOString() }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteField: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.fields.delete(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // Aplicaciones
    getAllApplications: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.applications.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    getApplicationsByField: function (fieldId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.applications.where('fieldId').equals(fieldId).toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addApplication: function (application) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.applications.put(application)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    updateApplication: function (id, changes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.applications.update(id, __assign(__assign({}, changes), { updatedAt: new Date().toISOString() }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteApplication: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.applications.delete(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // Movimientos
    getAllMovements: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.movements.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    getMovementsByProduct: function (productId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.movements.where('productId').equals(productId).toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addMovement: function (movement) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.movements.put(movement)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteMovement: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.movements.delete(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // ApplicationLots
    getApplicationLotsByApplication: function (applicationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.applicationLots.where('applicationId').equals(applicationId).toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addApplicationLot: function (applicationLot) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.applicationLots.put(applicationLot)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    // Contenedores
    getAllContainers: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.containers.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    getContainersByLot: function (lotId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.containers.where('lotId').equals(lotId).toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addContainer: function (container) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.containers.put(container)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    updateContainer: function (id, changes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.containers.update(id, __assign(__assign({}, changes), { updatedAt: new Date().toISOString() }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteContainer: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.containers.delete(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // Utilidades
    getUnsyncedData: function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, products, lots, fields, applications, movements, applicationLots, containers, tancadas, tancadaFields;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            exports.db.products.where('synced').equals(0).toArray(),
                            exports.db.lots.where('synced').equals(0).toArray(),
                            exports.db.fields.where('synced').equals(0).toArray(),
                            exports.db.applications.where('synced').equals(0).toArray(),
                            exports.db.movements.where('synced').equals(0).toArray(),
                            exports.db.applicationLots.where('synced').equals(0).toArray(),
                            exports.db.containers.where('synced').equals(0).toArray(),
                            exports.db.tancadas.where('synced').equals(0).toArray(),
                            exports.db.tancadaFields.where('synced').equals(0).toArray()
                        ])];
                    case 1:
                        _a = _b.sent(), products = _a[0], lots = _a[1], fields = _a[2], applications = _a[3], movements = _a[4], applicationLots = _a[5], containers = _a[6], tancadas = _a[7], tancadaFields = _a[8];
                        return [2 /*return*/, { products: products, lots: lots, fields: fields, applications: applications, movements: movements, applicationLots: applicationLots, containers: containers, tancadas: tancadas, tancadaFields: tancadaFields }];
                }
            });
        });
    },
    clearAllData: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            exports.db.products.clear(),
                            exports.db.lots.clear(),
                            exports.db.fields.clear(),
                            exports.db.applications.clear(),
                            exports.db.movements.clear(),
                            exports.db.applicationLots.clear(),
                            exports.db.containers.clear(),
                            exports.db.tancadas.clear(),
                            exports.db.tancadaFields.clear()
                        ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // Tancadas
    getAllTancadas: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tancadas.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addTancada: function (tancada) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tancadas.put(tancada)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    updateTancada: function (id, changes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tancadas.update(id, __assign(__assign({}, changes), { updatedAt: new Date().toISOString() }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteTancada: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tancadas.delete(id)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, exports.db.tancadaFields.where('tancadaId').equals(id).delete()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    // TancadaFields
    getTancadaFieldsByTancada: function (tancadaId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tancadaFields.where('tancadaId').equals(tancadaId).toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addTancadaField: function (tancadaField) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tancadaFields.put(tancadaField)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    // Tanques
    getAllTanks: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tanks.toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    addTank: function (tank) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tanks.put(tank)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    updateTank: function (id, changes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tanks.update(id, __assign(__assign({}, changes), { updatedAt: new Date().toISOString() }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    deleteTank: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports.db.tanks.delete(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
};
