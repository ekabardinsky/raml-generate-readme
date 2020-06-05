import ll = require("../lowLevelAST");
import hl = require("../highLevelAST");
import hlimpl = require("../highLevelImpl");
import yaml = require("yaml-ast-parser");
import proxy = require("./LowLevelASTProxy");
import RamlWrapper = require("../artifacts/raml10parserapi");
import referencePatcher = require("./referencePatcherLL");
export declare function expandTraitsAndResourceTypes<T>(api: T, merge?: boolean): T;
export declare function expandTraitsAndResourceTypesHL(api: hl.IHighLevelNode, merge?: boolean): hl.IHighLevelNode;
export declare function expandLibraries(api: RamlWrapper.Api): RamlWrapper.Api;
export declare function expandLibrary(lib: RamlWrapper.Library): RamlWrapper.Library;
export declare function expandLibrariesHL(api: hl.IHighLevelNode): hl.IHighLevelNode;
export declare function expandLibraryHL(lib: hl.IHighLevelNode): hl.IHighLevelNode;
export declare function mergeAPIs(masterUnit: ll.ICompilationUnit, extensionsAndOverlays: ll.ICompilationUnit[], mergeMode: hlimpl.OverlayMergeMode): hl.IHighLevelNode;
export declare class TraitsAndResourceTypesExpander {
    private ramlVersion;
    private defaultMediaType;
    private namespaceResolver;
    expandTraitsAndResourceTypes(api: hl.IHighLevelNode, rp?: referencePatcher.ReferencePatcher, forceProxy?: boolean, merge?: boolean): hl.IHighLevelNode;
    init(api: hl.IHighLevelNode): void;
    expandHighLevelNode(hlNode: hl.IHighLevelNode, rp: referencePatcher.ReferencePatcher, api: hl.IHighLevelNode, forceExpand?: boolean): hl.IHighLevelNode;
    createHighLevelNode(_api: hl.IHighLevelNode, merge?: boolean, rp?: referencePatcher.ReferencePatcher, forceProxy?: boolean, doInit?: boolean): hl.IHighLevelNode;
    private processResource;
    private mergeBodiesForMethod;
    private mergeBodies;
    private collectResourceData;
    private extractTraits;
    private readGenerictData;
}
export declare class LibraryExpander {
    expandLibraries(_api: hl.IHighLevelNode): hl.IHighLevelNode;
    expandLibrary(_lib: hl.IHighLevelNode): hl.IHighLevelNode;
    processNode(rp: referencePatcher.ReferencePatcher, hlNode: hl.IHighLevelNode): void;
}
export declare function toUnits(node: ll.ILowLevelASTNode): ll.ICompilationUnit[];
export declare function getTransformNames(): string[];
export declare function getTransformersForOccurence(occurence: string): any[];
export declare class ValueTransformer implements proxy.ValueTransformer {
    templateKind: string;
    templateName: string;
    unitsChain: ll.ICompilationUnit[];
    scalarParamValues?: {
        [key: string]: string;
    };
    scalarParams?: {
        [key: string]: ll.ILowLevelASTNode;
    };
    structuredParams?: {
        [key: string]: ll.ILowLevelASTNode;
    };
    vDelegate?: ValueTransformer;
    constructor(templateKind: string, templateName: string, unitsChain: ll.ICompilationUnit[], scalarParamValues?: {
        [key: string]: string;
    }, scalarParams?: {
        [key: string]: ll.ILowLevelASTNode;
    }, structuredParams?: {
        [key: string]: ll.ILowLevelASTNode;
    }, vDelegate?: ValueTransformer);
    transform(obj: any, toString?: boolean, doBreak?: () => boolean, callback?: (obj: any, transformer: DefaultTransformer) => any): {
        value: any;
        errors: hl.ValidationIssue[];
    };
    private paramUpperBound;
    children(node: ll.ILowLevelASTNode): ll.ILowLevelASTNode[];
    valueKind(node: ll.ILowLevelASTNode): yaml.Kind;
    anchorValueKind(node: ll.ILowLevelASTNode): yaml.Kind;
    resolvedValueKind(node: ll.ILowLevelASTNode): yaml.Kind;
    includePath(node: ll.ILowLevelASTNode): string;
    substitutionNode(node: ll.ILowLevelASTNode, chain?: ll.ILowLevelASTNode[], inKey?: boolean): any;
    paramNodesChain(node: ll.ILowLevelASTNode, inKey: boolean): ll.ILowLevelASTNode[];
    private paramName;
    definingUnitSequence(str: string): ll.ICompilationUnit[];
    _definingUnitSequence(str: string): ll.ICompilationUnit[];
}
export declare class DefaultTransformer extends ValueTransformer {
    owner: proxy.LowLevelCompositeNode;
    delegate: ValueTransformer;
    constructor(owner: proxy.LowLevelCompositeNode, delegate: ValueTransformer, unitsChain: ll.ICompilationUnit[]);
    transform(obj: any, toString?: boolean, doContinue?: () => boolean, callback?: (obj: any, transformer: DefaultTransformer) => any): any;
    private initParams;
    children(node: ll.ILowLevelASTNode): ll.ILowLevelASTNode[];
    valueKind(node: ll.ILowLevelASTNode): yaml.Kind;
    includePath(node: ll.ILowLevelASTNode): string;
    anchorValueKind(node: ll.ILowLevelASTNode): yaml.Kind;
    resolvedValueKind(node: ll.ILowLevelASTNode): yaml.Kind;
    substitutionNode(node: ll.ILowLevelASTNode, chain?: ll.ILowLevelASTNode[], inKey?: boolean): any;
    _definingUnitSequence(str: string): ll.ICompilationUnit[];
}
export declare function isPossibleMethodName(n: string): any;
export declare function parseMediaType(str: string): any;
