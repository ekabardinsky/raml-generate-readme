import core = require("../parser/wrapped-ast/parserCore");
import def = require("raml-definition-system");
import hl = require("../parser/highLevelAST");
import ll = require("../parser/lowLevelAST");
import typeSystem = def.rt;
import nominals = typeSystem.nominalTypes;
import typeExpressions = typeSystem.typeExpressions;
import defaultCalculator = require("../parser/wrapped-ast/defaultCalculator");
export declare function dump(node: hl.IHighLevelNode | hl.IAttribute, options: SerializeOptions): any;
export declare function appendSourcePath(eNode: hl.IParseResult, result: any): void;
export declare class JsonSerializer {
    private options?;
    constructor(options?: SerializeOptions);
    nodeTransformers: Transformation[];
    nodePropertyTransformers: Transformation[];
    nodeTransformersMap: TransformersMap;
    nodePropertyTransformersMap: TransformersMap;
    private defaultsCalculator;
    private helpersMap;
    private _astRoot;
    private init;
    astRoot(): hl.IParseResult;
    private dispose;
    dump(node: hl.IParseResult): any;
    dumpInternal(_node: hl.IParseResult, nodeProperty: hl.IProperty, rp: string, meta?: core.NodeMetadata, isRoot?: boolean): any;
    getDefaultsCalculator(): defaultCalculator.AttributeDefaultsCalculator;
    private canBeFragment;
    private dumpErrors;
    private dumpErrorBasic;
    serializeMeta(obj: any, node: hl.IHighLevelNode, _meta: core.NodeMetadata): void;
    private applyHelpers;
}
export interface SerializeOptions {
    /**
     * For root nodes additional details can be included into output. If the option is set to `true`,
     * node content is returned as value of the **specification** root property. Other root properties are:
     *
     * * **ramlVersion** version of RAML used by the specification represented by the node
     * * **type** type of the node: Api, Overlay, Extension, Library, or any other RAML type in fragments case
     * * **errors** errors of the specification represented by the node
     * @default false
     */
    rootNodeDetails?: boolean;
    /**
     * Whether to serialize metadata
     * @default false
     */
    serializeMetadata?: boolean;
    dumpXMLRepresentationOfExamples?: boolean;
    dumpSchemaContents?: boolean;
    attributeDefaults?: boolean;
    allParameters?: boolean;
    expandSecurity?: boolean;
    expandExpressions?: boolean;
    typeReferences?: boolean;
    expandTypes?: boolean;
    typeExpansionRecursionDepth?: number;
    sourceMap?: boolean;
}
export interface Transformation {
    match(node: hl.IParseResult, prop: nominals.IProperty): boolean;
    transform(value: any, node: hl.IParseResult, valueProp?: hl.IProperty): any;
    registrationInfo(): Object;
}
export declare type TransformersMap = {
    [key: string]: {
        [key: string]: {
            [key: string]: Transformation[];
        };
    };
};
export declare function applyTransformersMap(node: hl.IParseResult, prop: hl.IProperty, value: any, map: TransformersMap): any;
export declare function mergeRegInfos(arr: Object[]): Object;
export declare function toOptionsArray(union: typeExpressions.Union): typeExpressions.BaseNode[];
export declare function getSchemaPath(eNode: hl.IHighLevelNode): string;
export declare function patchDisplayName(value: any, llNode: ll.ILowLevelASTNode): void;
