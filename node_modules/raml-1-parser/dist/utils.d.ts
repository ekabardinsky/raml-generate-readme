import hl = require("./parser/highLevelAST");
export declare function hasAsyncRequests(): boolean;
export declare function addLoadCallback(x: (url: string) => void): void;
export declare function getTransformerNames(): string[];
export declare var updateType: (node: hl.IHighLevelNode) => void;
export declare function getFragmentDefenitionName(node: hl.IHighLevelNode): string;
export declare function genStructuredValue(name: string, parent: hl.IHighLevelNode, pr: hl.IProperty): string | hl.IStructuredValue;
export declare function parseUrl(u: string): string[];
export declare class UnitLink {
    /**
     * Node leading to the outer unit.
     */
    node: hl.IParseResult;
    /**
     * Unit this link points to.
     */
    targetUnitRoot: hl.IParseResult;
    constructor(node: hl.IParseResult, targetUnitRoot: hl.IParseResult);
}
export declare class PointOfViewValidationAcceptorImpl implements hl.ValidationAcceptor {
    protected errors: hl.ValidationIssue[];
    protected primaryUnitRoot: hl.IParseResult;
    constructor(errors: hl.ValidationIssue[], primaryUnitRoot: hl.IParseResult);
    accept(originalIssue: hl.ValidationIssue): void;
    transformIssue(originalIssue: hl.ValidationIssue): void;
    begin(): void;
    end(): void;
    acceptUnique(issue: hl.ValidationIssue): void;
    private findPathToNodeUnit;
    private findPathToNodeUnitRecursively;
    private findUnitLinks;
    private findMasterLinks;
    private convertConnectingNodeToError;
    private generateLinkMessageByNode;
    private findIssueTail;
}
