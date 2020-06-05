import parser10api = require("./parser/artifacts/raml10parserapi");
import highLevel = require("./parser/highLevelAST");
export declare function createTypeDeclaration(typeName: string): parser10api.TypeDeclaration;
export declare function createObjectTypeDeclaration(typeName: string): parser10api.ObjectTypeDeclaration;
export declare function setTypeDeclarationSchema(type: parser10api.TypeDeclaration, schema: string): void;
export declare function setTypeDeclarationExample(type: parser10api.TypeDeclaration, example: string): void;
export declare function addChild(parent: highLevel.BasicNode, child: highLevel.BasicNode): void;
