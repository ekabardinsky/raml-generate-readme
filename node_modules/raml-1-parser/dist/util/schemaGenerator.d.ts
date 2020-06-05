/**
 * Created by Sviridov on 5/1/2015.
 */
export declare class JsonSchemaGenerator {
    generateSchema(obj: any): Object;
    private pass;
    private passObject;
    private registerProperty;
    private passArray;
    private detectType;
}
export declare function generateSchema(text: string, mediaType: string): string;
