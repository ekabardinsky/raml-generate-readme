import RamlWrapper1 = require("../parser/artifacts/raml10parserapi");
import RamlWrapper08 = require("../parser/artifacts/raml08parserapi");
import jsonTypings = require("../typings-new-format/raml");
import Opt = require('../Opt');
import hl = require("../parser/highLevelAST");
import parserCore = require('../parser/wrapped-ast/parserCore');
import parserCoreApi = require('../parser/wrapped-ast/parserCoreApi');
import resolversApi = require("./jsyaml/resolversApi");
export declare type IHighLevelNode = hl.IHighLevelNode;
export declare type IParseResult = hl.IParseResult;
export declare function load(ramlPathOrContent: string, options?: parserCoreApi.LoadOptions): Promise<jsonTypings.RAMLParseResult>;
export declare function loadSync(ramlPathOrContent: string, options?: parserCoreApi.LoadOptions): jsonTypings.RAMLParseResult;
export declare function parse(ramlPathOrContent: string, options?: parserCoreApi.LoadOptions): Promise<hl.IHighLevelNode>;
export declare function parseSync(ramlPathOrContent: string, options?: parserCoreApi.LoadOptions): hl.IHighLevelNode;
/***
 * Load API synchronously. Detects RAML version and uses corresponding parser.
 * @param apiPath Path to API: local file system path or Web URL
 * @param options Load options
 * @return Opt&lt;Api&gt;, where Api belongs to RAML 1.0 or RAML 0.8 model.
 ***/
export declare function loadApi(apiPath: string, arg1?: string[] | parserCoreApi.Options, arg2?: string[] | parserCoreApi.Options): Opt<RamlWrapper1.Api | RamlWrapper08.Api>;
/***
 * Load RAML synchronously. Detects RAML version and uses corresponding parser.
 * @param ramlPath Path to RAML: local file system path or Web URL
 * @param options Load options
 * @return Opt&lt;RAMLLanguageElement&gt;, where RAMLLanguageElement belongs to RAML 1.0 or RAML 0.8 model.
 ***/
export declare function loadRAML(ramlPath: string, arg1?: string[] | parserCoreApi.Options, arg2?: string[] | parserCoreApi.Options): Opt<hl.BasicNode>;
/***
 * Load RAML synchronously. Detects RAML version and uses corresponding parser.
 * @param ramlPath Path to RAML: local file system path or Web URL
 * @param options Load options
 * @return Opt&lt;hl.IHighLevelNode&gt;
 ***/
export declare function loadRAMLHL(ramlPath: string, arg1?: string[] | parserCoreApi.Options, arg2?: string[] | parserCoreApi.Options): Opt<hl.IHighLevelNode>;
/***
 * Load API asynchronously. Detects RAML version and uses corresponding parser.
 * @param apiPath Path to API: local file system path or Web URL
 * @param options Load options
 * @return Promise&lt;Api&gt;, where Api belongs to RAML 1.0 or RAML 0.8 model.
 ***/
export declare function loadApiAsync(apiPath: string, arg1?: string[] | parserCoreApi.Options, arg2?: string[] | parserCoreApi.Options): Promise<RamlWrapper1.Api | RamlWrapper08.Api>;
/***
 * Load API asynchronously. Detects RAML version and uses corresponding parser.
 * @param ramlPath Path to RAML: local file system path or Web URL
 * @param options Load options
 * @return Promise&lt;RAMLLanguageElement&gt;, where RAMLLanguageElement belongs to RAML 1.0 or RAML 0.8 model.
 ***/
export declare function loadRAMLAsync(ramlPath: string, arg1?: string[] | parserCoreApi.Options, arg2?: string[] | parserCoreApi.Options): Promise<hl.BasicNode>;
export declare function loadRAMLAsyncHL(ramlPath: string, arg1?: string[] | parserCoreApi.Options, arg2?: string[] | parserCoreApi.Options): Promise<hl.IHighLevelNode>;
/**
 * Gets AST node by runtime type, if runtime type matches any.
 * @param runtimeType
 */
export declare function getLanguageElementByRuntimeType(runtimeType: hl.ITypeDefinition): parserCore.BasicNode;
export declare function toError(api: hl.IHighLevelNode): hl.ApiLoadingError;
export declare function loadApis1(projectRoot: string, cacheChildren?: boolean, expandTraitsAndResourceTypes?: boolean): RamlWrapper1.Api[];
export declare function optionsForContent(content: string, arg2?: parserCoreApi.Options, _filePath?: string): parserCoreApi.Options;
export declare function loadOptionsForContent(content: string, arg2?: parserCoreApi.LoadOptions, _filePath?: string): parserCoreApi.LoadOptions;
export declare function virtualFSResolver(filePath: string, content: string, originalResolver: resolversApi.FSResolver): resolversApi.FSResolver;
export declare function virtualFilePath(opt: parserCoreApi.Options | parserCoreApi.LoadOptions): string;
