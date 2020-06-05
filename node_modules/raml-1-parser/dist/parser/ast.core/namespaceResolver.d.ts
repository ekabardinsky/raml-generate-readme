import ll = require("../lowLevelAST");
import referencepatcherLL = require("./referencePatcherLL");
export declare class NamespaceResolver {
    private expandedAbsToNsMap;
    private _expandedNSMap;
    private byPathMap;
    private byNsMap;
    private _hasFragments;
    private _unitModels;
    hasTemplates(unit: ll.ICompilationUnit): boolean;
    resolveNamespace(from: ll.ICompilationUnit, to: ll.ICompilationUnit): UsesInfo;
    expandedNSMap(unit: ll.ICompilationUnit): {
        [key: string]: UsesInfo;
    };
    expandedPathMap(unit: ll.ICompilationUnit): {
        [key: string]: UsesInfo;
    };
    private calculateExpandedNamespaces;
    pathMap(unit: ll.ICompilationUnit): {
        [key: string]: UsesInfo;
    };
    nsMap(unit: ll.ICompilationUnit): {
        [key: string]: UsesInfo;
    };
    private calculateNamespaces;
    private lexLessEq;
    hasFragments(unit: ll.ICompilationUnit): boolean;
    unitModel(unit: ll.ICompilationUnit, passed?: {
        [key: string]: boolean;
    }): UnitModel;
    deleteUnitModel(aPath: string): void;
    getComponent(rootUnit: ll.ICompilationUnit, type: string, namespace: string, name: string, passed?: {
        [key: string]: boolean;
    }): TemplateModel;
}
export declare class UsesInfo {
    usesNodes: ll.ILowLevelASTNode[];
    unit: ll.ICompilationUnit;
    includePath: string;
    constructor(usesNodes: ll.ILowLevelASTNode[], unit: ll.ICompilationUnit, includePath: string);
    namespaceSegments: string[];
    steps(): number;
    namespace(): string;
    absolutePath(): string;
}
export declare class ElementsCollection {
    name: string;
    private static CLASS_IDENTIFIER;
    static isInstance(instance: any): instance is ElementsCollection;
    getClassIdentifier(): string[];
    constructor(name: string);
    array: ll.ILowLevelASTNode[];
    map: {
        [key: string]: ll.ILowLevelASTNode;
    };
    templateModels: {
        [key: string]: TemplateModel;
    };
    hasElement(name: string): boolean;
    getElement(name: string): ll.ILowLevelASTNode;
    getTemplateModel(name: string): TemplateModel;
    isEmpty(): boolean;
}
export declare class UnitModel {
    unit: ll.ICompilationUnit;
    constructor(unit: ll.ICompilationUnit);
    master: UnitModel;
    resourceTypes: ElementsCollection;
    traits: ElementsCollection;
    securitySchemes: ElementsCollection;
    annotationTypes: ElementsCollection;
    types: ElementsCollection;
    private _extensionChain;
    private _extensionSet;
    private _type;
    type(): string;
    private init;
    isOverlayOrExtension(): boolean;
    extensionSet(): {
        [key: string]: UnitModel;
    };
    extensionChain(): UnitModel[];
    collection(collectionName: string): ElementsCollection;
}
export declare class TemplateModel {
    name: string;
    kind: string;
    node: ll.ILowLevelASTNode;
    typeValuedParameters: any;
    constructor(name: string, kind: string, node: ll.ILowLevelASTNode, typeValuedParameters: any);
    isInitialized(): boolean;
    id(): string;
}
export declare class NamespaceResolverActionsAndConditionsFactory implements referencepatcherLL.ActionsAndCondtionsFactory {
    parent: referencepatcherLL.ReferencePatcherActionsAndConditionsFactory;
    action(actionName: string): referencepatcherLL.Action;
    condition(name: string): referencepatcherLL.Condition;
}
export declare function extendedUnit(u: ll.ICompilationUnit): ll.ICompilationUnit;
export declare function initUnitModel(result: UnitModel, resolver: NamespaceResolver, passed?: {
    [key: string]: boolean;
}): void;
export declare function isLibraryBaseDescendant(unit: ll.ICompilationUnit): boolean;
