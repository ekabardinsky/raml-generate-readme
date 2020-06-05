"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apiLoader = require("./parser/apiLoader");
exports.jsonTypings = require("./typings-new-format/raml");
var PromiseConstructor = require('promise-polyfill');
/**
 * RAML 1.0 top-level AST interfaces.
 */
exports.api10 = require("./parser/artifacts/raml10parserapi");
/**
 * RAML 0.8 top-level AST interfaces.
 */
exports.api08 = require("./parser/artifacts/raml08parserapi");
/**
 * Load RAML asynchronously. May load both Api and Typed fragments. The Promise is rejected with [[ApiLoadingError]] if the result contains errors and the 'rejectOnErrors' option is set to 'true'.
 * @param ramlPathOrContent Path to RAML: local file system path or Web URL; or RAML file content.
 * @param options Load options
 * @return Object representation of the specification wrapped into a Promise.
 **/
function load(ramlPathOrContent, options) {
    return apiLoader.load(ramlPathOrContent, options);
}
exports.load = load;
/**
 * Load RAML synchronously. May load both Api and Typed fragments. If the 'rejectOnErrors' option is set to true, [[ApiLoadingError]] is thrown for RAML which contains errors.
 * @param ramlPathOrContent Path to RAML: local file system path or Web URL; or RAML file content.
 * @param options Load options
 * @return Object representation of the specification.
 **/
function loadSync(ramlPathOrContent, options) {
    return apiLoader.loadSync(ramlPathOrContent, options);
}
exports.loadSync = loadSync;
/**
 * Load RAML asynchronously. May load both Api and Typed fragments. The Promise is rejected with [[ApiLoadingError]] if the result contains errors and the 'rejectOnErrors' option is set to 'true'.
 * @param ramlPathOrContent Path to RAML: local file system path or Web URL; or RAML file content.
 * @param options Load options
 * @return High level AST root wrapped into a Promise.
 **/
function parse(ramlPathOrContent, options) {
    return apiLoader.parse(ramlPathOrContent, options);
}
exports.parse = parse;
/**
 * Load RAML synchronously. May load both Api and Typed fragments. If the 'rejectOnErrors' option is set to true, [[ApiLoadingError]] is thrown for RAML which contains errors.
 * @param ramlPathOrContent Path to RAML: local file system path or Web URL; or RAML file content.
 * @param options Load options
 * @return High level AST root.
 **/
function parseSync(ramlPathOrContent, options) {
    return apiLoader.parseSync(ramlPathOrContent, options);
}
exports.parseSync = parseSync;
function loadApiSync(apiPath, arg1, arg2) {
    return apiLoader.loadApi(apiPath, arg1, arg2).getOrElse(null);
}
exports.loadApiSync = loadApiSync;
function loadRAMLSync(ramlPath, arg1, arg2) {
    return apiLoader.loadApi(ramlPath, arg1, arg2).getOrElse(null);
}
exports.loadRAMLSync = loadRAMLSync;
/**
 * Load RAML synchronously. May load both Api and Typed fragments. If the 'rejectOnErrors' option is set to true, [[ApiLoadingError]] is thrown for RAML which contains errors.
 * @param content content of the raml
 * @param options Load options  (note you should path a resolvers if you want includes to be resolved)
 * @return RAMLLanguageElement instance.
 **/
function parseRAMLSync(content, arg2) {
    var filePath = apiLoader.virtualFilePath(arg2);
    var optionsForContent = apiLoader.optionsForContent(content, arg2, filePath);
    return apiLoader.loadApi(filePath, [], optionsForContent).getOrElse(null);
}
exports.parseRAMLSync = parseRAMLSync;
/**
 * Load RAML asynchronously. May load both Api and Typed fragments. If the 'rejectOnErrors' option is set to true, [[ApiLoadingError]] is thrown for RAML which contains errors.
 * @param content content of the raml
 * @param options Load options  (note you should path a resolvers if you want includes to be resolved)
 * @return RAMLLanguageElement instance.
 **/
function parseRAML(content, arg2) {
    var filePath = apiLoader.virtualFilePath(arg2);
    var optionsForContent = apiLoader.optionsForContent(content, arg2, filePath);
    return apiLoader.loadApiAsync(filePath, [], optionsForContent);
}
exports.parseRAML = parseRAML;
function loadApi(apiPath, arg1, arg2) {
    return apiLoader.loadApiAsync(apiPath, arg1, arg2);
}
exports.loadApi = loadApi;
function loadRAML(ramlPath, arg1, arg2) {
    return apiLoader.loadRAMLAsync(ramlPath, arg1, arg2);
}
exports.loadRAML = loadRAML;
/**
 * Gets AST node by runtime type, if runtime type matches any.
 * @param runtimeType - runtime type to find the match for
 */
function getLanguageElementByRuntimeType(runtimeType) {
    return apiLoader.getLanguageElementByRuntimeType(runtimeType);
}
exports.getLanguageElementByRuntimeType = getLanguageElementByRuntimeType;
/**
 * Check if the AST node represents fragment
 */
function isFragment(node) {
    return exports.api10.isFragment(node);
}
exports.isFragment = isFragment;
/**
 * Convert fragment representing node to FragmentDeclaration instance.
 */
function asFragment(node) {
    return exports.api10.asFragment(node);
}
exports.asFragment = asFragment;
/**
 * High-level AST interfaces.
 */
exports.hl = require("./parser/highLevelAST");
/**
 * Low-level AST interfaces.
 */
exports.ll = require("./parser/lowLevelAST");
/**
 * Search functionality, operates on high AST level.
 */
exports.search = require("./search/search-interface");
/**
 * High-level stub node factory methods.
 */
exports.stubs = require("./stubProxy");
exports.utils = require("./utils");
/**
 * Low-level project factory.
 */
exports.project = require("./project");
/**
 * Helpers for classification of high-level AST entity types.
 */
exports.universeHelpers = require("./parser/tools/universeHelpers");
/**
 * Definition system.
 */
exports.ds = require("raml-definition-system");
/**
 * Schema utilities.
 */
exports.schema = require("./schema");
/**
 * A set of constants describing definition system entities.
 * @hidden
 **/
exports.universes = exports.ds.universesInfo;
/**
 * Exposed parser model modification methods. Operate on high-level.
 */
exports.parser = require("./parser");
/**
 * Applies traits and resources types to API on high-level.
 * Top-level expansion should be performed via calling expand() method of API node.
 */
exports.expander = require("./expanderStub");
/**
 * Exposed part of custom methods applied to top-level AST during generation.
 * Not to be used by parser clients.
 */
exports.wrapperHelper = require("./wrapperHelperStub");
if (typeof Promise === 'undefined' && typeof window !== 'undefined') {
    window.Promise = PromiseConstructor;
}
//# sourceMappingURL=index.js.map