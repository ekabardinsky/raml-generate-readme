import lowLevel = require("../parser/lowLevelAST");
export declare class ContentProvider {
    private unit;
    constructor(unit: lowLevel.ICompilationUnit);
    contextPath(): string;
    normalizePath(url: any): any;
    content(reference: any): string;
    contentAsync(reference: any): Promise<string>;
    private toRelativeIfNeeded;
    hasAsyncRequests(): boolean;
    resolvePath(context: any, relativePath: any): any;
    isAbsolutePath(uri: any): boolean;
    promiseResolve(arg: any): Promise<any>;
    rootPath(): string;
    isWebPath(p: string): boolean;
    relativePath(from: any, to: any): string;
}
