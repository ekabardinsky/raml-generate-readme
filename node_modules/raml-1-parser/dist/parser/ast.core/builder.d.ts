import defs = require("raml-definition-system");
import hl = require("../highLevelAST");
import ll = require("../lowLevelAST");
import def = defs;
export declare class BasicNodeBuilder implements hl.INodeBuilder {
    shouldDescriminate: boolean;
    process(node: hl.IHighLevelNode, childrenToAdopt: ll.ILowLevelASTNode[]): hl.IParseResult[];
    private isTypeDeclarationShortcut;
    private processChildren;
}
export declare function mapType(pt: def.rt.tsInterfaces.IParsedType, universe?: def.rt.nominalInterfaces.IUniverse): hl.ITypeDefinition[];
export declare function doDescrimination(node: hl.IHighLevelNode): any;
