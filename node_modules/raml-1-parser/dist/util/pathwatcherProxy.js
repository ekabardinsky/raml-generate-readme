"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var File = /** @class */ (function () {
    function File(path) {
        this.path = path;
    }
    File.prototype.getPath = function () {
        return this.path;
    };
    File.prototype.close = function () { };
    return File;
}());
exports.File = File;
function watch(path, f) {
    return { close: function () { } };
}
exports.watch = watch;
//# sourceMappingURL=pathwatcherProxy.js.map