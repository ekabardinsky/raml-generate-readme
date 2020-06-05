"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var limpl = require("./parser/jsyaml/jsyaml2lowLevel");
function createProject(path, r, h) {
    return new limpl.Project(path, r, h);
}
exports.createProject = createProject;
//# sourceMappingURL=project.js.map