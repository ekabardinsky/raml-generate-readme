"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RamlWrapper1Impl = require("../parser/artifacts/raml10parser");
var path = require("path");
var Opt = require("../Opt");
var jsyaml = require("../parser/jsyaml/jsyaml2lowLevel");
var hlimpl = require("../parser/highLevelImpl");
var llimpl = require("../parser/jsyaml/jsyaml2lowLevel");
var expanderLL = require("../parser/ast.core/expanderLL");
var util = require("../util/index");
var universeDef = require("../parser/tools/universe");
var ramlServices = require("../parser/definition-system/ramlServices");
var jsonSerializerHL = require("../util/jsonSerializerHL");
var universeHelpers = require("./tools/universeHelpers");
var search = require("./../search/search-interface");
var linter = require("./ast.core/linter");
var messageRegistry = require("../../resources/errorMessages");
var universeProvider = require("../parser/definition-system/universeProvider");
function load(ramlPathOrContent, options) {
    var serializeOptions = toNewFormatSerializeOptions(options);
    return parse(ramlPathOrContent, options).then(function (expanded) {
        return jsonSerializerHL.dump(expanded, serializeOptions);
    });
}
exports.load = load;
function loadSync(ramlPathOrContent, options) {
    var serializeOptions = toNewFormatSerializeOptions(options);
    var expanded = parseSync(ramlPathOrContent, options);
    return jsonSerializerHL.dump(expanded, serializeOptions);
}
exports.loadSync = loadSync;
function parse(ramlPathOrContent, options) {
    options = options || {};
    var filePath = ramlPathOrContent;
    if (consideredAsRamlContent(ramlPathOrContent)) {
        options = loadOptionsForContent(ramlPathOrContent, options, options.filePath);
        filePath = virtualFilePath(options);
    }
    var loadRAMLOptions = toOldStyleOptions(options);
    return loadRAMLAsyncHL(filePath, loadRAMLOptions).then(function (hlNode) {
        var expanded;
        if (!options.hasOwnProperty("expandLibraries") || options.expandLibraries) {
            expanded = expanderLL.expandLibrariesHL(hlNode);
        }
        else {
            expanded = expanderLL.expandTraitsAndResourceTypesHL(hlNode);
        }
        return expanded;
    });
}
exports.parse = parse;
function parseSync(ramlPathOrContent, options) {
    options = options || {};
    var filePath = ramlPathOrContent;
    if (consideredAsRamlContent(ramlPathOrContent)) {
        options = loadOptionsForContent(ramlPathOrContent, options, options.filePath);
        filePath = virtualFilePath(options);
    }
    var loadRAMLOptions = toOldStyleOptions(options);
    var hlNode = loadRAMLInternalHL(filePath, loadRAMLOptions);
    var expanded;
    if (!options.hasOwnProperty("expandLibraries") || options.expandLibraries) {
        if (universeHelpers.isLibraryType(hlNode.definition())) {
            expanded = expanderLL.expandLibraryHL(hlNode) || hlNode;
        }
        else {
            expanded = expanderLL.expandLibrariesHL(hlNode) || hlNode;
        }
    }
    else {
        expanded = expanderLL.expandTraitsAndResourceTypesHL(hlNode) || hlNode;
    }
    return expanded;
}
exports.parseSync = parseSync;
/***
 * Load API synchronously. Detects RAML version and uses corresponding parser.
 * @param apiPath Path to API: local file system path or Web URL
 * @param options Load options
 * @return Opt&lt;Api&gt;, where Api belongs to RAML 1.0 or RAML 0.8 model.
 ***/
function loadApi(apiPath, arg1, arg2) {
    var hlNode = loadRAMLInternalHL(apiPath, arg1, arg2);
    if (!hlNode) {
        return Opt.empty();
    }
    var api = hlNode.wrapperNode();
    var options = (Array.isArray(arg1) ? arg2 : arg1);
    setAttributeDefaults(api, options);
    return new Opt(api);
}
exports.loadApi = loadApi;
/***
 * Load RAML synchronously. Detects RAML version and uses corresponding parser.
 * @param ramlPath Path to RAML: local file system path or Web URL
 * @param options Load options
 * @return Opt&lt;RAMLLanguageElement&gt;, where RAMLLanguageElement belongs to RAML 1.0 or RAML 0.8 model.
 ***/
