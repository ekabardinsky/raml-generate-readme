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
var universe = require("../parser/tools/universe");
var core = require("../parser/wrapped-ast/parserCore");
var proxy = require("../parser/ast.core/LowLevelASTProxy");
var yaml = require("yaml-ast-parser");
var def = require("raml-definition-system");
var tsInterfaces = def.tsInterfaces;
var hlImpl = require("../parser/highLevelImpl");
var linter = require("../parser/ast.core/linter");
var jsyaml = require("../parser/jsyaml/jsyaml2lowLevel");
var llJson = require("../parser/jsyaml/json2lowLevel");
var referencePatcher = require("../parser/ast.core/referencePatcher");
var referencePatcherLL = require("../parser/ast.core/referencePatcherLL");
var typeExpander = require("./typeExpander");
var jsonSerializerTL = require("./jsonSerializer");
var typeSystem = def.rt;
var typeExpressions = typeSystem.typeExpressions;
var universeHelpers = require("../parser/tools/universeHelpers");
var universes = require("../parser/tools/universe");
var util = require("../util/index");
var defaultCalculator = require("../parser/wrapped-ast/defaultCalculator");
var helpersLL = require("../parser/wrapped-ast/helpersLL");
var stubs = require("../parser/stubs");
var _ = require("underscore");
var pathUtils = require("path");
var RAML_MEDIATYPE = "application/raml+yaml";
function dump(node, options) {
    return new JsonSerializer(options).dump(node);
}
exports.dump = dump;
var getRootPath = function (node) {
    var rootPath;
    var rootNode = node.root();
    if (rootNode) {
        var llRoot = rootNode.lowLevel();
        if (llRoot) {
            var rootUnit = llRoot.unit();
            if (rootUnit) {
                rootPath = rootUnit.absolutePath();
            }
        }
    }
    return rootPath;
};
function appendSourcePath(eNode, result) {
    var unitPath = hlImpl.actualPath(eNode);
    var sourceMap = result.sourceMap;
    if (!sourceMap) {
        sourceMap = {};
        result.sourceMap = sourceMap;
    }
    if (!sourceMap.path) {
        sourceMap.path = unitPath;
    }
}
exports.appendSourcePath = appendSourcePath;
;
var JsonSerializer = /** @class */ (function () {
    function JsonSerializer(options) {
        this.options = options;
        this.nodePropertyTransformers = [
            new ItemsTransformer()
            //new MethodsToMapTransformer(),
            //new TypesTransformer(),
            //new TraitsTransformer(),
            //new SecuritySchemesTransformer(),
            //new ResourceTypesTransformer(),
            //new ResourcesTransformer(),
            //new TypeExampleTransformer(),
            //new ParametersTransformer(),
            //new TypesTransformer(),
            //new UsesTransformer(),
            //new PropertiesTransformer(),
            //new TypeValueTransformer(),
            //new ExamplesTransformer(),
            //new ResponsesTransformer(),
            //new BodiesTransformer(),
            //new AnnotationsTransformer(),
            //new SecuritySchemesTransformer(),
            //new AnnotationTypesTransformer(),
            //new TemplateParametrizedPropertiesTransformer(),
            //new TraitsTransformer(),
            //new ResourceTypesTransformer(),
            //new FacetsTransformer(),
            //new SchemasTransformer(),
            //new ProtocolsToUpperCaseTransformer(),
            //new ResourceTypeMethodsToMapTransformer(),
            //new ReferencesTransformer(),
            //new OneElementArrayTransformer()
        ];
        this.nodeTransformersMap = {};
        this.nodePropertyTransformersMap = {};
        this.options = this.options || {};
        if (this.options.allParameters == null) {
            this.options.allParameters = true;
        }
        if (this.options.expandSecurity == null) {
            this.options.expandSecurity = true;
        }
        if (this.options.serializeMetadata == null) {
            this.options.serializeMetadata = false;
        }
        if (this.options.attributeDefaults == null) {
            this.options.attributeDefaults = true;
        }
        if (this.options.expandExpressions == null) {
            this.options.expandExpressions = true;
        }
        if (this.options.expandTypes == null) {
            //this.options.expandTypes = true;
        }
        else if (this.options.expandTypes) {
            if (!this.options.typeExpansionRecursionDepth) {
                this.options.typeExpansionRecursionDepth = 0;
            }
        }
        this.defaultsCalculator = new defaultCalculator.AttributeDefaultsCalculator(true, true);
        this.nodeTransformers = [
            new MethodsTransformer(),
            new ResourcesTransformer(this.options, this),
            new TypeTransformer(this.options, this),
            new UsesDeclarationTransformer(this),
            new SimpleNamesTransformer(),
            new TemplateParametrizedPropertiesTransformer(),
            new SchemasTransformer(),
            new ProtocolsToUpperCaseTransformer(),
            new ReferencesTransformer(),
            new Api10SchemasTransformer(),
            new SecurityExpandingTransformer(this.options.expandSecurity),
            new AllParametersTransformer(this.options.allParameters, this.options.serializeMetadata)
        ];
        fillTransformersMap(this.nodeTransformers, this.nodeTransformersMap);
        fillTransformersMap(this.nodePropertyTransformers, this.nodePropertyTransformersMap);
    }
    JsonSerializer.prototype.init = function (node) {
        this._astRoot = node;
        this.helpersMap = {
            "baseUriParameters": baseUriParametersHandler,
            "uriParameters": uriParametersHandler
        };
        var isElement = node.isElement();
        if (isElement) {
            node.types();
            var eNode = node.asElement();
            var definition = eNode.definition();
            if (definition.universe().version() == "RAML08") {
                if (universeHelpers.isApiType(definition)) {
                    var schemasCache08 = {};
                    eNode.elementsOfKind(universes.Universe08.Api.properties.schemas.name)
                        .forEach(function (x) { return schemasCache08[x.name()] = x; });
                    this.helpersMap["schemaContent"] = new SchemaContentHandler(schemasCache08);
                }
            }
            if (universeHelpers.isApiSibling(definition)) {
                this.helpersMap["traits"] = new TemplatesHandler(helpersLL.allTraits(eNode, false));
                this.helpersMap["resourceTypes"] = new TemplatesHandler(helpersLL.allResourceTypes(eNode, false));
            }
            else if (!universeHelpers.isLibraryType(definition)) {
                delete this.options.expandTypes;
            }
        }
    };
    JsonSerializer.prototype.astRoot = function () {
        return this._astRoot;
    };
    JsonSerializer.prototype.dispose = function () {
        delete this.helpersMap;
    };
    JsonSerializer.prototype.dump = function (node) {
        this.init(node);
        var isElement = node.isElement();
        var highLevelParent = node.parent();
        var rootNodeDetails = !highLevelParent && this.options.rootNodeDetails;
        var rootPath = getRootPath(node);
        var result = this.dumpInternal(node, null, rootPath, null, true);
        if (rootNodeDetails) {
            var obj = result;
            result = {};
            result.specification = obj;
            if (isElement) {
                var eNode = node.asElement();
                var definition = eNode.definition();
                if (definition) {
                    var universe_1 = definition.universe();
                    var ramlVersion = universe_1.version();
                    result.ramlVersion = ramlVersion;
                    var typeName = definition.nameId();
                    if (!typeName) {
                        if (definition.isAssignableFrom(def.universesInfo.Universe10.TypeDeclaration.name)) {
                            var typeDecl = universe_1.type(def.universesInfo.Universe10.TypeDeclaration.name);
                            var map_1 = {};
                            typeDecl.allSubTypes().forEach(function (x) { return map_1[x.nameId()] = true; });
                            for (var _i = 0, _a = definition.allSuperTypes(); _i < _a.length; _i++) {
                                var st = _a[_i];
                                if (map_1[st.nameId()]) {
                                    typeName = st.nameId();
                                    break;
                                }
                            }
                        }
                    }
                    result.type = typeName;
                }
                result.errors = this.dumpErrors(core.errors(eNode));
            }
        }
        this.dispose();
        return result;
    };
    JsonSerializer.prototype.dumpInternal = function (_node, nodeProperty, rp, meta, isRoot) {
        var _this = this;
        if (isRoot === void 0) { isRoot = false; }
        if (_node == null) {
            return null;
        }
        if (_node.isReused()) {
            var reusedJSON = _node.getJSON();
            if (reusedJSON != null) {
                //console.log(_node.id());
                return reusedJSON;
            }
        }
        var result = {};
        if (_node.isElement()) {
            var map = {};
            var eNode = _node.asElement();
            var definition = eNode.definition();
            var eNodeProperty = nodeProperty || eNode.property();
            if (universeHelpers.isExampleSpecType(definition)) {
                if (eNode.parent() != null) {
                    result = ""; //to be fulfilled by the transformer
                }
                else {
                    var at = hlImpl.auxiliaryTypeForExample(eNode);
                    var eObj = helpersLL.dumpExpandableExample(at.examples()[0], this.options.dumpXMLRepresentationOfExamples);
                    var uses = eNode.elementsOfKind("uses").map(function (x) { return _this.dumpInternal(x, x.property(), rp); });
                    if (uses.length > 0) {
                        eObj["uses"] = uses;
                    }
                    result = eObj;
                }
            }
            else {
                var obj = {};
                var children = eNode.attrs()
                    .concat(eNode.children().filter(function (x) { return !x.isAttr(); }));
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var ch = children_1[_i];
                    var prop = ch.property();
                    if (prop != null) {
                        var pName_1 = prop.nameId();
                        var pVal = map[pName_1];
                        if (pVal == null) {
                            pVal = new PropertyValue(prop);
                            map[pName_1] = pVal;
                        }
                        pVal.registerValue(ch);
                    }
                    else {
                        var llNode = ch.lowLevel();
                        var key = llNode.key();
                        if (key) {
                            //obj[key] = llNode.dumpToObject();
                        }
                    }
                }
                var scalarsAnnotations = {};
                var scalarsSources = {};
                var _loop_1 = function (p) {
                    if (def.UserDefinedProp.isInstance(p)) {
                        return "continue";
                    }
                    var pName_2 = p.nameId();
                    //TODO implement as transformer or ignore case
                    if (!isRoot && pName_2 == "uses") {
                        if (universeHelpers.isApiSibling(eNode.root().definition())) {
                            return "continue";
                        }
                    }
                    var pVal = map[pName_2];
                    if (universeHelpers.isTypeProperty(p)) {
                        if (pVal && pVal.arr.length == 1 && pVal.arr[0].isAttr() && (pVal.arr[0].asAttr().value() == null)) {
                            pVal = undefined;
                        }
                    }
                    pVal = this_1.applyHelpers(pVal, eNode, p, this_1.options.serializeMetadata);
                    var udVal = obj[pName_2];
                    var aVal = void 0;
                    if (pVal !== undefined) {
                        if (pVal.isMultiValue) {
                            aVal = pVal.arr.map(function (x, i) {
                                var pMeta = pVal.hasMeta ? pVal.mArr[i] : null;
                                return _this.dumpInternal(x, pVal.prop, rp, pMeta);
                            });
                            if (p.isValueProperty()) {
                                var sAnnotations_1 = [];
                                var sPaths_1 = [];
                                var gotScalarAnnotations_1 = false;
                                pVal.arr.filter(function (x) { return x.isAttr(); }).map(function (x) { return x.asAttr(); })
                                    .filter(function (x) { return x.isAnnotatedScalar(); }).forEach(function (x) {
                                    var sAnnotations1 = x.annotations().map(function (x) { return _this.dumpInternal(x, null, rp); });
                                    gotScalarAnnotations_1 = gotScalarAnnotations_1 || sAnnotations1.length > 0;
                                    sAnnotations_1.push(sAnnotations1);
                                    sPaths_1.push(hlImpl.actualPath(x, true));
                                });
                                if (gotScalarAnnotations_1) {
                                    scalarsAnnotations[pName_2] = sAnnotations_1;
                                }
                                if (sPaths_1.filter(function (x) { return x != null; }).length > 0) {
                                    scalarsSources[pName_2] = sPaths_1.map(function (x) { return { path: x }; });
                                }
                            }
                            if (universeHelpers.isTypeDeclarationDescendant(definition)
                                && universeHelpers.isTypeProperty(p)) {
                                //TODO compatibility crutch
                                if (pVal.arr.map(function (x) { return x.value(); })
                                    .filter(function (x) { return hlImpl.isStructuredValue(x); }).length > 0) {
                                    aVal = aVal[0];
                                }
                            }
                        }
                        else {
                            aVal = this_1.dumpInternal(pVal.val, pVal.prop, rp);
                            if (p.isValueProperty()) {
                                var attr = pVal.val.asAttr();
                                if (attr.isAnnotatedScalar()) {
                                    var sAnnotations = attr.annotations().map(function (x) { return _this.dumpInternal(x, null, rp); });
                                    if (sAnnotations.length > 0) {
                                        scalarsAnnotations[pName_2] = [sAnnotations];
                                    }
                                }
                                if (!attr.isFromKey()) {
                                    var sPath = hlImpl.actualPath(attr, true);
                                    if (sPath) {
                                        scalarsSources[pName_2] = [{ path: sPath }];
                                    }
                                }
                            }
                        }
                    }
                    else if (udVal !== undefined) {
                        aVal = udVal;
                    }
                    else if (this_1.options.attributeDefaults) {
                        defVal = this_1.defaultsCalculator.attributeDefaultIfEnabled(eNode, p);
                        if (defVal != null) {
                            meta = meta || new core.NodeMetadataImpl();
                            if (Array.isArray(defVal)) {
                                defVal = defVal.map(function (x) {
                                    if (hlImpl.isASTPropImpl(x)) {
                                        return _this.dumpInternal(x, p, rp);
                                    }
                                    return x;
                                });
                            }
                            else if (hlImpl.BasicASTNode.isInstance(defVal)) {
                                defVal = this_1.dumpInternal(defVal, p, rp);
                            }
                            aVal = defVal;
                            if (aVal != null && p.isMultiValue() && !Array.isArray(aVal)) {
                                aVal = [aVal];
                            }
                            insertionKind = this_1.defaultsCalculator.insertionKind(eNode, p);
                            if (insertionKind == defaultCalculator.InsertionKind.CALCULATED) {
                                meta.registerCalculatedValue(pName_2);
                            }
                            else if (insertionKind == defaultCalculator.InsertionKind.BY_DEFAULT) {
                                meta.registerInsertedAsDefaultValue(pName_2);
                            }
                        }
                    }
                    aVal = applyTransformersMap(eNode, p, aVal, this_1.nodePropertyTransformersMap);
                    if (aVal != null) {
                        //TODO implement as transformer
                        if ((pName_2 === "type" || pName_2 == "schema") && aVal && aVal.forEach && typeof aVal[0] === "string") {
                            var schemaString = aVal[0].trim();
                            var canBeJson = (schemaString[0] === "{" && schemaString[schemaString.length - 1] === "}");
                            var canBeXml = (schemaString[0] === "<" && schemaString[schemaString.length - 1] === ">");
                            if (canBeJson || canBeXml) {
                                var schemaPath = getSchemaPath(eNode);
                                if (schemaPath) {
                                    result["schemaPath"] = schemaPath;
                                    var sourceMap = result.sourceMap;
                                    if (!sourceMap) {
                                        sourceMap = {};
                                        result.sourceMap = sourceMap;
                                    }
                                    sourceMap.path = schemaPath;
                                }
                            }
                        }
                        result[pName_2] = aVal;
                    }
                };
                var this_1 = this, defVal, insertionKind;
                for (var _a = 0, _b = definition.allProperties()
                    .concat(definition.allCustomProperties()); _a < _b.length; _a++) {
                    var p = _b[_a];
                    _loop_1(p);
                }
                if (this.options.dumpSchemaContents && map["schema"]) {
                    if (map["schema"].prop.range().key() == universes.Universe08.SchemaString) {
                        var schemas = eNode.root().elementsOfKind("schemas");
                        schemas.forEach(function (x) {
                            if (x.name() == result["schema"]) {
                                var vl = x.attr("value");
                                if (vl) {
                                    result["schema"] = vl.value();
                                    result["schemaContent"] = vl.value();
                                }
                            }
                        });
                    }
                }
                if (this.options.serializeMetadata) {
                    this.serializeMeta(result, eNode, meta);
                }
                if (Object.keys(scalarsAnnotations).length > 0) {
                    result["scalarsAnnotations"] = scalarsAnnotations;
                }
                if (this.options.sourceMap && Object.keys(scalarsSources).length > 0) {
                    var sourceMap = result.sourceMap;
                    if (!sourceMap) {
                        sourceMap = {};
                        result.sourceMap = sourceMap;
                    }
                    sourceMap.scalarsSources = scalarsSources;
                }
                var pProps = helpersLL.getTemplateParametrizedProperties(eNode);
                if (pProps) {
                    result["parametrizedProperties"] = pProps;
                }
                if (universeHelpers.isTypeDeclarationDescendant(definition)) {
                    var fixedFacets = helpersLL.typeFixedFacets(eNode);
                    if (fixedFacets) {
                        result["fixedFacets"] = fixedFacets;
                    }
                }
                result = applyTransformersMap(eNode, eNodeProperty, result, this.nodeTransformersMap);
            }
            if (this.options.sourceMap && typeof result == "object") {
                appendSourcePath(eNode, result);
            }
        }
        else if (_node.isAttr()) {
            var aNode = _node.asAttr();
            var val = aNode.value();
            var prop = aNode.property();
            var rangeType = prop.range();
            var isValueType = rangeType.isValueType();
            if (isValueType && aNode['value']) {
                val = aNode['value']();
                if (val == null && universeHelpers.isAnyTypeType(rangeType)) {
                    var llAttrNode = aNode.lowLevel();
                    if (aNode.isAnnotatedScalar()) {
                        llAttrNode = _.find(llAttrNode.children(), function (x) { return x.key() == "value"; });
                    }
                    if (llAttrNode && llAttrNode.valueKind() != yaml.Kind.SCALAR) {
                        val = aNode.lowLevel().dumpToObject();
                        var pName = prop.nameId();
                        if (aNode.lowLevel().key() == pName && typeof val == "object" && val.hasOwnProperty(pName)) {
                            val = val[pName];
                        }
                    }
                }
            }
            if (val != null && (typeof val == 'number' || typeof val == 'string' || typeof val == 'boolean')) {
                if (universeHelpers.isStringTypeDescendant(prop.range())) {
                    val = '' + val;
                }
            }
            else if (hlImpl.isStructuredValue(val)) {
                val = aNode.plainValue();
                if (hlImpl.BasicASTNode.isInstance(val)) {
                    val = this.dumpInternal(val, nodeProperty || aNode.property(), rp, null, true);
                }
            }
            else if (jsyaml.ASTNode.isInstance(val) || proxy.LowLevelProxyNode.isInstance(val)) {
                val = val.dumpToObject();
            }
            val = applyTransformersMap(aNode, nodeProperty || aNode.property(), val, this.nodeTransformersMap);
            result = val;
        }
        else {
            var llNode = _node.lowLevel();
            result = llNode ? llNode.dumpToObject() : null;
        }
        _node.setJSON(result);
        return result;
    };
    JsonSerializer.prototype.getDefaultsCalculator = function () {
        return this.defaultsCalculator;
    };
    JsonSerializer.prototype.canBeFragment = function (node) {
        var definition = node.definition();
        var arr = [definition].concat(definition.allSubTypes());
        var arr1 = arr.filter(function (x) { return x.getAdapter(def.RAMLService).possibleInterfaces()
            .filter(function (y) { return y.nameId() == def.universesInfo.Universe10.FragmentDeclaration.name; }).length > 0; });
        return arr1.length > 0;
    };
    JsonSerializer.prototype.dumpErrors = function (errors) {
        var _this = this;
        return errors.map(function (x) {
            var eObj = _this.dumpErrorBasic(x);
            if (x.trace && x.trace.length > 0) {
                eObj['trace'] = _this.dumpErrors(x.trace);
            }
            return eObj;
        }).sort(function (x, y) {
            if (x.path != y.path) {
                return x.path.localeCompare(y.path);
            }
            if (y.range.start == null) {
                return 1;
            }
            else if (x.range.start == null) {
                return -1;
            }
            if (y.range.start == null) {
                return 1;
            }
            else if (x.range.start == null) {
                return -1;
            }
            if (x.range.start.position != y.range.start.position) {
                return x.range.start.position - y.range.start.position;
            }
            return x.code - y.code;
        });
    };
    JsonSerializer.prototype.dumpErrorBasic = function (x) {
        var eObj = {
            "code": x.code,
            "message": x.message,
            "path": x.path,
            "line": x.line,
            "column": x.column,
            "position": x.start,
            "range": x.range
        };
        if (x.isWarning === true) {
            eObj.isWarning = true;
        }
        return eObj;
    };
    JsonSerializer.prototype.serializeMeta = function (obj, node, _meta) {
        if (!this.options.serializeMetadata) {
            return;
        }
        var definition = node.definition();
        var isOptional = universeHelpers.isMethodType(definition) && node.optional();
        if (!_meta && !isOptional) {
            return;
        }
        var meta = _meta || new core.NodeMetadataImpl(false, false);
        if (isOptional) {
            meta.setOptional();
        }
        //if (!meta.isDefault()) {
        obj["__METADATA__"] = meta.toJSON();
        //}
    };
    JsonSerializer.prototype.applyHelpers = function (pVal, node, p, serializeMetadata) {
        var pName = p.nameId();
        var hMethod = this.helpersMap[pName];
        if (!hMethod) {
            return pVal;
        }
        var newVal = hMethod.apply(node, pVal, p, serializeMetadata);
        if (!newVal) {
            return pVal;
        }
        return newVal;
    };
    return JsonSerializer;
}());
exports.JsonSerializer = JsonSerializer;
var PropertyValue = /** @class */ (function () {
    function PropertyValue(prop) {
        this.prop = prop;
        this.arr = [];
        this.mArr = [];
        this.isMultiValue = prop.isMultiValue();
    }
    PropertyValue.prototype.registerValue = function (val) {
        if (this.isMultiValue) {
            this.arr.push(val);
        }
        else {
            this.val = val;
        }
    };
    PropertyValue.prototype.registerMeta = function (m) {
        if (this.isMultiValue) {
            this.mArr.push(m);
        }
    };
    return PropertyValue;
}());
function applyHelpers(pVal, node, p, serializeMetadata, schemasCache08) {
    var newVal;
    if (universeHelpers.isBaseUriParametersProperty(p)) {
        newVal = baseUriParameters(node, pVal, p, serializeMetadata);
    }
    if (universeHelpers.isUriParametersProperty(p)) {
        newVal = uriParameters(node, pVal, p, serializeMetadata);
    }
    else if (universeHelpers.isTraitsProperty(p)) {
        var arr = helpersLL.allTraits(node, false);
        newVal = contributeExternalNodes(node, arr, p, serializeMetadata);
    }
    else if (universeHelpers.isResourceTypesProperty(p)) {
        var arr = helpersLL.allResourceTypes(node, false);
        newVal = contributeExternalNodes(node, arr, p, serializeMetadata);
    }
    else if (p.nameId() == "schemaContent") {
        var attr = helpersLL.schemaContent08Internal(node, schemasCache08);
        if (attr) {
            newVal = new PropertyValue(p);
            newVal.registerValue(attr);
        }
    }
    if (newVal) {
        return newVal;
    }
    return pVal;
}
function uriParameters(resource, pVal, p, serializeMetadata) {
    if (serializeMetadata === void 0) { serializeMetadata = false; }
    var attr = resource.attr(universes.Universe10.Resource.properties.relativeUri.name);
    if (!attr) {
        return pVal;
    }
    var uri = attr.value();
    return extractParams(pVal, uri, resource, p, serializeMetadata);
}
function baseUriParameters(api, pVal, p, serializeMetadata) {
    if (serializeMetadata === void 0) { serializeMetadata = false; }
    var buriAttr = api.attr(universes.Universe10.Api.properties.baseUri.name);
    var uri = buriAttr ? buriAttr.value() : '';
    return extractParams(pVal, uri, api, p, serializeMetadata);
}
function extractParams(pVal, uri, ownerHl, prop, serializeMetadata) {
    if (!uri) {
        return pVal;
    }
    var describedParams = {};
    if (pVal) {
        pVal.arr.forEach(function (x) {
            var arr = describedParams[x.name()];
            if (!arr) {
                arr = [];
                describedParams[x.name()] = arr;
            }
            arr.push(x);
        });
    }
    var newVal = new PropertyValue(prop);
    var prev = 0;
    var mentionedParams = {};
    var gotUndescribedParam = false;
    for (var i = uri.indexOf('{'); i >= 0; i = uri.indexOf('{', prev)) {
        prev = uri.indexOf('}', ++i);
        if (prev < 0) {
            break;
        }
        var paramName = uri.substring(i, prev);
        mentionedParams[paramName] = true;
        if (describedParams[paramName]) {
            describedParams[paramName].forEach(function (x) {
                newVal.registerValue(x);
                newVal.registerMeta(null);
            });
        }
        else {
            gotUndescribedParam = true;
            var universe = ownerHl.definition().universe();
            var nc = universe.type(universes.Universe10.StringTypeDeclaration.name);
            var hlNode = stubs.createStubNode(nc, null, paramName, ownerHl.lowLevel().unit());
            hlNode.setParent(ownerHl);
            hlNode.attrOrCreate("name").setValue(paramName);
            hlNode.patchProp(prop);
            newVal.registerValue(hlNode);
            if (serializeMetadata) {
                newVal.hasMeta = true;
                var meta = new core.NodeMetadataImpl();
                meta.setCalculated();
                newVal.registerMeta(meta);
            }
        }
    }
    if (!gotUndescribedParam) {
        return pVal;
    }
    Object.keys(describedParams).filter(function (x) { return !mentionedParams[x]; })
        .forEach(function (x) { return describedParams[x].forEach(function (y) {
        newVal.registerValue(y);
        if (newVal.hasMeta) {
            newVal.registerMeta(null);
        }
    }); });
    return newVal;
}
;
function contributeExternalNodes(ownerNode, arr, p, serializeMetadata) {
    if (arr.length == 0) {
        return null;
    }
    var rootPath = ownerNode.lowLevel().unit().absolutePath();
    var newVal = new PropertyValue(p);
    arr.forEach(function (x) {
        newVal.registerValue(x);
        if (serializeMetadata) {
            if (x.lowLevel().unit().absolutePath() != rootPath) {
                newVal.hasMeta = true;
                var meta = new core.NodeMetadataImpl();
                meta.setCalculated();
                newVal.mArr.push(meta);
            }
            else {
                newVal.mArr.push(null);
            }
        }
    });
    return newVal;
}
var baseUriParametersHandler = {
    apply: function (node, pVal, p, serializeMetadata) {
        var buriAttr = node.attr(universes.Universe10.Api.properties.baseUri.name);
        var uri = buriAttr ? buriAttr.value() : '';
        return extractParams(pVal, uri, node, p, serializeMetadata);
    }
};
var uriParametersHandler = {
    apply: function (node, pVal, p, serializeMetadata) {
        var attr = node.attr(universes.Universe10.Resource.properties.relativeUri.name);
        if (!attr) {
            return pVal;
        }
        var uri = attr.value();
        return extractParams(pVal, uri, node, p, serializeMetadata);
    }
};
var TemplatesHandler = /** @class */ (function () {
    function TemplatesHandler(arr) {
        this.arr = arr;
    }
    TemplatesHandler.prototype.apply = function (node, pVal, p, serializeMetadata) {
        //var arr = helpersHL.allTraits(node,false);
        return contributeExternalNodes(node, this.arr, p, serializeMetadata);
    };
    return TemplatesHandler;
}());
var SchemaContentHandler = /** @class */ (function () {
    function SchemaContentHandler(schemasCache08) {
        this.schemasCache08 = schemasCache08;
    }
    SchemaContentHandler.prototype.apply = function (node, pVal, p, serializeMetadata) {
        var newVal = null;
        var attr = helpersLL.schemaContent08Internal(node, this.schemasCache08);
        if (attr) {
            newVal = new PropertyValue(p);
            newVal.registerValue(attr);
        }
        return newVal;
    };
    return SchemaContentHandler;
}());
function applyTransformersMap(node, prop, value, map) {
    var definition;
    if (node.isElement()) {
        definition = node.asElement().definition();
    }
    else if (node.isAttr()) {
        var p = node.asAttr().property();
        if (p) {
            definition = p.range();
        }
    }
    if (definition instanceof def.UserDefinedClass || definition.isUserDefined()) {
        definition = _.find(definition.allSuperTypes(), function (x) { return !x.isUserDefined(); });
    }
    if (definition == null) {
        return value;
    }
    var rv = definition.universe().version();
    var uMap = map[rv];
    if (!uMap) {
        return value;
    }
    var tMap = uMap[definition.nameId()];
    if (!tMap) {
        return value;
    }
    var pName = prop ? prop.nameId() : "__$$anyprop__";
    var arr = tMap[pName];
    if (!arr) {
        arr = tMap["__$$anyprop__"];
    }
    if (!arr) {
        return value;
    }
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var t = arr_1[_i];
        value = t.transform(value, node, prop);
    }
    return value;
}
exports.applyTransformersMap = applyTransformersMap;
function fillTransformersMap(tArr, map) {
    for (var _i = 0, tArr_1 = tArr; _i < tArr_1.length; _i++) {
        var t = tArr_1[_i];
        var info = t.registrationInfo();
        if (!info) {
            continue;
        }
        for (var _a = 0, _b = Object.keys(info); _a < _b.length; _a++) {
            var uName = _b[_a];
            var uObject = info[uName];
            var uMap = map[uName];
            if (uMap == null) {
                uMap = {};
                map[uName] = uMap;
            }
            for (var _c = 0, _d = Object.keys(uObject); _c < _d.length; _c++) {
                var tName = _d[_c];
                var tObject = uObject[tName];
                var tMap = uMap[tName];
                if (tMap == null) {
                    tMap = {};
                    uMap[tName] = tMap;
                }
                for (var _e = 0, _f = Object.keys(tObject); _e < _f.length; _e++) {
                    var pName = _f[_e];
                    var arr = tMap[pName];
                    if (arr == null) {
                        arr = [];
                        if (pName != "__$$anyprop__") {
                            var aArr = tMap["__$$anyprop__"];
                            if (aArr) {
                                arr = arr.concat(aArr);
                            }
                        }
                        tMap[pName] = arr;
                    }
                    if (pName == "__$$anyprop__") {
                        for (var _g = 0, _h = Object.keys(tMap); _g < _h.length; _g++) {
                            var pn = _h[_g];
                            tMap[pn].push(t);
                        }
                    }
                    else {
                        arr.push(t);
                    }
                }
            }
        }
    }
}
var AbstractObjectPropertyMatcher = /** @class */ (function () {
    function AbstractObjectPropertyMatcher() {
    }
    AbstractObjectPropertyMatcher.prototype.match = function (td, prop) {
        if (td == null) {
            return false;
        }
        var info = this.registrationInfo();
        var ver = td.universe().version();
        if (td instanceof def.UserDefinedClass || td.isUserDefined()) {
            td = _.find(td.allSuperTypes(), function (x) { return !x.isUserDefined(); });
            if (td == null) {
                return prop == null;
            }
        }
        var uObject = info[ver];
        if (!uObject) {
            return false;
        }
        var tObject = uObject[td.nameId()];
        if (!tObject) {
            return false;
        }
        var p = (prop == null) || tObject[prop.nameId()] === true || tObject["__$$anyprop__"] === true;
        return p;
    };
    return AbstractObjectPropertyMatcher;
}());
var BasicObjectPropertyMatcher = /** @class */ (function (_super) {
    __extends(BasicObjectPropertyMatcher, _super);
    function BasicObjectPropertyMatcher(typeName, propName, applyToDescendatns, restrictToUniverses) {
        if (applyToDescendatns === void 0) { applyToDescendatns = false; }
        if (restrictToUniverses === void 0) { restrictToUniverses = ["RAML10", "RAML08"]; }
        var _this = _super.call(this) || this;
        _this.typeName = typeName;
        _this.propName = propName;
        _this.applyToDescendatns = applyToDescendatns;
        _this.restrictToUniverses = restrictToUniverses;
        return _this;
    }
    BasicObjectPropertyMatcher.prototype.registrationInfo = function () {
        var _this = this;
        if (this.regInfo) {
            return this.regInfo;
        }
        var result = {};
        var uObjects = [];
        for (var _i = 0, _a = this.restrictToUniverses; _i < _a.length; _i++) {
            var uName = _a[_i];
            var uObj = {};
            result[uName] = uObj;
            uObjects.push(uObj);
        }
        var tObjects = [];
        for (var _b = 0, _c = Object.keys(result); _b < _c.length; _b++) {
            var uName = _c[_b];
            var t = def.getUniverse(uName).type(this.typeName);
            if (t) {
                var uObject = result[uName];
                var typeNames = [this.typeName];
                if (this.applyToDescendatns) {
                    t.allSubTypes().forEach(function (x) { return typeNames.push(x.nameId()); });
                }
                for (var _d = 0, typeNames_1 = typeNames; _d < typeNames_1.length; _d++) {
                    var tName = typeNames_1[_d];
                    var tObject = {};
                    if (this.propName != null) {
                        tObject[this.propName] = true;
                    }
                    else {
                        tObject["__$$anyprop__"] = true;
                    }
                    uObject[tName] = tObject;
                }
            }
        }
        this.regInfo = {};
        Object.keys(result).forEach(function (x) {
            var uObject = result[x];
            if (Object.keys(uObject).length > 0) {
                _this.regInfo[x] = uObject;
            }
        });
        return this.regInfo;
    };
    return BasicObjectPropertyMatcher;
}(AbstractObjectPropertyMatcher));
var MatcherBasedTransformation = /** @class */ (function () {
    function MatcherBasedTransformation(matcher) {
        this.matcher = matcher;
    }
    MatcherBasedTransformation.prototype.match = function (node, prop) {
        var definition;
        if (node.isElement()) {
            definition = node.asElement().definition();
        }
        else if (node.isAttr()) {
            var prop1 = node.asAttr().property();
            if (prop1) {
                definition = prop1.range();
            }
        }
        return definition ? this.matcher.match(definition, prop) : false;
    };
    MatcherBasedTransformation.prototype.registrationInfo = function () {
        return this.matcher.registrationInfo();
    };
    return MatcherBasedTransformation;
}());
var BasicTransformation = /** @class */ (function (_super) {
    __extends(BasicTransformation, _super);
    function BasicTransformation(typeName, propName, applyToDescendatns, restrictToUniverses) {
        if (applyToDescendatns === void 0) { applyToDescendatns = false; }
        if (restrictToUniverses === void 0) { restrictToUniverses = ["RAML10", "RAML08"]; }
        var _this = _super.call(this, new BasicObjectPropertyMatcher(typeName, propName, applyToDescendatns, restrictToUniverses)) || this;
        _this.typeName = typeName;
        _this.propName = propName;
        _this.applyToDescendatns = applyToDescendatns;
        _this.restrictToUniverses = restrictToUniverses;
        return _this;
    }
    return BasicTransformation;
}(MatcherBasedTransformation));
var CompositeObjectPropertyMatcher = /** @class */ (function (_super) {
    __extends(CompositeObjectPropertyMatcher, _super);
    function CompositeObjectPropertyMatcher(matchers) {
        var _this = _super.call(this) || this;
        _this.matchers = matchers;
        return _this;
    }
    CompositeObjectPropertyMatcher.prototype.registrationInfo = function () {
        if (this.regInfo) {
            return this.regInfo;
        }
        this.regInfo = mergeRegInfos(this.matchers.map(function (x) { return x.registrationInfo(); }));
        return this.regInfo;
    };
    return CompositeObjectPropertyMatcher;
}(AbstractObjectPropertyMatcher));
// class ArrayToMapTransformer implements Transformation{
//
//     constructor(protected matcher:ObjectPropertyMatcher, protected propName:string){}
//
//     match(node:hl.IParseResult,prop:nominals.IProperty):boolean{
//         return node.isElement()&&this.matcher.match(node.asElement().definition(),prop);
//     }
//
//     transform(value:any,node:hl.IParseResult){
//         if(Array.isArray(value)&&value.length>0 && value[0][this.propName]){
//             var obj = {};
//             value.forEach(x=>{
//                 var key = x["$$"+this.propName];
//                 if(key!=null){
//                     delete x["$$"+this.propName];
//                 }
//                 else{
//                     key = x[this.propName];
//                 }
//                 var previous = obj[key];
//                 if(previous){
//                     if(Array.isArray(previous)){
//                         previous.push(x);
//                     }
//                     else{
//                         obj[key] = [ previous, x ];
//                     }
//                 }
//                 else {
//                     obj[key] = x;
//                 }
//             });
//             return obj;
//         }
//         return value;
//     }
//
//     registrationInfo():Object{
//         return this.matcher.registrationInfo();
//     }
// }
var ResourcesTransformer = /** @class */ (function (_super) {
    __extends(ResourcesTransformer, _super);
    function ResourcesTransformer(options, owner) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, universes.Universe10.Resource.name, null, true) || this;
        _this.options = options;
        _this.owner = owner;
        return _this;
    }
    ResourcesTransformer.prototype.transform = function (value, node) {
        if (Array.isArray(value)) {
            return value;
        }
        var relUri = value[universes.Universe10.Resource.properties.relativeUri.name];
        if (relUri) {
            var segments = relUri.trim().split("/");
            while (segments.length > 0 && segments[0].length == 0) {
                segments.shift();
            }
            value["relativeUriPathSegments"] = segments;
            value.absoluteUri = helpersLL.absoluteUri(node.asElement());
            value.completeRelativeUri = helpersLL.completeRelativeUri(node.asElement());
            if (universeHelpers.isResourceType(node.parent().definition())) {
                value.parentUri = helpersLL.completeRelativeUri(node.parent());
                value.absoluteParentUri = helpersLL.absoluteUri(node.parent());
            }
            else {
                value.parentUri = "";
                var parent_1 = this.owner.astRoot().asElement() || node.parent();
                var baseUriAttr = parent_1.attr(universes.Universe10.Api.properties.baseUri.name);
                var baseUri = (baseUriAttr && baseUriAttr.value()) || "";
                value.absoluteParentUri = baseUri;
            }
        }
        return value;
    };
    return ResourcesTransformer;
}(BasicTransformation));
var ItemsTransformer = /** @class */ (function (_super) {
    __extends(ItemsTransformer, _super);
    function ItemsTransformer() {
        return _super.call(this, universes.Universe10.TypeDeclaration.name, universes.Universe10.ArrayTypeDeclaration.properties.items.name, true) || this;
    }
    ItemsTransformer.prototype.transform = function (value, node) {
        if (!value || !Array.isArray(value)
            || value.length != 1
            || (typeof value[0] !== "object") || !node.isElement()) {
            return value;
        }
        var highLevelNode = node.asElement();
        var result = value[0];
        var td = highLevelNode.definition().universe().type(universe.Universe10.TypeDeclaration.name);
        var hasType = highLevelNode.definition().universe().type(universe.Universe10.ArrayTypeDeclaration.name);
        var tNode;
        var llNode = highLevelNode.attr("items").lowLevel();
        var itemsLocalType;
        var stop;
        do {
            stop = true;
            tNode = new hlImpl.ASTNodeImpl(llNode, highLevelNode, td, hasType.property(universe.Universe10.ArrayTypeDeclaration.properties.items.name));
            itemsLocalType = tNode.localType();
            if (itemsLocalType && jsonSerializerTL.isEmpty(itemsLocalType) && itemsLocalType.superTypes().length == 1) {
                var tChildren = llNode.children().filter(function (y) { return y.key() == "type"; });
                if (tChildren.length == 1) {
                    if (tChildren[0].resolvedValueKind() == yaml.Kind.SCALAR) {
                        result = tChildren[0].value();
                        break;
                    }
                    else {
                        llNode = tChildren[0];
                        stop = false;
                        result = result.type[0];
                    }
                }
            }
        } while (!stop);
        if (itemsLocalType.getExtra(tsInterfaces.TOP_LEVEL_EXTRA)
            && typeof result == "object" && !Array.isArray(result)) {
            result = result.type;
        }
        if (!Array.isArray(result)) {
            result = [result];
        }
        return result;
    };
    return ItemsTransformer;
}(BasicTransformation));
var MethodsTransformer = /** @class */ (function (_super) {
    __extends(MethodsTransformer, _super);
    function MethodsTransformer() {
        return _super.call(this, universes.Universe10.Method.name, null, true) || this;
    }
    MethodsTransformer.prototype.transform = function (value, node) {
        if (Array.isArray(value)) {
            return value;
        }
        var parent = node.parent();
        if (!universeHelpers.isResourceType(parent.definition())) {
            return value;
        }
        value.parentUri = helpersLL.completeRelativeUri(parent);
        value.absoluteParentUri = helpersLL.absoluteUri(parent);
        return value;
    };
    return MethodsTransformer;
}(BasicTransformation));
var TypeTransformer = /** @class */ (function (_super) {
    __extends(TypeTransformer, _super);
    function TypeTransformer(options, owner) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, universes.Universe10.TypeDeclaration.name, null, true) || this;
        _this.options = options;
        _this.owner = owner;
        _this.facetsToExtract = {
            "maxItems": true,
            "minItems": true,
            "discriminatorValue": true,
            "discriminator": true,
            "pattern": true,
            "minLength": true,
            "maxLength": true,
            "enum": true,
            "minimum": true,
            "maximum": true,
            "format": true,
            "fileTypes": true
        };
        return _this;
    }
    TypeTransformer.prototype.transform = function (_value, node, valueProp) {
        var _this = this;
        var nodeProperty = node.property();
        if (this.options.expandTypes && node && node.isElement()) {
            var parent_2 = node.parent();
            if (parent_2 && universeHelpers.isTypeDeclarationDescendant(parent_2.definition())) {
                return {};
            }
            var pt = node.asElement().parsedType();
            var isInsideTemplate = linter.typeOfContainingTemplate(node) != null;
            var isAnnotationType = nodeProperty && universeHelpers.isAnnotationTypesProperty(nodeProperty);
            var result = new typeExpander.TypeExpander({
                node: node.asElement(),
                typeCollection: node.types(),
                typeExpansionRecursionDepth: this.options.typeExpansionRecursionDepth,
                serializeMetadata: this.options.serializeMetadata,
                sourceMap: this.options.sourceMap,
                isInsideTemplate: isInsideTemplate,
                isAnnotationType: isAnnotationType
            }).serializeType(pt);
            if (nodeProperty && universeHelpers.isParametersProperty(nodeProperty)) {
                if (result.name && util.stringEndsWith(result.name, "?")) {
                    result.name = result.name.substring(0, result.name.length - 1);
                    if (!result.hasOwnProperty("required")) {
                        result.required = false;
                    }
                }
                else if (!result.hasOwnProperty("required")) {
                    result.required = true;
                    this.appendMeta(result, "required", "insertedAsDefault");
                }
                if (result.displayName && util.stringEndsWith(result.displayName, "?")) {
                    result.displayName = result.displayName.substring(0, result.displayName.length - 1);
                }
                if (_value.hasOwnProperty("enum") && !result.hasOwnProperty("enum")) {
                    result.enum = _value.enum;
                    this.appendMeta(result, "enum", "calculated");
                }
                if (_value.__METADATA__ && _value.__METADATA__.calculated === true) {
                    this.appendMeta(result, null, "calculated");
                }
            }
            if (nodeProperty && universeHelpers.isBodyProperty(nodeProperty)) {
                if (result.name != _value.name) {
                    result.name = _value.name;
                    result.displayName = _value.displayName;
                }
                this.appendMeta(result, "name", "calculated", _value.__METADATA__);
                this.appendMeta(result, "displayName", "calculated", _value.__METADATA__);
            }
            if (_value && typeof _value === "object" && _value.hasOwnProperty("parametrizedProperties")) {
                result.parametrizedProperties = _value.parametrizedProperties;
            }
            return result;
        }
        var isArray = Array.isArray(_value);
        if (isArray && _value.length == 0) {
            return _value;
        }
        var value = isArray ? _value[0] : _value;
        if (this.options.sourceMap) {
            appendSourcePath(node, value);
        }
        var aPropsVal = value[def.universesInfo.Universe10.ObjectTypeDeclaration.properties.additionalProperties.name];
        if (typeof aPropsVal !== "boolean" && aPropsVal) {
            delete value[def.universesInfo.Universe10.ObjectTypeDeclaration.properties.additionalProperties.name];
        }
        var prop = nodeProperty;
        // if(universeHelpers.isItemsProperty(prop)||universeHelpers.isTypeProperty(prop)){
        //     if(value.name == prop.nameId()){
        //         delete value.name;
        //     }
        // }
        // else if(universeHelpers.isBodyProperty(prop)){
        //     if(node.lowLevel().key()==prop.nameId()){
        //         delete value.name;
        //     }
        // }
        var isTopLevel = node.asElement().localType().getExtra(tsInterfaces.TOP_LEVEL_EXTRA);
        var isInTypes = nodeProperty && (universeHelpers.isTypesProperty(nodeProperty)
            || universeHelpers.isSchemasProperty(nodeProperty));
        if (isInTypes || !isTopLevel) {
            var exampleObj = helpersLL.typeExample(node.asElement(), this.options.dumpXMLRepresentationOfExamples);
            if (exampleObj) {
                value["examples"] = [exampleObj];
            }
            else {
                var examples = helpersLL.typeExamples(node.asElement(), this.options.dumpXMLRepresentationOfExamples);
                if (examples.length > 0) {
                    value["examples"] = examples;
                }
            }
            delete value["example"];
            if (value["examples"] != null) {
                value["simplifiedExamples"] = value["examples"].map(function (x) {
                    if (x == null) {
                        return x;
                    }
                    var val = x["value"];
                    if (val == null) {
                        return val;
                    }
                    else if (typeof val === "object") {
                        return JSON.stringify(val);
                    }
                    return val;
                });
            }
        }
        if (value.hasOwnProperty("schema")) {
            if (!value.hasOwnProperty("type")) {
                value["type"] = value["schema"];
            }
            else {
                var typeValue = value["type"];
                if (!Array.isArray(typeValue)) {
                    typeValue = [typeValue];
                    value["type"] = typeValue;
                }
                value["type"] = _.unique(typeValue);
            }
            delete value["schema"];
        }
        if (valueProp && universeHelpers.isSchemaProperty(valueProp) && value.name == "schema") {
            value.name = "type";
            if (value.displayName == "schema") {
                value.displayName = "type";
            }
        }
        //this.refineTypeValue(value,node.asElement());
        if (!Array.isArray(value.type)) {
            value.type = [value.type];
        }
        var tp = node.isElement() && node.asElement().parsedType();
        if (tp && tp.isUnion()) {
            var reg_1 = node.root().types().getTypeRegistry();
            tp.declaredFacets().filter(function (x) {
                if (value.hasOwnProperty(x.facetName())) {
                    return false;
                }
                if (!x.validateSelf(reg_1).isOk()) {
                    return false;
                }
                if (!_this.facetsToExtract[x.facetName()]) {
                    return false;
                }
                if (x.facetName() == "discriminatorValue") {
                    return x.isStrict();
                }
                return true;
            }).forEach(function (x) { return value[x.facetName()] = x.value(); });
        }
        value.mediaType = RAML_MEDIATYPE;
        if (node && node.isElement()) {
            var e = node.asElement();
            var externalType = e.localType().isExternal() ? e.localType() : null;
            if (!externalType) {
                for (var _i = 0, _a = e.localType().allSuperTypes(); _i < _a.length; _i++) {
                    var st = _a[_i];
                    if (st.isExternal()) {
                        externalType = st;
                    }
                }
            }
            if (externalType) {
                var sch = externalType.external().schema().trim();
                if (util.stringStartsWith(sch, "<")) {
                    value.mediaType = "application/xml";
                }
                else {
                    value.mediaType = "application/json";
                }
                if (_value.type && _value.type.length) {
                    var t = _value.type[0];
                    if (typeof t == "string") {
                        t = t.trim();
                        if (t == sch) {
                            _value.type[0] = t;
                        }
                    }
                }
            }
        }
        if (!prop || !(universeHelpers.isHeadersProperty(prop)
            || universeHelpers.isQueryParametersProperty(prop)
            || universeHelpers.isUriParametersProperty(prop)
            || universeHelpers.isPropertiesProperty(prop)
            || universeHelpers.isBaseUriParametersProperty(prop))) {
            delete value["required"];
            var metaObj = value["__METADATA__"];
            if (metaObj) {
                var pMetaObj = metaObj["primitiveValuesMeta"];
                if (pMetaObj) {
                    delete pMetaObj["required"];
                    if (!Object.keys(pMetaObj).length) {
                        delete metaObj["primitiveValuesMeta"];
                    }
                }
                if (!Object.keys(metaObj).length) {
                    delete value["__METADATA__"];
                }
            }
        }
        var typeValue = value["type"];
        if (typeValue.forEach && typeof typeValue[0] === "string") {
            var runtimeType = node.asElement().localType();
            if (runtimeType && runtimeType.hasExternalInHierarchy()) {
                var schemaString = typeValue[0].trim();
                var canBeJson = (schemaString[0] === "{" && schemaString[schemaString.length - 1] === "}");
                var canBeXml = (schemaString[0] === "<" && schemaString[schemaString.length - 1] === ">");
                if (canBeJson) {
                    value["typePropertyKind"] = "JSON";
                }
                else if (canBeXml) {
                    value["typePropertyKind"] = "XML";
                }
                else {
                    value["typePropertyKind"] = "TYPE_EXPRESSION";
                }
            }
            else {
                value["typePropertyKind"] = "TYPE_EXPRESSION";
            }
        }
        else if (typeof typeValue === "object") {
            value["typePropertyKind"] = "INPLACE";
        }
        if (this.options.expandExpressions) {
            this.processExpressions(value, node);
        }
        return _value;
    };
    TypeTransformer.prototype.processExpressions = function (value, node) {
        this.parseExpressions(value, node);
    };
    TypeTransformer.prototype.parseExpressions = function (obj, node) {
        var typeValue = obj.type;
        var isSingleString = Array.isArray(typeValue)
            && typeValue.map(function (x) { return typeof x === "string"; });
        this.parseExpressionsForProperty(obj, "items", node);
        this.parseExpressionsForProperty(obj, "type", node);
        if (isSingleString) {
            var t = node.asElement().parsedType();
            var _loop_2 = function (i) {
                if (!isSingleString[i]) {
                    return "continue";
                }
                var newTypeValue = obj.type[i];
                if (newTypeValue && typeof newTypeValue == "object") {
                    var copy = false;
                    if (!this_2.isEmptyUnion(t) && obj.type.length == 1) {
                        copy = Object.keys(newTypeValue).filter(function (x) {
                            if (x == "type") {
                                return false;
                            }
                            return !obj.hasOwnProperty(x);
                        }).length > 0;
                    }
                    if (copy) {
                        Object.keys(newTypeValue).forEach(function (x) {
                            obj[x] = newTypeValue[x];
                        });
                    }
                    else if (!newTypeValue.name) {
                        newTypeValue.name = "type";
                        newTypeValue.displayName = "type";
                        newTypeValue.typePropertyKind = "TYPE_EXPRESSION";
                        this_2.appendMeta(newTypeValue, "displayName", "calculated");
                    }
                }
            };
            var this_2 = this;
            for (var i = 0; i < obj.type.length; i++) {
                _loop_2(i);
            }
        }
    };
    TypeTransformer.prototype.appendSource = function (obj, sourceMap) {
        if (!this.options.sourceMap || !sourceMap) {
            return;
        }
        obj.sourceMap = sourceMap;
    };
    TypeTransformer.prototype.appendMeta = function (obj, field, kind, maskObj) {
        if (!this.options.serializeMetadata) {
            return;
        }
        var useMask = maskObj != null;
        var maskScalarsObj = useMask && maskObj.primitiveValuesMeta;
        if (useMask && !maskScalarsObj) {
            return;
        }
        var maskFObj = maskScalarsObj && maskScalarsObj[field];
        if (useMask) {
            if (!maskFObj) {
                return;
            }
            else if (!maskFObj[kind]) {
                return;
            }
        }
        var metaObj = obj.__METADATA__;
        if (!metaObj) {
            metaObj = {};
            obj.__METADATA__ = metaObj;
        }
        if (field == null) {
            metaObj[kind] = true;
            return;
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
    TypeTransformer.prototype.isEmptyUnion = function (t) {
        if (!t.isUnion()) {
            return false;
        }
        return !t.isEmpty();
    };
    TypeTransformer.prototype.parseExpressionsForProperty = function (obj, prop, node) {
        var value = obj[prop];
        if (!value) {
            return;
        }
        var isSingleString = false;
        if (!Array.isArray(value)) {
            if (value && typeof value == "object") {
                if (value.unfolded) {
                    obj.prop = value.unfolded;
                }
                else {
                    this.parseExpressions(value, node);
                }
                return;
            }
            else if (typeof value == "string") {
                isSingleString = true;
                value = [value];
            }
        }
        var resultingArray = [];
        for (var i = 0; i < value.length; i++) {
            var expr = value[i];
            if (expr && typeof expr == "object") {
                if (expr.unfolded) {
                    expr = expr.unfolded;
                }
                else {
                    this.parseExpressions(expr, node);
                }
            }
            if (typeof expr != "string") {
                resultingArray.push(expr);
                continue;
            }
            var str = expr;
            var gotExpression = referencePatcher.checkExpression(str);
            if (!gotExpression) {
                var ref = this.options.typeReferences ? this.typeReference(node, expr) : expr;
                resultingArray.push(ref);
                continue;
            }
            var escapeData = {
                status: referencePatcher.ParametersEscapingStatus.NOT_REQUIRED
            };
            if (expr.indexOf("<<") >= 0) {
                escapeData = referencePatcher.escapeTemplateParameters(expr);
                if (escapeData.status == referencePatcher.ParametersEscapingStatus.OK) {
                    str = escapeData.resultingString;
                    gotExpression = referencePatcher.checkExpression(str);
                    if (!gotExpression) {
                        resultingArray.push(expr);
                        continue;
                    }
                }
                else if (escapeData.status == referencePatcher.ParametersEscapingStatus.ERROR) {
                    resultingArray.push(expr);
                    continue;
                }
            }
            var parsedExpression = void 0;
            try {
                parsedExpression = typeExpressions.parse(str);
            }
            catch (exception) {
                resultingArray.push(expr);
                continue;
            }
            if (!parsedExpression) {
                resultingArray.push(expr);
                continue;
            }
            var exprObj = this.expressionToObject(parsedExpression, escapeData, node, obj.sourceMap);
            if (exprObj != null) {
                resultingArray.push(exprObj);
            }
        }
        obj[prop] = isSingleString ? resultingArray[0] : resultingArray;
    };
    TypeTransformer.prototype.expressionToObject = function (expr, escapeData, node, sourceMap) {
        var result;
        var arr = 0;
        if (expr.type == "name") {
            var literal = expr;
            arr = literal.arr;
            result = literal.value;
            if (escapeData.status == referencePatcher.ParametersEscapingStatus.OK) {
                var unescapeData = referencePatcher.unescapeTemplateParameters(result, escapeData.substitutions);
                if (unescapeData.status == referencePatcher.ParametersEscapingStatus.OK) {
                    result = unescapeData.resultingString;
                }
            }
            if (this.options.typeReferences) {
                result = this.typeReference(node, result);
            }
        }
        else if (expr.type == "union") {
            var union = expr;
            result = {
                type: ["union"],
                anyOf: []
            };
            var components = toOptionsArray(union);
            for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
                var c = components_1[_i];
                if (c == null) {
                    result = null;
                    break;
                }
                var c1 = this.expressionToObject(c, escapeData, node, sourceMap);
                result.anyOf.push(c1);
            }
            result.anyOf = _.unique(result.anyOf);
            this.appendSource(result, sourceMap);
        }
        else if (expr.type == "parens") {
            var parens = expr;
            arr = parens.arr;
            result = this.expressionToObject(parens.expr, escapeData, node, sourceMap);
        }
        if (result != null && arr > 0) {
            if (typeof result === "string") {
                // result = {
                //     type: [ result ],
                //     name: "items",
                //     displayName: "items",
                //     typePropertyKind: "TYPE_EXPRESSION"
                // };
                // this.appendMeta(result,"displayName","calculated");
                // this.appendSource(result,sourceMap);
            }
            while (arr-- > 0) {
                result = {
                    type: ["array"],
                    items: [result]
                };
                if (arr > 0) {
                    result.name = "items";
                    result.displayName = "items";
                    result.typePropertyKind = "TYPE_EXPRESSION";
                    this.appendMeta(result, "displayName", "calculated");
                    this.appendSource(result, sourceMap);
                }
            }
        }
        if (typeof result === "object") {
            result.typePropertyKind = "TYPE_EXPRESSION";
            result.sourceMap = sourceMap;
        }
        return result;
    };
    TypeTransformer.prototype.typeReference = function (node, result) {
        if (!result) {
            return result;
        }
        var rootNode = this.owner.astRoot();
        var types = rootNode.isElement() && rootNode.asElement().types();
        var t = types && types.getTypeRegistry().getByChain(result);
        if (!t) {
            // let i0 = result.indexOf("<<");
            // if(i0>=0 && result.indexOf(">>",i0)>=0 && linter.typeOfContainingTemplate(node)){
            //
            // }
            // else {
            //
            // }
        }
        else if (t.isBuiltin()) {
        }
        else {
            var src = t.getExtra(typeSystem.SOURCE_EXTRA);
            var llNode = void 0;
            if (hlImpl.BasicASTNode.isInstance(src)) {
                llNode = src.lowLevel();
            }
            else if (jsyaml.ASTNode.isInstance(src)
                || llJson.AstNode.isInstance(src)
                || proxy.LowLevelProxyNode.isInstance(src)) {
                llNode = src;
            }
            else if (hlImpl.LowLevelWrapperForTypeSystem.isInstance(src)) {
                llNode = src.node();
            }
            var llRoot = rootNode.lowLevel();
            if (llRoot.actual().libExpanded) {
                result = "#/specification/types/" + t.name();
            }
            else {
                var location_1 = "";
                var rootUnit = llRoot.unit();
                var unit = llNode.unit();
                if (unit.absolutePath() != rootUnit.absolutePath()) {
                    var resolver = unit.project().namespaceResolver();
                    var d = resolver.expandedPathMap(rootUnit)[unit.absolutePath()];
                    location_1 = location_1 + d.includePath;
                }
                result = location_1 + "#/specification/types/" + t.name();
            }
        }
        return result;
    };
    return TypeTransformer;
}(BasicTransformation));
var SimpleNamesTransformer = /** @class */ (function (_super) {
    __extends(SimpleNamesTransformer, _super);
    function SimpleNamesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universes.Universe10.TypeDeclaration.name, universes.Universe10.LibraryBase.properties.annotationTypes.name, true, ["RAML10"]),
            new BasicObjectPropertyMatcher(universes.Universe10.TypeDeclaration.name, universes.Universe10.LibraryBase.properties.types.name, true, ["RAML10"]),
            new BasicObjectPropertyMatcher(universes.Universe10.Trait.name, universes.Universe10.LibraryBase.properties.traits.name, true, ["RAML10"]),
            new BasicObjectPropertyMatcher(universes.Universe10.AbstractSecurityScheme.name, universes.Universe10.LibraryBase.properties.securitySchemes.name, true, ["RAML10"]),
            new BasicObjectPropertyMatcher(universes.Universe10.ResourceType.name, universes.Universe10.LibraryBase.properties.resourceTypes.name, true, ["RAML10"])
        ])) || this;
    }
    SimpleNamesTransformer.prototype.transform = function (value, node) {
        if (!node.parent() || !node.parent().lowLevel()["libProcessed"]) {
            return value;
        }
        patchDisplayName(value, node.lowLevel());
        return value;
    };
    return SimpleNamesTransformer;
}(MatcherBasedTransformation));
var TemplateParametrizedPropertiesTransformer = /** @class */ (function (_super) {
    __extends(TemplateParametrizedPropertiesTransformer, _super);
    function TemplateParametrizedPropertiesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universes.Universe10.ResourceType.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe10.Trait.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe10.Method.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe10.Response.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe08.Parameter.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe08.BodyLike.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe10.TypeDeclaration.name, null, true)
        ])) || this;
    }
    TemplateParametrizedPropertiesTransformer.prototype.transform = function (value, node) {
        if (Array.isArray(value)) {
            return value;
        }
        var propName = def.universesInfo.Universe10.Trait.properties.parametrizedProperties.name;
        var parametrizedProps = value[propName];
        if (parametrizedProps) {
            Object.keys(parametrizedProps).forEach(function (y) {
                value[y] = parametrizedProps[y];
            });
            delete value[propName];
        }
        return value;
    };
    return TemplateParametrizedPropertiesTransformer;
}(MatcherBasedTransformation));
//
// class PropertiesTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.ObjectTypeDeclaration.name,universes.Universe10.ObjectTypeDeclaration.properties.properties.name,true)
//         ]),"name");
//     }
//
// }
var SchemasTransformer = /** @class */ (function (_super) {
    __extends(SchemasTransformer, _super);
    function SchemasTransformer() {
        return _super.call(this, universes.Universe08.GlobalSchema.name, universes.Universe08.Api.properties.schemas.name, true, ["RAML08"]) || this;
    }
    SchemasTransformer.prototype.transform = function (value, node) {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            if (value.sourceMap) {
                delete value.sourceMap["scalarsSources"];
                if (Object.keys(value.sourceMap).length == 0) {
                    delete value["sourceMap"];
                }
            }
            value.name = value.key;
            delete value.key;
            return value;
        }
    };
    return SchemasTransformer;
}(BasicTransformation));
var ProtocolsToUpperCaseTransformer = /** @class */ (function (_super) {
    __extends(ProtocolsToUpperCaseTransformer, _super);
    function ProtocolsToUpperCaseTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universes.Universe10.Api.name, universes.Universe10.Api.properties.protocols.name, true),
            new BasicObjectPropertyMatcher(universes.Universe10.MethodBase.name, universes.Universe10.MethodBase.properties.protocols.name, true),
        ])) || this;
    }
    ProtocolsToUpperCaseTransformer.prototype.transform = function (value, node) {
        if (typeof (value) == 'string') {
            return value.toUpperCase();
        }
        else if (Array.isArray(value)) {
            return value.map(function (x) { return x.toUpperCase(); });
        }
        return value;
    };
    return ProtocolsToUpperCaseTransformer;
}(MatcherBasedTransformation));
var ReferencesTransformer = /** @class */ (function (_super) {
    __extends(ReferencesTransformer, _super);
    function ReferencesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universes.Universe10.SecuritySchemeRef.name, universes.Universe10.Api.properties.securedBy.name, true),
            new BasicObjectPropertyMatcher(universes.Universe10.TraitRef.name, universes.Universe10.MethodBase.properties.is.name, true),
            new BasicObjectPropertyMatcher(universes.Universe10.ResourceTypeRef.name, universes.Universe10.ResourceBase.properties.type.name, true)
        ])) || this;
    }
    ReferencesTransformer.prototype.transform = function (value, node) {
        if (value == null) {
            return null;
        }
        if (Array.isArray(value)) {
            return value;
        }
        return this.toSimpleValue(value);
    };
    ReferencesTransformer.prototype.toSimpleValue = function (x) {
        if (typeof (x) !== "object") {
            return {
                name: x
            };
        }
        var result = {
            name: x['name']
        };
        var params = x['value'];
        if (params) {
            Object.keys(params).forEach(function (y) {
                result.parameters = result.parameters || [];
                result.parameters.push({
                    name: y,
                    value: params[y]
                });
            });
        }
        return result;
    };
    return ReferencesTransformer;
}(MatcherBasedTransformation));
var UsesDeclarationTransformer = /** @class */ (function (_super) {
    __extends(UsesDeclarationTransformer, _super);
    function UsesDeclarationTransformer(dumper) {
        var _this = _super.call(this, universes.Universe10.LibraryBase.name, null, true, ["RAML10"]) || this;
        _this.dumper = dumper;
        return _this;
    }
    UsesDeclarationTransformer.prototype.getReferencePatcher = function () {
        this.referencePatcher = this.referencePatcher || new referencePatcherLL.ReferencePatcher();
        return this.referencePatcher;
    };
    UsesDeclarationTransformer.prototype.transform = function (_value, node) {
        var llNode = node.lowLevel();
        var actual = llNode && llNode.actual();
        var libExpanded = actual && actual.libExpanded;
        if (!libExpanded) {
            return _value;
        }
        var usesArray = _value[def.universesInfo.Universe10.FragmentDeclaration.properties.uses.name];
        if (!usesArray || !Array.isArray(usesArray) || usesArray.length == 0) {
            return _value;
        }
        var unit = llNode.unit();
        var resolver = unit.project().namespaceResolver();
        if (!resolver) {
            return _value;
        }
        var nsMap = resolver.expandedNSMap(unit);
        if (!nsMap) {
            return _value;
        }
        var usagePropName = def.universesInfo.Universe10.Library.properties.usage.name;
        var annotationsPropName = def.universesInfo.Universe10.Annotable.properties.annotations.name;
        for (var _i = 0, usesArray_1 = usesArray; _i < usesArray_1.length; _i++) {
            var u = usesArray_1[_i];
            var namespace = u.key;
            var usesEntry = nsMap[namespace];
            if (!usesEntry) {
                continue;
            }
            var libUnit = usesEntry.unit;
            var libNode = libUnit.ast();
            var libAnnotations = libNode.children().filter(function (x) {
                var key = x.key();
                return util.stringStartsWith(key, "(") && util.stringEndsWith(key, ")");
            });
            var libUsage = libNode.children().find(function (x) { return x.key() == usagePropName; });
            if (libUsage) {
                u[usagePropName] = libUsage.value();
            }
            if (libAnnotations.length > 0) {
                var annotableType = node.root().definition().universe().type(universes.Universe10.Annotable.name);
                var annotationsProp = annotableType.property(universes.Universe10.Annotable.properties.annotations.name);
                var usesEntryAnnotations = [];
                for (var _a = 0, libAnnotations_1 = libAnnotations; _a < libAnnotations_1.length; _a++) {
                    var a = libAnnotations_1[_a];
                    var dumped = a.dumpToObject();
                    var aObj = {
                        name: a.key().substring(1, a.key().length - 1),
                        value: dumped[Object.keys(dumped)[0]]
                    };
                    if (!aObj || !aObj.name) {
                        continue;
                    }
                    var aName = aObj.name;
                    var hasRootMediaType = unit.ast().children().some(function (x) { return x.key() == universes.Universe10.Api.properties.mediaType.name; });
                    var scope = new referencePatcherLL.Scope();
                    scope.hasRootMediaType = hasRootMediaType;
                    var state = new referencePatcherLL.State(this.getReferencePatcher(), unit, scope, resolver);
                    var patchedReference = this.getReferencePatcher().resolveReferenceValueBasic(aName, state, "annotationTypes", [unit, libUnit]);
                    if (!patchedReference) {
                        continue;
                    }
                    aObj.name = patchedReference.value();
                    usesEntryAnnotations.push(aObj);
                }
                if (usesEntryAnnotations.length > 0) {
                    u[annotationsPropName] = usesEntryAnnotations;
                }
            }
        }
        return _value;
    };
    return UsesDeclarationTransformer;
}(BasicTransformation));
var SecurityExpandingTransformer = /** @class */ (function (_super) {
    __extends(SecurityExpandingTransformer, _super);
    function SecurityExpandingTransformer(enabled) {
        if (enabled === void 0) { enabled = false; }
        var _this = _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universes.Universe10.Api.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe10.Overlay.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe10.Extension.name, null, true),
            new BasicObjectPropertyMatcher(universes.Universe10.Library.name, null, true)
        ])) || this;
        _this.enabled = enabled;
        return _this;
    }
    SecurityExpandingTransformer.prototype.match = function (node, prop) {
        return this.enabled ? _super.prototype.match.call(this, node, prop) : false;
    };
    SecurityExpandingTransformer.prototype.registrationInfo = function () {
        return this.enabled ? _super.prototype.registrationInfo.call(this) : null;
    };
    SecurityExpandingTransformer.prototype.transform = function (value, _node) {
        this.processApi(value);
        return value;
    };
    SecurityExpandingTransformer.prototype.processApi = function (value) {
        var securitySchemesArr = value[def.universesInfo.Universe10.Api.properties.securitySchemes.name];
        if (!securitySchemesArr || securitySchemesArr.length == 0) {
            return;
        }
        var securitySchemes = {};
        for (var _i = 0, securitySchemesArr_1 = securitySchemesArr; _i < securitySchemesArr_1.length; _i++) {
            var ss = securitySchemesArr_1[_i];
            securitySchemes[ss.name] = ss;
        }
        this.expandSecuredBy(value, securitySchemes);
        var resources = value[def.universesInfo.Universe10.Api.properties.resources.name];
        if (resources) {
            for (var _a = 0, resources_1 = resources; _a < resources_1.length; _a++) {
                var r = resources_1[_a];
                this.processResource(r, securitySchemes);
            }
        }
        var resourceTypes = value[def.universesInfo.Universe10.LibraryBase.properties.resourceTypes.name];
        if (resourceTypes) {
            for (var _b = 0, resourceTypes_1 = resourceTypes; _b < resourceTypes_1.length; _b++) {
                var r = resourceTypes_1[_b];
                this.processResource(r, securitySchemes);
            }
        }
        var traits = value[def.universesInfo.Universe10.LibraryBase.properties.traits.name];
        if (traits) {
            for (var _c = 0, traits_1 = traits; _c < traits_1.length; _c++) {
                var t = traits_1[_c];
                this.expandSecuredBy(t, securitySchemes);
            }
        }
        return value;
    };
    SecurityExpandingTransformer.prototype.processResource = function (res, securitySchemes) {
        this.expandSecuredBy(res, securitySchemes);
        var methods = res[def.universesInfo.Universe10.Resource.properties.methods.name];
        if (methods) {
            for (var _i = 0, methods_1 = methods; _i < methods_1.length; _i++) {
                var m = methods_1[_i];
                this.expandSecuredBy(m, securitySchemes);
            }
        }
        var resources = res[def.universesInfo.Universe10.Resource.properties.resources.name];
        if (resources) {
            for (var _a = 0, resources_2 = resources; _a < resources_2.length; _a++) {
                var r = resources_2[_a];
                this.processResource(r, securitySchemes);
            }
        }
    };
    SecurityExpandingTransformer.prototype.expandSecuredBy = function (obj, securitySchemes) {
        var securedBy = obj[def.universesInfo.Universe10.ResourceBase.properties.securedBy.name];
        if (!securedBy) {
            return;
        }
        for (var i = 0; i < securedBy.length; i++) {
            var ref = securedBy[i];
            if (ref == null) {
                continue;
            }
            var sch = void 0;
            if (typeof ref == "string") {
                sch = securitySchemes[ref];
            }
            else if (typeof ref == "object") {
                var refObj = ref;
                ref = ref.name; //Object.keys(refObj)[0];
                sch = JSON.parse(JSON.stringify(securitySchemes[ref]));
                var params = refObj.parameters;
                if (params && params.length > 0) {
                    // let paramNames = Object.keys(params);
                    // if (paramNames.length > 0) {
                    var settings = sch.settings;
                    if (!settings) {
                        settings = {};
                        sch.settings = settings;
                    }
                    for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
                        var pn = params_1[_i];
                        settings[pn.name] = pn.value;
                    }
                    //}
                }
            }
            if (!sch) {
                continue;
            }
            securedBy[i] = sch;
        }
    };
    return SecurityExpandingTransformer;
}(MatcherBasedTransformation));
var AllParametersTransformer = /** @class */ (function (_super) {
    __extends(AllParametersTransformer, _super);
    function AllParametersTransformer(enabled, serializeMetadata) {
        if (enabled === void 0) { enabled = false; }
        if (serializeMetadata === void 0) { serializeMetadata = false; }
        var _this = _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universes.Universe10.Api.name, null, true)
        ])) || this;
        _this.enabled = enabled;
        _this.serializeMetadata = serializeMetadata;
        return _this;
    }
    AllParametersTransformer.prototype.match = function (node, prop) {
        return this.enabled ? _super.prototype.match.call(this, node, prop) : false;
    };
    AllParametersTransformer.prototype.registrationInfo = function () {
        return this.enabled ? _super.prototype.registrationInfo.call(this) : null;
    };
    AllParametersTransformer.prototype.transform = function (value, node, uriParams) {
        this.processApi(value);
        return value;
    };
    AllParametersTransformer.prototype.processApi = function (api) {
        var params = this.extract(api, def.universesInfo.Universe10.Api.properties.baseUriParameters.name);
        var resources = api[def.universesInfo.Universe10.Resource.properties.resources.name] || [];
        for (var _i = 0, resources_3 = resources; _i < resources_3.length; _i++) {
            var r = resources_3[_i];
            this.processResource(r, params);
        }
    };
    AllParametersTransformer.prototype.processResource = function (resource, uriParams) {
        var pName = def.universesInfo.Universe10.Resource.properties.uriParameters.name;
        var params1 = this.extract(resource, pName);
        var newParams = uriParams.concat(resource[pName] || []);
        if (newParams.length > 0) {
            resource[pName] = newParams;
        }
        var params2 = uriParams.concat(params1);
        var methods = resource[def.universesInfo.Universe10.ResourceBase.properties.methods.name] || [];
        for (var _i = 0, methods_2 = methods; _i < methods_2.length; _i++) {
            var m = methods_2[_i];
            this.processMethod(m, params2);
        }
        var resources = resource[def.universesInfo.Universe10.Resource.properties.resources.name] || [];
        for (var _a = 0, resources_4 = resources; _a < resources_4.length; _a++) {
            var r = resources_4[_a];
            this.processResource(r, params2);
        }
    };
    AllParametersTransformer.prototype.processMethod = function (method, uriParams) {
        this.appendSecurityData(method);
        var pName = def.universesInfo.Universe10.Resource.properties.uriParameters.name;
        var newParams = uriParams.concat(method[pName] || []);
        if (newParams.length > 0) {
            method[pName] = newParams;
        }
    };
    AllParametersTransformer.prototype.appendSecurityData = function (obj) {
        var headerPName = def.universesInfo.Universe10.Operation.properties.headers.name;
        var responsesPName = def.universesInfo.Universe10.Operation.properties.responses.name;
        var queryPName = def.universesInfo.Universe10.Operation.properties.queryParameters.name;
        var securedBy = obj[def.universesInfo.Universe10.Method.properties.securedBy.name] || [];
        for (var _i = 0, securedBy_1 = securedBy; _i < securedBy_1.length; _i++) {
            var sSch = securedBy_1[_i];
            if (!sSch) {
                continue;
            }
            var describedBy = sSch[def.universesInfo.Universe10.AbstractSecurityScheme.properties.describedBy.name] || {};
            var sHeaders = this.extract(describedBy, headerPName);
            var sResponses = this.extract(describedBy, responsesPName);
            var sQParams = this.extract(describedBy, queryPName);
            if (sHeaders.length > 0) {
                obj[headerPName] = (obj[headerPName] || []).concat(sHeaders);
            }
            if (sResponses.length > 0) {
                obj[responsesPName] = (obj[responsesPName] || []).concat(sResponses);
            }
            if (sQParams.length > 0) {
                obj[queryPName] = (obj[queryPName] || []).concat(sQParams);
            }
        }
    };
    AllParametersTransformer.prototype.extract = function (api, pName) {
        var arr = api[pName] || [];
        arr = JSON.parse(JSON.stringify(arr));
        if (this.serializeMetadata) {
            for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
                var x = arr_2[_i];
                var mtd = x["__METADATA__"];
                if (!mtd) {
                    mtd = {};
                    x["__METADATA__"] = mtd;
                }
                mtd["calculated"] = true;
            }
        }
        return arr;
    };
    AllParametersTransformer.uriParamsPropName = universes.Universe10.ResourceBase.properties.uriParameters.name;
    AllParametersTransformer.methodsPropName = universes.Universe10.ResourceBase.properties.methods.name;
    AllParametersTransformer.resourcesPropName = universes.Universe10.Api.properties.resources.name;
    AllParametersTransformer.queryParametersPropName = universes.Universe10.Method.properties.queryParameters.name;
    AllParametersTransformer.headersPropName = universes.Universe10.Method.properties.headers.name;
    AllParametersTransformer.securedByPropName = universes.Universe10.Method.properties.securedBy.name;
    AllParametersTransformer.responsesPropName = universes.Universe10.Method.properties.responses.name;
    return AllParametersTransformer;
}(MatcherBasedTransformation));
//
// class MethodsToMapTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.ResourceBase.name,universes.Universe10.ResourceBase.properties.methods.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe08.Resource.name,universes.Universe08.Resource.properties.methods.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe08.ResourceType.name,universes.Universe08.ResourceType.properties.methods.name,true)
//         ]),"method");
//     }
// }
//
// class TypesTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.LibraryBase.name,universes.Universe10.LibraryBase.properties.types.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.LibraryBase.name,universes.Universe10.LibraryBase.properties.schemas.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.LibraryBase.name,universes.Universe10.LibraryBase.properties.annotationTypes.name,true)
//         ]),"name");
//     }
// }
//
// class TraitsTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.LibraryBase.name,
//                 universes.Universe10.LibraryBase.properties.traits.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe08.Api.name,
//                 universes.Universe08.Api.properties.traits.name,true)
//         ]),"name");
//     }
// }
//
// class ResourceTypesTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.LibraryBase.name,universes.Universe10.LibraryBase.properties.resourceTypes.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe08.Api.name,universes.Universe10.Api.properties.resourceTypes.name,true,["RAML08"])
//         ]),"name");
//     }
// }
//
// class SecuritySchemesTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.LibraryBase.name,universes.Universe10.LibraryBase.properties.securitySchemes.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe08.Api.name,universes.Universe08.Api.properties.securitySchemes.name,true,["RAML08"])
//         ]),"name");
//     }
// }
//
// class ParametersTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.Api.name,universes.Universe10.Api.properties.baseUriParameters.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.ResourceBase.name,universes.Universe10.ResourceBase.properties.uriParameters.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe08.Resource.name,universes.Universe08.Resource.properties.uriParameters.name,true,["RAML08"]),
//             new BasicObjectPropertyMatcher(universes.Universe10.ResourceBase.name,universes.Universe10.MethodBase.properties.queryParameters.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.MethodBase.name,universes.Universe10.MethodBase.properties.queryParameters.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.Operation.name,universes.Universe10.MethodBase.properties.queryParameters.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.Operation.name,universes.Universe10.MethodBase.properties.headers.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.MethodBase.name,universes.Universe10.MethodBase.properties.headers.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe08.BodyLike.name,universes.Universe08.BodyLike.properties.formParameters.name)
//         ]),"name");
//     }
//
// }
//
// class ResponsesTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             //new BasicObjectPropertyMatcher(universes.Universe10.Operation.name,universes.Universe10.Operation.properties.responses.name,true),
//             new BasicObjectPropertyMatcher(universes.Universe10.MethodBase.name,universes.Universe10.MethodBase.properties.responses.name,true)
//         ]),"code");
//     }
// }
//
// class AnnotationsTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.Annotable.name,universes.Universe10.Annotable.properties.annotations.name,true)
//         ]),"name");
//     }
// }
//
// class BodiesTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.Response.name,universes.Universe10.Response.properties.body.name),
//             new BasicObjectPropertyMatcher(universes.Universe10.MethodBase.name,universes.Universe10.MethodBase.properties.body.name,true)
//         ]),"name");
//     }
//
// }
//
// class FacetsTransformer extends ArrayToMapTransformer{
//
//     constructor(){
//         super(new CompositeObjectPropertyMatcher([
//             new BasicObjectPropertyMatcher(universes.Universe10.TypeDeclaration.name,universes.Universe10.TypeDeclaration.properties.facets.name,true)
//         ]),"name");
//     }
// }
var Api10SchemasTransformer = /** @class */ (function (_super) {
    __extends(Api10SchemasTransformer, _super);
    function Api10SchemasTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universes.Universe10.LibraryBase.name, null, true, ["RAML10"])
        ])) || this;
    }
    Api10SchemasTransformer.prototype.transform = function (value, node) {
        if (!value) {
            return value;
        }
        if (!value.hasOwnProperty("schemas")) {
            return value;
        }
        var schemasValue = value["schemas"];
        if (!value.hasOwnProperty("types")) {
            value["types"] = schemasValue;
        }
        else {
            var typesValue = value["types"];
            value["types"] = typesValue.concat(schemasValue);
        }
        delete value["schemas"];
        return value;
    };
    return Api10SchemasTransformer;
}(MatcherBasedTransformation));
function mergeRegInfos(arr) {
    if (arr.length == 0) {
        return {};
    }
    var result = arr[0];
    for (var i = 1; i < arr.length; i++) {
        var obj = arr[i];
        result = mergeObjects(result, obj);
    }
    return result;
}
exports.mergeRegInfos = mergeRegInfos;
function mergeObjects(o1, o2) {
    for (var _i = 0, _a = Object.keys(o2); _i < _a.length; _i++) {
        var k = _a[_i];
        var f1 = o1[k];
        var f2 = o2[k];
        if (f1 == null) {
            o1[k] = f2;
        }
        else {
            if (typeof (f1) == "object" && typeof (f2) == "object") {
                o1[k] = mergeObjects(f1, f2);
            }
        }
    }
    return o1;
}
function toOptionsArray(union) {
    var result;
    var e1 = union.first;
    var e2 = union.rest;
    while (e1.type == "parens" && e1.arr == 0) {
        e1 = e1.expr;
    }
    while (e2.type == "parens" && e2.arr == 0) {
        e2 = e2.expr;
    }
    if (e1.type == "union") {
        result = toOptionsArray(e1);
    }
    else {
        result = [e1];
    }
    if (e2.type == "union") {
        result = result.concat(toOptionsArray(e2));
    }
    else {
        result.push(e2);
    }
    return result;
}
exports.toOptionsArray = toOptionsArray;
function getSchemaPath(eNode) {
    var include = eNode.lowLevel().includePath && eNode.lowLevel().includePath();
    if (!include) {
        var typeAttr = eNode.attr("type");
        if (!typeAttr) {
            typeAttr = eNode.attr("schema");
        }
        if (typeAttr) {
            include = typeAttr.lowLevel().includePath && typeAttr.lowLevel().includePath();
        }
    }
    var schemaPath;
    if (include) {
        var ind = include.indexOf("#");
        var postfix = "";
        if (ind >= 0) {
            postfix = include.substring(ind);
            include = include.substring(0, ind);
        }
        var aPath = eNode.lowLevel().unit().resolve(include).absolutePath();
        var relativePath = void 0;
        if (util.stringStartsWith(aPath, "http://") || util.stringStartsWith(aPath, "https://")) {
            relativePath = aPath;
        }
        else {
            relativePath = pathUtils.relative(eNode.lowLevel().unit().project().getRootPath(), aPath);
        }
        relativePath = relativePath.replace(/\\/g, '/');
        schemaPath = relativePath + postfix;
    }
    return schemaPath;
}
exports.getSchemaPath = getSchemaPath;
function patchDisplayName(value, llNode) {
    var key = llNode.key();
    //value["$$name"] = key;
    var original = llNode;
    while (proxy.LowLevelProxyNode.isInstance(original)) {
        original = original.originalNode();
    }
    var oKey = original.key();
    if (proxy.LowLevelProxyNode.isInstance(llNode)) {
        if (oKey && oKey.indexOf("<<") >= 0 && llNode.key().indexOf("<<") <= 0) {
            oKey = llNode.key();
        }
    }
    if (oKey == null) {
        return;
    }
    var aVal = value;
    //aVal.name = oKey;
    if (aVal.displayName == key) {
        aVal.displayName = oKey;
    }
}
exports.patchDisplayName = patchDisplayName;
//# sourceMappingURL=jsonSerializerHL.js.map