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
exports.default = TancadasPage;
var react_1 = require("react");
var useData_1 = require("../hooks/useData");
var api_1 = require("../services/api");
var initialWizardState = {
    step: 'date-tank',
    date: new Date().toISOString().split('T')[0],
    tankId: '',
    tankCapacity: '',
    waterAmount: '',
    totalHectares: '',
    fields: [],
    products: [],
    notes: ''
};
function TancadasPage() {
    var _this = this;
    var _a = (0, useData_1.useTancadas)(), tancadas = _a.tancadas, loading = _a.loading, addTancada = _a.addTancada, updateTancada = _a.updateTancada, deleteTancada = _a.deleteTancada;
    var products = (0, useData_1.useProducts)().products;
    var fields = (0, useData_1.useFields)().fields;
    var tanks = (0, useData_1.useTanks)().tanks;
    var lots = (0, useData_1.useLots)().lots;
    var _b = (0, react_1.useState)(false), showModal = _b[0], setShowModal = _b[1];
    var _c = (0, react_1.useState)(null), editingId = _c[0], setEditingId = _c[1];
    var _d = (0, react_1.useState)({
        date: new Date().toISOString().split('T')[0],
        tankCapacity: '',
        tankId: '',
        waterAmount: '',
        notes: '',
        totalHectares: '' // Total hectares to treat
    }), formData = _d[0], setFormData = _d[1];
    // Multiple products in the mix, with lots per product
    var _e = (0, react_1.useState)([]), selectedProducts = _e[0], setSelectedProducts = _e[1];
    // Fields distribution - how many hectares of the total for each field
    var _f = (0, react_1.useState)([]), fieldDistribution = _f[0], setFieldDistribution = _f[1];
    // Stock per lot (real stock calculated from movements)
    var _g = (0, react_1.useState)({}), lotStocks = _g[0], setLotStocks = _g[1];
    // Wizard state for mobile
    var _h = (0, react_1.useState)(false), showWizard = _h[0], setShowWizard = _h[1];
    var _j = (0, react_1.useState)(initialWizardState), wizardState = _j[0], setWizardState = _j[1];
    var _k = (0, react_1.useState)(0), currentProductIndex = _k[0], setCurrentProductIndex = _k[1];
    var _l = (0, react_1.useState)(false), addingProduct = _l[0], setAddingProduct = _l[1];
    // Resumen modal
    var _m = (0, react_1.useState)(false), showResumen = _m[0], setShowResumen = _m[1];
    var _o = (0, react_1.useState)(null), resumenTancada = _o[0], setResumenTancada = _o[1];
    // Generar texto de resumen para una tancada
    var generarResumenTexto = function (tancada) {
        var _a, _b;
        var totalHectareas = ((_a = tancada.tancadaFields) === null || _a === void 0 ? void 0 : _a.reduce(function (sum, f) { return sum + f.hectaresTreated; }, 0)) || 0;
        var texto = "FECHA: ".concat(formatDate(tancada.date), "\n");
        texto += "HECT\u00C1REAS: ".concat(totalHectareas, " ha\n");
        texto += "AGUA: ".concat(tancada.waterAmount, " L\n");
        texto += "\nPRODUCTOS:\n";
        // Los lotes se almacenan en lotsUsed de cada tancadaProduct
        (_b = tancada.tancadaProducts) === null || _b === void 0 ? void 0 : _b.forEach(function (tp) {
            var _a, _b;
            var producto = ((_a = tp.product) === null || _a === void 0 ? void 0 : _a.name) || 'Sin nombre';
            var cantidad = tp.quantity;
            var unidad = ((_b = tp.product) === null || _b === void 0 ? void 0 : _b.baseUnit) || 'L';
            // Buscar información del lote desde lotsData (del backend) o lista local
            var totalContainerCapacity = 0;
            // Primer intento: usar lotsData del backend
            var lotsData = tp.lotsData;
            if (lotsData && Array.isArray(lotsData) && lotsData.length > 0) {
                var validLots = lotsData.filter(function (l) { return l.containerCapacity; });
                if (validLots.length > 0) {
                    totalContainerCapacity = validLots.reduce(function (sum, l) { return sum + (l.containerCapacity || 0); }, 0);
                }
            }
            // Segundo intento: buscar en la lista local de lotes
            if (totalContainerCapacity === 0 && tp.lotsUsed) {
                try {
                    var lotsUsed = typeof tp.lotsUsed === 'string' ? JSON.parse(tp.lotsUsed) : tp.lotsUsed;
                    if (Array.isArray(lotsUsed) && lotsUsed.length > 0) {
                        var lotIds_1 = lotsUsed.map(function (l) { return l.lotId; });
                        var lotsInfo = lots.filter(function (l) { return lotIds_1.includes(l.id) && l.containerCapacity; });
                        if (lotsInfo.length > 0) {
                            totalContainerCapacity = lotsInfo.reduce(function (sum, l) { return sum + (l.containerCapacity || 0); }, 0);
                        }
                    }
                }
                catch (e) {
                    // Ignore parse errors
                }
            }
            // Formato: Producto capacidadUnidad x cantidadUnidad
            if (totalContainerCapacity > 0) {
                texto += "\u2022 ".concat(producto, " x").concat(totalContainerCapacity).concat(unidad.toLowerCase(), " ").concat(cantidad).concat(unidad.toLowerCase(), "\n");
            }
            else {
                texto += "\u2022 ".concat(producto, " ").concat(cantidad, " ").concat(unidad, "\n");
            }
        });
        // Agregar campos tratados
        if (tancada.tancadaFields && tancada.tancadaFields.length > 0) {
            texto += "\nCAMPOS:\n";
            tancada.tancadaFields.forEach(function (tf) {
                var _a, _b;
                var campoNombre = ((_a = tf.field) === null || _a === void 0 ? void 0 : _a.name) || 'Sin nombre';
                var hectareas = tf.hectaresTreated;
                var totalCampo = ((_b = tf.field) === null || _b === void 0 ? void 0 : _b.area) || hectareas;
                texto += "\u2022 ".concat(campoNombre, ": ").concat(hectareas, "/").concat(totalCampo, " ha\n");
            });
        }
        return texto;
    };
    var abrirResumen = function (tancada) {
        setResumenTancada(tancada);
        setShowResumen(true);
    };
    // Function to fetch lot stocks
    var fetchLotStocks = function () { return __awaiter(_this, void 0, void 0, function () {
        var stocks, _i, lots_1, lot, result, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    stocks = {};
                    _i = 0, lots_1 = lots;
                    _b.label = 1;
                case 1:
                    if (!(_i < lots_1.length)) return [3 /*break*/, 6];
                    lot = lots_1[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, api_1.movementsApi.getLotStock(lot.id)];
                case 3:
                    result = _b.sent();
                    stocks[lot.id] = result.stock;
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    stocks[lot.id] = lot.initialStock;
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    setLotStocks(stocks);
                    return [2 /*return*/];
            }
        });
    }); };
    // Calculate total distributed hectares
    var distributedHectares = (0, react_1.useMemo)(function () {
        return fieldDistribution.reduce(function (sum, f) { return sum + (parseFloat(f.hectares) || 0); }, 0);
    }, [fieldDistribution]);
    var resetForm = function () {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            tankCapacity: '',
            tankId: '',
            waterAmount: '',
            notes: '',
            totalHectares: ''
        });
        setSelectedProducts([]);
        setFieldDistribution([]);
        setEditingId(null);
        setWizardState(initialWizardState);
        setShowWizard(false);
    };
    // Wizard functions for mobile
    var openWizard = function () {
        setWizardState(initialWizardState);
        fetchLotStocks();
        setShowWizard(true);
        setCurrentProductIndex(0);
        setAddingProduct(false);
    };
    var closeWizard = function () {
        setShowWizard(false);
        setWizardState(initialWizardState);
        setCurrentProductIndex(0);
        setAddingProduct(false);
    };
    var nextStep = function () {
        var steps = ['date-tank', 'hectares', 'fields', 'products', 'notes', 'confirm'];
        var currentIdx = steps.indexOf(wizardState.step);
        if (currentIdx < steps.length - 1) {
            setWizardState(__assign(__assign({}, wizardState), { step: steps[currentIdx + 1] }));
        }
    };
    var prevStep = function () {
        var steps = ['date-tank', 'hectares', 'fields', 'products', 'notes', 'confirm'];
        var currentIdx = steps.indexOf(wizardState.step);
        if (currentIdx > 0) {
            setWizardState(__assign(__assign({}, wizardState), { step: steps[currentIdx - 1] }));
        }
    };
    var goToStep = function (step) {
        setWizardState(__assign(__assign({}, wizardState), { step: step }));
    };
    // Add product in wizard - ask if want to add more
    var handleWizardAddProduct = function () {
        if (products.length > 0) {
            var usedProductIds_1 = wizardState.products.map(function (p) { return p.productId; });
            var availableProducts = products.filter(function (p) { return !usedProductIds_1.includes(p.id); });
            if (availableProducts.length > 0) {
                var totalHa = parseFloat(wizardState.totalHectares) || 0;
                var product = availableProducts[0];
                var dose = product.dosePerHectareMin || product.dosePerHectareMax || 0;
                var quantity = totalHa * dose;
                var newProduct = {
                    productId: product.id,
                    concentration: '',
                    quantity: quantity > 0 ? quantity.toFixed(2) : '',
                    dosePerHectare: dose.toString(),
                    lots: []
                };
                setWizardState(__assign(__assign({}, wizardState), { products: __spreadArray(__spreadArray([], wizardState.products, true), [newProduct], false) }));
                setCurrentProductIndex(wizardState.products.length);
                setAddingProduct(false);
            }
        }
    };
    var handleWizardRemoveProduct = function (index) {
        var updated = wizardState.products.filter(function (_, i) { return i !== index; });
        setWizardState(__assign(__assign({}, wizardState), { products: updated }));
        if (currentProductIndex >= updated.length) {
            setCurrentProductIndex(Math.max(0, updated.length - 1));
        }
    };
    var handleWizardAddField = function () {
        if (fields.length > 0) {
            var usedFieldIds_1 = wizardState.fields.map(function (f) { return f.fieldId; });
            var availableField = fields.find(function (f) { return !usedFieldIds_1.includes(f.id); });
            if (availableField) {
                var totalTarget = parseFloat(wizardState.totalHectares) || 0;
                var alreadyDistributed = wizardState.fields.reduce(function (sum, f) { return sum + (parseFloat(f.hectares) || 0); }, 0);
                var remaining = Math.max(0, totalTarget - alreadyDistributed);
                var suggestedHectares = Math.min(availableField.area, remaining);
                setWizardState(__assign(__assign({}, wizardState), { fields: __spreadArray(__spreadArray([], wizardState.fields, true), [{ fieldId: availableField.id, hectares: suggestedHectares > 0 ? suggestedHectares.toString() : '' }], false) }));
            }
        }
    };
    var handleWizardRemoveField = function (index) {
        var updated = wizardState.fields.filter(function (_, i) { return i !== index; });
        setWizardState(__assign(__assign({}, wizardState), { fields: updated }));
    };
    var handleWizardFieldChange = function (index, hectares) {
        var updated = __spreadArray([], wizardState.fields, true);
        updated[index].hectares = hectares;
        setWizardState(__assign(__assign({}, wizardState), { fields: updated }));
    };
    // Submit tancada from wizard
    var submitWizardTancada = function () { return __awaiter(_this, void 0, void 0, function () {
        var tancadaData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tancadaData = {
                        date: new Date(wizardState.date).toISOString(),
                        tankCapacity: parseFloat(wizardState.tankCapacity),
                        waterAmount: parseFloat(wizardState.waterAmount),
                        notes: wizardState.notes || undefined,
                        products: wizardState.products.map(function (p) {
                            var _a;
                            return ({
                                productId: p.productId,
                                concentration: p.concentration ? parseFloat(p.concentration) : undefined,
                                quantity: parseFloat(p.quantity),
                                lots: (_a = p.lots) === null || _a === void 0 ? void 0 : _a.filter(function (l) { return l.quantityUsed > 0; }).map(function (l) { return ({
                                    lotId: l.lotId,
                                    quantityUsed: l.quantityUsed
                                }); })
                            });
                        }),
                        fields: wizardState.fields.map(function (f) { return ({
                            fieldId: f.fieldId,
                            hectaresTreated: parseFloat(f.hectares),
                            productUsed: wizardState.products.reduce(function (sum, p) { return sum + (parseFloat(p.quantity) || 0); }, 0)
                        }); })
                    };
                    return [4 /*yield*/, addTancada(tancadaData)];
                case 1:
                    _a.sent();
                    closeWizard();
                    fetchLotStocks();
                    return [2 /*return*/];
            }
        });
    }); };
    var distributedHectaresWizard = (0, react_1.useMemo)(function () {
        return wizardState.fields.reduce(function (sum, f) { return sum + (parseFloat(f.hectares) || 0); }, 0);
    }, [wizardState.fields]);
    // Fetch real stock for all lots
    (0, react_1.useEffect)(function () {
        var fetchLotStocks = function () { return __awaiter(_this, void 0, void 0, function () {
            var stocks, _i, lots_2, lot, result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        stocks = {};
                        _i = 0, lots_2 = lots;
                        _b.label = 1;
                    case 1:
                        if (!(_i < lots_2.length)) return [3 /*break*/, 6];
                        lot = lots_2[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, api_1.movementsApi.getLotStock(lot.id)];
                    case 3:
                        result = _b.sent();
                        stocks[lot.id] = result.stock;
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        // Fallback to initial stock if API fails
                        stocks[lot.id] = lot.initialStock;
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        setLotStocks(stocks);
                        return [2 /*return*/];
                }
            });
        }); };
        if (lots.length > 0) {
            fetchLotStocks();
        }
    }, [lots]);
    // Open modal and refresh stocks
    var openModal = function () {
        resetForm();
        fetchLotStocks(); // Refresh stocks when opening modal
        setShowModal(true);
    };
    // Edit existing tancada
    var handleEdit = function (tancada) {
        var _a, _b, _c;
        setEditingId(tancada.id);
        setFormData({
            date: new Date(tancada.date).toISOString().split('T')[0],
            tankCapacity: tancada.tankCapacity.toString(),
            tankId: '',
            waterAmount: tancada.waterAmount.toString(),
            notes: tancada.notes || '',
            totalHectares: ((_a = tancada.tancadaFields) === null || _a === void 0 ? void 0 : _a.reduce(function (sum, f) { return sum + f.hectaresTreated; }, 0).toString()) || ''
        });
        // Load products
        setSelectedProducts(((_b = tancada.tancadaProducts) === null || _b === void 0 ? void 0 : _b.map(function (p) {
            var _a;
            // Parse lotsUsed if available
            var parsedLots = [];
            if (p.lotsUsed) {
                try {
                    parsedLots = typeof p.lotsUsed === 'string' ? JSON.parse(p.lotsUsed) : p.lotsUsed;
                }
                catch (e) {
                    parsedLots = [];
                }
            }
            return {
                productId: p.productId,
                concentration: ((_a = p.concentration) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                quantity: p.quantity.toString(),
                dosePerHectare: '',
                lots: parsedLots
            };
        })) || []);
        // Load field distribution
        setFieldDistribution(((_c = tancada.tancadaFields) === null || _c === void 0 ? void 0 : _c.map(function (f) { return ({
            fieldId: f.fieldId,
            hectares: f.hectaresTreated.toString()
        }); })) || []);
        // Refresh stocks when editing
        fetchLotStocks();
        setShowModal(true);
    };
    var handleTankSelect = function (tankId) {
        var tank = tanks.find(function (t) { return t.id === tankId; });
        setFormData(__assign(__assign({}, formData), { tankId: tankId, tankCapacity: tank ? tank.capacity.toString() : '' }));
    };
    var handleAddProduct = function () {
        if (products.length > 0) {
            var usedProductIds_2 = selectedProducts.map(function (p) { return p.productId; });
            var availableProduct = products.find(function (p) { return !usedProductIds_2.includes(p.id); });
            if (availableProduct) {
                // Pre-fill with recommended dose based on total hectares
                var totalHa = parseFloat(formData.totalHectares) || 0;
                var dose = availableProduct.dosePerHectareMin || availableProduct.dosePerHectareMax || 0;
                var quantity = totalHa * dose;
                setSelectedProducts(__spreadArray(__spreadArray([], selectedProducts, true), [{
                        productId: availableProduct.id,
                        concentration: '',
                        quantity: quantity > 0 ? quantity.toFixed(2) : '',
                        dosePerHectare: dose.toString(),
                        lots: []
                    }], false));
            }
        }
    };
    var handleRemoveProduct = function (index) {
        setSelectedProducts(selectedProducts.filter(function (_, i) { return i !== index; }));
    };
    // Get lots for a specific product
    var getProductLots = function (productId) {
        return lots.filter(function (l) { return l.productId === productId; });
    };
    // Add lot to a product - auto-fill with required quantity
    var handleAddLotToProduct = function (productIndex) {
        var productLots = getProductLots(selectedProducts[productIndex].productId);
        if (productLots.length > 0) {
            var productData = selectedProducts[productIndex];
            var requiredQuantity = parseFloat(productData.quantity) || 0;
            var updated = __spreadArray([], selectedProducts, true);
            updated[productIndex].lots.push({
                lotId: productLots[0].id,
                quantityUsed: requiredQuantity
            });
            setSelectedProducts(updated);
        }
    };
    // Remove lot from product
    var handleRemoveLotFromProduct = function (productIndex, lotIndex) {
        var updated = __spreadArray([], selectedProducts, true);
        updated[productIndex].lots.splice(lotIndex, 1);
        setSelectedProducts(updated);
    };
    // Update lot quantity
    var handleLotQuantityChange = function (productIndex, lotIndex, quantityUsed) {
        var updated = __spreadArray([], selectedProducts, true);
        updated[productIndex].lots[lotIndex].quantityUsed = quantityUsed;
        setSelectedProducts(updated);
    };
    var handleProductChange = function (index, field, value) {
        var updated = __spreadArray([], selectedProducts, true);
        updated[index][field] = value;
        // Auto-calculate quantity when dosePerHectare changes
        if (field === 'dosePerHectare') {
            var totalHa = parseFloat(formData.totalHectares) || 0;
            var dose = parseFloat(value) || 0;
            if (totalHa > 0 && dose > 0) {
                updated[index].quantity = (totalHa * dose).toFixed(2);
            }
        }
        setSelectedProducts(updated);
    };
    // Recalculate all product quantities based on total hectares
    var recalculateQuantities = function () {
        var totalHa = parseFloat(formData.totalHectares) || 0;
        if (totalHa === 0)
            return;
        var updated = selectedProducts.map(function (sp) {
            var product = products.find(function (p) { return p.id === sp.productId; });
            if (!product)
                return sp;
            var dose = parseFloat(sp.dosePerHectare) || product.dosePerHectareMin || product.dosePerHectareMax || 0;
            if (dose === 0)
                return sp;
            return __assign(__assign({}, sp), { quantity: (totalHa * dose).toFixed(2) });
        });
        setSelectedProducts(updated);
    };
    // Add field to distribution
    var addFieldToDistribution = function () {
        if (fields.length > 0) {
            var usedFieldIds_2 = fieldDistribution.map(function (f) { return f.fieldId; });
            var availableField = fields.find(function (f) { return !usedFieldIds_2.includes(f.id); });
            if (availableField) {
                // Calculate remaining hectares to distribute
                var totalTarget = parseFloat(formData.totalHectares) || 0;
                var alreadyDistributed = fieldDistribution.reduce(function (sum, f) { return sum + (parseFloat(f.hectares) || 0); }, 0);
                var remaining = Math.max(0, totalTarget - alreadyDistributed);
                // Fill with the lesser of: field's total area OR remaining hectares
                var suggestedHectares = Math.min(availableField.area, remaining);
                setFieldDistribution(__spreadArray(__spreadArray([], fieldDistribution, true), [{
                        fieldId: availableField.id,
                        hectares: suggestedHectares > 0 ? suggestedHectares.toString() : ''
                    }], false));
            }
        }
    };
    var removeField = function (index) {
        setFieldDistribution(fieldDistribution.filter(function (_, i) { return i !== index; }));
    };
    var updateFieldHectares = function (index, value) {
        var updated = __spreadArray([], fieldDistribution, true);
        updated[index].hectares = value;
        setFieldDistribution(updated);
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var tancadaData, fetchLotStocks;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    tancadaData = {
                        date: new Date(formData.date).toISOString(),
                        tankCapacity: parseFloat(formData.tankCapacity),
                        waterAmount: parseFloat(formData.waterAmount),
                        notes: formData.notes || undefined,
                        products: selectedProducts.map(function (p) {
                            var _a;
                            return ({
                                productId: p.productId,
                                concentration: p.concentration ? parseFloat(p.concentration) : undefined,
                                quantity: parseFloat(p.quantity),
                                lots: (_a = p.lots) === null || _a === void 0 ? void 0 : _a.filter(function (l) { return l.quantityUsed > 0; }).map(function (l) { return ({
                                    lotId: l.lotId,
                                    quantityUsed: l.quantityUsed
                                }); })
                            });
                        }),
                        fields: fieldDistribution.map(function (f) { return ({
                            fieldId: f.fieldId,
                            hectaresTreated: parseFloat(f.hectares),
                            productUsed: selectedProducts.reduce(function (sum, p) { return sum + (parseFloat(p.quantity) || 0); }, 0)
                        }); })
                    };
                    if (!editingId) return [3 /*break*/, 2];
                    return [4 /*yield*/, updateTancada(editingId, tancadaData)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, addTancada(tancadaData)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    setShowModal(false);
                    resetForm();
                    fetchLotStocks = function () { return __awaiter(_this, void 0, void 0, function () {
                        var stocks, _i, lots_3, lot, result, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    stocks = {};
                                    _i = 0, lots_3 = lots;
                                    _b.label = 1;
                                case 1:
                                    if (!(_i < lots_3.length)) return [3 /*break*/, 6];
                                    lot = lots_3[_i];
                                    _b.label = 2;
                                case 2:
                                    _b.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, api_1.movementsApi.getLotStock(lot.id)];
                                case 3:
                                    result = _b.sent();
                                    stocks[lot.id] = result.stock;
                                    return [3 /*break*/, 5];
                                case 4:
                                    _a = _b.sent();
                                    stocks[lot.id] = lot.initialStock;
                                    return [3 /*break*/, 5];
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6:
                                    setLotStocks(stocks);
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    fetchLotStocks();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var fetchLotStocks_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('¿Estás seguro de eliminar esta tancada?')) return [3 /*break*/, 2];
                    return [4 /*yield*/, deleteTancada(id)];
                case 1:
                    _a.sent();
                    fetchLotStocks_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                        var stocks, _i, lots_4, lot, result, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    stocks = {};
                                    _i = 0, lots_4 = lots;
                                    _b.label = 1;
                                case 1:
                                    if (!(_i < lots_4.length)) return [3 /*break*/, 6];
                                    lot = lots_4[_i];
                                    _b.label = 2;
                                case 2:
                                    _b.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, api_1.movementsApi.getLotStock(lot.id)];
                                case 3:
                                    result = _b.sent();
                                    stocks[lot.id] = result.stock;
                                    return [3 /*break*/, 5];
                                case 4:
                                    _a = _b.sent();
                                    stocks[lot.id] = lot.initialStock;
                                    return [3 /*break*/, 5];
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6:
                                    setLotStocks(stocks);
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    fetchLotStocks_1();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); };
    var formatDate = function (dateStr) {
        return new Date(dateStr).toLocaleDateString();
    };
    if (loading) {
        return (<div className="loading">
        <div className="spinner"></div>
      </div>);
    }
    return (<div>
      <div className="flex flex-between mb-2">
        <h2>Tancadas</h2>
        <button className="btn btn-primary" onClick={function () {
            // Use wizard on mobile, modal on desktop
            if (window.innerWidth < 768) {
                openWizard();
            }
            else {
                openModal();
            }
        }} disabled={fields.length === 0 || products.length === 0}>
          + Nuevo
        </button>
      </div>

      {fields.length === 0 && (<div className="card">
          <div className="empty-state">
            <p>Primero debés crear campos para registrar tancadas</p>
          </div>
        </div>)}

      {tancadas.length === 0 && fields.length > 0 ? (<div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>🚿</div>
            <h3>No hay tancadas</h3>
            <p>Registrá tu primera tancada para fumigar campos</p>
            <button className="btn btn-primary mt-1" onClick={function () { return window.innerWidth < 768 ? openWizard() : openModal(); }}>
              + Nuevo
            </button>
          </div>
        </div>) : (<>
          {/* Vista móvil - Cards */}
          <div className="mobile-cards">
            {tancadas.map(function (tancada) {
                var _a, _b;
                return (<div key={tancada.id} className="card-mobile">
                <div className="card-mobile-header">
                  <span className="card-mobile-date">{formatDate(tancada.date)}</span>
                  <span className="card-mobile-badge">{tancada.tankCapacity}L</span>
                </div>
                
                <div className="card-mobile-content">
                  <div className="card-mobile-section">
                    <span className="card-mobile-label">Productos:</span>
                    {(_a = tancada.tancadaProducts) === null || _a === void 0 ? void 0 : _a.map(function (tp, idx) {
                        var _a, _b;
                        return (<span key={idx} className="badge badge-primary" style={{ marginRight: '0.25rem', marginBottom: '0.25rem' }}>
                        {(_a = tp.product) === null || _a === void 0 ? void 0 : _a.name}: {tp.quantity}{(_b = tp.product) === null || _b === void 0 ? void 0 : _b.baseUnit}
                      </span>);
                    })}
                  </div>
                  
                  <div className="card-mobile-row">
                    <div>
                      <span className="card-mobile-label">Agua:</span>
                      <span>{tancada.waterAmount} L</span>
                    </div>
                    <div>
                      <span className="card-mobile-label">Hás:</span>
                      <span>{((_b = tancada.tancadaFields) === null || _b === void 0 ? void 0 : _b.reduce(function (sum, f) { return sum + f.hectaresTreated; }, 0)) || 0} ha</span>
                    </div>
                  </div>
                  
                  {tancada.tancadaFields && tancada.tancadaFields.length > 0 && (<div className="card-mobile-section">
                      <span className="card-mobile-label">Campos:</span>
                      {tancada.tancadaFields.map(function (tf, idx) {
                            var _a;
                            return (<span key={idx} className="badge badge-info" style={{ marginRight: '0.25rem' }}>
                          {(_a = tf.field) === null || _a === void 0 ? void 0 : _a.name}: {tf.hectaresTreated}ha
                        </span>);
                        })}
                    </div>)}
                </div>
                
                <div className="card-mobile-actions">
                  <button className="btn btn-info btn-sm" onClick={function () { return abrirResumen(tancada); }}>
                    📋 Resumen
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={function () { return handleEdit(tancada); }}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={function () { return handleDelete(tancada.id); }}>
                    🗑️
                  </button>
                </div>
              </div>);
            })}
          </div>

          {/* Vista desktop - Tabla */}
          <div className="table-container hide-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tanques</th>
                  <th>Productos</th>
                  <th className="hide-mobile">Agua</th>
                  <th>Hás</th>
                  <th className="hide-mobile">Campos Tratados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tancadas.map(function (tancada) {
                var _a, _b, _c;
                return (<tr key={tancada.id}>
                    <td>{formatDate(tancada.date)}</td>
                    <td>{tancada.tankCapacity} L</td>
                    <td>
                      {(_a = tancada.tancadaProducts) === null || _a === void 0 ? void 0 : _a.map(function (tp, idx) {
                        var _a, _b;
                        return (<div key={idx}>
                          <span className="badge badge-primary" style={{ marginRight: '0.25rem', marginBottom: '0.25rem' }}>
                            {((_a = tp.product) === null || _a === void 0 ? void 0 : _a.name) || '-'}{tp.concentration ? " (".concat(tp.concentration, "%)") : ''}: {tp.quantity} {(_b = tp.product) === null || _b === void 0 ? void 0 : _b.baseUnit}
                          </span>
                        </div>);
                    })}
                    </td>
                    <td className="hide-mobile">{tancada.waterAmount} L</td>
                    <td>
                      <strong>
                        {((_b = tancada.tancadaFields) === null || _b === void 0 ? void 0 : _b.reduce(function (sum, f) { return sum + f.hectaresTreated; }, 0)) || 0} ha
                      </strong>
                    </td>
                    <td className="hide-mobile">
                      {(_c = tancada.tancadaFields) === null || _c === void 0 ? void 0 : _c.map(function (tf, idx) {
                        var _a, _b;
                        return (<div key={idx} style={{ marginBottom: '0.25rem' }}>
                          <span className="badge badge-info" style={{ marginRight: '0.25rem' }}>
                            {((_a = tf.field) === null || _a === void 0 ? void 0 : _a.name) || 'Campo'}
                          </span>
                          <span style={{ fontSize: '0.75rem' }}>
                            {tf.hectaresTreated}/{((_b = tf.field) === null || _b === void 0 ? void 0 : _b.area) || tf.hectaresTreated} ha
                          </span>
                        </div>);
                    })}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-info btn-sm" onClick={function () { return abrirResumen(tancada); }} title="Resumen">
                          📋
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={function () { return handleEdit(tancada); }} title="Editar">
                          ✏️
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={function () { return handleDelete(tancada.id); }} title="Eliminar">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>);
            })}
              </tbody>
            </table>
          </div>
        </>)}

      {/* Modal de Tancada */}
      {showModal && (<div className="modal-overlay" onClick={function () { return setShowModal(false); }}>
          <div className="modal" onClick={function (e) { return e.stopPropagation(); }} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Tancada' : 'Nueva Tancada'}</h3>
              <button className="btn btn-icon btn-secondary" onClick={function () { return setShowModal(false); }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input type="date" className="form-input" value={formData.date} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { date: e.target.value })); }} required/>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tanque Fijo</label>
                    <select className="form-select" value={formData.tankId} onChange={function (e) { return handleTankSelect(e.target.value); }}>
                      <option value="">Seleccionar tanque...</option>
                      {tanks.map(function (tank) { return (<option key={tank.id} value={tank.id}>
                          {tank.name} ({tank.capacity} L)
                        </option>); })}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacidad Tanque (L) *</label>
                    <input type="number" step="0.01" className="form-input" value={formData.tankCapacity} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { tankCapacity: e.target.value })); }} required placeholder="Ej: 500"/>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Agua Total (L) *</label>
                    <input type="number" step="0.01" className="form-input" value={formData.waterAmount} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { waterAmount: e.target.value })); }} required placeholder="Ej: 500"/>
                  </div>
                </div>

                {/* Total Hectareas - FIRST */}
                <div className="form-group">
                  <label className="form-label">
                    Total Hectáreas a Tratar *
                  </label>
                  <input type="number" step="0.01" className="form-input" value={formData.totalHectares} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { totalHectares: e.target.value })); }} placeholder="Ej: 50" style={{ maxWidth: '200px' }}/>
                  {formData.totalHectares && (<div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                      Total: <strong>{formData.totalHectares} hectáreas</strong> a distribuir entre los campos
                    </div>)}
                </div>

                {/* Distribution by field */}
                <div className="form-group">
                  <label className="form-label">
                    Distribución por Campo
                    {distributedHectares > 0 && parseFloat(formData.totalHectares) > 0 && (<span style={{
                    fontWeight: 'normal',
                    color: distributedHectares === parseFloat(formData.totalHectares) ? 'var(--success)' : 'var(--danger)'
                }}>
                        {' '}(Distribuido: {distributedHectares.toFixed(2)} / {formData.totalHectares} ha)
                      </span>)}
                  </label>
                  {fieldDistribution.map(function (fd, index) { return (<div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select className="form-select" value={fd.fieldId} onChange={function (e) {
                    var updated = __spreadArray([], fieldDistribution, true);
                    var selectedField = fields.find(function (f) { return f.id === e.target.value; });
                    updated[index].fieldId = e.target.value;
                    // Auto-fill with remaining hectares when changing field
                    if (selectedField) {
                        var totalTarget = parseFloat(formData.totalHectares) || 0;
                        var otherFieldsHa = fieldDistribution
                            .filter(function (_, i) { return i !== index; })
                            .reduce(function (sum, f) { return sum + (parseFloat(f.hectares) || 0); }, 0);
                        var remaining = Math.max(0, totalTarget - otherFieldsHa);
                        var suggested = Math.min(selectedField.area, remaining);
                        updated[index].hectares = suggested > 0 ? suggested.toString() : '';
                    }
                    setFieldDistribution(updated);
                }} style={{ flex: 2 }}>
                        {fields.map(function (f) { return (<option key={f.id} value={f.id}>
                            {f.name} (total: {f.area} ha)
                          </option>); })}
                      </select>
                      <input type="number" step="0.01" className="form-input" value={fd.hectares} onChange={function (e) { return updateFieldHectares(index, e.target.value); }} placeholder="Ha tratadas" style={{ flex: 1 }}/>
                      <button type="button" className="btn btn-danger btn-sm" onClick={function () { return removeField(index); }}>
                        ✕
                      </button>
                    </div>); })}
                  {fieldDistribution.length < fields.length && (<button type="button" className="btn btn-secondary btn-sm" onClick={addFieldToDistribution}>
                      + Agregar Campo
                    </button>)}
                  
                  {fieldDistribution.length > 0 && (<button type="button" className="btn btn-info btn-sm" style={{ marginLeft: '0.5rem' }} onClick={recalculateQuantities}>
                      🔄 Recalcular cantidades
                    </button>)}
                </div>

                {/* Productos en la mezcla */}
                <div className="form-group">
                  <label className="form-label">Productos en la Mezcla</label>
                  {selectedProducts.map(function (sp, index) {
                var product = products.find(function (p) { return p.id === sp.productId; });
                var totalHa = parseFloat(formData.totalHectares) || 0;
                return (<div key={index} style={{
                        background: 'var(--gray-50)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                          <select className="form-select" value={sp.productId} onChange={function (e) { return handleProductChange(index, 'productId', e.target.value); }} style={{ flex: 2 }}>
                            {products.map(function (p) { return (<option key={p.id} value={p.id}>
                                {p.name}
                              </option>); })}
                          </select>
                          <input type="number" step="0.1" className="form-input" value={sp.concentration} onChange={function (e) { return handleProductChange(index, 'concentration', e.target.value); }} placeholder="Conc %" style={{ flex: 1 }}/>
                          <button type="button" className="btn btn-danger btn-sm" onClick={function () { return handleRemoveProduct(index); }}>
                            ✕
                          </button>
                        </div>
                        
                        {/* Dosis por hectárea */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Dosis por Ha</label>
                            <input type="number" step="0.01" className="form-input" value={sp.dosePerHectare} onChange={function (e) { return handleProductChange(index, 'dosePerHectare', e.target.value); }} placeholder={"Min: ".concat((product === null || product === void 0 ? void 0 : product.dosePerHectareMin) || '-', " - Max: ").concat((product === null || product === void 0 ? void 0 : product.dosePerHectareMax) || '-')}/>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Cantidad Total ({product === null || product === void 0 ? void 0 : product.baseUnit})</label>
                            <input type="number" step="0.01" className="form-input" value={sp.quantity} onChange={function (e) { return handleProductChange(index, 'quantity', e.target.value); }} placeholder="Cantidad"/>
                          </div>
                        </div>
                        
                        {/* Recommended dose range info */}
                        {product && totalHa > 0 && (<div style={{
                            background: 'var(--white)',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--info)',
                            fontSize: '0.75rem'
                        }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                              📋 <strong>Rango recomendado para {product.name}:</strong>
                            </div>
                            <div>
                              Dosis: <strong>{product.dosePerHectareMin || '-'} - {product.dosePerHectareMax || '-'} {product.baseUnit}/ha</strong>
                            </div>
                            <div style={{ marginTop: '0.25rem' }}>
                              Cantidad recomendada: <strong>{(totalHa * (product.dosePerHectareMin || 0)).toFixed(2)} - {(totalHa * (product.dosePerHectareMax || 0)).toFixed(2)} {product.baseUnit}</strong>
                            </div>
                            {sp.dosePerHectare && (<div style={{ fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>
                                → Actual: {sp.quantity || '0'} {product.baseUnit} ({totalHa} ha × {sp.dosePerHectare} {product.baseUnit}/ha)
                              </div>)}
                          </div>)}

                        {/* Lot selection for this product */}
                        {product && (<div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--gray-300)' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--gray-700)' }}>
                              📦 Lotes a utilizar
                            </label>
                            
                            {sp.lots && sp.lots.length > 0 && (<div style={{ marginTop: '0.5rem' }}>
                                {sp.lots.map(function (lot, lotIdx) {
                                var _a, _b;
                                var selectedLot = lots.find(function (l) { return l.id === lot.lotId; });
                                var stock = (_b = (_a = lotStocks[lot.lotId]) !== null && _a !== void 0 ? _a : selectedLot === null || selectedLot === void 0 ? void 0 : selectedLot.initialStock) !== null && _b !== void 0 ? _b : 0;
                                var expiryText = (selectedLot === null || selectedLot === void 0 ? void 0 : selectedLot.expiryDate)
                                    ? " | Vence: ".concat(new Date(selectedLot.expiryDate).toLocaleDateString('es-AR'))
                                    : '';
                                return (<div key={lotIdx}>
                                      {/* Selected lot info */}
                                      <div style={{
                                        background: '#e3f2fd',
                                        padding: '0.4rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.7rem',
                                        marginBottom: '0.4rem'
                                    }}>
                                        📦 Stock: <strong>{stock}</strong>{expiryText}
                                      </div>
                                      
                                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <select className="form-select" value={lot.lotId} onChange={function (e) {
                                        var updated = __spreadArray([], selectedProducts, true);
                                        updated[index].lots[lotIdx].lotId = e.target.value;
                                        setSelectedProducts(updated);
                                    }} style={{ flex: 2, fontSize: '0.75rem' }}>
                                          {getProductLots(product.id).map(function (l) { return (<option key={l.id} value={l.id}>
                                              {l.lotCode ? "C\u00F3digo: ".concat(l.lotCode) : "Lote ".concat(l.id.slice(0, 8))}
                                            </option>); })}
                                        </select>
                                        <input type="number" step="0.01" className="form-input" value={lot.quantityUsed} onChange={function (e) { return handleLotQuantityChange(index, lotIdx, parseFloat(e.target.value) || 0); }} placeholder="Cant" style={{ flex: 1, fontSize: '0.75rem' }}/>
                                        <button type="button" className="btn btn-danger btn-sm" onClick={function () { return handleRemoveLotFromProduct(index, lotIdx); }} style={{ padding: '0.25rem 0.5rem' }}>
                                          ✕
                                        </button>
                                      </div>
                                    </div>);
                            })}
                              </div>)}
                            {getProductLots(product.id).length > 0 && (<button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.25rem', fontSize: '0.7rem' }} onClick={function () { return handleAddLotToProduct(index); }}>
                                + Agregar Lote
                              </button>)}
                            {getProductLots(product.id).length === 0 && (<div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                No hay lotes disponibles para este producto
                              </div>)}
                          </div>)}
                      </div>);
            })}
                  {selectedProducts.length < products.length && products.length > 0 && (<button type="button" className="btn btn-secondary btn-sm" onClick={handleAddProduct}>
                      + Agregar Producto ({selectedProducts.length}/{products.length})
                    </button>)}
                  {products.length === 0 && (<div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                      No hay productos disponibles. Creá productos primero.
                    </div>)}
                </div>

                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { notes: e.target.value })); }} placeholder="Observaciones..."/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function () { return setShowModal(false); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!formData.totalHectares || selectedProducts.length === 0}>
                {editingId ? 'Actualizar Tancada' : 'Registrar Tancada'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Modal de Resumen en Texto */}
      {showResumen && resumenTancada && (<div className="modal-overlay" onClick={function () { return setShowResumen(false); }}>
          <div className="modal" onClick={function (e) { return e.stopPropagation(); }} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Resumen de Tancada</h3>
              <button className="btn btn-icon btn-secondary" onClick={function () { return setShowResumen(false); }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                background: 'var(--gray-100)',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.9rem',
                lineHeight: '1.6'
            }}>
                {generarResumenTexto(resumenTancada)}
              </pre>
              <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                var text, e_1, textArea, successful;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            text = generarResumenTexto(resumenTancada);
                            if (!(navigator.clipboard && window.isSecureContext)) return [3 /*break*/, 4];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, navigator.clipboard.writeText(text)];
                        case 2:
                            _a.sent();
                            alert('Resumen copiado al portapapeles');
                            return [2 /*return*/];
                        case 3:
                            e_1 = _a.sent();
                            console.log('Clipboard API failed, trying fallback');
                            return [3 /*break*/, 4];
                        case 4:
                            // Fallback for HTTP or non-secure contexts
                            try {
                                textArea = document.createElement('textarea');
                                textArea.value = text;
                                textArea.style.position = 'fixed';
                                textArea.style.left = '-999999px';
                                textArea.style.top = '-999999px';
                                document.body.appendChild(textArea);
                                textArea.focus();
                                textArea.select();
                                successful = document.execCommand('copy');
                                document.body.removeChild(textArea);
                                if (successful) {
                                    alert('Resumen copiado al portapapeles');
                                }
                                else {
                                    alert('No se pudo copiar. Podés seleccionar el texto y copiarlo manualmente.');
                                }
                            }
                            catch (err) {
                                alert('No se pudo copiar. Seleccioná el texto y copialo manualmente.');
                            }
                            return [2 /*return*/];
                    }
                });
            }); }}>
                📋 Copiar al Portapapeles
              </button>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={function () { return setShowResumen(false); }}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>) /* Mobile Wizard Modal */}/* Mobile Wizard Modal */

      {/* Mobile Wizard Modal */}
      {showWizard && (<div className="modal-overlay" onClick={closeWizard}>
          <div className="modal" onClick={function (e) { return e.stopPropagation(); }} style={{ maxWidth: '100%', margin: '0.5rem', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {wizardState.step === 'date-tank' && '1. Fecha y Tanque'}
                {wizardState.step === 'hectares' && '2. Hectáreas'}
                {wizardState.step === 'fields' && '3. Campos'}
                {wizardState.step === 'products' && '4. Productos'}
                {wizardState.step === 'notes' && '5. Notas'}
                {wizardState.step === 'confirm' && '6. Confirmar'}
              </h3>
              <button className="btn btn-icon btn-secondary" onClick={closeWizard}>✕</button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {/* Step 1: Date and Tank */}
              {wizardState.step === 'date-tank' && (<div>
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input type="date" className="form-input" value={wizardState.date} onChange={function (e) { return setWizardState(__assign(__assign({}, wizardState), { date: e.target.value })); }}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanque Fijo (opcional)</label>
                    <select className="form-select" value={wizardState.tankId} onChange={function (e) {
                    var tank = tanks.find(function (t) { return t.id === e.target.value; });
                    setWizardState(__assign(__assign({}, wizardState), { tankId: e.target.value, tankCapacity: tank ? tank.capacity.toString() : '' }));
                }}>
                      <option value="">Sin tanque fijo</option>
                      {tanks.map(function (tank) { return (<option key={tank.id} value={tank.id}>{tank.name} ({tank.capacity}L)</option>); })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacidad Tanque (L) *</label>
                    <input type="number" step="0.01" className="form-input" value={wizardState.tankCapacity} onChange={function (e) { return setWizardState(__assign(__assign({}, wizardState), { tankCapacity: e.target.value })); }} placeholder="Ej: 500"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Agua Total (L) *</label>
                    <input type="number" step="0.01" className="form-input" value={wizardState.waterAmount} onChange={function (e) { return setWizardState(__assign(__assign({}, wizardState), { waterAmount: e.target.value })); }} placeholder="Ej: 500"/>
                  </div>
                </div>)}

              {/* Step 2: Hectares */}
              {wizardState.step === 'hectares' && (<div>
                  <div className="form-group">
                    <label className="form-label">Total Hectáreas a Tratar *</label>
                    <input type="number" step="0.01" className="form-input" value={wizardState.totalHectares} onChange={function (e) { return setWizardState(__assign(__assign({}, wizardState), { totalHectares: e.target.value })); }} placeholder="Ej: 50"/>
                    {wizardState.totalHectares && (<p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        Estas hectáreas se distribuirán entre los campos
                      </p>)}
                  </div>
                </div>)}

              {/* Step 3: Fields */}
              {wizardState.step === 'fields' && (<div>
                  {wizardState.fields.length > 0 && (<div style={{ marginBottom: '1rem' }}>
                      {wizardState.fields.map(function (fd, index) {
                        var field = fields.find(function (f) { return f.id === fd.fieldId; });
                        return (<div key={index} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{field === null || field === void 0 ? void 0 : field.name}</div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input type="number" step="0.01" className="form-input" value={fd.hectares} onChange={function (e) { return handleWizardFieldChange(index, e.target.value); }} placeholder="Hectáreas"/>
                              <span style={{ alignSelf: 'center', color: 'var(--gray-600)' }}>/ {field === null || field === void 0 ? void 0 : field.area} ha</span>
                              <button type="button" className="btn btn-danger btn-sm" onClick={function () { return handleWizardRemoveField(index); }}>
                                ✕
                              </button>
                            </div>
                          </div>);
                    })}
                      <div style={{ fontSize: '0.8rem', color: distributedHectaresWizard === parseFloat(wizardState.totalHectares) ? 'var(--success)' : 'var(--danger)' }}>
                        Distribuido: {distributedHectaresWizard.toFixed(2)} / {wizardState.totalHectares || 0} ha
                      </div>
                    </div>)}
                  
                  {wizardState.fields.length < fields.length && (<button type="button" className="btn btn-secondary" onClick={handleWizardAddField}>
                      + Agregar Campo
                    </button>)}
                </div>)}

              {/* Step 4: Products */}
              {wizardState.step === 'products' && (<div>
                  {wizardState.products.map(function (sp, index) {
                    var product = products.find(function (p) { return p.id === sp.productId; });
                    var totalHa = parseFloat(wizardState.totalHectares) || 0;
                    return (<div key={index} style={{
                            background: 'var(--gray-50)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.75rem'
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong>{product === null || product === void 0 ? void 0 : product.name}</strong>
                          <button type="button" className="btn btn-danger btn-sm" onClick={function () { return handleWizardRemoveProduct(index); }}>
                            ✕
                          </button>
                        </div>
                        
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Concentración (%)</label>
                          <input type="number" step="0.1" className="form-input" value={sp.concentration} onChange={function (e) {
                            var updated = __spreadArray([], wizardState.products, true);
                            updated[index].concentration = e.target.value;
                            setWizardState(__assign(__assign({}, wizardState), { products: updated }));
                        }} placeholder="Opcional"/>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Dosis/Ha</label>
                            <input type="number" step="0.01" className="form-input" value={sp.dosePerHectare} onChange={function (e) {
                            var updated = __spreadArray([], wizardState.products, true);
                            updated[index].dosePerHectare = e.target.value;
                            var dose = parseFloat(e.target.value) || 0;
                            if (totalHa > 0 && dose > 0) {
                                updated[index].quantity = (totalHa * dose).toFixed(2);
                            }
                            setWizardState(__assign(__assign({}, wizardState), { products: updated }));
                        }} placeholder={product ? "".concat(product.dosePerHectareMin || '-', "-").concat(product.dosePerHectareMax || '-') : ''}/>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Cantidad ({product === null || product === void 0 ? void 0 : product.baseUnit})</label>
                            <input type="number" step="0.01" className="form-input" value={sp.quantity} onChange={function (e) {
                            var updated = __spreadArray([], wizardState.products, true);
                            updated[index].quantity = e.target.value;
                            setWizardState(__assign(__assign({}, wizardState), { products: updated }));
                        }} placeholder="Cantidad"/>
                          </div>
                        </div>
                      </div>);
                })}

                  {/* Ask to add another product */}
                  {!addingProduct && (<div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <p style={{ marginBottom: '0.5rem' }}>¿Querés agregar otro producto?</p>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button type="button" className="btn btn-primary" onClick={handleWizardAddProduct} disabled={wizardState.products.length >= products.length}>
                          ✓ Sí, agregar más
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={function () { return nextStep(); }}>
                          ✓ No, terminar productos
                        </button>
                      </div>
                    </div>)}
                </div>)}

              {/* Step 5: Notes */}
              {wizardState.step === 'notes' && (<div>
                  <div className="form-group">
                    <label className="form-label">Notas (opcional)</label>
                    <textarea className="form-textarea" value={wizardState.notes} onChange={function (e) { return setWizardState(__assign(__assign({}, wizardState), { notes: e.target.value })); }} placeholder="Observaciones..." rows={4}/>
                  </div>
                </div>)}

              {/* Step 6: Confirm */}
              {wizardState.step === 'confirm' && (<div>
                  <div style={{ background: 'var(--gray-100)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                    <h4 style={{ marginBottom: '0.75rem' }}>Resumen de la Tancada</h4>
                    <p><strong>Fecha:</strong> {new Date(wizardState.date).toLocaleDateString('es-AR')}</p>
                    <p><strong>Agua:</strong> {wizardState.waterAmount}L</p>
                    <p><strong>Tanque:</strong> {wizardState.tankCapacity}L</p>
                    <p><strong>Hectáreas:</strong> {wizardState.totalHectares} ha</p>
                    <p><strong>Campos:</strong> {wizardState.fields.map(function (f) { var _a; return (_a = fields.find(function (field) { return field.id === f.fieldId; })) === null || _a === void 0 ? void 0 : _a.name; }).join(', ')}</p>
                    <p><strong>Productos:</strong> {wizardState.products.map(function (p) { var _a; return (_a = products.find(function (prod) { return prod.id === p.productId; })) === null || _a === void 0 ? void 0 : _a.name; }).join(', ')}</p>
                    {wizardState.notes && <p><strong>Notas:</strong> {wizardState.notes}</p>}
                  </div>
                </div>)}
            </div>

            <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              {wizardState.step !== 'date-tank' && wizardState.step !== 'products' && (<button type="button" className="btn btn-secondary" onClick={prevStep} style={{ flex: '1 1 auto' }}>
                  ← Atrás
                </button>)}
              
              {wizardState.step !== 'confirm' && wizardState.step !== 'products' && (<button type="button" className="btn btn-primary" onClick={nextStep} style={{ flex: '1 1 auto' }} disabled={(wizardState.step === 'date-tank' && (!wizardState.tankCapacity || !wizardState.waterAmount)) ||
                    (wizardState.step === 'hectares' && !wizardState.totalHectares) ||
                    (wizardState.step === 'fields' && wizardState.fields.length === 0)}>
                  Siguiente →
                </button>)}

              {wizardState.step === 'confirm' && (<button type="button" className="btn btn-primary" onClick={submitWizardTancada} style={{ flex: '1 1 auto', width: '100%' }}>
                  ✓ Confirmar Tancada
                </button>)}
            </div>
          </div>
        </div>)}
    </div>);
}