function loadRAML(ramlPath, arg1, arg2) {
    var hlNode = loadRAMLInternalHL(ramlPath, arg1, arg2);
    if (!hlNode) {
        return Opt.empty();
    }
    var api = hlNode.wrapperNode();
    var options = (Array.isArray(arg1) ? arg2 : arg1);
    setAttributeDefaults(api, options);
    return new Opt(api);
}
exports.loadRAML = loadRAML;
/***
 * Load RAML synchronously. Detects RAML version and uses corresponding parser.
 * @param ramlPath Path to RAML: local file system path or Web URL
 * @param options Load options
 * @return Opt&lt;hl.IHighLevelNode&gt;
 ***/
function loadRAMLHL(ramlPath, arg1, arg2) {
    var hlNode = loadRAMLInternalHL(ramlPath, arg1, arg2);
    if (!hlNode) {
        return Opt.empty();
    }
    return new Opt(hlNode);
}
exports.loadRAMLHL = loadRAMLHL;
function loadRAMLInternalHL(apiPath, arg1, arg2) {
    var gotArray = Array.isArray(arg1);
    var extensionsAndOverlays = (gotArray ? arg1 : null);
    var options = (gotArray ? arg2 : arg1);
    options = options || {};
    var project = getProject(apiPath, options);
    var pr = apiPath.indexOf("://");
    var unitName = (pr != -1 && pr < 6) ? apiPath : path.basename(apiPath);
    var unit = project.unit(unitName);
    if (arg2 && !extensionsAndOverlays) {
        extensionsAndOverlays = null;
    }
    var api;
    if (unit) {
        if (extensionsAndOverlays && extensionsAndOverlays.length > 0) {
            var extensionUnits = [];
            extensionsAndOverlays.forEach(function (currentPath) {
                if (!currentPath || currentPath.trim().length == 0) {
                    throw new Error(messageRegistry.EXTENSIONS_AND_OVERLAYS_LEGAL_FILE_PATHS.message);
                }
            });
            extensionsAndOverlays.forEach(function (unitPath) {
                extensionUnits.push(project.unit(unitPath, path.isAbsolute(unitPath)));
            });
            //calling to perform the checks, we do not actually need the api itself
            extensionUnits.forEach(function (extensionUnit) { return toApi(extensionUnit, options); });
            api = toApi(expanderLL.mergeAPIs(unit, extensionUnits, hlimpl.OverlayMergeMode.MERGE), options);
        }
        else {
            api = toApi(unit, options);
            api.setMergeMode(hlimpl.OverlayMergeMode.MERGE);
        }
    }
    if (!unit) {
        throw new Error(linter.applyTemplate(messageRegistry.CAN_NOT_RESOLVE, { path: apiPath }));
    }
    if (options.rejectOnErrors && api && api.errors().filter(function (x) { return !x.isWarning; }).length) {
        throw toError(api);
    }
    return api;
}
/***
 * Load API asynchronously. Detects RAML version and uses corresponding parser.
 * @param apiPath Path to API: local file system path or Web URL
 * @param options Load options
 * @return Promise&lt;Api&gt;, where Api belongs to RAML 1.0 or RAML 0.8 model.
 ***/
function loadApiAsync(apiPath, arg1, arg2) {
    var ramlPromise = loadRAMLAsync(apiPath, arg1, arg2);
    return ramlPromise.then(function (loadedRaml) {
        // if (false) {
        //     //TODO check that loaded RAML is API
        //     return Promise.reject("Specified RAML is not API");
        // } else {
        return loadedRaml;
        // }
    });
}
exports.loadApiAsync = loadApiAsync;
/***
 * Load API asynchronously. Detects RAML version and uses corresponding parser.
 * @param ramlPath Path to RAML: local file system path or Web URL
 * @param options Load options
 * @return Promise&lt;RAMLLanguageElement&gt;, where RAMLLanguageElement belongs to RAML 1.0 or RAML 0.8 model.
 ***/
