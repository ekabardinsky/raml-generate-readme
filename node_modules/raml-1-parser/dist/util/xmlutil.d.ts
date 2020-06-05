export declare function isXmlScheme(content: string): boolean;
export declare function parseXML(value: string, errorsHandler?: {
    warning: (x: any) => void;
    error: (x: any) => void;
    fatalError: (x: any) => void;
}): any;
