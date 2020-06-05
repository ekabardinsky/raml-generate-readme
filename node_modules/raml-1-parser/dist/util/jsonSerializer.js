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
var def = require("raml-definition-system");
var tsInterfaces = def.tsInterfaces;
var yaml = require("yaml-ast-parser");
var hlImpl = require("../parser/highLevelImpl");
var builder = require("../parser/ast.core/builder");
var universeHelpers = require("../parser/tools/universeHelpers");
var universes = require("../parser/tools/universe");
var util = require("../util/index");
var _ = require("underscore");
var RamlWrapper10 = require("../parser/artifacts/raml10parserapi");
var pathUtils = require("path");
function dump(node, serializeMeta) {
    if (serializeMeta === void 0) { serializeMeta = true; }
    return new JsonSerializer({
        rootNodeDetails: true,
        serializeMetadata: serializeMeta
    }).dump(node);
}
exports.dump = dump;
var JsonSerializer = /** @class */ (function () {
    function JsonSerializer(options) {
        this.options = options;
        this.nodeTransformers = [
            new ResourcesTransformer(),
            new TypeExampleTransformer(),
            new TypeDefaultValueTransformer(),
            //new ParametersTransformer(),
            new ArrayExpressionTransformer(),
            new TypesTransformer(),
            //new UsesTransformer(),
            //new PropertiesTransformer(),
            //new ExamplesTransformer(),
            //new ResponsesTransformer(),
            //new BodiesTransformer(),
            //new AnnotationsTransformer(),
            new SecuritySchemesTransformer(),
            new AnnotationTypesTransformer(),
            new TemplateParametrizedPropertiesTransformer(),
            new TraitsTransformer(),
            new ResourceTypesTransformer(),
            //new FacetsTransformer(),
            new SchemasTransformer(),
            new ProtocolsToUpperCaseTransformer(),
            new ResourceTypeMethodsToMapTransformer(),
            new ReferencesTransformer(),
            new SimpleNamesTransformer(),
        ];
        this.nodePropertyTransformers = [
            //new ResourcesTransformer(),
            //new TypeExampleTransformer(),
            new ParametersTransformer(),
            //new TypesTransformer(),
            //new UsesTransformer(),
            new PropertiesTransformer(),
            // //new ExamplesTransformer(),
            new ResponsesTransformer(),
            new BodiesTransformer(),
            new AnnotationsTransformer(),
            //new SecuritySchemesTransformer(),
            //new AnnotationTypesTransformer(),
            //new TemplateParametrizedPropertiesTransformer(),
            //new TraitsTransformer(),
            //new ResourceTypesTransformer(),
            new FacetsTransformer(),
            //new SchemasTransformer(),
            //new ProtocolsToUpperCaseTransformer(),
            //new ResourceTypeMethodsToMapTransformer(),
            //new ReferencesTransformer(),
            new OneElementArrayTransformer()
        ];
        this.ignore = new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isResponseType, universeHelpers.isDisplayNameProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isApiSibling, universeHelpers.isDisplayNameProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isAnnotationRefTypeOrDescendant, universeHelpers.isAnnotationProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isSecuritySchemeRefType, universeHelpers.isSecuritySchemeProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isTraitRefType, universeHelpers.isTraitProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isResourceTypeRefType, universeHelpers.isResourceTypeProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isApiSibling, universeHelpers.isRAMLVersionProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isTypeDeclarationDescendant, universeHelpers.isStructuredItemsProperty),
        ]);
        this.missingProperties = new PropertiesData();
        this.options = this.options || {};
        if (this.options.serializeMetadata == null) {
            this.options.serializeMetadata = true;
        }
    }
    JsonSerializer.prototype.printMissingProperties = function () {
        return this.missingProperties.print();
    };
    JsonSerializer.prototype.dump = function (node) {
        var highLevelNode = node.highLevel();
        var highLevelParent = highLevelNode && highLevelNode.parent();
        var rootNodeDetails = !highLevelParent && this.options.rootNodeDetails;
        var result = this.dumpInternal(node, rootNodeDetails, true);
        return result;
    };
    JsonSerializer.prototype.dumpInternal = function (node, rootNodeDetails, isRoot, nodeProperty) {
        var _this = this;
        if (rootNodeDetails === void 0) { rootNodeDetails = false; }
        if (isRoot === void 0) { isRoot = false; }
        if (node == null) {
            return null;
        }
        if (core.BasicNodeImpl.isInstance(node)) {
            var props = {};
            var basicNode = node;
            var definition = basicNode.highLevel().definition();
            definition.allProperties().filter(function (x) {
                if (_this.ignore.match(basicNode.definition(), x)) {
                    return false;
                }
                else if (!isRoot && x.nameId() == "uses" && !isFragment(basicNode.highLevel())) {
                    return false;
                }
                return true;
            }).forEach(function (x) {
                props[x.nameId()] = x;
            });
            definition.allCustomProperties().filter(function (x) { return !_this.ignore.match(basicNode.definition(), x); }).forEach(function (x) {
                props[x.nameId()] = x;
            });
            var obj = this.dumpProperties(props, node);
            if (props["schema"]) {
                if (this.options.dumpSchemaContents) {
                    if (props["schema"].range().key() == universes.Universe08.SchemaString) {
                        var schemas = basicNode.highLevel().root().elementsOfKind("schemas");
                        schemas.forEach(function (x) {
                            if (x.name() == obj["schema"]) {
                                var vl = x.attr("value");
                                if (vl) {
                                    obj["schema"] = vl.value();
                                    obj["schemaContent"] = vl.value();
                                }
                            }
                        });
                    }
                }
            }
            this.serializeScalarsAnnotations(obj, basicNode, props);
            this.serializeMeta(obj, basicNode);
            if (this.canBeFragment(node)) {
                if (RamlWrapper10.isFragment(node)) {
                    var fragment = RamlWrapper10.asFragment(node);
                    var uses = fragment.uses();
                    if (uses.length > 0) {
                        obj["uses"] = uses.map(function (x) { return x.toJSON(); });
                    }
                }
            }
            if (universeHelpers.isTypeDeclarationDescendant(definition)) {
                var prop = basicNode.highLevel().property();
                if (prop && !(universeHelpers.isHeadersProperty(prop)
                    || universeHelpers.isQueryParametersProperty(prop)
                    || universeHelpers.isUriParametersProperty(prop)
                    || universeHelpers.isPropertiesProperty(prop)
                    || universeHelpers.isBaseUriParametersProperty(prop))) {
                    delete obj["required"];
                    var metaObj = obj["__METADATA__"];
                    if (metaObj) {
                        var pMetaObj = metaObj["primitiveValuesMeta"];
                        if (pMetaObj) {
                            delete pMetaObj["required"];
                        }
                    }
                }
            }
            if (this.options.sourceMap && typeof obj == "object") {
                var unitPath = hlImpl.actualPath(node.highLevel());
                if (node.highLevel().lowLevel() && node.highLevel().lowLevel().actual() && node.highLevel().lowLevel().actual().actualPath) {
                    unitPath = node.highLevel().lowLevel().actual().actualPath;
                }
                var sourceMap = obj.sourceMap;
                if (!sourceMap) {
                    sourceMap = {};
                    obj.sourceMap = sourceMap;
                }
                if (!sourceMap.path) {
                    sourceMap.path = unitPath;
                }
            }
            this.nodeTransformers.forEach(function (x) {
                if (x.match(node, nodeProperty || node.highLevel().property())) {
                    obj = x.transform(obj, node);
                }
            });
            var result = {};
            if (rootNodeDetails) {
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
                result.specification = obj;
                result.errors = this.dumpErrors(basicNode.errors());
            }
            else {
                result = obj;
            }
            return result;
        }
        else if (core.AttributeNodeImpl.isInstance(node)) {
            var props = {};
            var attrNode = node;
            var definition = attrNode.highLevel().definition();
            var pRange = attrNode.highLevel().property().range();
            if (pRange.isArray()) {
                pRange = pRange.array().componentType();
            }
            definition.allCustomProperties().filter(function (x) { return !_this.ignore.match(pRange, x); }).forEach(function (x) {
                props[x.nameId()] = x;
            });
            var isValueType = pRange.isValueType();
            if (isValueType && attrNode['value']) {
                var val = attrNode['value']();
                if (val == null || typeof val == 'number' || typeof val == 'string' || typeof val == 'boolean') {
                    return val;
                }
                else if (pRange.isAssignableFrom(universe.Universe08.StringType.name) && hlImpl.StructuredValue.isInstance(val)) {
                    var sVal = val;
                    var llNode = sVal.lowLevel();
                    val = llNode ? llNode.dumpToObject() : null;
                    return val;
                }
            }
            var obj = this.dumpProperties(props, node);
            this.nodeTransformers.forEach(function (x) {
                if (x.match(node, node.highLevel().property())) {
                    obj = x.transform(obj, node);
                }
            });
            this.serializeScalarsAnnotations(obj, node, props);
            this.serializeMeta(obj, attrNode);
            return obj;
        }
        else if (core.TypeInstanceImpl.isInstance(node)) {
            return this.serializeTypeInstance(node);
        }
        else if (core.TypeInstancePropertyImpl.isInstance(node)) {
            return this.serializeTypeInstanceProperty(node);
        }
        return node;
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
                eObj['trace'] = _this.dumpErrors(x.trace); //x.trace.map(y=>this.dumpErrorBasic(y));
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
    JsonSerializer.prototype.stringLooksLikeXML = function (contents) {
        return (contents[0] === "<" && contents[contents.length - 1] === ">");
    };
    JsonSerializer.prototype.stringLooksLikeJSON = function (contents) {
        return (contents[0] === "{" && contents[contents.length - 1] === "}");
    };
    JsonSerializer.prototype.dumpProperties = function (props, node) {
        var _this = this;
        var obj = {};
        var definition;
        if (node.highLevel().isElement()) {
            definition = node.highLevel().definition();
        }
        var scalarsSources = {};
        Object.keys(props).forEach(function (propName) {
            var nodeProperty;
            if (definition) {
                nodeProperty = definition.property(propName);
                if (!nodeProperty) {
                    nodeProperty = _.find(definition.allCustomProperties(), function (x) { return x.nameId() == propName; });
                }
            }
            if (!node[propName]) {
                _this.missingProperties.addProperty(props[propName], node.kind());
                return;
            }
            var property = props[propName];
            var originalValue = node[propName]();
            var value = originalValue;
            if (value && propName == "structuredType" && typeof value === "object") {
                value = null;
                var highLevelNode = node.highLevel();
                var a = highLevelNode.lowLevel();
                var tdl = null;
                a.children().forEach(function (x) {
                    if (x.key() == "type" || x.key() == "schema") {
                        var td = highLevelNode.definition().universe().type(universe.Universe10.TypeDeclaration.name);
                        var hasType = highLevelNode.definition().universe().type(universe.Universe10.TypeDeclaration.name);
                        var tNode = new hlImpl.ASTNodeImpl(x, highLevelNode, td, hasType.property(x.key()));
                        tNode.patchType(builder.doDescrimination(tNode));
                        value = _this.dumpInternal(tNode.wrapperNode(), false, false, nodeProperty);
                        propName = x.key();
                    }
                });
            }
            else if (propName == "items" && typeof value === "object") {
                var isArr = Array.isArray(value);
                var isObj = !isArr;
                if (isArr) {
                    isObj = _.find(value, function (x) { return typeof (x) == "object"; }) != null;
                }
                if (isObj) {
                    value = null;
                    var highLevelNode = node.highLevel();
                    var a = highLevelNode.lowLevel();
                    var tdl = null;
                    a.children().forEach(function (x) {
                        if (x.key() == "items") {
                            var td = highLevelNode.definition().universe().type(universe.Universe10.TypeDeclaration.name);
                            var hasType = highLevelNode.definition().universe().type(universe.Universe10.ArrayTypeDeclaration.name);
                            var tNode = void 0;
                            var llNode = x;
                            var itemsLocalType = void 0;
                            var stop_1;
                            do {
                                stop_1 = true;
                                tNode = new hlImpl.ASTNodeImpl(llNode, highLevelNode, td, hasType.property(universe.Universe10.ArrayTypeDeclaration.properties.items.name));
                                itemsLocalType = tNode.localType();
                                if (itemsLocalType && isEmpty(itemsLocalType) && itemsLocalType.superTypes().length == 1) {
                                    var tChildren = llNode.children().filter(function (y) { return y.key() == "type"; });
                                    if (tChildren.length == 1) {
                                        if (tChildren[0].resolvedValueKind() == yaml.Kind.SCALAR) {
                                            value = tChildren[0].value();
                                            break;
                                        }
                                        else {
                                            llNode = tChildren[0];
                                            stop_1 = false;
                                        }
                                    }
                                }
                            } while (!stop_1);
                            if (value == null) {
                                tNode.patchType(builder.doDescrimination(tNode));
                                value = _this.dumpInternal(tNode.wrapperNode(), false, false, nodeProperty);
                            }
                            if (itemsLocalType.getExtra(tsInterfaces.TOP_LEVEL_EXTRA)
                                && typeof value == "object" && !Array.isArray(value)) {
                                value = value.type;
                            }
                            if (Array.isArray(value) && value.length == 1) {
                                value = value[0];
                            }
                            propName = x.key();
                        }
                    });
                }
            }
            var hasValue = Array.isArray(value) ? (value.length > 0) : (value != null);
            if (definition && definition.isAssignableFrom("TypeDeclaration")
                && (propName === "type" || propName == "schema") && hasValue) {
                if (Array.isArray(value)) {
                    var val_1 = value.length > 0 ? value[0] : null;
                    if (val_1 == null) {
                        var defaultsCalculator = node.getDefaultsCalculator();
                        if (defaultsCalculator) {
                            var typeProp = def.getUniverse("RAML10").type("TypeDeclaration").property("type");
                            val_1 = defaultsCalculator.attributeDefaultIfEnabled(node.highLevel().asElement(), typeProp);
                        }
                        value[0] = val_1;
                    }
                    var highLevelNode = node.highLevel();
                    var runtimeType = highLevelNode.localType();
                    var canBeJson_1 = false;
                    var canBeXml_1 = false;
                    if (runtimeType && runtimeType.hasExternalInHierarchy()) {
                        var schemaString = val_1.trim();
                        canBeJson_1 = (schemaString[0] === "{" && schemaString[schemaString.length - 1] === "}");
                        canBeXml_1 = (schemaString[0] === "<" && schemaString[schemaString.length - 1] === ">");
                    }
                    if (canBeJson_1) {
                        obj["typePropertyKind"] = "JSON";
                    }
                    else if (canBeXml_1) {
                        obj["typePropertyKind"] = "XML";
                    }
                    else {
                        obj["typePropertyKind"] = "TYPE_EXPRESSION";
                    }
                }
                else if (typeof value === "object") {
                    obj["typePropertyKind"] = "INPLACE";
                }
            }
            if ((propName === "type" || propName == "schema") && value && value.forEach && typeof value[0] === "string") {
                var schemaString = value[0].trim();
                var canBeJson = _this.stringLooksLikeJSON(schemaString);
                var canBeXml = _this.stringLooksLikeXML(schemaString);
                if (canBeJson || canBeXml) {
                    var include = node.highLevel().lowLevel().includePath && node.highLevel().lowLevel().includePath();
                    if (!include && node.highLevel().isElement()) {
                        var typeAttr = node.highLevel().asElement().attr("type");
                        if (!typeAttr) {
                            typeAttr = node.highLevel().asElement().attr("schema");
                        }
                        if (typeAttr) {
                            include = typeAttr.lowLevel().includePath && typeAttr.lowLevel().includePath();
                        }
                    }
                    if (include) {
                        var ind = include.indexOf("#");
                        var postfix = "";
                        if (ind >= 0) {
                            postfix = include.substring(ind);
                            include = include.substring(0, ind);
                        }
                        var aPath = node.highLevel().lowLevel().unit().resolve(include).absolutePath();
                        var relativePath;
                        if (aPath.indexOf("http://") === 0 || aPath.indexOf("https://") === 0) {
                            relativePath = aPath;
                        }
                        else {
                            relativePath = pathUtils.relative(node.highLevel().lowLevel().unit().project().getRootPath(), aPath);
                        }
                        relativePath = relativePath.replace(/\\/g, '/');
                        var schemaPath = relativePath + postfix;
                        obj["schemaPath"] = schemaPath;
                        if (_this.options.sourceMap) {
                            var sourceMap = obj.sourceMap;
                            if (!sourceMap) {
                                sourceMap = {};
                                obj.sourceMap = sourceMap;
                            }
                            sourceMap.path = schemaPath;
                        }
                    }
                }
            }
            if (!value && propName == "type") {
                return;
                //we should not use
            }
            if (!value && propName == "schema") {
                return;
                //we should not use
            }
            if (!value && propName == "items") {
                return;
                //we should not use
            }
            if (node.definition
                && universeHelpers.isTypeDeclarationDescendant(node.definition())
                && universeHelpers.isTypeProperty(property)) {
                //custom handling of not adding "type" property to the types having "schema" inside, even though the property actually exist,
                // thus making "type" and "schema" arrays mutually exclusive in JSON.
                var schemaValue = node[universe.Universe10.TypeDeclaration.properties.schema.name]();
                if (schemaValue != null && (!Array.isArray(schemaValue) || schemaValue.length != 0)) {
                    return;
                }
                var highLevelNode = node.highLevel();
                var a = highLevelNode.lowLevel();
                var tdl = null;
                var hasSchema = false;
                a.children().forEach(function (x) {
                    if (x.key() == "schema") {
                        hasSchema = true;
                        return;
                    }
                });
                if (hasSchema) {
                    return;
                }
            }
            if (Array.isArray(value)) {
                var propertyValue = [];
                for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                    var val = value_1[_i];
                    var dumped = _this.dumpInternal(val);
                    if (propName === 'examples' && _this.options && _this.options.dumpXMLRepresentationOfExamples && val.expandable && val.expandable._owner) {
                        dumped.asXMLString = val.expandable.asXMLString();
                    }
                    propertyValue.push(dumped);
                }
                if (propertyValue.length == 0 && core.BasicNodeImpl.isInstance(node) && !_this.isDefined(node, propName)) {
                    return;
                }
                for (var _a = 0, _b = _this.nodePropertyTransformers; _a < _b.length; _a++) {
                    var x = _b[_a];
                    if (x.match(node, property)) {
                        propertyValue = x.transform(propertyValue, node);
                    }
                }
                obj[propName] = propertyValue;
                if (props[propName].isValueProperty() && originalValue) {
                    var sPaths = [];
                    for (var _c = 0, originalValue_1 = originalValue; _c < originalValue_1.length; _c++) {
                        var a_1 = originalValue_1[_c];
                        if (core.AttributeNodeImpl.isInstance(a_1)) {
                            var attr = a_1.highLevel();
                            var sPath = hlImpl.actualPath(attr, true);
                            sPaths.push(sPath);
                        }
                        else {
                            sPaths.push(null);
                        }
                    }
                    if (sPaths.filter(function (x) { return x != null; }).length > 0) {
                        scalarsSources[propName] = sPaths.map(function (x) { return { path: x }; });
                    }
                }
            }
            else {
                var val = _this.dumpInternal(value);
                if (core.TypeInstanceImpl.isInstance(value)) {
                    obj[propName] = val;
                    return;
                }
                if (val == null && core.BasicNodeImpl.isInstance(node) && !_this.isDefined(node, propName)) {
                    return;
                }
                if (core.BasicNodeImpl.isInstance(node)) {
                    _this.nodePropertyTransformers.forEach(function (x) {
                        if (x.match(node, property)) {
                            val = x.transform(val, node);
                        }
                    });
                }
                obj[propName] = val;
                if (propName === 'example' && _this.options && _this.options.dumpXMLRepresentationOfExamples && value.expandable && value.expandable._owner) {
                    val.asXMLString = value.expandable.asXMLString();
                }
                if (originalValue && props[propName].isValueProperty()) {
                    var v = Array.isArray(originalValue) ? originalValue[0] : originalValue;
                    if (core.AttributeNodeImpl.isInstance(v)) {
                        var attr = v.highLevel();
                        if (!attr.isFromKey()) {
                            var sPath = hlImpl.actualPath(attr, true);
                            if (sPath) {
                                scalarsSources[propName] = [{ path: sPath }];
                            }
                        }
                    }
                }
            }
        });
        if (this.options.sourceMap && Object.keys(scalarsSources).length > 0) {
            var sourceMap = obj.sourceMap;
            if (!sourceMap) {
                sourceMap = {};
                obj.sourceMap = sourceMap;
            }
            sourceMap.scalarsSources = scalarsSources;
        }
        return obj;
    };
    JsonSerializer.prototype.serializeScalarsAnnotations = function (obj, node, props) {
        var _this = this;
        if (node["scalarsAnnotations"]) {
            var val = {};
            var accessor = node["scalarsAnnotations"]();
            for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
                var propName = _a[_i];
                if (accessor[propName]) {
                    var arr = accessor[propName]();
                    if (arr.length > 0) {
                        if (Array.isArray(arr[0])) {
                            var arr1 = [];
                            arr.forEach(function (x, i) {
                                arr1.push(x.map(function (y) { return _this.dumpInternal(y); }));
                            });
                            if (arr1.filter(function (x) { return x.length > 0; }).length > 0) {
                                val[propName] = arr1;
                            }
                        }
                        else {
                            val[propName] = arr.map(function (x) { return _this.dumpInternal(x); });
                        }
                    }
                }
            }
            if (Object.keys(val).length > 0) {
                obj["scalarsAnnotations"] = val;
            }
        }
    };
    JsonSerializer.prototype.serializeMeta = function (obj, node) {
        if (!this.options.serializeMetadata) {
            return;
        }
        var meta = node.meta();
        if (!meta.isDefault()) {
            obj["__METADATA__"] = meta.toJSON();
        }
    };
    JsonSerializer.prototype.serializeTypeInstance = function (inst) {
        var _this = this;
        if (inst.isScalar()) {
            return inst.value();
        }
        else if (inst.isArray()) {
            return inst.items().map(function (x) { return _this.serializeTypeInstance(x); });
        }
        else {
            var props = inst.properties();
            if (props.length == 0) {
                return null;
            }
            var obj = {};
            props.forEach(function (x) { return obj[x.name()] = _this.serializeTypeInstanceProperty(x); });
            return obj;
        }
    };
    JsonSerializer.prototype.serializeTypeInstanceProperty = function (prop) {
        var _this = this;
        if (prop.isArray()) {
            var values = prop.values();
            //if(values.length==0){
            //    return null;
            //}
            var arr = [];
            values.forEach(function (x) { return arr.push(_this.serializeTypeInstance(x)); });
            return arr;
        }
        else {
            return this.serializeTypeInstance(prop.value());
        }
    };
    JsonSerializer.prototype.isDefined = function (node, name) {
        var hl = node.highLevel();
        if (hl.elementsOfKind(name).length > 0) {
            return true;
        }
        if (hl.attributes(name).length > 0) {
            return true;
        }
        return false;
    };
    return JsonSerializer;
}());
exports.JsonSerializer = JsonSerializer;
var BasicObjectPropertyMatcher = /** @class */ (function () {
    function BasicObjectPropertyMatcher(typeMatcher, propMatcher) {
        this.typeMatcher = typeMatcher;
        this.propMatcher = propMatcher;
    }
    BasicObjectPropertyMatcher.prototype.match = function (td, prop) {
        return (td == null || this.typeMatcher(td)) && ((prop == null) || this.propMatcher(prop));
    };
    return BasicObjectPropertyMatcher;
}());
var CompositeObjectPropertyMatcher = /** @class */ (function () {
    function CompositeObjectPropertyMatcher(matchers) {
        this.matchers = matchers;
    }
    CompositeObjectPropertyMatcher.prototype.match = function (td, prop) {
        var l = this.matchers.length;
        for (var i = 0; i < l; i++) {
            if (this.matchers[i].match(td, prop)) {
                return true;
            }
        }
        return false;
    };
    return CompositeObjectPropertyMatcher;
}());
var ArrayToMapTransformer = /** @class */ (function () {
    function ArrayToMapTransformer(matcher, propName) {
        this.matcher = matcher;
        this.propName = propName;
    }
    ArrayToMapTransformer.prototype.match = function (node, prop) {
        return this.matcher.match(node.definition(), prop);
    };
    ArrayToMapTransformer.prototype.transform = function (value) {
        var _this = this;
        if (Array.isArray(value) && value.length > 0 && value[0][this.propName]) {
            var obj = {};
            value.forEach(function (x) {
                var key = x[_this.propName];
                var previous = obj[key];
                if (previous) {
                    if (Array.isArray(previous)) {
                        previous.push(x);
                    }
                    else {
                        obj[key] = [previous, x];
                    }
                }
                else {
                    obj[key] = x;
                }
            });
            return obj;
        }
        return value;
    };
    return ArrayToMapTransformer;
}());
var ArrayToMappingsArrayTransformer = /** @class */ (function () {
    function ArrayToMappingsArrayTransformer(matcher, propName) {
        this.matcher = matcher;
        this.propName = propName;
    }
    ArrayToMappingsArrayTransformer.prototype.match = function (node, prop) {
        return this.matcher.match(node.definition ? node.definition() : null, prop);
    };
    ArrayToMappingsArrayTransformer.prototype.transform = function (value) {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            var obj = {};
            obj[value[this.propName]] = value;
            return obj;
        }
    };
    return ArrayToMappingsArrayTransformer;
}());
var ParametersTransformer = /** @class */ (function (_super) {
    __extends(ParametersTransformer, _super);
    function ParametersTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isApiSibling, universeHelpers.isBaseUriParametersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isResourceBaseSibling, universeHelpers.isUriParametersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isResourceBaseSibling, universeHelpers.isQueryParametersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isTraitType, universeHelpers.isQueryParametersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isMethodType, universeHelpers.isQueryParametersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isSecuritySchemePartType, universeHelpers.isQueryParametersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isTraitType, universeHelpers.isHeadersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isMethodType, universeHelpers.isHeadersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isSecuritySchemePartType, universeHelpers.isHeadersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isResponseType, universeHelpers.isHeadersProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isBodyLikeType, universeHelpers.isFormParametersProperty)
        ]), "name") || this;
    }
    return ParametersTransformer;
}(ArrayToMapTransformer));
var TypesTransformer = /** @class */ (function (_super) {
    __extends(TypesTransformer, _super);
    function TypesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isLibraryBaseSibling, universeHelpers.isTypesProperty),
            new BasicObjectPropertyMatcher(function (x) { return universeHelpers.isLibraryBaseSibling(x) && universeHelpers.isRAML10Type(x); }, universeHelpers.isSchemasProperty)
        ]), "name") || this;
    }
    TypesTransformer.prototype.match = function (node, prop) {
        var res = node.parent() != null && this.matcher.match(node.parent().definition(), prop);
        if (res) {
            return true;
        }
        else {
            return false;
        }
    };
    return TypesTransformer;
}(ArrayToMappingsArrayTransformer));
var UsesTransformer = /** @class */ (function (_super) {
    __extends(UsesTransformer, _super);
    function UsesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isLibraryBaseSibling, universeHelpers.isUsesProperty)
        ]), "name") || this;
    }
    return UsesTransformer;
}(ArrayToMapTransformer));
var PropertiesTransformer = /** @class */ (function (_super) {
    __extends(PropertiesTransformer, _super);
    function PropertiesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isObjectTypeDeclarationSibling, universeHelpers.isPropertiesProperty)
        ]), "name") || this;
    }
    return PropertiesTransformer;
}(ArrayToMapTransformer));
var ResponsesTransformer = /** @class */ (function (_super) {
    __extends(ResponsesTransformer, _super);
    function ResponsesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isMethodBaseSibling, universeHelpers.isResponsesProperty)
        ]), "code") || this;
    }
    return ResponsesTransformer;
}(ArrayToMapTransformer));
var AnnotationsTransformer = /** @class */ (function (_super) {
    __extends(AnnotationsTransformer, _super);
    function AnnotationsTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(function (x) { return true; }, universeHelpers.isAnnotationsProperty)
        ]), "name") || this;
    }
    return AnnotationsTransformer;
}(ArrayToMapTransformer));
var BodiesTransformer = /** @class */ (function (_super) {
    __extends(BodiesTransformer, _super);
    function BodiesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isResponseType, universeHelpers.isBodyProperty),
            new BasicObjectPropertyMatcher(universeHelpers.isMethodBaseSibling, universeHelpers.isBodyProperty)
        ]), "name") || this;
    }
    return BodiesTransformer;
}(ArrayToMapTransformer));
var TraitsTransformer = /** @class */ (function (_super) {
    __extends(TraitsTransformer, _super);
    function TraitsTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isTraitType, universeHelpers.isTraitsProperty)
        ]), "name") || this;
    }
    return TraitsTransformer;
}(ArrayToMappingsArrayTransformer));
var ResourceTypesTransformer = /** @class */ (function (_super) {
    __extends(ResourceTypesTransformer, _super);
    function ResourceTypesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isResourceTypeType, universeHelpers.isResourceTypesProperty)
        ]), "name") || this;
    }
    ResourceTypesTransformer.prototype.transform = function (value) {
        var methodsPropertyName = universes.Universe10.ResourceBase.properties.methods.name;
        if (Array.isArray(value)) {
            return value;
        }
        else {
            var methods = value[methodsPropertyName];
            if (methods) {
                methods.forEach(function (m) {
                    var keys = Object.keys(m);
                    if (keys.length > 0) {
                        var methodName = keys[0];
                        value[methodName] = m[methodName];
                    }
                });
            }
            delete value[methodsPropertyName];
            return _super.prototype.transform.call(this, value);
        }
    };
    return ResourceTypesTransformer;
}(ArrayToMappingsArrayTransformer));
var FacetsTransformer = /** @class */ (function (_super) {
    __extends(FacetsTransformer, _super);
    function FacetsTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isTypeDeclarationSibling, universeHelpers.isFacetsProperty)
        ]), "name") || this;
    }
    return FacetsTransformer;
}(ArrayToMapTransformer));
var SecuritySchemesTransformer = /** @class */ (function (_super) {
    __extends(SecuritySchemesTransformer, _super);
    function SecuritySchemesTransformer() {
        return _super.call(this, null, "name") || this;
    }
    SecuritySchemesTransformer.prototype.match = function (node, prop) {
        return prop != null && universeHelpers.isSecuritySchemesProperty(prop);
    };
    return SecuritySchemesTransformer;
}(ArrayToMappingsArrayTransformer));
var AnnotationTypesTransformer = /** @class */ (function (_super) {
    __extends(AnnotationTypesTransformer, _super);
    function AnnotationTypesTransformer() {
        return _super.call(this, new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isLibraryBaseSibling, universeHelpers.isAnnotationTypesProperty)
        ]), "name") || this;
    }
    AnnotationTypesTransformer.prototype.match = function (node, prop) {
        return node.parent() != null && this.matcher.match(node.parent().definition(), prop);
    };
    return AnnotationTypesTransformer;
}(ArrayToMappingsArrayTransformer));
var ResourceTypeMethodsToMapTransformer = /** @class */ (function (_super) {
    __extends(ResourceTypeMethodsToMapTransformer, _super);
    function ResourceTypeMethodsToMapTransformer() {
        return _super.call(this, null, "method") || this;
    }
    ResourceTypeMethodsToMapTransformer.prototype.match = function (node, prop) {
        return node.parent() != null
            && universeHelpers.isResourceTypeType(node.parent().definition())
            && universeHelpers.isMethodsProperty(prop);
    };
    return ResourceTypeMethodsToMapTransformer;
}(ArrayToMappingsArrayTransformer));
var exampleNameProp = universe.Universe10.ExampleSpec.properties.name.name;
var exampleContentProp = universe.Universe10.ExampleSpec.properties.value.name;
var exampleStructuredContentProp = "structuredContent";
var ExamplesTransformer = /** @class */ (function () {
    function ExamplesTransformer() {
    }
    ExamplesTransformer.prototype.match = function (node, prop) {
        return universeHelpers.isExampleSpecType(node.definition());
    };
    ExamplesTransformer.prototype.transform = function (value) {
        var _this = this;
        if (Array.isArray(value) && value.length > 0) {
            if (value[0][exampleNameProp]) {
                var obj = {};
                value.forEach(function (x) { return obj[x[exampleNameProp]] = _this.getActualExample(x); });
                return obj;
            }
            else {
                var arr = value.map(function (x) { return _this.getActualExample(x); });
                return arr;
            }
        }
        else {
            return value;
        }
    };
    ExamplesTransformer.prototype.getActualExample = function (exampleSpecObj) {
        if (exampleSpecObj[exampleStructuredContentProp]) {
            return exampleSpecObj[exampleStructuredContentProp];
        }
        return exampleSpecObj[exampleContentProp];
    };
    return ExamplesTransformer;
}());
var TypeExampleTransformer = /** @class */ (function () {
    function TypeExampleTransformer() {
    }
    TypeExampleTransformer.prototype.match = function (node, prop) {
        return node.definition && universeHelpers.isTypeDeclarationSibling(node.definition());
    };
    TypeExampleTransformer.prototype.transform = function (value) {
        var isArray = Array.isArray(value);
        var arr = isArray ? value : [value];
        arr.forEach(function (x) {
            var structuredExample = x['example'];
            if (structuredExample) {
                x['example'] = structuredExample.structuredValue;
                x['structuredExample'] = structuredExample;
            }
        });
        return isArray ? arr : arr[0];
    };
    return TypeExampleTransformer;
}());
var TypeDefaultValueTransformer = /** @class */ (function () {
    function TypeDefaultValueTransformer() {
    }
    TypeDefaultValueTransformer.prototype.match = function (node, prop) {
        return node.definition && universeHelpers.isTypeDeclarationSibling(node.definition());
    };
    TypeDefaultValueTransformer.prototype.transform = function (value, node) {
        var hlNode = node.highLevel();
        if (hlNode == null || !hlNode.isElement()) {
            return value;
        }
        var element = hlNode.asElement();
        var propName = universe.Universe10.TypeDeclaration.properties.default.name;
        var attr = element.attr(propName);
        if (attr == null || attr.value() != null) {
            return value;
        }
        var isArray = Array.isArray(value);
        var arr = isArray ? value : [value];
        arr.forEach(function (x) {
            if (x[propName] == null) {
                var dVal = attr.lowLevel().dumpToObject();
                if (typeof dVal == "object" && dVal.hasOwnProperty(propName)) {
                    x[propName] = dVal[propName];
                }
                else {
                    x[propName] = dVal;
                }
            }
        });
        return isArray ? arr : arr[0];
    };
    return TypeDefaultValueTransformer;
}());
var SchemasTransformer = /** @class */ (function () {
    function SchemasTransformer() {
        this.matcher = new BasicObjectPropertyMatcher(function (x) { return universeHelpers.isApiType(x) && universeHelpers.isRAML08Type(x); }, universeHelpers.isSchemasProperty);
    }
    SchemasTransformer.prototype.match = function (node, prop) {
        return node.parent() != null && this.matcher.match(node.parent().definition(), prop);
    };
    SchemasTransformer.prototype.transform = function (value) {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            var obj = {};
            obj[value.key] = value.value;
            if (value.sourceMap && value.sourceMap.path) {
                obj.sourceMap = {
                    path: value.sourceMap.path
                };
            }
            return obj;
        }
    };
    SchemasTransformer.prototype.getActualExample = function (exampleSpecObj) {
        if (exampleSpecObj[exampleStructuredContentProp]) {
            return exampleSpecObj[exampleStructuredContentProp];
        }
        return exampleSpecObj[exampleContentProp];
    };
    return SchemasTransformer;
}());
var ProtocolsToUpperCaseTransformer = /** @class */ (function () {
    function ProtocolsToUpperCaseTransformer() {
    }
    ProtocolsToUpperCaseTransformer.prototype.match = function (node, prop) {
        return prop != null && universeHelpers.isProtocolsProperty(prop);
    };
    ProtocolsToUpperCaseTransformer.prototype.transform = function (value) {
        if (typeof (value) == 'string') {
            return value.toUpperCase();
        }
        else if (Array.isArray(value)) {
            return value.map(function (x) { return x.toUpperCase(); });
        }
        return value;
    };
    return ProtocolsToUpperCaseTransformer;
}());
var OneElementArrayTransformer = /** @class */ (function () {
    function OneElementArrayTransformer() {
        this.usecases = new CompositeObjectPropertyMatcher([
            new BasicObjectPropertyMatcher(universeHelpers.isApiSibling, universeHelpers.isMediaTypeProperty)
        ]);
    }
    OneElementArrayTransformer.prototype.match = function (node, prop) {
        return this.usecases.match(node.definition(), prop);
    };
    OneElementArrayTransformer.prototype.transform = function (value) {
        if (Array.isArray(value) && value.length == 1) {
            return value[0];
        }
        return value;
    };
    return OneElementArrayTransformer;
}());
var ResourcesTransformer = /** @class */ (function () {
    function ResourcesTransformer() {
    }
    ResourcesTransformer.prototype.match = function (node, prop) {
        return prop != null && universeHelpers.isResourcesProperty(prop);
    };
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
            value.absoluteUri = node.absoluteUri();
        }
        return value;
    };
    return ResourcesTransformer;
}());
var SimpleNamesTransformer = /** @class */ (function () {
    function SimpleNamesTransformer() {
    }
    SimpleNamesTransformer.prototype.match = function (node, prop) {
        if (!node.parent() || !node.parent().highLevel().lowLevel()["libProcessed"]) {
            return false;
        }
        return universeHelpers.isAnnotationTypesProperty(prop)
            || universeHelpers.isTypesProperty(prop)
            || universeHelpers.isResourceTypesProperty(prop)
            || universeHelpers.isTraitsProperty(prop)
            || universeHelpers.isSecuritySchemesProperty(prop);
    };
    SimpleNamesTransformer.prototype.transform = function (value, node) {
        var llNode = node.highLevel().lowLevel();
        var key = llNode.key();
        var original = llNode;
        while (proxy.LowLevelProxyNode.isInstance(original)) {
            original = original.originalNode();
        }
        var oKey = original.key();
        var aVal = value[Object.keys(value)[0]];
        aVal.name = oKey;
        if (aVal.displayName == key) {
            aVal.displayName = oKey;
        }
        return value;
    };
    return SimpleNamesTransformer;
}());
var TemplateParametrizedPropertiesTransformer = /** @class */ (function () {
    function TemplateParametrizedPropertiesTransformer() {
    }
    TemplateParametrizedPropertiesTransformer.prototype.match = function (node, prop) {
        var hlNode = node.highLevel();
        if (!hlNode) {
            return false;
        }
        var d = hlNode.definition();
        if (!d) {
            return false;
        }
        return universeHelpers.isResourceTypeType(d)
            || universeHelpers.isTraitType(d)
            || universeHelpers.isMethodType(d)
            || universeHelpers.isResponseType(d)
            || universeHelpers.isParameterDescendant(d)
            || universeHelpers.isBodyLikeType(d)
            || universeHelpers.isTypeDeclarationDescendant(d);
    };
    TemplateParametrizedPropertiesTransformer.prototype.transform = function (value) {
        if (Array.isArray(value)) {
            return value;
        }
        var propName = universe.Universe10.Trait.properties.parametrizedProperties.name;
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
}());
var ReferencesTransformer = /** @class */ (function () {
    function ReferencesTransformer() {
    }
    ReferencesTransformer.prototype.match = function (node, prop) {
        return prop != null && (universeHelpers.isSecuredByProperty(prop)
            || universeHelpers.isIsProperty(prop)
            || (node.parent() != null && (universeHelpers.isResourceType(node.parent().highLevel().definition())
                || universeHelpers.isResourceTypeType(node.parent().highLevel().definition()))
                && universeHelpers.isTypeProperty(prop)));
    };
    ReferencesTransformer.prototype.transform = function (value) {
        if (!value) {
            return null;
        }
        if (Array.isArray(value)) {
            return value;
        }
        return this.toSimpleValue(value);
    };
    ReferencesTransformer.prototype.toSimpleValue = function (x) {
        var name = x['name'];
        var params = x['structuredValue'];
        if (params) {
            var obj = {};
            obj[name] = params;
            return obj;
        }
        else {
            return name;
        }
    };
    return ReferencesTransformer;
}());
var ArrayExpressionTransformer = /** @class */ (function () {
    function ArrayExpressionTransformer() {
    }
    ArrayExpressionTransformer.prototype.match = function (node, prop) {
        if (!(core.BasicNodeImpl.isInstance(node))) {
            return false;
        }
        var hlNode = node.highLevel();
        var definition = hlNode.definition();
        if (!universeHelpers.isTypeDeclarationDescendant(definition)) {
            return false;
        }
        var lType = hlNode.localType();
        if (!lType || !lType.isArray()) {
            return false;
        }
        return true;
    };
    ArrayExpressionTransformer.prototype.transform = function (value) {
        var typePropName = universes.Universe10.TypeDeclaration.properties.type.name;
        var schemaPropName = universes.Universe10.TypeDeclaration.properties.schema.name;
        var itemsPropName = universes.Universe10.ArrayTypeDeclaration.properties.items.name;
        var tValue = value[typePropName];
        if (!tValue) {
            tValue = value[schemaPropName];
        }
        if (tValue.length == 1 && util.stringEndsWith(tValue[0], "[]")) {
            if (value[itemsPropName] == null) {
                value[itemsPropName] = tValue[0].substring(0, tValue[0].length - 2);
            }
            tValue[0] = "array";
        }
        return value;
    };
    return ArrayExpressionTransformer;
}());
var PropertiesData = /** @class */ (function () {
    function PropertiesData() {
        this.map = {};
    }
    PropertiesData.prototype.addProperty = function (prop, wrapperKind) {
        var data = this.map[wrapperKind];
        if (!data) {
            data = new TypePropertiesData(wrapperKind);
            this.map[wrapperKind] = data;
        }
        data.addProperty(prop);
    };
    PropertiesData.prototype.print = function () {
        var _this = this;
        return Object.keys(this.map).map(function (x) { return _this.map[x].print(); }).join('\n') + "\n";
    };
    return PropertiesData;
}());
var TypePropertiesData = /** @class */ (function () {
    function TypePropertiesData(typeName) {
        this.typeName = typeName;
        this.map = {};
    }
    TypePropertiesData.prototype.addProperty = function (prop) {
        var name = prop.domain().nameId();
        var data = this.map[name];
        if (!data) {
            data = new TypePropertiesData2(name);
            this.map[name] = data;
        }
        data.addProperty(prop);
    };
    TypePropertiesData.prototype.print = function () {
        var _this = this;
        return this.typeName + ':\n' + Object.keys(this.map).map(function (x) { return '    ' + _this.map[x].print(); }).join('\n');
    };
    return TypePropertiesData;
}());
var TypePropertiesData2 = /** @class */ (function () {
    function TypePropertiesData2(typeName) {
        this.typeName = typeName;
        this.map = {};
    }
    TypePropertiesData2.prototype.addProperty = function (prop) {
        var name = prop.nameId();
        this.map[name] = prop;
    };
    TypePropertiesData2.prototype.print = function () {
        return this.typeName + ': ' + Object.keys(this.map).sort().join(', ');
    };
    return TypePropertiesData2;
}());
function isEmpty(nc) {
    if (nc.properties().length) {
        return false;
    }
    if (nc.annotations().length) {
        return false;
    }
    if (nc.facets().length) {
        return false;
    }
    var fixedFacets = nc.fixedFacets();
    if (fixedFacets && Object.keys(fixedFacets).length) {
        return false;
    }
    var fixedBuiltinFacets = nc.fixedBuiltInFacets();
    if (fixedBuiltinFacets && Object.keys(fixedBuiltinFacets).length) {
        return false;
    }
    if (nc.description()) {
        return false;
    }
    return true;
}
exports.isEmpty = isEmpty;
function isFragment(node) {
    if (!node.parent()) {
        return true;
    }
    if (node.lowLevel()["libProcessed"]) {
        return false;
    }
    if (!universeHelpers.isLibraryType(node.root().definition())) {
        return false;
    }
    var includePath = node.lowLevel().includePath();
    if (includePath == null) {
        return false;
    }
    var resolvedUnit = node.lowLevel().unit().resolve(includePath);
    if (resolvedUnit && resolvedUnit.contents().startsWith("#%RAML")) {
        return true;
    }
    return false;
}
//# sourceMappingURL=jsonSerializer.js.map