function loadRAMLAsync(ramlPath, arg1, arg2) {
    return loadRAMLAsyncHL(ramlPath, arg1, arg2).then(function (x) {
        if (!x) {
            return null;
        }
        var gotArray = Array.isArray(arg1);
        var options = (gotArray ? arg2 : arg1);
        var node = x;
        while (node != null) {
            var wn = node.wrapperNode();
            setAttributeDefaults(wn, options);
            var master = node.getMaster();
            node = master && master !== node ? master.asElement() : null;
        }
        return x.wrapperNode();
    });
}
exports.loadRAMLAsync = loadRAMLAsync;
function loadRAMLAsyncHL(ramlPath, arg1, arg2) {
    var gotArray = Array.isArray(arg1);
    var extensionsAndOverlays = (gotArray ? arg1 : null);
    var options = (gotArray ? arg2 : arg1);
    options = options || {};
    var project = getProject(ramlPath, options);
    var pr = ramlPath.indexOf("://");
    var unitName = (pr != -1 && pr < 6) ? ramlPath : path.basename(ramlPath);
    if (arg2 && !extensionsAndOverlays) {
        extensionsAndOverlays = null;
    }
    if (!extensionsAndOverlays || extensionsAndOverlays.length == 0) {
        return fetchAndLoadApiAsyncHL(project, unitName, options).then(function (masterApi) {
            masterApi.setMergeMode(hlimpl.OverlayMergeMode.MERGE);
            return masterApi;
        });
    }
    else {
        extensionsAndOverlays.forEach(function (currentPath) {
            if (!currentPath || currentPath.trim().length == 0) {
                throw new Error(messageRegistry.EXTENSIONS_AND_OVERLAYS_LEGAL_FILE_PATHS.message);
            }
        });
        return fetchAndLoadApiAsyncHL(project, unitName, options).then(function (masterApi) {
            var apiPromises = [];
            extensionsAndOverlays.forEach(function (extensionUnitPath) {
                apiPromises.push(fetchAndLoadApiAsyncHL(project, extensionUnitPath, options));
            });
            return Promise.all(apiPromises).then(function (apis) {
                var overlayUnits = [];
                apis.forEach(function (currentApi) { return overlayUnits.push(currentApi.lowLevel().unit()); });
                var result = expanderLL.mergeAPIs(masterApi.lowLevel().unit(), overlayUnits, hlimpl.OverlayMergeMode.MERGE);
                return result;
            }).then(function (mergedHighLevel) {
                return toApi(mergedHighLevel, options);
            });
        });
    }
}
exports.loadRAMLAsyncHL = loadRAMLAsyncHL;
/**
 * Gets AST node by runtime type, if runtime type matches any.
 * @param runtimeType
 */
