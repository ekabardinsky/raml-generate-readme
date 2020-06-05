"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var messageRegistry = require("../../resources/errorMessages");
var MarkdownString = /** @class */ (function () {
    function MarkdownString(_value) {
        var _this = this;
        this._value = _value;
        this.value = function () { return _this._value; };
        if (typeof this._value !== 'string') {
            throw new Error(messageRegistry.INVALID_ARGUMENT.message);
        }
    }
    return MarkdownString;
}());
exports.MarkdownString = MarkdownString;
//# sourceMappingURL=values.js.map