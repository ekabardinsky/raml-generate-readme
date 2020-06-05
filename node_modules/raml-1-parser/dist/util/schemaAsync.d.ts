import lowLevel = require("../parser/lowLevelAST");
export declare function isScheme(content: any): boolean;
export declare function startDownloadingReferencesAsync(schemaContent: string, unit: lowLevel.ICompilationUnit): Promise<lowLevel.ICompilationUnit>;
export declare function getReferences(schemaContent: any, unit: any): any;