function getLanguageElementByRuntimeType(runtimeType) {
    if (runtimeType == null) {
        return null;
    }
    var highLevelNode = runtimeType.getAdapter(ramlServices.RAMLService).getDeclaringNode();
    if (highLevelNode == null) {
        return null;
    }
    return highLevelNode.wrapperNode();
}
exports.getLanguageElementByRuntimeType = getLanguageElementByRuntimeType;
function fetchAndLoadApiAsync(project, unitName, options) {
    return fetchAndLoadApiAsyncHL(project, unitName, options).then(function (x) { return x.wrapperNode(); });
}
function fetchAndLoadApiAsyncHL(project, unitName, options) {
    var _unitName = unitName.replace(/\\/g, "/");
    return llimpl.fetchIncludesAndMasterAsync(project, _unitName).then(function (x) {
        try {
            var api = toApi(x, options);
            if (options.rejectOnErrors && api && api.errors().filter(function (x) { return !x.isWarning; }).length) {
                return Promise.reject(toError(api));
            }
            return api;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function getProject(apiPath, options) {
    options = options || {};
    var includeResolver = options.fsResolver;
    var httpResolver = options.httpResolver;
    var reusedNode = options.reusedNode;
    var project;
    if (reusedNode) {
        var reusedUnit = reusedNode.lowLevel().unit();
        project = reusedUnit.project();
        project.namespaceResolver().deleteUnitModel(reusedUnit.absolutePath());
        project.deleteUnit(path.basename(apiPath));
        if (includeResolver) {
            project.setFSResolver(includeResolver);
        }
        if (httpResolver) {
            project.setHTTPResolver(httpResolver);
        }
    }
    else {
        var projectRoot = path.dirname(apiPath);
        project = new jsyaml.Project(projectRoot, includeResolver, httpResolver);
    }
    return project;
}
;
function toApi(unitOrHighlevel, options, checkApisOverlays) {
    if (checkApisOverlays === void 0) { checkApisOverlays = false; }
    options = options || {};
    if (!unitOrHighlevel) {
        return null;
    }
    var unit = null;
    var highLevel = null;
    if (unitOrHighlevel.isRAMLUnit) {
        unit = unitOrHighlevel;
    }
    else {
        highLevel = unitOrHighlevel;
        unit = highLevel.lowLevel().unit();
    }
    var contents = unit.contents();
    var ramlFirstLine = hlimpl.ramlFirstLine(contents);
    if (!ramlFirstLine) {
        throw new Error(messageRegistry.INVALID_FIRST_LINE.message);
    }
    var verStr = ramlFirstLine[1];
    var ramlFileType = ramlFirstLine[2];
    var typeName;
    var apiImpl;
    var ramlVersion;
    if (verStr == '0.8') {
        ramlVersion = 'RAML08';
    }
    else if (verStr == '1.0') {
        ramlVersion = 'RAML10';
    }
    if (!ramlVersion) {
        throw new Error(messageRegistry.UNKNOWN_RAML_VERSION.message);
    }
    if (ramlVersion == 'RAML08' && checkApisOverlays) {
        throw new Error(messageRegistry.EXTENSIONS_AND_OVERLAYS_NOT_SUPPORTED_0_8.message);
    }
    //if (!ramlFileType || ramlFileType.trim() === "") {
    //    if (verStr=='0.8') {
    //        typeName = universeDef.Universe08.Api.name;
    //        apiImpl = RamlWrapper08.ApiImpl;
    //    } else if(verStr=='1.0'){
    //        typeName = universeDef.Universe10.Api.name;
    //        apiImpl = RamlWrapper1.ApiImpl;
    //    }
    //} else if (ramlFileType === "Overlay") {
    //    apiImpl = RamlWrapper1.OverlayImpl;
    //    typeName = universeDef.Universe10.Overlay.name;
    //} else if (ramlFileType === "Extension") {
    //    apiImpl = RamlWrapper1.ExtensionImpl;
    //    typeName = universeDef.Universe10.Extension.name;
    //}
    var universe = universeProvider(ramlVersion);
    var apiType = universe.type(typeName);
    if (!highLevel) {
        highLevel = hlimpl.fromUnit(unit);
        if (options.reusedNode) {
            if (options.reusedNode.lowLevel().unit().absolutePath() == unit.absolutePath()) {
                if (checkReusability(highLevel, options.reusedNode)) {
                    highLevel.setReusedNode(options.reusedNode);
                }
            }
        }
        //highLevel =
        //    new hlimpl.ASTNodeImpl(unit.ast(), null, <any>apiType, null)
    }
    //api = new apiImpl(highLevel);
    return highLevel;
}
;
function toError(api) {
    var error = new Error(messageRegistry.API_CONTAINS_ERROR.message);
    error.parserErrors = hlimpl.toParserErrors(api.errors(), api);
    return error;
}
exports.toError = toError;
function loadApis1(projectRoot, cacheChildren, expandTraitsAndResourceTypes) {
    if (cacheChildren === void 0) { cacheChildren = false; }
    if (expandTraitsAndResourceTypes === void 0) { expandTraitsAndResourceTypes = true; }
    var universe = universeProvider("RAML10");
    var apiType = universe.type(universeDef.Universe10.Api.name);
    var p = new jsyaml.Project(projectRoot);
    var result = [];
    p.units().forEach(function (x) {
        var lowLevel = x.ast();
        if (cacheChildren) {
            lowLevel = llimpl.toChildCachingNode(lowLevel);
        }
        var api = new RamlWrapper1Impl.ApiImpl(new hlimpl.ASTNodeImpl(lowLevel, null, apiType, null));
        if (expandTraitsAndResourceTypes) {
            api = expanderLL.expandTraitsAndResourceTypes(api);
        }
        result.push(api);
    });
    return result;
}
exports.loadApis1 = loadApis1;
function checkReusability(hnode, rNode) {
    if (!rNode) {
        return false;
    }
    var s1 = hnode.lowLevel().unit().contents();
    var s2 = rNode.lowLevel().unit().contents();
    var l = Math.min(s1.length, s2.length);
    var pos = -1;
    for (var i = 0; i < l; i++) {
        if (s1.charAt(i) != s2.charAt(i)) {
            pos = i;
            break;
        }
    }
    while (pos > 0 && s1.charAt(pos).replace(/\s/, '') == '') {
        pos--;
    }
    if (pos < 0 && s1.length != s2.length) {
        pos = l;
    }
    var editedNode = search.deepFindNode(rNode, pos, pos + 1);
    if (!editedNode) {
        return true;
    }
    if (editedNode.lowLevel().unit().absolutePath() != hnode.lowLevel().unit().absolutePath()) {
        return true;
    }
    var editedElement = editedNode.isElement() ? editedNode.asElement() : editedNode.parent();
    if (!editedElement) {
        return true;
    }
    var pProp = editedElement.property();
    if (!pProp) {
        return true;
    }
    if (universeHelpers.isAnnotationsProperty(pProp)) {
        editedElement = editedElement.parent();
    }
    if (!editedElement) {
        return true;
    }
    var p = editedElement;
    while (p) {
        var pDef = p.definition();
        if (universeHelpers.isResourceTypeType(pDef) || universeHelpers.isTraitType(pDef)) {
            return false;
        }
        var prop = p.property();
        if (!prop) {
            return true;
        }
        if (universeHelpers.isTypeDeclarationDescendant(pDef)) {
            if (universeHelpers.isTypesProperty(prop) || universeHelpers.isAnnotationTypesProperty(prop)) {
                return false;
            }
        }
        var propRange = prop.range();
        if (universeHelpers.isResourceTypeRefType(propRange) || universeHelpers.isTraitRefType(propRange)) {
            return false;
        }
        p = p.parent();
    }
    return true;
}
function setAttributeDefaults(api, options) {
    options = options || {};
    if (options.attributeDefaults != null && api) {
        api.setAttributeDefaults(options.attributeDefaults);
    }
    else if (api) {
        api.setAttributeDefaults(true);
    }
}
function optionsForContent(content, arg2, _filePath) {
    var filePath = _filePath || virtualFilePath(arg2);
    var fsResolver = virtualFSResolver(filePath, content, arg2 && arg2.fsResolver);
    return {
        fsResolver: fsResolver,
        httpResolver: arg2 ? arg2.httpResolver : null,
        rejectOnErrors: arg2 ? arg2.rejectOnErrors : false,
        attributeDefaults: arg2 ? arg2.attributeDefaults : true
    };
}
exports.optionsForContent = optionsForContent;
function toOldStyleOptions(options) {
    if (!options) {
        return {};
    }
    return {
        fsResolver: options.fsResolver,
        httpResolver: options.httpResolver,
        rejectOnErrors: false,
        attributeDefaults: true
    };
}
function loadOptionsForContent(content, arg2, _filePath) {
    var filePath = _filePath || virtualFilePath(arg2);
    var fsResolver = virtualFSResolver(filePath, content, arg2 && arg2.fsResolver);
    var result = {
        fsResolver: fsResolver
    };
    if (!arg2) {
        return result;
    }
    for (var _i = 0, _a = Object.keys(arg2); _i < _a.length; _i++) {
        var key = _a[_i];
        if (key != "fsResolver") {
            result[key] = arg2[key];
        }
    }
    return result;
}
exports.loadOptionsForContent = loadOptionsForContent;
function consideredAsRamlContent(str) {
    str = str && str.trim();
    if (!str) {
        return true;
    }
    if (str.length <= "#%RAML".length) {
        return util.stringStartsWith("#%RAML", str);
    }
    else if (util.stringStartsWith(str, "#%RAML")) {
        return true;
    }
    return str.indexOf("\n") >= 0;
}
function toNewFormatSerializeOptions(options) {
    options = options || {};
    return {
        rootNodeDetails: true,
        attributeDefaults: true,
        serializeMetadata: options.serializeMetadata || false,
        expandExpressions: options.expandExpressions,
        typeReferences: options.typeReferences,
        expandTypes: options.expandTypes,
        typeExpansionRecursionDepth: options.typeExpansionRecursionDepth,
        sourceMap: options.sourceMap
    };
}
function virtualFSResolver(filePath, content, originalResolver) {
    if (filePath != null) {
        filePath = filePath.replace(/\\/g, "/");
    }
    return {
        content: function (pathStr) {
            if (pathStr === filePath) {
                return content;
            }
            if (originalResolver) {
                return originalResolver.content(pathStr);
            }
        },
        contentAsync: function (pathStr) {
            if (pathStr === filePath) {
                return Promise.resolve(content);
            }
            if (originalResolver) {
                return originalResolver.contentAsync(pathStr);
            }
        }
    };
}
exports.virtualFSResolver = virtualFSResolver;
function virtualFilePath(opt) {
    var filePath = (opt && opt.filePath) || path.resolve("/#local.raml");
    return filePath.replace(/\\/g, "/");
}
exports.virtualFilePath = virtualFilePath;
//# sourceMappingURL=apiLoader.js.map