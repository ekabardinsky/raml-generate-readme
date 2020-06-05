import ll = require("../lowLevelAST");
import hl = require("../highLevelAST");
import jsyaml = require("../jsyaml/jsyaml2lowLevel");
import proxy = require("./LowLevelASTProxy");
import def = require("raml-definition-system");
export declare enum PatchMode {
    DEFAULT = 0,
    PATH = 1
}
export declare enum ParametersEscapingStatus {
    OK = 0,
    NOT_REQUIRED = 1,
    ERROR = 2
}
export interface EscapeData {
    resultingString?: string;
    substitutions?: {
        [key: string]: string;
    };
    status: ParametersEscapingStatus;
}
export declare function escapeTemplateParameters(str: string): EscapeData;
export declare function unescapeTemplateParameters(str: string, substitutions: {
    [key: string]: string;
}): EscapeData;
export declare function checkExpression(value: string): boolean;
export declare function patchMethodIs(node: hl.IHighLevelNode, traits: {
    node: ll.ILowLevelASTNode;
    transformer: proxy.ValueTransformer;
}[], rootPath: string): proxy.LowLevelCompositeNode;
export declare function prepareTraitRefNode(llNode: ll.ILowLevelASTNode, llParent: ll.ILowLevelASTNode): jsyaml.ASTNode;
export declare function toOriginal(node: ll.ILowLevelASTNode): ll.ILowLevelASTNode;
export declare class PatchedReference {
    private _namespace;
    private _name;
    private _collectionName;
    private _referencedUnit;
    private _isChained;
    private _mode;
    constructor(_namespace: string, _name: string, _collectionName: string, _referencedUnit: ll.ICompilationUnit, _isChained: boolean, _mode: PatchMode);
    private static CLASS_IDENTIFIER_PatchedReference;
    static isInstance(instance: any): instance is PatchedReference;
    getClassIdentifier(): string[];
    referencedNode: ll.ILowLevelASTNode;
    gotQuestion: boolean;
    namespace(): string;
    name(): string;
    collectionName(): string;
    referencedUnit(): ll.ICompilationUnit;
    mode(): PatchMode;
    value(): string;
    isChained(): boolean;
}
export declare function instanceOfPatchedReference(instance: any): instance is PatchedReference;
export declare type DependencyMap = {
    [key: string]: {
        [key: string]: PatchedReference;
    };
};
export declare function getDeclaration(elementName: string, typeName: string, units: ll.ICompilationUnit[]): hl.IHighLevelNode;
export declare function isCompoundValue(str: string): boolean;
export declare function typeUnit(t: hl.ITypeDefinition | def.rt.IParsedType): ll.ICompilationUnit;
