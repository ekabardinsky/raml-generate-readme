"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function lint(h, acceptor) {
    h.resources().forEach(function (x) {
        console.log("Linting!!!!!" + x.relativeUri());
    });
}
//# sourceMappingURL=customLinter.js.map