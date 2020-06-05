import def = require("raml-definition-system");
import typeSystem = def.rt;
import tsInterfaces = typeSystem.tsInterfaces;
import hl = require("../parser/highLevelAST");
import referencePatcher = require("../parser/ast.core/referencePatcher");
import typeExpressions = def.rt.typeExpressions;
export declare type IPropertyInfo = tsInterfaces.IPropertyInfo;
export declare type IParsedType = tsInterfaces.IParsedType;
export declare type ITypeFacet = tsInterfaces.ITypeFacet;
export declare type IExample = tsInterfaces.IExample;
export declare type IAnnotation = tsInterfaces.IAnnotation;
export declare type IConstraint = tsInterfaces.IConstraint;
export declare type ElementSourceInfo = tsInterfaces.ElementSourceInfo;
export interface BranchingData {
    branchingOption(branchId: number): number;
    typeMap(): TypeMap;
    expander(): TypeExpander;
}
export interface TypeMap {
    addType(t: TypeEntry): void;
    removeType(t: TypeEntry): void;
    hasType(t: TypeEntry): boolean;
    hasTypeByName(name: string): boolean;
    typeByName(name: string): TypeEntry;
    addProperty(typeName: string, propName: string, prop: Entry): any;
    property(typeName: string, propName: string): Entry;
}
export interface BranchingRegistry {
    nextBranchId(optionsCount: number): number;
    possibleBranches(tm?: TypeMap): BranchingData[];
    expander(): TypeExpander;
}
export interface Entry {
    append(te: GeneralTypeEntry, bd: BranchingData): void;
}
export declare class PropertyEntry implements Entry {
    protected _original: IPropertyInfo;
    protected _name: string;
    protected _type: TypeEntry;
    protected _required: boolean;
    protected isFacet: boolean;
    protected _metadata: any;
    protected _src: IPropertyInfo;
    constructor(_original: IPropertyInfo, _name: string, _type: TypeEntry, _required: boolean, isFacet: boolean, _metadata: any, _src?: IPropertyInfo);
    name(): string;
    original(): def.rt.tsInterfaces.IPropertyInfo;
    append(te: GeneralTypeEntry, bd: BranchingData): void;
    setType(t: TypeEntry): void;
    type(): TypeEntry;
    required(): boolean;
    metadata(): any;
    annotations(): def.rt.tsInterfaces.IAnnotation[];
    source(): GeneralTypeEntry;
}
export interface TypeEntry extends Entry {
    name(): string;
    displayName(): string;
    original(): IParsedType;
    isUnion(): boolean;
    isBuiltIn(): boolean;
    isExternal(): boolean;
    isUnknown(): boolean;
    schema(): string;
    isIntersection(): boolean;
    addSuperType(type: TypeEntry): void;
    superTypes(): TypeEntry[];
    clone(): TypeEntry;
    possibleBuiltInTypes(occured: {
        [key: string]: boolean;
    }): string[];
    branchingRegistry(): BranchingRegistry;
    allFacets(): ITypeFacet[];
    declaredFacets(): ITypeFacet[];
    isRecursionPoint(): boolean;
    examples(expand: boolean): IExample[];
    meta(): ITypeFacet[];
    schemaPath(): string;
    id(): string;
    typeAttributeValue(): any;
}
export declare class AbstractTypeEntry implements TypeEntry {
    protected _original: IParsedType;
    protected _superTypes: TypeEntry[];
    constructor(_original: IParsedType, _superTypes: TypeEntry[]);
    protected _branchingRegistry: BranchingRegistry;
    private _id;
    protected _typeAttrVal: string;
    id(): string;
    branchingRegistry(): BranchingRegistry;
    setBranchingRegistry(value: BranchingRegistry): void;
    name(): string;
    isUnion(): boolean;
    isBuiltIn(): boolean;
    isExternal(): boolean;
    isUnknown(): boolean;
    schema(): string;
    isIntersection(): boolean;
    addSuperType(type: TypeEntry): void;
    superTypes(): TypeEntry[];
    original(): IParsedType;
    append(te: GeneralTypeEntry, bd: BranchingData): void;
    clone(): TypeEntry;
    possibleBuiltInTypes(): string[];
    declaredFacets(): def.rt.tsInterfaces.ITypeFacet[];
    allFacets(): def.rt.tsInterfaces.ITypeFacet[];
    isRecursionPoint(): boolean;
    examples(expand: boolean): IExample[];
    declaredExampleFacets(): def.rt.tsInterfaces.ITypeFacet[];
    meta(): def.rt.tsInterfaces.ITypeFacet[];
    schemaPath(): string;
    sourceMap(): ElementSourceInfo;
    displayName(): string;
    private getOneMetaValue;
    typeAttributeValue(): any;
    setTypeAttributeValue(val: string): void;
}
export declare class GeneralTypeEntry extends AbstractTypeEntry {
    protected _componentType: TypeEntry;
    protected _properties: PropertyEntry[];
    protected _facets: PropertyEntry[];
    protected _name: string;
    protected facets: PropertyEntry[];
    constructor(_original: IParsedType, _superTypes: TypeEntry[], _componentType: TypeEntry, _properties: PropertyEntry[], _facets: PropertyEntry[], _name: string);
    private _isRecursionPoint;
    private _depth;
    private metadataSource;
    setDepth(d: number): void;
    depth(): number;
    clone(ct?: TypeEntry): GeneralTypeEntry;
    possibleBuiltInTypes(occured?: {
        [key: string]: boolean;
    }): string[];
    componentType(): TypeEntry;
    setComponentType(componentType: TypeEntry): void;
    properties(): PropertyEntry[];
    definedFacets(): PropertyEntry[];
    addProperty(propertyEntry: PropertyEntry): void;
    addFacet(propertyEntry: PropertyEntry): void;
    append(te: GeneralTypeEntry, bd: BranchingData): void;
    name(): string;
    setName(n: string): string;
    isRecursionPoint(): boolean;
    setIsRecursionPoint(val?: boolean): void;
}
export declare class BuiltInTypeEntry extends AbstractTypeEntry {
    protected _original: IParsedType;
    constructor(_original: IParsedType);
    possibleBuiltInTypes(): string[];
    isBuiltIn(): boolean;
    append(te: GeneralTypeEntry, bd: BranchingData): void;
}
export declare class UnionTypeEntry extends AbstractTypeEntry {
    protected _options: TypeEntry[];
    protected _branchId: number;
    constructor(original: IParsedType, _options: TypeEntry[], _branchId: number);
    isUnion(): boolean;
    branchId(): number;
    append(te: GeneralTypeEntry, bd: BranchingData): void;
    clone(): TypeEntry;
    possibleBuiltInTypes(occured?: {
        [key: string]: boolean;
    }): string[];
    options(): TypeEntry[];
}
export declare class IntersectionTypeEntry extends AbstractTypeEntry {
    protected options: TypeEntry[];
    constructor(original: IParsedType, options: TypeEntry[]);
    isIntersection(): boolean;
    append(te: TypeEntry, bd: BranchingData): void;
    clone(): TypeEntry;
    possibleBuiltInTypes(occured?: {
        [key: string]: boolean;
    }): string[];
}
export declare class BasicTypeMap implements TypeMap {
    private typeMapById;
    private typeMapByName;
    private propertiesMap;
    addType(t: AbstractTypeEntry): void;
    removeType(t: AbstractTypeEntry): void;
    hasType(t: AbstractTypeEntry): boolean;
    hasTypeByName(name: string): boolean;
    typeByName(name: string): AbstractTypeEntry;
    addProperty(typeName: string, propName: string, prop: PropertyEntry): void;
    property(typeName: string, propName: string): PropertyEntry;
    private propKey;
}
export interface Options {
    typeCollection?: tsInterfaces.IParsedTypeCollection;
    node?: hl.IHighLevelNode;
    typeExpansionRecursionDepth?: number;
    serializeMetadata?: boolean;
    sourceMap?: boolean;
    isInsideTemplate?: boolean;
    isAnnotationType?: boolean;
}
export declare class TypeExpander {
    protected options: Options;
    constructor(options?: Options);
    serializeType(t: IParsedType): any;
    protected createHierarchyEntry(t: IParsedType, typeExpansionRecursionDepth: number, occured?: BasicTypeMap, branchingRegistry?: BranchingRegistry): AbstractTypeEntry;
    protected doCreateHierarchyEntry(t: IParsedType, typeExpansionRecursionDepth: number, occured: BasicTypeMap, branchingRegistry: BranchingRegistry): AbstractTypeEntry;
    protected processExpression(expression: string, typeExpansionRecursionDepth: number, occured: BasicTypeMap, branchingRegistry: BranchingRegistry, original?: tsInterfaces.IParsedType): AbstractTypeEntry;
    protected expressionToObject(expr: typeExpressions.BaseNode, escapeData: referencePatcher.EscapeData, typeExpansionRecursionDepth: number, occured: BasicTypeMap, branchingRegistry: BranchingRegistry, original?: tsInterfaces.IParsedType): AbstractTypeEntry;
    protected extractParserMetadata(pt: IParsedType): any;
    protected processPropertyHierarchy(p: tsInterfaces.IPropertyInfo, typeExpansionRecursionDepth: number, t: IParsedType, occured: BasicTypeMap, branchingRegistry: BranchingRegistry, isFacet?: boolean): PropertyEntry;
    expandHierarchy(e: TypeEntry, reg: BranchingRegistry, typeMap?: TypeMap): TypeEntry;
    protected appendSourceFromExtras(result: any, te: TypeEntry): void;
    spreadSources(result: any, src: any): void;
    protected dump(te: TypeEntry, expand: boolean): any;
    private dumpScalarsAnnotations;
    private processExample;
    protected checkIfTypePropertyIsDefault(te: TypeEntry, result: any): void;
    protected dumpProperty(p: PropertyEntry, gte: GeneralTypeEntry, expand: boolean, isFacet?: boolean): any;
    protected dumpAnnotations(annotations: IAnnotation[], obj: any): void;
    protected dumpFacets(te: TypeEntry, result: any, expand: boolean): void;
    protected mergeFacetValues(arr: ITypeFacet[]): any;
    protected dumpMeta(te: TypeEntry, result: any, expand: boolean): void;
    protected sourceHasKey(te: TypeEntry, key: string): boolean;
    protected appendMeta(obj: any, field: string, kind: string): void;
    protected removeMeta(obj: any, field: string): void;
    private checkIfPropertyTypeIsCalculated;
    patchDisplayName(te: TypeEntry, result: any): void;
}
