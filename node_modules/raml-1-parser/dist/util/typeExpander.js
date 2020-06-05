"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var def = require("raml-definition-system");
var builder = require("../parser/ast.core/builder");
var typeSystem = def.rt;
var tsInterfaces = typeSystem.tsInterfaces;
var _ = require("underscore");
var yaml = require("yaml-ast-parser");
var hlImpl = require("../parser/highLevelImpl");
var referencePatcher = require("../parser/ast.core/referencePatcher");
var typeExpressions = def.rt.typeExpressions;
var jsonSerializerHL = require("./jsonSerializerHL");
var PropertyEntry = /** @class */ (function () {
    function PropertyEntry(_original, _name, _type, _required, isFacet, _metadata, _src) {
        if (isFacet === void 0) { isFacet = false; }
        if (_src === void 0) { _src = null; }
        this._original = _original;
        this._name = _name;
        this._type = _type;
        this._required = _required;
        this.isFacet = isFacet;
        this._metadata = _metadata;
        this._src = _src;
    }
    PropertyEntry.prototype.name = function () {
        return this._original ? this._original.name() : this._name;
    };
    PropertyEntry.prototype.original = function () {
        return this._original;
    };
    PropertyEntry.prototype.append = function (te, bd) {
        var propType;
        if (this._type.isUnion()) {
            var union = this._type;
            var optionId = bd.branchingOption(union.branchId());
            var option = union.options()[optionId];
            if (option.isBuiltIn()) {
                propType = option;
            }
            else {
                var etp = new GeneralTypeEntry(option.original(), [], null, [], [], option.name());
                option.append(etp, bd);
                propType = etp;
            }
        }
        else {
            var etp = new GeneralTypeEntry(this._type.original(), [], null, [], [], this._type.name());
            this._type.append(etp, bd);
            propType = etp;
        }
        var newPropEntry = new PropertyEntry(this._original, this._name, propType, this.required(), this.isFacet, this.metadata(), this._src);
        if (this.isFacet) {
            te.addFacet(newPropEntry);
        }
        else {
            te.addProperty(newPropEntry);
        }
    };
    PropertyEntry.prototype.setType = function (t) {
        this._type = t;
    };
    PropertyEntry.prototype.type = function () {
        return this._type;
    };
    PropertyEntry.prototype.required = function () {
        if (this._required != null) {
            return this._required;
        }
        return this._original.required();
    };
    PropertyEntry.prototype.metadata = function () {
        return this._metadata;
    };
    PropertyEntry.prototype.annotations = function () {
        return this._original ? this._original.annotations() : [];
    };
    PropertyEntry.prototype.source = function () {
        var src = this._original || this._src;
        if (!src) {
            return null;
        }
        return new GeneralTypeEntry(src.declaredAt(), [], null, [], [], null);
    };
    return PropertyEntry;
}());
exports.PropertyEntry = PropertyEntry;
var AbstractTypeEntry = /** @class */ (function () {
    function AbstractTypeEntry(_original, _superTypes) {
        this._original = _original;
        this._superTypes = _superTypes;
        this._id = "" + (globalId++);
    }
    AbstractTypeEntry.prototype.id = function () {
        return this._id;
    };
    AbstractTypeEntry.prototype.branchingRegistry = function () {
        return this._branchingRegistry;
    };
    AbstractTypeEntry.prototype.setBranchingRegistry = function (value) {
        this._branchingRegistry = value;
    };
    AbstractTypeEntry.prototype.name = function () {
        return this._original && this._original.name();
    };
    AbstractTypeEntry.prototype.isUnion = function () {
        return false;
    };
    AbstractTypeEntry.prototype.isBuiltIn = function () {
        return false;
    };
    AbstractTypeEntry.prototype.isExternal = function () {
        if (this._original) {
            return this._original.isExternal();
        }
        for (var _i = 0, _a = this.superTypes(); _i < _a.length; _i++) {
            var st = _a[_i];
            if (st.isExternal()) {
                return true;
            }
        }
        return false;
    };
    AbstractTypeEntry.prototype.isUnknown = function () {
        if (this._original && this._original.isUnknown()) {
            return _.find(this._original.allFacets(), function (x) { return x.facetName() == "importedByChain"; }) == null;
        }
        return false;
    };
    AbstractTypeEntry.prototype.schema = function () {
        if (this._original) {
            var et = _.find([this._original].concat(this._original.allSuperTypes()), function (x) {
                return x.kind() == "external";
            });
            if (et) {
                return et.schema();
            }
            return null;
        }
        for (var _i = 0, _a = this.superTypes(); _i < _a.length; _i++) {
            var st = _a[_i];
            var sch = st.schema();
            if (sch) {
                return sch;
            }
        }
        return null;
    };
    AbstractTypeEntry.prototype.isIntersection = function () {
        return false;
    };
    AbstractTypeEntry.prototype.addSuperType = function (type) {
        this._superTypes = this._superTypes || [];
        if (this._superTypes.indexOf(type) < 0) {
            this._superTypes.push(type);
        }
    };
    AbstractTypeEntry.prototype.superTypes = function () {
        return this._superTypes;
    };
    AbstractTypeEntry.prototype.original = function () {
        return this._original;
    };
    AbstractTypeEntry.prototype.append = function (te, bd) {
        // if(!te._original){
        //     te._original = this.original();
        // }
    };
    AbstractTypeEntry.prototype.clone = function () {
        throw new Error("not implemented");
    };
    AbstractTypeEntry.prototype.possibleBuiltInTypes = function () {
        throw new Error("not implemented");
    };
    AbstractTypeEntry.prototype.declaredFacets = function () {
        var result = [];
        if (this._original) {
            result = this._original.declaredFacets();
            result = result.filter(function (x) { return x.kind() != tsInterfaces.MetaInformationKind.Example
                && x.kind() != tsInterfaces.MetaInformationKind.Examples; });
        }
        return result;
    };
    AbstractTypeEntry.prototype.allFacets = function () {
        var meta = this.meta();
        var result = meta.filter(function (x) { return x.kind() != tsInterfaces.MetaInformationKind.FacetDeclaration; });
        return result;
    };
    AbstractTypeEntry.prototype.isRecursionPoint = function () {
        return false;
    };
    AbstractTypeEntry.prototype.examples = function (expand) {
        if (this._original) {
            var examples = this._original.examples();
            return examples;
        }
        return [];
    };
    AbstractTypeEntry.prototype.declaredExampleFacets = function () {
        var result = [];
        if (this._original) {
            result = this._original.declaredFacets();
            result = result.filter(function (x) { return x.kind() == tsInterfaces.MetaInformationKind.Example
                || x.kind() == tsInterfaces.MetaInformationKind.Examples; });
        }
        return result;
    };
    AbstractTypeEntry.prototype.meta = function () {
        var result = [];
        if (this._original) {
            result = this._original.allFacets();
        }
        else {
            for (var _i = 0, _a = this.superTypes(); _i < _a.length; _i++) {
                var st = _a[_i];
                st.allFacets().forEach(function (x) { return result.push(x); });
            }
        }
        result = result.filter(function (x) {
            return x.kind() != tsInterfaces.MetaInformationKind.Example
                && x.kind() != tsInterfaces.MetaInformationKind.Examples
                && x.kind() != tsInterfaces.MetaInformationKind.FacetDeclaration;
        });
        return result;
    };
    AbstractTypeEntry.prototype.schemaPath = function () {
        if (!this.original() || !this.original().superTypes().filter(function (x) {
            return x.superTypes().length == 1 && x.superTypes()[0].name() == "external";
        }).length) {
            return null;
        }
        var schPath = _.find(this.meta(), function (x) { return x.kind() == tsInterfaces.MetaInformationKind.SchemaPath; });
        return schPath && schPath.value();
    };
    AbstractTypeEntry.prototype.sourceMap = function () {
        return this.getOneMetaValue(tsInterfaces.MetaInformationKind.SchemaPath);
    };
    AbstractTypeEntry.prototype.displayName = function () {
        return this.getOneMetaValue(tsInterfaces.MetaInformationKind.DisplayName);
    };
    AbstractTypeEntry.prototype.getOneMetaValue = function (kind) {
        var sourceMap = _.find(this.declaredFacets(), function (x) { return x.kind() == kind; });
        if (sourceMap) {
            return sourceMap.value();
        }
        return null;
    };
    AbstractTypeEntry.prototype.typeAttributeValue = function () {
        return typeAttributeValue(this._original) || this._typeAttrVal;
    };
    AbstractTypeEntry.prototype.setTypeAttributeValue = function (val) {
        this._typeAttrVal = val;
    };
    return AbstractTypeEntry;
}());
exports.AbstractTypeEntry = AbstractTypeEntry;
var globalId = 0;
var GeneralTypeEntry = /** @class */ (function (_super) {
    __extends(GeneralTypeEntry, _super);
    function GeneralTypeEntry(_original, _superTypes, _componentType, _properties, _facets, _name) {
        if (_superTypes === void 0) { _superTypes = []; }
        if (_properties === void 0) { _properties = []; }
        if (_facets === void 0) { _facets = []; }
        var _this = _super.call(this, _original, _superTypes) || this;
        _this._componentType = _componentType;
        _this._properties = _properties;
        _this._facets = _facets;
        _this._name = _name;
        _this.facets = [];
        return _this;
    }
    GeneralTypeEntry.prototype.setDepth = function (d) {
        this._depth = d;
    };
    GeneralTypeEntry.prototype.depth = function () {
        return this._depth;
    };
    GeneralTypeEntry.prototype.clone = function (ct) {
        return new GeneralTypeEntry(this._original, [], ct, [], [], this.name());
    };
    GeneralTypeEntry.prototype.possibleBuiltInTypes = function (occured) {
        if (occured === void 0) { occured = {}; }
        if (this.name()) {
            if (occured[this.name()]) {
                return [];
            }
            occured[this.name()] = true;
        }
        var result = [];
        // if(this.original()&&!this.original().isUnion()) {
        //     let possibleTypes = [this.original()].concat(this.original().allSuperTypes()).filter(x => x.isBuiltin());
        //     for (let o of this.original().allOptions()) {
        //         possibleTypes = possibleTypes.concat([o].concat(o.allSuperTypes()).filter(x => x.isBuiltin()));
        //     }
        //     possibleTypes = _.unique(possibleTypes);
        //     let map:{[key:string]:typeSystem.IParsedType} = {};
        //     possibleTypes.forEach(x=>map[x.name()]=x);
        //     possibleTypes.forEach(x=>{
        //         x.allSuperTypes().forEach(y=>delete map[y.name()]);
        //     });
        //     result = _.unique(Object.keys(map));
        // }
        // else {
        for (var _i = 0, _a = this.superTypes(); _i < _a.length; _i++) {
            var st = _a[_i];
            //if(!st.isUnion()) {
            result = result.concat(st.possibleBuiltInTypes(occured));
            // }
            // else{
            //     for(let o of (<UnionTypeEntry>st).options()){
            //         result = result.concat(o.possibleBuiltInTypes(occured));
            //     }
            // }
        }
        var map = {};
        result.forEach(function (x) { return map[x] = true; });
        result.forEach(function (x) {
            var t = typeSystem.builtInTypes().get(x);
            if (t) {
                t.allSuperTypes().forEach(function (y) { return delete map[y.name()]; });
            }
        });
        delete map["unknown"];
        result = Object.keys(map);
        // }
        return result;
    };
    GeneralTypeEntry.prototype.componentType = function () {
        return this._componentType;
    };
    GeneralTypeEntry.prototype.setComponentType = function (componentType) {
        this._componentType = componentType;
    };
    GeneralTypeEntry.prototype.properties = function () {
        return this._properties;
    };
    GeneralTypeEntry.prototype.definedFacets = function () {
        return this._facets;
    };
    GeneralTypeEntry.prototype.addProperty = function (propertyEntry) {
        this._properties.push(propertyEntry);
    };
    GeneralTypeEntry.prototype.addFacet = function (propertyEntry) {
        this._facets.push(propertyEntry);
    };
    GeneralTypeEntry.prototype.append = function (te, bd) {
        if (this._original && this._original.kind() != "union") {
            te._original = this._original;
        }
        if (this.isExternal()) {
            return;
        }
        if (bd.typeMap().hasType(this) && this.depth() == 0) { //isRecursionPoint()){
            te.setIsRecursionPoint();
            return;
        }
        if (this._typeAttrVal != null) {
            te.setTypeAttributeValue(this._typeAttrVal);
        }
        bd.typeMap().addType(this);
        try {
            if (this._componentType) {
                var ct = bd.expander().expandHierarchy(this._componentType, this._componentType.branchingRegistry(), bd.typeMap());
                //if(!te.componentType()) {
                te.setComponentType(ct);
                // }
                // else{
                //     let cType = new GeneralTypeEntry(null,[],null,[],[],null);
                //     te.componentType().append(cType,null);
                //     ct.append(cType,null);
                //     te.setComponentType(cType);
                // }
            }
            if (this._properties.length > 0) {
                var pMap = {};
                for (var _i = 0, _a = this._properties; _i < _a.length; _i++) {
                    var p = _a[_i];
                    var pName = p.name();
                    var pArr = pMap[pName];
                    if (!pArr) {
                        pArr = [];
                        pMap[pName] = pArr;
                    }
                    pArr.push(p);
                }
                var _loop_1 = function (pName) {
                    var pArr = pMap[pName];
                    if (pArr.length == 1) {
                        pArr[0].append(te, bd);
                    }
                    else {
                        var pType_1 = new GeneralTypeEntry(null, [], null, [], [], null);
                        var required_1 = false;
                        pArr.forEach(function (x) {
                            pType_1.addSuperType(x.type());
                            required_1 = required_1 || x.required();
                        });
                        var mergedProp = new PropertyEntry(null, pName, pType_1, required_1, false, null, pArr[0].original());
                        mergedProp.append(te, bd);
                    }
                };
                for (var _b = 0, _c = Object.keys(pMap); _b < _c.length; _b++) {
                    var pName = _c[_b];
                    _loop_1(pName);
                }
            }
            if (this._facets.length > 0) {
                for (var _d = 0, _e = this._facets; _d < _e.length; _d++) {
                    var f = _e[_d];
                    f.append(te, bd);
                }
            }
            for (var _f = 0, _g = this.superTypes(); _f < _g.length; _f++) {
                var st = _g[_f];
                st.append(te, bd);
                if (!st.isUnion()) {
                    te.addSuperType(st);
                }
            }
        }
        finally {
            bd.typeMap().removeType(this);
        }
    };
    GeneralTypeEntry.prototype.name = function () {
        return this._name || _super.prototype.name.call(this);
    };
    GeneralTypeEntry.prototype.setName = function (n) {
        return this._name = n;
    };
    GeneralTypeEntry.prototype.isRecursionPoint = function () {
        return this._isRecursionPoint;
    };
    GeneralTypeEntry.prototype.setIsRecursionPoint = function (val) {
        if (val === void 0) { val = true; }
        this._isRecursionPoint = val;
    };
    return GeneralTypeEntry;
}(AbstractTypeEntry));
exports.GeneralTypeEntry = GeneralTypeEntry;
var BuiltInTypeEntry = /** @class */ (function (_super) {
    __extends(BuiltInTypeEntry, _super);
    function BuiltInTypeEntry(_original) {
        var _this = _super.call(this, _original, []) || this;
        _this._original = _original;
        return _this;
    }
    BuiltInTypeEntry.prototype.possibleBuiltInTypes = function () {
        return [this._original.name()];
    };
    BuiltInTypeEntry.prototype.isBuiltIn = function () {
        return true;
    };
    BuiltInTypeEntry.prototype.append = function (te, bd) {
        te.addSuperType(this);
    };
    return BuiltInTypeEntry;
}(AbstractTypeEntry));
exports.BuiltInTypeEntry = BuiltInTypeEntry;
var UnionTypeEntry = /** @class */ (function (_super) {
    __extends(UnionTypeEntry, _super);
    function UnionTypeEntry(original, _options, _branchId) {
        var _this = _super.call(this, original, []) || this;
        _this._options = _options;
        _this._branchId = _branchId;
        return _this;
    }
    UnionTypeEntry.prototype.isUnion = function () {
        return true;
    };
    UnionTypeEntry.prototype.branchId = function () {
        return this._branchId;
    };
    UnionTypeEntry.prototype.append = function (te, bd) {
        var optionId = bd.branchingOption(this._branchId);
        var option = this._options[optionId];
        if (!option.isBuiltIn() && option.name() != null) {
            te.setName(option.name());
        }
        else {
            te.setName(this.name());
        }
        option.append(te, bd);
    };
    UnionTypeEntry.prototype.clone = function () {
        throw new Error("Not implemented");
    };
    UnionTypeEntry.prototype.possibleBuiltInTypes = function (occured) {
        if (occured === void 0) { occured = {}; }
        var result = [];
        if (this.name()) {
            if (occured[this.name()]) {
                return [];
            }
            occured[this.name()] = true;
        }
        this._options.forEach(function (x) { return result = result.concat(x.possibleBuiltInTypes(occured)); });
        result = _.unique(result);
        return result;
    };
    UnionTypeEntry.prototype.options = function () {
        return this._options;
    };
    return UnionTypeEntry;
}(AbstractTypeEntry));
exports.UnionTypeEntry = UnionTypeEntry;
var IntersectionTypeEntry = /** @class */ (function (_super) {
    __extends(IntersectionTypeEntry, _super);
    function IntersectionTypeEntry(original, options) {
        var _this = _super.call(this, original, []) || this;
        _this.options = options;
        return _this;
    }
    IntersectionTypeEntry.prototype.isIntersection = function () {
        return true;
    };
    IntersectionTypeEntry.prototype.append = function (te, bd) {
        throw new Error("not implemented");
    };
    IntersectionTypeEntry.prototype.clone = function () {
        throw new Error("Not implemented");
    };
    IntersectionTypeEntry.prototype.possibleBuiltInTypes = function (occured) {
        if (occured === void 0) { occured = {}; }
        if (this.name()) {
            if (occured[this.name()]) {
                return [];
            }
            occured[this.name()] = true;
        }
        var possibleTypes = this.options.map(function (x) { return x.possibleBuiltInTypes(occured); });
        var result = possibleTypes[0];
        for (var i = 1; i < possibleTypes.length; i++) {
            result = _.intersection(result, possibleTypes[i]);
        }
        return result;
    };
    return IntersectionTypeEntry;
}(AbstractTypeEntry));
exports.IntersectionTypeEntry = IntersectionTypeEntry;
function mergeMeta(to, from) {
    if (!from) {
        return;
    }
    else if (!to) {
        return from;
    }
    for (var _i = 0, _a = Object.keys(from); _i < _a.length; _i++) {
        var key = _a[_i];
        if (!to.hasOwnProperty(key)) {
            to[key] = from[key];
        }
        else if (key == "primitiveValuesMeta") {
            for (var _b = 0, _c = Object.keys(from.primitiveValuesMeta); _b < _c.length; _b++) {
                var key1 = _c[_b];
                if (!to.primitiveValuesMeta.hasOwnProperty(key1)) {
                    to.primitiveValuesMeta[key1] = from.primitiveValuesMeta[key1];
                }
            }
        }
    }
}
var BasicTypeMap = /** @class */ (function () {
    function BasicTypeMap() {
        this.typeMapById = {};
        this.typeMapByName = {};
        this.propertiesMap = {};
    }
    BasicTypeMap.prototype.addType = function (t) {
        var n = t.id();
        if (n) {
            this.typeMapById[n] = t;
        }
        if (t.name()) {
            this.typeMapByName[t.name()] = t;
        }
    };
    BasicTypeMap.prototype.removeType = function (t) {
        if (t.id()) {
            delete this.typeMapById[t.id()];
        }
        if (t.name()) {
            delete this.typeMapByName[t.name()];
        }
    };
    BasicTypeMap.prototype.hasType = function (t) {
        var n = t.id();
        return this.typeMapById[n] !== undefined;
    };
    BasicTypeMap.prototype.hasTypeByName = function (name) {
        return this.typeMapByName[name] !== undefined;
    };
    BasicTypeMap.prototype.typeByName = function (name) {
        return this.typeMapByName[name];
    };
    BasicTypeMap.prototype.addProperty = function (typeName, propName, prop) {
        var propKey = this.propKey(typeName, propName);
        this.propertiesMap[propKey] = prop;
    };
    BasicTypeMap.prototype.property = function (typeName, propName) {
        var propKey = this.propKey(typeName, propName);
        return this.propertiesMap[propKey];
    };
    BasicTypeMap.prototype.propKey = function (typeName, propName) {
        return typeName + "/" + propName;
    };
    return BasicTypeMap;
}());
exports.BasicTypeMap = BasicTypeMap;
var BasicBranchingData = /** @class */ (function () {
    function BasicBranchingData(arr, _expander, _typeMap) {
        if (_typeMap === void 0) { _typeMap = new BasicTypeMap(); }
        this.arr = arr;
        this._expander = _expander;
        this._typeMap = _typeMap;
    }
    BasicBranchingData.prototype.branchingOption = function (branchId) {
        if (branchId > this.arr.length - 1) {
            throw new Error("Branch index exceeds total branches count");
        }
        return this.arr[branchId];
    };
    BasicBranchingData.prototype.typeMap = function () {
        return this._typeMap;
    };
    BasicBranchingData.prototype.expander = function () {
        return this._expander;
    };
    return BasicBranchingData;
}());
var BasicBranchingRegistry = /** @class */ (function () {
    function BasicBranchingRegistry(_expander) {
        this._expander = _expander;
        this.arr = [];
    }
    BasicBranchingRegistry.prototype.expander = function () {
        return this._expander;
    };
    BasicBranchingRegistry.prototype.nextBranchId = function (optionsCount) {
        var result = this.arr.length;
        this.arr.push(optionsCount);
        return result;
    };
    BasicBranchingRegistry.prototype.possibleBranches = function (typeMap) {
        var _this = this;
        var steps = [];
        var ranks = [];
        var count = 1;
        var rank = 1;
        var l = this.arr.length;
        for (var i = 0; i < l; i++) {
            steps.push(count);
            ranks.push(rank);
            count *= this.arr[i];
            rank *= this.arr[l - 1 - i];
        }
        ranks = ranks.reverse();
        var sequences = [];
        for (var i = 0; i < count; i++) {
            sequences.push([]);
        }
        // 2,3,3
        // r l c ------------------
        // 9 2 1 000000000111111111
        // 3 3 2 000111222000111222
        // 1 3 6 123123123123123123
        for (var i = 0; i < l; i++) {
            var ind = 0;
            var currentOptionsCount = this.arr[i];
            for (var j0 = 0; j0 < steps[i]; j0++) {
                for (var j1 = 0; j1 < currentOptionsCount; j1++) {
                    for (var j2 = 0; j2 < ranks[i]; j2++) {
                        sequences[ind++].push(j1);
                    }
                }
            }
        }
        var result = sequences.map(function (x) { return new BasicBranchingData(x, _this.expander(), typeMap); });
        return result;
    };
    return BasicBranchingRegistry;
}());
var TypeExpander = /** @class */ (function () {
    function TypeExpander(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        if (typeof (this.options.typeExpansionRecursionDepth) !== "number") {
            this.options.typeExpansionRecursionDepth = -1;
        }
        if (typeof (this.options.serializeMetadata) !== "boolean") {
            this.options.serializeMetadata = false;
        }
    }
    TypeExpander.prototype.serializeType = function (t) {
        var he = this.createHierarchyEntry(t, this.options.typeExpansionRecursionDepth);
        var expand = this.options.typeExpansionRecursionDepth >= 0;
        if (expand) {
            he = this.expandHierarchy(he, he.branchingRegistry());
        }
        var result = this.dump(he, expand);
        return result;
    };
    TypeExpander.prototype.createHierarchyEntry = function (t, typeExpansionRecursionDepth, occured, branchingRegistry) {
        if (occured === void 0) { occured = new BasicTypeMap(); }
        var isNewTree = false;
        if (!branchingRegistry) {
            isNewTree = true;
            branchingRegistry = new BasicBranchingRegistry(this);
        }
        var result = this.doCreateHierarchyEntry(t, typeExpansionRecursionDepth, occured, branchingRegistry);
        if (isNewTree) {
            result.setBranchingRegistry(branchingRegistry);
        }
        return result;
    };
    TypeExpander.prototype.doCreateHierarchyEntry = function (t, typeExpansionRecursionDepth, occured, branchingRegistry) {
        if (occured === void 0) { occured = new BasicTypeMap(); }
        if (t.isBuiltin()) {
            var result_1 = occured.typeByName(t.name());
            if (!result_1) {
                result_1 = new BuiltInTypeEntry(t);
                occured.addType(result_1);
            }
            return result_1;
        }
        var d = 0;
        //unwrapping library chaining
        if (!t.name() && t.isEmpty() && t.superTypes().length == 2 && t.superTypes().filter(function (x) { return x.name() != "unknown"; }).length == 1) {
            t = _.find(t.superTypes(), function (x) { return x.name() != "unknown"; });
        }
        if (t.name() && occured.hasTypeByName(t.name())) {
            if (typeExpansionRecursionDepth <= 0) {
                return occured.typeByName(t.name());
            }
            else {
                d = typeExpansionRecursionDepth;
                typeExpansionRecursionDepth--;
            }
        }
        if (this.options.isInsideTemplate && t.superTypes().length == 1) {
            var expr = void 0;
            var typeAttrVal = typeAttributeValue(t);
            if (typeAttrVal) {
                expr = typeAttrVal;
            }
            else if (t.superTypes()[0].isBuiltin()) {
                expr = t.name();
            }
            else {
                expr = t.superTypes()[0].name();
            }
            if (expr && expr.indexOf("<<") >= 0) {
                var res = this.processExpression(expr, typeExpansionRecursionDepth, occured, branchingRegistry, t);
                if (res) {
                    return res;
                }
            }
        }
        if (t.isUnion() && t.superTypes().length == 0) {
            var options_3 = t.options();
            var optionEntries = [];
            for (var _i = 0, options_1 = options_3; _i < options_1.length; _i++) {
                var o = options_1[_i];
                optionEntries.push(this.createHierarchyEntry(o, typeExpansionRecursionDepth, occured, branchingRegistry));
            }
            var branchId = branchingRegistry.nextBranchId(optionEntries.length);
            var unionSuperType = new UnionTypeEntry(t, optionEntries, branchId);
            return unionSuperType;
        }
        var result = new GeneralTypeEntry(t, [], null, [], [], t.name());
        result.setDepth(d);
        if (t.name() != null && !occured.hasTypeByName(t.name())) {
            occured.addType(result);
        }
        var superTypeEntries = [];
        if (typeExpansionRecursionDepth == -1) {
            var allSuperTypes = t.superTypes();
            var superTypes = allSuperTypes; //.filter(x=>!x.isUnion());
            for (var _a = 0, superTypes_1 = superTypes; _a < superTypes_1.length; _a++) {
                var st = superTypes_1[_a];
                var ste = this.createHierarchyEntry(st, typeExpansionRecursionDepth, occured, branchingRegistry);
                superTypeEntries.push(ste);
            }
        }
        else {
            var allSuperTypes = t.allSuperTypes();
            var superTypes = allSuperTypes.filter(function (x) { return !x.isUnion(); });
            for (var _b = 0, superTypes_2 = superTypes; _b < superTypes_2.length; _b++) {
                var st = superTypes_2[_b];
                if (st.isBuiltin()) {
                    var ste = this.createHierarchyEntry(st, typeExpansionRecursionDepth, occured, branchingRegistry);
                    superTypeEntries.push(ste);
                }
            }
        }
        var options = t.allOptions();
        var properties = typeExpansionRecursionDepth >= 0 ? t.properties() : t.declaredProperties();
        if (typeExpansionRecursionDepth >= 0 && options.length > 1) {
            var optionEntries = [];
            for (var _c = 0, options_2 = options; _c < options_2.length; _c++) {
                var o = options_2[_c];
                optionEntries.push(this.createHierarchyEntry(o, typeExpansionRecursionDepth, occured, branchingRegistry));
            }
            var branchId = branchingRegistry.nextBranchId(optionEntries.length);
            var unionSuperType = new UnionTypeEntry(t, optionEntries, branchId);
            superTypeEntries.push(unionSuperType);
        }
        if (t.isArray()) {
            var ct = t.componentType();
            if (ct) {
                if (isEmpty(ct)) {
                    ct = ct.superTypes()[0];
                }
                var componentTypeEntry = this.createHierarchyEntry(ct, typeExpansionRecursionDepth, occured);
                result.setComponentType(componentTypeEntry);
            }
        }
        var propertyEntries = [];
        if (properties.length > 0) {
            for (var _d = 0, properties_1 = properties; _d < properties_1.length; _d++) {
                var p = properties_1[_d];
                var pe = this.processPropertyHierarchy(p, typeExpansionRecursionDepth, t, occured, branchingRegistry);
                propertyEntries.push(pe);
            }
        }
        for (var _e = 0, superTypeEntries_1 = superTypeEntries; _e < superTypeEntries_1.length; _e++) {
            var st = superTypeEntries_1[_e];
            result.addSuperType(st);
        }
        for (var _f = 0, propertyEntries_1 = propertyEntries; _f < propertyEntries_1.length; _f++) {
            var pe = propertyEntries_1[_f];
            result.addProperty(pe);
        }
        var definedFacets = typeExpansionRecursionDepth >= 0 ? t.allDefinedFacets() : t.definedFacets();
        if (definedFacets.length > 0) {
            for (var _g = 0, definedFacets_1 = definedFacets; _g < definedFacets_1.length; _g++) {
                var p = definedFacets_1[_g];
                var fe = this.processPropertyHierarchy(p, typeExpansionRecursionDepth, t, occured, branchingRegistry, true);
                result.addFacet(fe);
            }
        }
        if (typeExpansionRecursionDepth == this.options.typeExpansionRecursionDepth) {
            occured.removeType(result);
        }
        return result;
    };
    TypeExpander.prototype.processExpression = function (expression, typeExpansionRecursionDepth, occured, branchingRegistry, original) {
        if (occured === void 0) { occured = new BasicTypeMap(); }
        var gotExpression = referencePatcher.checkExpression(expression);
        if (!gotExpression) {
            return null;
        }
        var escapeData = referencePatcher.escapeTemplateParameters(expression);
        var str;
        if (escapeData.status == referencePatcher.ParametersEscapingStatus.OK) {
            str = escapeData.resultingString;
            gotExpression = referencePatcher.checkExpression(str);
            if (!gotExpression) {
                return null;
            }
        }
        else {
            return null;
        }
        var parsedExpression;
        try {
            parsedExpression = typeExpressions.parse(str);
            if (!parsedExpression) {
                return null;
            }
            var exprObj = this.expressionToObject(parsedExpression, escapeData, typeExpansionRecursionDepth, occured, branchingRegistry, original);
            return exprObj;
        }
        catch (exception) {
            return null;
        }
    };
    TypeExpander.prototype.expressionToObject = function (expr, escapeData, typeExpansionRecursionDepth, occured, branchingRegistry, original) {
        if (occured === void 0) { occured = new BasicTypeMap(); }
        var result;
        var arr = 0;
        if (expr.type == "name") {
            var literal = expr;
            arr = literal.arr;
            var name_1 = literal.value;
            if (escapeData.status == referencePatcher.ParametersEscapingStatus.OK) {
                var unescapeData = referencePatcher.unescapeTemplateParameters(name_1, escapeData.substitutions);
                if (unescapeData.status == referencePatcher.ParametersEscapingStatus.OK) {
                    name_1 = unescapeData.resultingString;
                }
            }
            var t = def.rt.builtInTypes().get(name_1);
            if (!t) {
                t = this.options.typeCollection.getType(name_1);
            }
            if (t) {
                result = this.createHierarchyEntry(t, typeExpansionRecursionDepth, occured, branchingRegistry);
            }
            else {
                var UTE = new GeneralTypeEntry(def.rt.builtInTypes().get("unknown"), [], null, [], [], "unknown");
                var orig = (arr === 0) ? original : null;
                result = new GeneralTypeEntry(orig, [UTE], null, [], [], name_1);
                result.setTypeAttributeValue(name_1);
            }
        }
        else if (expr.type == "union") {
            var union = expr;
            var components = jsonSerializerHL.toOptionsArray(union);
            var optionEntries = [];
            for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
                var c = components_1[_i];
                if (c == null) {
                    result = null;
                    break;
                }
                var c1 = this.expressionToObject(c, escapeData, typeExpansionRecursionDepth, occured, branchingRegistry);
                optionEntries.push(c1);
            }
            var branchId = branchingRegistry.nextBranchId(optionEntries.length);
            result = new UnionTypeEntry(original, optionEntries, branchId);
        }
        else if (expr.type == "parens") {
            var parens = expr;
            arr = parens.arr;
            result = this.expressionToObject(parens.expr, escapeData, typeExpansionRecursionDepth, occured, branchingRegistry, original);
        }
        if (result != null && arr > 0) {
            var ATE = new BuiltInTypeEntry(def.rt.builtInTypes().get("array"));
            while (arr-- > 0) {
                var orig = (arr === 0) ? original : null;
                result = new GeneralTypeEntry(null, [ATE], result, [], [], null);
            }
        }
        return result;
    };
    TypeExpander.prototype.extractParserMetadata = function (pt) {
        var meta;
        var metaArr = pt.declaredFacets().filter(function (x) { return x.facetName() == "__METADATA__"; });
        if (metaArr.length) {
            meta = metaArr[0].value();
        }
        return meta;
    };
    TypeExpander.prototype.processPropertyHierarchy = function (p, typeExpansionRecursionDepth, t, occured, branchingRegistry, isFacet) {
        if (isFacet === void 0) { isFacet = false; }
        var pt = p.range();
        var meta = this.extractParserMetadata(pt);
        var owner = p.declaredAt();
        var d = typeExpansionRecursionDepth;
        if (owner.name() && (!t.name() || owner.name() != t.name()) && occured.hasTypeByName(owner.name())) {
            if (typeExpansionRecursionDepth <= 0) {
                var e = occured.property(owner.name(), p.name());
                if (e) {
                    return e;
                }
                d--;
            }
        }
        if (isEmpty(pt)) {
            pt = pt.superTypes()[0];
            if (typeExpansionRecursionDepth >= 0) {
                mergeMeta(meta, this.extractParserMetadata(pt));
            }
        }
        var pe = new PropertyEntry(p, null, null, p.required(), isFacet, meta);
        if (owner.name()) {
            occured.addProperty(owner.name(), p.name(), pe);
        }
        var pte = this.createHierarchyEntry(pt, d, occured, branchingRegistry);
        pe.setType(pte);
        return pe;
    };
    TypeExpander.prototype.expandHierarchy = function (e, reg, typeMap) {
        if (!reg) {
            return e;
        }
        var entries = [];
        for (var _i = 0, _a = reg.possibleBranches(typeMap); _i < _a.length; _i++) {
            var bd = _a[_i];
            var branchEntry = new GeneralTypeEntry(null, [], null, [], [], null);
            e.append(branchEntry, bd);
            entries.push(branchEntry);
        }
        if (entries.length == 1) {
            return entries[0];
        }
        var result = new UnionTypeEntry(e.original(), entries, -1);
        return result;
    };
    TypeExpander.prototype.appendSourceFromExtras = function (result, te) {
        if (!this.options.sourceMap) {
            return;
        }
        if (!result.sourceMap) {
            var sourceMap = void 0;
            var src = te.original() && te.original().getExtra("SOURCE");
            if (src) {
                var llSrc = void 0;
                if (hlImpl.LowLevelWrapperForTypeSystem.isInstance(src)) {
                    llSrc = src.node();
                }
                else if (hlImpl.ASTNodeImpl.isInstance(src)) {
                    var schemaPath = void 0;
                    if (te.isExternal()) {
                        schemaPath = jsonSerializerHL.getSchemaPath(src);
                        if (schemaPath) {
                            result.schemaPath = schemaPath;
                            sourceMap = {
                                path: schemaPath
                            };
                        }
                    }
                    if (!sourceMap) {
                        sourceMap = {
                            path: hlImpl.actualPath(src)
                        };
                    }
                }
                else if (src.obj && src.obj.sourceMap) {
                    sourceMap = src.obj.sourceMap;
                }
                if (llSrc) {
                    if (llSrc.includePath()) {
                        sourceMap = {
                            path: llSrc.unit().resolve(llSrc.includePath()).path()
                        };
                    }
                    else {
                        sourceMap = {
                            path: llSrc.unit().path()
                        };
                    }
                }
            }
            if (sourceMap) {
                this.spreadSources(result, sourceMap);
            }
        }
    };
    TypeExpander.prototype.spreadSources = function (result, src) {
        var _this = this;
        if (typeof result !== "object") {
            return;
        }
        else if (!result.sourceMap) {
            result.sourceMap = src;
        }
        else {
            return;
        }
        if (result.items) {
            result.items.forEach(function (x) { return _this.spreadSources(x, src); });
        }
        if (result.anyOf) {
            result.anyOf.forEach(function (x) { return _this.spreadSources(x, src); });
        }
        if (result.properties) {
            result.properties.forEach(function (x) { return _this.spreadSources(x, src); });
        }
        if (result.facets) {
            result.facets.forEach(function (x) { return _this.spreadSources(x, src); });
        }
        if (result.xml) {
            this.spreadSources(result.xml, src);
        }
    };
    TypeExpander.prototype.dump = function (te, expand) {
        var _this = this;
        var result = {};
        var name = te.name();
        if (name) {
            result.name = name;
            if (te.isRecursionPoint()) {
                result = {
                    type: ["any"]
                };
                this.appendSourceFromExtras(result, te);
                return result;
            }
        }
        var superTypes = te.superTypes();
        if (te.isBuiltIn()) {
            result = {
                type: [name],
                typePropertyKind: "TYPE_EXPRESSION"
            };
        }
        else if (te.isExternal()) {
            if (!expand && superTypes[0].name() && te.original().allSuperTypes().length > 3) {
                result.type = [superTypes[0].name()];
                result.typePropertyKind = "TYPE_EXPRESSION";
            }
            else {
                var sch = te.schema();
                if (sch) {
                    sch = sch.trim();
                    var resolved = resolveSchemaFragment(this.options.node, sch);
                    if (resolved) {
                        sch = resolved;
                    }
                    result.type = [sch];
                    if (te.schemaPath()) {
                        result.schemaPath = te.schemaPath();
                    }
                    var canBeJson = (sch[0] === "{" && sch[sch.length - 1] === "}");
                    var canBeXml = (sch[0] === "<" && sch[sch.length - 1] === ">");
                    if (canBeJson) {
                        result.typePropertyKind = "JSON";
                    }
                    else if (canBeXml) {
                        result.typePropertyKind = "XML";
                    }
                    else {
                        result.typePropertyKind = "TYPE_EXPRESSION";
                    }
                }
            }
        }
        else if (te.isUnion()) {
            result.typePropertyKind = "TYPE_EXPRESSION";
            var ute = te;
            var options = ute.options();
            if (options.length > 0) {
                result.type = ["union"];
                var anyOf = [];
                result.anyOf = anyOf;
                for (var _i = 0, options_4 = options; _i < options_4.length; _i++) {
                    var o = options_4[_i];
                    if (!expand && o.name()) {
                        anyOf.push(o.name());
                    }
                    else {
                        var dumpedOption = this.dump(o, expand);
                        this.appendSourceFromExtras(dumpedOption, ute);
                        if (this.options.isInsideTemplate) {
                            if (dumpedOption.name == te.name() && dumpedOption.type) {
                                var dot = dumpedOption.type;
                                if (dot.length && dot[0].indexOf("<<") >= 0) {
                                    dumpedOption = dot[0];
                                }
                            }
                            else if (dumpedOption.name && dumpedOption.name.indexOf("<<") >= 0) {
                                dumpedOption = dumpedOption.name;
                            }
                        }
                        anyOf.push(dumpedOption);
                    }
                }
            }
        }
        else {
            if (superTypes.length && (superTypes[0].name() || superTypes[0].isUnion())) {
                result.typePropertyKind = "TYPE_EXPRESSION";
            }
            else {
                result.typePropertyKind = "INPLACE";
            }
            var gte_1 = te;
            var typeAttrVal = void 0;
            if (this.options.isInsideTemplate) {
                typeAttrVal = te.typeAttributeValue();
                if (!typeAttrVal) {
                    var supertypes = te.original() && te.original().superTypes();
                    if (supertypes && supertypes.length == 1 && supertypes[0].isUnknown()) {
                        var stName = supertypes[0].name();
                        if (stName.indexOf("<<") >= 0) {
                            typeAttrVal = stName;
                        }
                    }
                }
                if (typeAttrVal && !Array.isArray(typeAttrVal)) {
                    typeAttrVal = [typeAttrVal];
                }
            }
            if (typeAttrVal) {
                result.type = typeAttrVal;
                result.typePropertyKind = "TYPE_EXPRESSION";
            }
            else if (expand) {
                var type = gte_1.possibleBuiltInTypes();
                if (type.length > 0) {
                    result.type = type;
                }
            }
            else {
                var type = [];
                for (var _a = 0, superTypes_3 = superTypes; _a < superTypes_3.length; _a++) {
                    var st = superTypes_3[_a];
                    if (st.name()) {
                        type.push(st.name());
                    }
                    else {
                        var dumped = this.dump(st, expand);
                        dumped.name = "type";
                        var stDisplayName = st.displayName();
                        dumped.displayName = stDisplayName || "type";
                        if (!stDisplayName) {
                            this.appendMeta(dumped, "displayName", "calculated");
                        }
                        type.push(dumped);
                    }
                }
                result.type = type;
            }
            var properties = gte_1.properties();
            if (properties && properties.length > 0) {
                var props = [];
                result.properties = props;
                for (var _b = 0, properties_2 = properties; _b < properties_2.length; _b++) {
                    var p = properties_2[_b];
                    var dumpedPropertyType = this.dumpProperty(p, gte_1, expand);
                    props.push(dumpedPropertyType);
                }
            }
            var facets = gte_1.definedFacets();
            if (facets && facets.length > 0) {
                var facetArr = [];
                result.facets = facetArr;
                for (var _c = 0, facets_1 = facets; _c < facets_1.length; _c++) {
                    var f = facets_1[_c];
                    var dumpedFacetType = this.dumpProperty(f, gte_1, expand, true);
                    facetArr.push(dumpedFacetType);
                }
            }
            var ct_1 = gte_1.componentType();
            if (ct_1) {
                var ctArr = [ct_1];
                if (!expand && isEmpty(ct_1.original(), true) && ct_1.superTypes().length > 1) {
                    ctArr = ct_1.superTypes();
                }
                result.items = ctArr.map(function (x) {
                    if (!expand && x.name()) {
                        return x.name();
                        //this.appendMeta(result.items[0], "displayName", "calculated");
                        //this.appendSourceFromExtras(result.items[0], gte);
                    }
                    else {
                        var dumpedComponentType = _this.dump(ct_1, expand);
                        _this.appendSourceFromExtras(dumpedComponentType, gte_1);
                        if (!ct_1.isUnion() && !dumpedComponentType.name) {
                            dumpedComponentType.name = "items";
                            dumpedComponentType.displayName = "items";
                            _this.appendMeta(dumpedComponentType, "displayName", "calculated");
                        }
                        if (_this.options.isInsideTemplate) {
                            if (dumpedComponentType.name == te.name() && dumpedComponentType.type) {
                                var dot = dumpedComponentType.type;
                                if (dot.length && dot[0].indexOf("<<") >= 0) {
                                    dumpedComponentType = dot[0];
                                }
                            }
                            else if (dumpedComponentType.name && dumpedComponentType.name.indexOf("<<") >= 0) {
                                dumpedComponentType = dumpedComponentType.name;
                            }
                        }
                        return dumpedComponentType;
                    }
                });
            }
            this.dumpFacets(te, result, expand);
        }
        var examples = te.examples(expand);
        if (examples.length > 0) {
            var simplified = [];
            var examplesArr = [];
            result.examples = examplesArr;
            result.simplifiedExamples = simplified;
            for (var _d = 0, examples_1 = examples; _d < examples_1.length; _d++) {
                var e = examples_1[_d];
                this.processExample(e, simplified, examplesArr);
            }
        }
        var annotations = te.original() && te.original().annotations();
        this.dumpAnnotations(annotations, result);
        this.dumpScalarsAnnotations(te, result, expand);
        this.dumpMeta(te, result, expand);
        this.appendSourceFromExtras(result, te);
        this.patchDisplayName(te, result);
        this.checkIfTypePropertyIsDefault(te, result);
        return result;
    };
    TypeExpander.prototype.dumpScalarsAnnotations = function (te, result, expand) {
        var sAnnotations = te.original() && (expand ? te.original().scalarsAnnotations() : te.original().declaredScalarsAnnotations());
        if (sAnnotations) {
            var keys = Object.keys(sAnnotations);
            if (keys.length) {
                var sAObj = {};
                result.scalarsAnnotations = sAObj;
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var pName = keys_1[_i];
                    sAObj[pName] = sAnnotations[pName].map(function (x) { return x.map(function (y) {
                        return {
                            name: y.name(),
                            value: y.value()
                        };
                    }); });
                }
            }
        }
    };
    TypeExpander.prototype.processExample = function (e, simplified, examplesArr) {
        var val;
        if (e.isJSONString() || e.isYAML()) {
            var asJSON = e.asJSON();
            val = asJSON != null ? asJSON : e.original();
        }
        else {
            val = e.original();
        }
        var needStringify = false;
        if (Array.isArray(val)) {
            for (var _i = 0, val_1 = val; _i < val_1.length; _i++) {
                var c = val_1[_i];
                if (Array.isArray(c) || (typeof val == "object")) {
                    needStringify = true;
                    break;
                }
            }
        }
        else if (typeof val == "object" && val != null) {
            needStringify = true;
        }
        var simpleValue = needStringify ? JSON.stringify(val) : val;
        simplified.push(simpleValue);
        var eObj = {
            strict: e.strict(),
            value: val
        };
        if (e.name()) {
            eObj.name = e.name();
        }
        if (e.displayName() != null) {
            eObj.displayName = e.displayName();
        }
        if (e.description()) {
            eObj.description = e.description();
        }
        var annotations = e.annotations();
        this.dumpAnnotations(annotations, eObj);
        if (e.hasScalarAnnotations()) {
            var sAnnotations = e.scalarsAnnotations();
            var resSAnnotations = {};
            for (var _a = 0, _b = Object.keys(sAnnotations); _a < _b.length; _a++) {
                var fName = _b[_a];
                if (sAnnotations[fName]) {
                    resSAnnotations[fName] = [[]];
                    for (var _c = 0, _d = Object.keys(sAnnotations[fName]); _c < _d.length; _c++) {
                        var aName = _d[_c];
                        resSAnnotations[fName][0].push({
                            name: aName,
                            value: sAnnotations[fName][aName].value()
                        });
                    }
                }
            }
            if (Object.keys(resSAnnotations).length) {
                eObj.scalarsAnnotations = resSAnnotations;
            }
        }
        examplesArr.push(eObj);
    };
    TypeExpander.prototype.checkIfTypePropertyIsDefault = function (te, result) {
        if (te.isBuiltIn()) {
            return;
        }
        if (te.original() && te.original().isUnion()) {
            return;
        }
        if (!te.isUnknown() && (te.original() && !this.sourceHasKey(te, "type") && !this.sourceHasKey(te, "schema"))) {
            var byDefault = false;
            if (!Array.isArray(result.type) || !result.type.length) {
                byDefault = true;
            }
            else {
                byDefault = result.type[0] != "array";
            }
            if (byDefault) {
                this.appendMeta(result, "type", "insertedAsDefault");
            }
        }
        else {
            this.removeMeta(result, "type");
        }
    };
    TypeExpander.prototype.dumpProperty = function (p, gte, expand, isFacet) {
        if (isFacet === void 0) { isFacet = false; }
        var dumpedPropertyType;
        var propType = p.type();
        if (!expand && propType.name()) {
            dumpedPropertyType = {
                type: [propType.name()],
                displayName: p.name(),
                typePropertyKind: "TYPE_EXPRESSION"
            };
            this.appendMeta(dumpedPropertyType, "displayName", "calculated");
        }
        else {
            dumpedPropertyType = this.dump(propType, expand);
            if (this.options.isInsideTemplate) {
                if (dumpedPropertyType.name != null && dumpedPropertyType.name.indexOf("<<") >= 0) {
                    dumpedPropertyType = {
                        type: [dumpedPropertyType.name],
                        typePropertyKind: "TYPE_EXPRESSION"
                    };
                }
            }
            if (dumpedPropertyType.__METADATA__) {
                dumpedPropertyType.__METADATA__ = JSON.parse(JSON.stringify(dumpedPropertyType.__METADATA__));
            }
            if (dumpedPropertyType.displayName == null || propType.name()) {
                dumpedPropertyType.displayName = p.name();
                this.appendMeta(dumpedPropertyType, "displayName", "calculated");
            }
        }
        this.appendSourceFromExtras(dumpedPropertyType, p.source() || gte);
        dumpedPropertyType.name = p.name();
        if (!isFacet) {
            dumpedPropertyType.required = p.required();
        }
        // if (p.metadata()) {
        //     //dumpedPropertyType.__METADATA__ = p.metadata();
        // }
        //else
        if (!isFacet) {
            if (p.required()) {
                var processed = false;
                if (p.original()) {
                    if (p.original().range().getExtra("HAS_FACETS")) {
                        var hf = p.original().range().getExtra("HAS_FACETS");
                        if (hf.length && hf.indexOf("required") >= 0) {
                            processed = true;
                        }
                    }
                    if (!processed) {
                        this.appendMeta(dumpedPropertyType, "required", "insertedAsDefault");
                    }
                }
                else {
                    if (propType.name() || propType.isBuiltIn()) {
                        this.appendMeta(dumpedPropertyType, "required", "insertedAsDefault");
                    }
                    else if (!this.sourceHasKey(propType, "required")) {
                        this.appendMeta(dumpedPropertyType, "required", "insertedAsDefault");
                    }
                }
            }
        }
        var typeChecked = false;
        var pte = propType;
        if (propType.isBuiltIn() || (propType.original() && propType.original().isBuiltin())) {
            if (p.original()) {
                var range = p.original().range();
                if (!range.isBuiltin()) {
                    pte = new GeneralTypeEntry(range, [], null, [], [], null);
                }
            }
        }
        if (expand || pte != propType) {
            this.checkIfTypePropertyIsDefault(pte, dumpedPropertyType);
        }
        this.checkIfPropertyTypeIsCalculated(dumpedPropertyType, p, isFacet, expand);
        if (p.annotations() && p.annotations().length) {
            var scalarsAnnotations = dumpedPropertyType.scalarsAnnotations;
            if (!scalarsAnnotations) {
                scalarsAnnotations = {};
                dumpedPropertyType.scalarsAnnotations = scalarsAnnotations;
            }
            scalarsAnnotations['required'] = [[]];
            for (var _i = 0, _a = p.annotations(); _i < _a.length; _i++) {
                var a = _a[_i];
                scalarsAnnotations['required'][0].push({
                    name: a.name(),
                    value: a.value()
                });
            }
        }
        return dumpedPropertyType;
    };
    TypeExpander.prototype.dumpAnnotations = function (annotations, obj) {
        if (annotations && annotations.length > 0) {
            var aArr_1 = [];
            obj.annotations = aArr_1;
            annotations.forEach(function (x) {
                aArr_1.push({
                    name: x.name(),
                    value: x.value()
                });
            });
        }
    };
    ;
    TypeExpander.prototype.dumpFacets = function (te, result, expand) {
        var customFacets = [];
        if (te.original()) {
            if (expand) {
                customFacets = te.original().allCustomFacets() || [];
            }
            else {
                customFacets = te.original().customFacets() || [];
            }
            var map_1 = {};
            te.original().allDefinedFacets().forEach(function (x) { return map_1[x.name()] = true; });
            customFacets = customFacets.filter(function (x) { return map_1[x.facetName()] === true; });
        }
        if (this.options.isInsideTemplate) {
            var parametrized_2 = [];
            customFacets = customFacets.filter(function (x) {
                if (x.facetName().indexOf("<<") >= 0) {
                    parametrized_2.push(x);
                    return false;
                }
                return true;
            });
            for (var _i = 0, parametrized_1 = parametrized_2; _i < parametrized_1.length; _i++) {
                var p = parametrized_1[_i];
                result[p.facetName()] = p.value();
            }
        }
        if (customFacets && customFacets.length > 0) {
            var facetsObj_1 = [];
            result.fixedFacets = facetsObj_1;
            customFacets.forEach(function (x) {
                try {
                    var val = x.value();
                    if (typeof val == 'object') {
                        JSON.stringify(val);
                    }
                    facetsObj_1.push({
                        name: x.facetName(),
                        value: val
                    });
                }
                catch (e) {
                    console.log('Error while dumping ' + x.facetName());
                    console.log(e);
                }
            });
        }
        var builtInTypes = te.possibleBuiltInTypes({});
        var propMap = propertiesForBuiltinTypes(builtInTypes);
        var facetsMap = {};
        var facets = expand ? te.allFacets() : te.declaredFacets();
        for (var _a = 0, facets_2 = facets; _a < facets_2.length; _a++) {
            var f = facets_2[_a];
            if (f.kind() == tsInterfaces.MetaInformationKind.DiscriminatorValue) {
                if (!f.isStrict()) {
                    continue;
                }
            }
            var fn = f.facetName();
            if (propMap[fn]) {
                var fArr = facetsMap[fn];
                if (!fArr) {
                    fArr = [];
                    facetsMap[fn] = fArr;
                }
                fArr.push(f);
            }
        }
        for (var _b = 0, _c = Object.keys(facetsMap); _b < _c.length; _b++) {
            var fn = _c[_b];
            var fArr = facetsMap[fn];
            var val = void 0;
            if (fArr.length == 1) {
                val = fArr[0].value();
            }
            else {
                val = this.mergeFacetValues(fArr);
            }
            if (typeof val == "string" || typeof val == "number" || typeof val == "boolean") {
                if (fn == "allowedTargets" && !Array.isArray(val)) {
                    val = [val];
                }
                else if (fn == "enum") {
                    if (!Array.isArray(val)) {
                        val = [val];
                    }
                    if (te.original() && te.original().isString()) {
                        val = val.map(function (x) { return "" + x; });
                    }
                }
                result[fn] = val;
            }
        }
    };
    TypeExpander.prototype.mergeFacetValues = function (arr) {
        if (arr.length == 0) {
            return null;
        }
        var c;
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var f = arr_1[_i];
            if (!c) {
                if (!f.isConstraint()) {
                    return f.value();
                }
                c = f;
                continue;
            }
            if (!f.isConstraint()) {
                continue;
            }
            c = c.composeWith(f);
        }
        if (!c) {
            return arr[0].value();
        }
        return c.value();
    };
    TypeExpander.prototype.dumpMeta = function (te, result, expand) {
        var meta = expand ? te.meta() : te.declaredFacets();
        for (var _i = 0, meta_1 = meta; _i < meta_1.length; _i++) {
            var m = meta_1[_i];
            var name_2 = m.facetName();
            if (MetaNamesProvider.getInstance().hasProperty(name_2)) {
                if (!result.hasOwnProperty(name_2)) {
                    result[name_2] = m.value();
                    if (name_2 == "allowedTargets" && !Array.isArray(m.value())) {
                        result[name_2] = [m.value()];
                    }
                    else if (name_2 == "enum") {
                        if (!Array.isArray(m.value())) {
                            result[name_2] = [m.value()];
                        }
                        if (te.original() && te.original().isString()) {
                            result[name_2] = result[name_2].map(function (x) { return "" + x; });
                        }
                    }
                }
            }
            else if (name_2 == "closed") {
                var val = m.value();
                result["additionalProperties"] = val;
            }
        }
    };
    TypeExpander.prototype.sourceHasKey = function (te, key) {
        var src = te.original() && te.original().getExtra("SOURCE");
        var result = null;
        if (src) {
            if (hlImpl.LowLevelWrapperForTypeSystem.isInstance(src)) {
                var childWithKey = src.childWithKey(key);
                result = childWithKey && childWithKey.value() != null;
            }
            else if (hlImpl.ASTNodeImpl.isInstance(src)) {
                var attr = src.attr(key);
                result = attr && attr.value() != null;
            }
            else if (src.obj) {
                result = src.obj[key] != null;
            }
        }
        return result;
    };
    TypeExpander.prototype.appendMeta = function (obj, field, kind) {
        if (!this.options.serializeMetadata) {
            return;
        }
        var metaObj = obj.__METADATA__;
        if (!metaObj) {
            metaObj = {};
            obj.__METADATA__ = metaObj;
        }
        var scalarsObj = metaObj.primitiveValuesMeta;
        if (!scalarsObj) {
            scalarsObj = {};
            metaObj.primitiveValuesMeta = scalarsObj;
        }
        var fObj = scalarsObj[field];
        if (!fObj) {
            fObj = {};
            scalarsObj[field] = fObj;
        }
        fObj[kind] = true;
    };
    TypeExpander.prototype.removeMeta = function (obj, field) {
        if (!this.options.serializeMetadata) {
            return;
        }
        var metaObj = obj.__METADATA__;
        if (!metaObj) {
            return;
        }
        var scalarsObj = metaObj.primitiveValuesMeta;
        if (!scalarsObj) {
            return;
        }
        var fObj = scalarsObj[field];
        if (!fObj) {
            return;
        }
        delete scalarsObj[field];
        if (Object.keys(metaObj.primitiveValuesMeta)) {
            return;
        }
        delete metaObj.primitiveValuesMeta;
        if (Object.keys(metaObj)) {
            return;
        }
        delete obj.__METADATA__;
    };
    TypeExpander.prototype.checkIfPropertyTypeIsCalculated = function (dumpedPropertyType, p, isFacet, expand) {
        if (!this.options.serializeMetadata) {
            return;
        }
        var domSrc = p.original() && p.original().declaredAt().getExtra("SOURCE");
        if (domSrc) {
            var llDomSrc = void 0;
            if (hlImpl.ASTNodeImpl.isInstance(domSrc)) {
                llDomSrc = domSrc.lowLevel();
            }
            else if (hlImpl.LowLevelWrapperForTypeSystem.isInstance(domSrc)) {
                llDomSrc = domSrc.node();
            }
            if (llDomSrc) {
                var propsSrc = _.find(llDomSrc.children(), function (x) { return x.key() == (isFacet ? "facets" : "properties"); });
                if (propsSrc) {
                    var pSrc = _.find(propsSrc.children(), function (x) { return x.key() == p.name(); });
                    if (pSrc) {
                        if (pSrc.resolvedValueKind() == yaml.Kind.SCALAR) {
                            if (!expand || def.rt.builtInTypes().get(pSrc.value())) {
                                this.removeMeta(dumpedPropertyType, "type");
                            }
                        }
                        else if (pSrc.resolvedValueKind() == yaml.Kind.SEQ) {
                            var typeNodes = pSrc.children();
                            if (typeNodes.length > 1) {
                                this.removeMeta(dumpedPropertyType, "type");
                            }
                            else if (typeNodes.length == 1 && typeNodes[0].resolvedValueKind() == yaml.Kind.SCALAR) {
                                var tNode = typeNodes[0];
                                if (!expand || def.rt.builtInTypes().get(tNode.value())) {
                                    this.removeMeta(dumpedPropertyType, "type");
                                }
                            }
                        }
                        else {
                            var typeChild = _.find(pSrc.children(), function (x) { return x.key() == "type"; });
                            if (!typeChild) {
                                typeChild = _.find(pSrc.children(), function (x) { return x.key() == "schema"; });
                            }
                            if (typeChild) {
                                if (typeChild.resolvedValueKind() == yaml.Kind.SEQ) {
                                    var typeNodes = typeChild.children();
                                    if (typeNodes.length > 1) {
                                        this.removeMeta(dumpedPropertyType, "type");
                                    }
                                    else if (typeNodes.length == 1 && typeNodes[0].resolvedValueKind() == yaml.Kind.SCALAR) {
                                        var tNode = typeNodes[0];
                                        if (!expand || def.rt.builtInTypes().get(tNode.value())) {
                                            this.removeMeta(dumpedPropertyType, "type");
                                        }
                                    }
                                }
                                else if (typeChild.resolvedValueKind() == yaml.Kind.SCALAR) {
                                    if (!expand || def.rt.builtInTypes().get(typeChild.value())) {
                                        this.removeMeta(dumpedPropertyType, "type");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    TypeExpander.prototype.patchDisplayName = function (te, result) {
        if (!result.displayName && result.name) {
            result.displayName = result.name;
            var llSrc = void 0;
            var src = te.original() && te.original().getExtra("SOURCE");
            if (src) {
                if (hlImpl.LowLevelWrapperForTypeSystem.isInstance(src)) {
                    llSrc = src.node();
                }
                else if (hlImpl.ASTNodeImpl.isInstance(src)) {
                    var schemaPath = void 0;
                    llSrc = src.lowLevel();
                }
            }
            if (llSrc) {
                jsonSerializerHL.patchDisplayName(result, llSrc);
            }
            else {
                result.displayName = result.name;
            }
            this.appendMeta(result, "displayName", "calculated");
        }
        if (result.hasOwnProperty("displayName") && result.displayName != null) {
            result.displayName = "" + result.displayName;
        }
    };
    return TypeExpander;
}());
exports.TypeExpander = TypeExpander;
function propertiesForBuiltinTypes(builtInTypes) {
    var types = [];
    for (var _i = 0, builtInTypes_1 = builtInTypes; _i < builtInTypes_1.length; _i++) {
        var tn = builtInTypes_1[_i];
        var t = typeSystem.builtInTypes().get(tn);
        if (t) {
            var ts = builder.mapType(t);
            ts.forEach(function (x) { return types.push(x); });
        }
    }
    var propMap = {};
    types.forEach(function (x) {
        x.properties().forEach(function (p) { return propMap[p.nameId()] = true; });
    });
    return propMap;
}
var MetaNamesProvider = /** @class */ (function () {
    function MetaNamesProvider() {
        this.map = {};
        this.init();
    }
    MetaNamesProvider.getInstance = function () {
        if (!MetaNamesProvider.instance) {
            MetaNamesProvider.instance = new MetaNamesProvider();
        }
        return MetaNamesProvider.instance;
    };
    MetaNamesProvider.prototype.init = function () {
        var types = [
            def.getUniverse("RAML10").type(def.universesInfo.Universe10.TypeDeclaration.name),
            def.getUniverse("RAML10").type(def.universesInfo.Universe10.StringTypeDeclaration.name),
            def.getUniverse("RAML10").type(def.universesInfo.Universe10.FileTypeDeclaration.name)
        ];
        for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
            var t = types_1[_i];
            for (var _a = 0, _b = t.properties(); _a < _b.length; _a++) {
                var p = _b[_a];
                if (p.nameId() != def.universesInfo.Universe10.TypeDeclaration.properties.schema.name) {
                    this.map[p.nameId()] = true;
                }
            }
        }
        this.map["sourceMap"] = true;
        this.map["__METADATA__"] = true;
    };
    MetaNamesProvider.prototype.hasProperty = function (n) {
        return this.map.hasOwnProperty(n);
    };
    MetaNamesProvider.instance = new MetaNamesProvider();
    return MetaNamesProvider;
}());
var filterOut = ["typePropertyKind", "sourceMap", "required", "__METADATA__", "notScalar"];
function isEmpty(t, ignoreSupertypesCount) {
    if (ignoreSupertypesCount === void 0) { ignoreSupertypesCount = false; }
    if (t.isUnion() || t.isBuiltin() || t.name()) {
        return false;
    }
    if (!ignoreSupertypesCount && t.superTypes().length != 1) {
        return false;
    }
    var meta = t.declaredFacets().filter(function (x) {
        var fn = x.facetName();
        if (filterOut.indexOf(fn) >= 0) {
            return false;
        }
        if (fn == "discriminatorValue") {
            var strict = x['isStrict'];
            return (typeof strict != "function") || strict.call(x);
        }
        else if (fn == "__METADATA__") {
            var meta_2 = x.value();
            var pMeta = meta_2.primitiveValuesMeta;
            if (!pMeta && Object.keys(meta_2).length == 0) {
                return false;
            }
            else if (pMeta) {
                if (!Object.keys(pMeta).filter(function (y) { return y != "displayName" && y != "required"; }).length) {
                    return false;
                }
                return true;
            }
            return true;
        }
        return true;
    });
    return meta.length == 0;
}
function typeAttributeValue(t) {
    if (!t) {
        return null;
    }
    var tAttr = _.find(t.declaredFacets(), function (x) { return x.kind() == tsInterfaces.MetaInformationKind.TypeAttributeValue; });
    if (tAttr) {
        return tAttr.value();
    }
    return null;
}
function resolveSchemaFragment(node, value) {
    if (!node || !hlImpl.ASTNodeImpl.isInstance(node)) {
        return null;
    }
    var n = node.attr("type") || node.attr("schema") || node;
    return hlImpl.resolveSchemaFragment(n, value);
}
//# sourceMappingURL=typeExpander.js.map