"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ll = require("../lowLevelAST");
var path = require("path");
var universes = require("../tools/universe");
var yaml = require("yaml-ast-parser");
var universeHelpers = require("../tools/universeHelpers");
var referencepatcherLL = require("./referencePatcherLL");
var resourceRegistry = require("../jsyaml/resourceRegistry");
var hlImpl = require("../highLevelImpl");
var def = require("raml-definition-system");
var _ = require("underscore");
var util = require("../../util/index");
var NamespaceResolver = /** @class */ (function () {
    function NamespaceResolver() {
        this.expandedAbsToNsMap = {};
        this._expandedNSMap = {};
        this.byPathMap = {};
        this.byNsMap = {};
        this._hasFragments = {};
        this._unitModels = {};
    }
    NamespaceResolver.prototype.hasTemplates = function (unit) {
        var uModel = this.unitModel(unit);
        if (!uModel.traits.isEmpty() || !uModel.resourceTypes.isEmpty()) {
            return true;
        }
        var epMap = this.expandedPathMap(unit);
        if (epMap) {
            for (var _i = 0, _a = Object.keys(epMap); _i < _a.length; _i++) {
                var p = _a[_i];
                var u = epMap[p].unit;
                var uModel1 = this.unitModel(u);
                if (!uModel1.traits.isEmpty() || !uModel1.resourceTypes.isEmpty()) {
                    return true;
                }
            }
        }
        var eValue = extendsValue(unit);
        while (eValue) {
            unit = unit.resolve(eValue);
            if (unit) {
                uModel = this.unitModel(unit);
                if (!uModel.traits.isEmpty() || !uModel.resourceTypes.isEmpty()) {
                    return true;
                }
                eValue = extendsValue(unit);
            }
            else {
                eValue = null;
            }
        }
        return false;
    };
    NamespaceResolver.prototype.resolveNamespace = function (from, to) {
        if (to == null) {
            return null;
        }
        var toPath = to.absolutePath();
        var unitMap = this.expandedPathMap(from);
        if (!unitMap) {
            return null;
        }
        var usesInfo = unitMap[toPath];
        return usesInfo;
    };
    NamespaceResolver.prototype.expandedNSMap = function (unit) {
        var aPath = unit.absolutePath();
        var result = this._expandedNSMap[aPath];
        if (result === undefined) {
            var pm = this.expandedPathMap(unit);
            if (!pm) {
                result = null;
            }
            else {
                result = {};
                for (var _i = 0, _a = Object.keys(pm); _i < _a.length; _i++) {
                    var ap = _a[_i];
                    var uInfo = pm[ap];
                    result[uInfo.namespace()] = uInfo;
                }
            }
            this._expandedNSMap[aPath] = result;
        }
        return result;
    };
    NamespaceResolver.prototype.expandedPathMap = function (unit) {
        var fromPath = unit.absolutePath();
        var unitMap = this.expandedAbsToNsMap[fromPath];
        if (unitMap === undefined) {
            unitMap = this.calculateExpandedNamespaces(unit);
            if (Object.keys(unitMap).length == 0) {
                unitMap = null;
            }
            this.expandedAbsToNsMap[fromPath] = unitMap;
        }
        return unitMap;
    };
    NamespaceResolver.prototype.calculateExpandedNamespaces = function (_unit) {
        var _this = this;
        var rootPath = path.dirname(_unit.absolutePath());
        var result = {};
        var usesInfoArray = [];
        while (_unit) {
            usesInfoArray.push(new UsesInfo([], _unit, ""));
            var u = _unit;
            _unit = null;
            var node = u.ast();
            if (node && node.kind() != yaml.Kind.SCALAR) {
                var fLine = hlImpl.ramlFirstLine(u.contents());
                if (fLine && fLine.length == 3 && (fLine[2] == def.universesInfo.Universe10.Overlay.name ||
                    fLine[2] == def.universesInfo.Universe10.Extension.name)) {
                    var eValue = extendsValue(u);
                    if (eValue) {
                        _unit = u.resolve(eValue);
                        if (_unit && resourceRegistry.isWaitingFor(_unit.absolutePath())) {
                            _unit = null;
                        }
                    }
                }
            }
        }
        var _loop_1 = function () {
            visited = {};
            usedUnits = {};
            info = usesInfoArray[i];
            unit = info.unit;
            var unitAbsPath = unit.absolutePath();
            node = unit.ast();
            if (!node || node.kind() == yaml.Kind.SCALAR) {
                return "continue";
            }
            steps = info.steps() + 1;
            visit = function (x) {
                if (!x) {
                    return;
                }
                var children = x.children();
                var nodeUnit = x.unit();
                var localPath = nodeUnit.absolutePath();
                if (x.parent() == null) {
                    if (visited[localPath]) {
                        return;
                    }
                    visited[localPath] = true;
                    if (localPath != unitAbsPath) {
                        var fLine_1 = hlImpl.ramlFirstLine(nodeUnit.contents());
                        if (fLine_1 && fLine_1.length == 3 && fLine_1[1] == "1.0") {
                            _this._hasFragments[unitAbsPath] = true;
                        }
                    }
                    var map = _this.pathMap(nodeUnit);
                    if (map) {
                        for (var _i = 0, _a = Object.keys(map); _i < _a.length; _i++) {
                            var absPath = _a[_i];
                            var childInfo = map[absPath];
                            var segments = info.namespaceSegments.concat(childInfo.namespaceSegments);
                            var usesNodes = info.usesNodes.concat(childInfo.usesNodes);
                            var existing = result[absPath];
                            if (existing) {
                                if (existing.steps() < steps) {
                                    continue;
                                }
                                else if (existing.steps() == steps
                                    && _this.lexLessEq(existing.namespaceSegments, segments)) {
                                    continue;
                                }
                            }
                            var includePath;
                            var childInclude = childInfo.includePath;
                            var absChildPath = childInfo.absolutePath();
                            if (path.isAbsolute(info.includePath) || ll.isWebPath(info.includePath)) {
                                includePath = absChildPath;
                            }
                            else if (path.isAbsolute(childInclude) || ll.isWebPath(childInclude)) {
                                includePath = absChildPath;
                            }
                            else {
                                if (ll.isWebPath(rootPath) != ll.isWebPath(absChildPath)) {
                                    includePath = absChildPath;
                                }
                                else if (rootPath.length > 0 && absChildPath.length > 0
                                    && rootPath.charAt(0).toLowerCase() != absChildPath.charAt(0).toLowerCase()) {
                                    //Windows case of library being located on different drive
                                    includePath = absChildPath;
                                }
                                else {
                                    includePath = path.relative(rootPath, absChildPath);
                                }
                            }
                            includePath = includePath.replace(/\\/g, "/");
                            var ui = new UsesInfo(usesNodes, childInfo.unit, includePath);
                            if (!usedUnits[ui.absolutePath()]) {
                                result[absPath] = ui;
                                usesInfoArray.push(ui);
                                usedUnits[ui.absolutePath()] = true;
                            }
                        }
                    }
                }
                children.forEach(function (y) {
                    if (y.valueKind() == yaml.Kind.INCLUDE_REF) {
                        var includedUnit = nodeUnit.resolve(y.includePath());
                        if (includedUnit) {
                            if (!includedUnit.isRAMLUnit()) {
                                return;
                            }
                            visit(includedUnit.ast());
                        }
                    }
                    else {
                        visit(y);
                    }
                });
                if (x.parent() == null) {
                    visited[localPath] = false;
                }
            };
            visit(node);
        };
        var visited, usedUnits, info, unit, node, steps, visit;
        for (var i = 0; i < usesInfoArray.length; i++) {
            _loop_1();
        }
        var namespaces = {};
        for (var _i = 0, _a = Object.keys(result); _i < _a.length; _i++) {
            var key = _a[_i];
            var info = result[key];
            var ns = info.namespace();
            var i = 0;
            while (namespaces[ns]) {
                ns = info.namespace() + i++;
            }
            if (ns != info.namespace()) {
                info.namespaceSegments = ns.split(".");
            }
            namespaces[ns] = true;
        }
        return result;
    };
    NamespaceResolver.prototype.pathMap = function (unit) {
        var fromPath = unit.absolutePath();
        var unitMap = this.byPathMap[fromPath];
        if (unitMap === undefined) {
            unitMap = this.calculateNamespaces(unit);
            if (Object.keys(unitMap).length == 0) {
                unitMap = null;
            }
            this.byPathMap[fromPath] = unitMap;
        }
        return unitMap;
    };
    NamespaceResolver.prototype.nsMap = function (unit) {
        var fromPath = unit.absolutePath();
        var unitMap = this.byNsMap[fromPath];
        if (unitMap === undefined) {
            var map = this.pathMap(unit);
            if (map == null) {
                unitMap = null;
            }
            else {
                unitMap = {};
                for (var _i = 0, _a = Object.keys(map); _i < _a.length; _i++) {
                    var aPath = _a[_i];
                    var info = map[aPath];
                    unitMap[info.namespace()] = info;
                }
            }
            this.byNsMap[fromPath] = unitMap;
        }
        return unitMap;
    };
    NamespaceResolver.prototype.calculateNamespaces = function (unit) {
        var rootPath = path.dirname(unit.absolutePath());
        var result = {};
        var rootNode = unit.ast();
        var usesNodes = rootNode.children().filter(function (x) { return x.key()
            == universes.Universe10.FragmentDeclaration.properties.uses.name; });
        if (rootNode.actual() && rootNode.actual()["usesNode"]) {
            usesNodes = [rootNode.actual()["usesNode"]];
        }
        if (usesNodes.length == 0) {
            return result;
        }
        var usesDeclarationNodes = [];
        for (var _i = 0, usesNodes_1 = usesNodes; _i < usesNodes_1.length; _i++) {
            var un = usesNodes_1[_i];
            usesDeclarationNodes = usesDeclarationNodes.concat(un.children());
        }
        if (usesDeclarationNodes.length == 0) {
            return result;
        }
        for (var _a = 0, usesDeclarationNodes_1 = usesDeclarationNodes; _a < usesDeclarationNodes_1.length; _a++) {
            var un = usesDeclarationNodes_1[_a];
            var value = un.value();
            var libUnit = unit.resolve(value);
            if (libUnit == null) {
                continue;
            }
            var usesNodes = [un];
            var absPath = libUnit.absolutePath();
            var includePath;
            if (ll.isWebPath(value)) {
                includePath = libUnit.absolutePath();
            }
            else {
                includePath = path.relative(rootPath, libUnit.absolutePath());
            }
            includePath = includePath.replace(/\\/g, "/");
            var ui = new UsesInfo(usesNodes, libUnit, includePath);
            result[absPath] = ui;
        }
        var node = unit.ast();
        if (node && node.kind() != yaml.Kind.SCALAR) {
            var fLine = hlImpl.ramlFirstLine(unit.contents());
            if (fLine.length == 3 && (fLine[2] == def.universesInfo.Universe10.Overlay.name ||
                fLine[2] == def.universesInfo.Universe10.Extension.name)) {
                var eNode = _.find(node.children(), function (x) { return x.key() == universes.Universe10.Extension.properties.extends.name; });
                if (eNode) {
                    var eValue = eNode.value(true);
                    var extendedUnit;
                    try {
                        extendedUnit = unit.resolve(eValue);
                    }
                    catch (e) {
                    }
                    if (extendedUnit) {
                        var m = this.pathMap(extendedUnit);
                        if (m) {
                            for (var _b = 0, _c = Object.keys(m); _b < _c.length; _b++) {
                                var k = _c[_b];
                                result[k] = m[k];
                            }
                        }
                    }
                }
            }
        }
        return result;
    };
    NamespaceResolver.prototype.lexLessEq = function (a, b) {
        if (a.length > b.length) {
            return false;
        }
        if (a.length < b.length) {
            return true;
        }
        for (var i = 0; i < a.length; i++) {
            var seg_a = a[i];
            var seg_b = b[i];
            if (seg_a < seg_b) {
                return true;
            }
            else if (seg_a > seg_b) {
                return false;
            }
        }
        return true;
    };
    NamespaceResolver.prototype.hasFragments = function (unit) {
        if (!unit.isRAMLUnit()) {
            return false;
        }
        var fLine = hlImpl.ramlFirstLine(unit.contents());
        if (!fLine || fLine.length < 2 || fLine[1] != "1.0") {
            return false;
        }
        this.expandedPathMap(unit);
        return this._hasFragments[unit.absolutePath()] ? true : false;
    };
    NamespaceResolver.prototype.unitModel = function (unit, passed) {
        var aPath = unit.absolutePath();
        var result = this._unitModels[aPath];
        if (result) {
            return result;
        }
        result = new UnitModel(unit);
        this._unitModels[aPath] = result;
        initUnitModel(result, this, passed);
        return result;
    };
    NamespaceResolver.prototype.deleteUnitModel = function (aPath) {
        delete this._unitModels[aPath];
    };
    NamespaceResolver.prototype.getComponent = function (rootUnit, type, namespace, name, passed) {
        var nsMap = this.expandedNSMap(rootUnit);
        if (nsMap) {
            var referencedUnit = rootUnit;
            if (namespace) {
                var uInfo = nsMap[namespace];
                referencedUnit = uInfo ? uInfo.unit : null;
            }
            if (referencedUnit) {
                var uModel = this.unitModel(referencedUnit, passed);
                var templateCollection = uModel[type];
                if (templateCollection && ElementsCollection.isInstance(templateCollection)) {
                    var tModel = templateCollection.getTemplateModel(name);
                    if (tModel && !tModel.isInitialized()) {
                        initTemplateModel(tModel, this, passed);
                    }
                    return tModel;
                }
            }
        }
    };
    return NamespaceResolver;
}());
exports.NamespaceResolver = NamespaceResolver;
var UsesInfo = /** @class */ (function () {
    function UsesInfo(usesNodes, unit, includePath) {
        this.usesNodes = usesNodes;
        this.unit = unit;
        this.includePath = includePath;
        this.namespaceSegments = this.usesNodes.map(function (x) { return x.key(); });
    }
    UsesInfo.prototype.steps = function () {
        return this.namespaceSegments.length;
    };
    UsesInfo.prototype.namespace = function () {
        return this.namespaceSegments.join(".");
    };
    UsesInfo.prototype.absolutePath = function () {
        return this.unit.absolutePath();
    };
    return UsesInfo;
}());
exports.UsesInfo = UsesInfo;
var ElementsCollection = /** @class */ (function () {
    function ElementsCollection(name) {
        this.name = name;
        this.array = [];
        this.map = {};
    }
    ElementsCollection.isInstance = function (instance) {
        return instance != null && instance.getClassIdentifier
            && typeof (instance.getClassIdentifier) == "function"
            && _.contains(instance.getClassIdentifier(), ElementsCollection.CLASS_IDENTIFIER);
    };
    ElementsCollection.prototype.getClassIdentifier = function () {
        var superIdentifiers = [];
        return superIdentifiers.concat(ElementsCollection.CLASS_IDENTIFIER);
    };
    ElementsCollection.prototype.hasElement = function (name) {
        return (this.map[name] != null);
    };
    ElementsCollection.prototype.getElement = function (name) {
        return this.map[name];
    };
    ElementsCollection.prototype.getTemplateModel = function (name) {
        if (!this.templateModels) {
            return null;
        }
        return this.templateModels[name];
    };
    ElementsCollection.prototype.isEmpty = function () {
        return this.array.length == 0;
    };
    ElementsCollection.CLASS_IDENTIFIER = "namespaceResolver.ElementsCollection";
    return ElementsCollection;
}());
exports.ElementsCollection = ElementsCollection;
var UnitModel = /** @class */ (function () {
    function UnitModel(unit) {
        this.unit = unit;
        this.init();
    }
    UnitModel.prototype.type = function () {
        return this._type;
    };
    UnitModel.prototype.init = function () {
        this.types = new ElementsCollection(def.universesInfo.Universe10.LibraryBase.properties.types.name);
        this.annotationTypes = new ElementsCollection(def.universesInfo.Universe10.LibraryBase.properties.annotationTypes.name);
        this.securitySchemes = new ElementsCollection(def.universesInfo.Universe10.LibraryBase.properties.securitySchemes.name);
        this.traits = new ElementsCollection(def.universesInfo.Universe10.LibraryBase.properties.traits.name);
        this.resourceTypes = new ElementsCollection(def.universesInfo.Universe10.LibraryBase.properties.resourceTypes.name);
        var fLine = hlImpl.ramlFirstLine(this.unit.contents());
        if (fLine) {
            if (fLine.length < 3 || !fLine[2]) {
                this._type = def.universesInfo.Universe10.Api.name;
            }
            else {
                this._type = fLine[2];
            }
        }
    };
    UnitModel.prototype.isOverlayOrExtension = function () {
        return this._type == def.universesInfo.Universe10.Overlay.name
            || this._type == def.universesInfo.Universe10.Extension.name;
    };
    UnitModel.prototype.extensionSet = function () {
        if (!this._extensionSet) {
            this._extensionSet = {};
            this._extensionChain = [];
            var um = this;
            while (um) {
                var aPath = um.unit.absolutePath();
                if (this._extensionSet[aPath]) {
                    break;
                }
                this._extensionSet[aPath] = um;
                this._extensionChain.push(um);
                um = um.master;
            }
        }
        return this._extensionSet;
    };
    UnitModel.prototype.extensionChain = function () {
        if (!this._extensionChain) {
            this.extensionSet();
        }
        return this._extensionChain;
    };
    UnitModel.prototype.collection = function (collectionName) {
        if (collectionName == "types") {
            return this.types;
        }
        else if (collectionName == "annotationTypes") {
            return this.annotationTypes;
        }
        else if (collectionName == "resourceTypes") {
            return this.resourceTypes;
        }
        else if (collectionName == "traits") {
            return this.traits;
        }
        else if (collectionName == "securitySchemes") {
            return this.securitySchemes;
        }
        return null;
    };
    return UnitModel;
}());
exports.UnitModel = UnitModel;
function extendsValue(u) {
    var node = u.ast();
    var eNode = _.find(node.children(), function (x) { return x.key() == universes.Universe10.Extension.properties.extends.name; });
    var result = eNode && eNode.value();
    var newUnit = u.resolve(result);
    if (newUnit === u) {
        return null;
    }
    return result;
}
var transitionsMap;
function initTransitions() {
    if (transitionsMap) {
        return;
    }
    transitionsMap = {};
    for (var _i = 0, _a = Object.keys(referencepatcherLL.transitions); _i < _a.length; _i++) {
        var key = _a[_i];
        var trSchema = referencepatcherLL.transitions[key];
        var tr = new referencepatcherLL.Transition(key, trSchema, transitionsMap);
        transitionsMap[key] = tr;
    }
    var factory = new NamespaceResolverActionsAndConditionsFactory();
    for (var _b = 0, _c = Object.keys(transitionsMap); _b < _c.length; _b++) {
        var key = _c[_b];
        transitionsMap[key].init(factory);
    }
}
function templateKey(path, kind, name) {
    return path + "|" + kind + "|" + name;
}
;
var TemplateModel = /** @class */ (function () {
    function TemplateModel(name, kind, node, typeValuedParameters) {
        this.name = name;
        this.kind = kind;
        this.node = node;
        this.typeValuedParameters = typeValuedParameters;
    }
    TemplateModel.prototype.isInitialized = function () {
        return this.typeValuedParameters != null;
    };
    TemplateModel.prototype.id = function () {
        return this.node.unit().absolutePath() + "|" + this.kind + "|" + this.node.key();
    };
    return TemplateModel;
}());
exports.TemplateModel = TemplateModel;
var NamespaceResolverActionsAndConditionsFactory = /** @class */ (function () {
    function NamespaceResolverActionsAndConditionsFactory() {
        this.parent = new referencepatcherLL.ReferencePatcherActionsAndConditionsFactory();
    }
    NamespaceResolverActionsAndConditionsFactory.prototype.action = function (actionName) {
        var action = dummyAction;
        if (actionName == "##patch") {
            action = checkTypeValue;
        }
        else if (actionName == "##patchAnnotationName") {
            action = checkAnnotationNameValue;
        }
        else if (actionName == "##patchResourceTypeReference") {
            action = checkResourceTypeReferenceAction;
        }
        else if (actionName == "##patchTraitReference") {
            action = checkTraitReferenceAction;
        }
        return action;
    };
    NamespaceResolverActionsAndConditionsFactory.prototype.condition = function (name) {
        return this.parent.condition(name);
    };
    return NamespaceResolverActionsAndConditionsFactory;
}());
exports.NamespaceResolverActionsAndConditionsFactory = NamespaceResolverActionsAndConditionsFactory;
function checkTraitReferenceAction(node, state) {
    var kind = def.universesInfo.Universe10.LibraryBase.properties.traits.name;
    if (node.kind() != yaml.Kind.SCALAR) {
        if (node.key() == null) {
            node = node.children()[0];
        }
    }
    if (node.kind() == yaml.Kind.SCALAR) {
        return false;
    }
    checkReferenceAction(node, state, kind);
    return false;
}
function checkResourceTypeReferenceAction(node, state) {
    if (node.valueKind() == yaml.Kind.SCALAR) {
        return;
    }
    if (node.children().length == 0) {
        return;
    }
    node = node.children()[0];
    var kind = def.universesInfo.Universe10.LibraryBase.properties.resourceTypes.name;
    checkReferenceAction(node, state, kind);
    return false;
}
function checkTypeValue(node, state) {
    var value = node.value();
    if (typeof value != "string") {
        return false;
    }
    checkStringValue(value, state);
    return false;
}
function checkAnnotationNameValue(node, state) {
    var key = node.key();
    if (!key) {
        return false;
    }
    var annotationName = key.substring(1, key.length - 1);
    checkStringValue(annotationName, state);
}
function checkStringValue(value, state) {
    if (util.stringStartsWith(value, "<<") && util.stringEndsWith(value, ">>")) {
        value = value.substring("<<".length, value.length - ">>".length);
        if (value.indexOf("<<") < 0) {
            state.meta.params[value] = true;
        }
    }
}
;
function checkReferenceAction(node, state, kind) {
    var reusingParams = [];
    for (var _i = 0, _a = node.children(); _i < _a.length; _i++) {
        var ch = _a[_i];
        if (ch.valueKind() != yaml.Kind.SCALAR) {
            continue;
        }
        var val = ch.value();
        if (typeof val != 'string') {
            continue;
        }
        if (!(util.stringStartsWith(val, "<<") && util.stringEndsWith(val, ">>"))) {
            continue;
        }
        val = val.substring(2, val.length - 2);
        if (val.indexOf("<<") >= 0) {
            continue;
        }
        reusingParams.push({
            setParam: ch.key(),
            readParam: val
        });
    }
    if (reusingParams.length == 0) {
        return;
    }
    var templateName = node.key();
    var arr = [];
    var l = templateName.length;
    for (var i = 0; i < l; i++) {
        if (templateName.charAt(i) == ".") {
            arr.push(i);
        }
    }
    var tm;
    if (arr.length > 0) {
        for (var i = arr.length - 1; i >= 0; i--) {
            var ind = arr[i];
            var ns = templateName.substring(0, ind);
            var name_1 = templateName.substring(ind + 1, l);
            tm = state.resolver.getComponent(state.rootUnit, kind, ns, name_1, state.meta.passed);
        }
    }
    else {
        tm = state.resolver.getComponent(state.rootUnit, kind, null, templateName, state.meta.passed);
    }
    if (tm && tm.isInitialized()) {
        for (var _b = 0, reusingParams_1 = reusingParams; _b < reusingParams_1.length; _b++) {
            var e = reusingParams_1[_b];
            if (tm.typeValuedParameters[e.setParam]) {
                state.meta.params[e.readParam] = true;
            }
        }
    }
}
;
function dummyAction(node, state) {
    return false;
}
function extendedUnit(u) {
    var node = u.ast();
    var eNode = _.find(node.children(), function (x) { return x.key() == universes.Universe10.Extension.properties.extends.name; });
    var eValue = eNode && eNode.value();
    if (!eValue) {
        return null;
    }
    return u.resolve(eValue);
}
exports.extendedUnit = extendedUnit;
function initUnitModel(result, resolver, passed) {
    var rootNode = result.unit.ast();
    if (!rootNode) {
        return;
    }
    if (!isLibraryBaseDescendant(result.unit)) {
        return;
    }
    var isRAML08 = (hlImpl.ramlFirstLine(result.unit.contents())[1] == "0.8");
    for (var _i = 0, _a = rootNode.children(); _i < _a.length; _i++) {
        var ch = _a[_i];
        var key = ch.key();
        if (key == def.universesInfo.Universe10.LibraryBase.properties.types.name) {
            contributeCollection(result.types, ch.children());
        }
        else if (key == def.universesInfo.Universe10.LibraryBase.properties.annotationTypes.name) {
            contributeCollection(result.annotationTypes, ch.children());
        }
        else if (key == def.universesInfo.Universe10.LibraryBase.properties.securitySchemes.name) {
            contributeCollection(result.securitySchemes, ch.children(), isRAML08);
        }
        else if (key == def.universesInfo.Universe10.LibraryBase.properties.traits.name) {
            contributeCollection(result.traits, ch.children(), isRAML08);
        }
        else if (key == def.universesInfo.Universe10.LibraryBase.properties.resourceTypes.name) {
            contributeCollection(result.resourceTypes, ch.children(), isRAML08);
        }
    }
    if (!isRAML08) {
        var resourceTypeModels_1 = result.resourceTypes.templateModels;
        var resourceTypes = resourceTypeModels_1
            && Object.keys(resourceTypeModels_1).map(function (x) { return resourceTypeModels_1[x]; }) || [];
        var traitModels_1 = result.traits.templateModels;
        var traits = traitModels_1
            && Object.keys(traitModels_1).map(function (x) { return traitModels_1[x]; }) || [];
        for (var _b = 0, traits_1 = traits; _b < traits_1.length; _b++) {
            var tr = traits_1[_b];
            initTemplateModel(tr, resolver, passed);
        }
        for (var _c = 0, resourceTypes_1 = resourceTypes; _c < resourceTypes_1.length; _c++) {
            var rt = resourceTypes_1[_c];
            initTemplateModel(rt, resolver, passed);
        }
    }
    if (result.isOverlayOrExtension()) {
        var rootNode_1 = result.unit.ast();
        var extendsAttrs = rootNode_1.children().filter(function (x) {
            return x.key() == def.universesInfo.Universe10.Overlay.properties.extends.name;
        });
        if (extendsAttrs.length > 0) {
            var eAttr = extendsAttrs[0];
            var eVal = eAttr.value();
            if (eVal) {
                var masterUnit = result.unit.resolve(eVal);
                if (masterUnit) {
                    var masterUnitModel = resolver.unitModel(masterUnit);
                    result.master = masterUnitModel;
                }
            }
        }
    }
}
exports.initUnitModel = initUnitModel;
function initTemplateModel(tm, resolver, passed) {
    if (passed === void 0) { passed = {}; }
    var tr = transitionsMap[tm.kind];
    if (!tr) {
        return;
    }
    var id = tm.id();
    if (passed[id]) {
        return;
    }
    passed[id] = true;
    try {
        var scope = new referencepatcherLL.Scope();
        var rootUnit = tm.node.unit().project().getMainUnit();
        if (rootUnit) {
            var rootUnitAST = rootUnit.ast();
            var fLine = hlImpl.ramlFirstLine(rootUnit.contents());
            if (rootUnitAST && fLine.length == 3) {
                var universe = fLine[1] == "1.0" ? def.getUniverse("RAML10") : def.getUniverse("RAML08");
                if (universe) {
                    var tName = fLine[2];
                    var type = universe.type(tName);
                    if (type && universeHelpers.isApiSibling(type)) {
                        scope.hasRootMediaType = (_.find(rootUnitAST.children(), function (x) { return x.key() == "mediaType"; }) != null);
                    }
                }
            }
        }
        var state = new referencepatcherLL.State(null, tm.node.unit(), scope, resolver);
        state.meta.params = {};
        state.meta.passed = passed;
        tr.processNode(tm.node, state);
        tm.typeValuedParameters = state.meta.params;
    }
    finally {
        delete passed[id];
    }
}
function isLibraryBaseDescendant(unit) {
    var fLine = hlImpl.ramlFirstLine(unit.contents());
    if (!fLine) {
        return false;
    }
    if (fLine.length < 3 || !fLine[2]) {
        return true;
    }
    var typeName = fLine[2];
    var u = def.getUniverse("RAML10");
    if (!u) {
        return false;
    }
    var t = u.type(typeName);
    if (!t) {
        return false;
    }
    return universeHelpers.isLibraryBaseSibling(t);
}
exports.isLibraryBaseDescendant = isLibraryBaseDescendant;
function contributeCollection(c, nodes, isRAML08) {
    if (isRAML08 === void 0) { isRAML08 = false; }
    var _nodes;
    if (isRAML08) {
        _nodes = [];
        nodes.forEach(function (x) {
            var children = x.children();
            if (children.length > 0) {
                _nodes.push(children[0]);
            }
        });
    }
    else {
        _nodes = nodes;
    }
    _nodes.forEach(function (x) {
        c.array.push(x);
        var name = x.key();
        c.map[name] = x;
        var tm = createTemplateModel(x, c.name);
        if (tm) {
            if (!c.templateModels) {
                c.templateModels = {};
            }
            c.templateModels[name] = tm;
        }
    });
}
function createTemplateModel(node, collectionName) {
    var kind;
    if (collectionName == def.universesInfo.Universe10.LibraryBase.properties.traits.name) {
        kind = def.universesInfo.Universe10.Trait.name;
    }
    else if (collectionName == def.universesInfo.Universe10.LibraryBase.properties.resourceTypes.name) {
        kind = def.universesInfo.Universe10.ResourceType.name;
    }
    if (!kind) {
        return;
    }
    initTransitions();
    var tr = transitionsMap[kind];
    if (!tr) {
        return null;
    }
    var name = node.key();
    return new TemplateModel(name, kind, node, null);
}
//# sourceMappingURL=namespaceResolver.js.map