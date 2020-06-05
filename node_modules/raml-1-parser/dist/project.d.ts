import ll = require("./parser/lowLevelAST");
import rs = require("./parser/jsyaml/resolversApi");
export declare function createProject(path: string, r?: rs.FSResolver, h?: rs.HTTPResolver): ll.IProject;
